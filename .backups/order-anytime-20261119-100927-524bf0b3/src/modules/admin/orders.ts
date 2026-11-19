import { addDays, todayVN } from "@/lib/dates";
import { getOrdersRepository } from "@/modules/orders/repository";
import type { OrderInput } from "@/modules/orders/schema";
import { createOrder, orderErrorMessage, priceOrderLines, validatePickup } from "@/modules/orders/service";
import type { Order, OrderStatus } from "@/modules/orders/types";
import { inquiriesRepository } from "@/modules/inquiries/repository";
import { slotsRepository, type SlotConfig } from "@/modules/slots/repository";
import { logAudit } from "./audit";
import { needsReason, nextStatuses, OPEN_STATUSES } from "./order-flow";
import type { AdminUser } from "./session";

export async function changeOrderStatus(user: AdminUser, code: string, to: OrderStatus, note: string | null): Promise<void> {
  const repo = getOrdersRepository();
  const order = await repo.findByCode(code);
  if (!order) throw new Error("Không tìm thấy đơn.");
  if (!nextStatuses[order.status].includes(to)) throw new Error("Đơn đã đổi trạng thái – vui lòng tải lại trang.");
  if (needsReason(to) && !note) throw new Error("Vui lòng ghi lý do để báo khách.");
  // Tra tien khi nhan banh: khach da nhan banh = da thu tien mat
  const autoPaid = to === "completed" && order.payment === "cod" && order.paymentStatus !== "paid";
  const ok = await repo.update(
    code,
    { status: order.status },
    {
      status: to,
      statusNote: needsReason(to) ? note : order.statusNote,
      confirmedAt: to === "confirmed" ? new Date().toISOString() : undefined,
      ...(autoPaid ? { paymentStatus: "paid" as const, paidAt: new Date().toISOString() } : {}),
    },
  );
  if (!ok) throw new Error("Đơn vừa được người khác cập nhật – vui lòng tải lại trang.");
  await logAudit(user, `order.${to}`, "order", code, { from: order.status, to, note });
  if (autoPaid) await logAudit(user, "payment.paid", "order", code, { amount: order.totalVnd, method: "cod", note: "Thu tiền mặt khi giao" });
}

/** Tiem tao don ho khach (goi dien / inbox). Mac dinh xac nhan luon vi tiem da noi chuyen voi khach. */
export async function createOrderByAdmin(user: AdminUser, input: OrderInput, confirmNow: boolean): Promise<string> {
  const order = await createOrder(input, { byAdmin: true });
  await logAudit(user, "order.create_admin", "order", order.code, { total: order.totalVnd });
  if (confirmNow) await changeOrderStatus(user, order.code, "confirmed", null);
  return order.code;
}

/** Trang thai con cho sua mon / thong tin */
export const EDITABLE: OrderStatus[] = ["pending_confirmation", "confirmed", "preparing", "ready"];

export async function editOrder(user: AdminUser, code: string, input: OrderInput): Promise<void> {
  const repo = getOrdersRepository();
  const order = await repo.findByCode(code);
  if (!order) throw new Error("Không tìm thấy đơn.");
  if (!EDITABLE.includes(order.status)) throw new Error("Đơn đã kết thúc – không sửa được.");
  validatePickup(input);
  const items = await priceOrderLines(input.items, input.pickupDate);
  const total = items.reduce((n, i) => n + i.lineTotalVnd, 0);
  if (order.paymentStatus === "paid" && total !== order.totalVnd) {
    throw new Error("Đơn đã ghi nhận thanh toán – không đổi món làm thay đổi tổng tiền. Bỏ đánh dấu đã nhận tiền trước (chủ tiệm).");
  }
  let ok = false;
  try {
    ok = await repo.updateFull(code, order.status, {
      customerName: input.customer.name,
      customerPhone: input.customer.phone,
      pickupDate: input.pickupDate,
      pickupSlotId: input.slotId,
      payment: input.payment,
      note: input.note ?? "",
      items,
      totalVnd: total,
    });
  } catch (err) {
    orderErrorMessage(err);
  }
  if (!ok) throw new Error("Đơn vừa đổi trạng thái – vui lòng tải lại trang.");
  await logAudit(user, "order.edit", "order", code, { from_total: order.totalVnd, to_total: total });
}

/** Xoa han don da huy / tu choi (don that giu lai de bao cao) */
export async function deleteOrder(user: AdminUser, code: string): Promise<void> {
  const ok = await getOrdersRepository().remove(code);
  if (!ok) throw new Error("Chỉ xoá được đơn đã huỷ hoặc từ chối.");
  await logAudit(user, "order.delete", "order", code);
}

/** Danh dau da nhan tien – CHI Admin, xac minh thu cong (khong bao gio tu client cua khach) */
export async function setOrderPaid(user: AdminUser, code: string, paid: boolean): Promise<void> {
  const repo = getOrdersRepository();
  const order = await repo.findByCode(code);
  if (!order) throw new Error("Không tìm thấy đơn.");
  if (paid && (order.status === "rejected" || order.status === "cancelled")) throw new Error("Đơn đã huỷ/từ chối – không ghi nhận thanh toán.");
  const from = order.paymentStatus;
  if (paid && from === "paid") return;
  if (!paid && from !== "paid") return;
  const ok = await repo.update(code, { paymentStatus: from }, { paymentStatus: paid ? "paid" : "unpaid", paidAt: paid ? new Date().toISOString() : null });
  if (!ok) throw new Error("Đơn vừa được cập nhật – vui lòng tải lại trang.");
  await logAudit(user, paid ? "payment.paid" : "payment.unpaid", "order", code, { amount: order.totalVnd, method: order.payment });
}

export interface SlotDay {
  slot: SlotConfig;
  orders: Order[];
}

export interface Dashboard {
  today: string;
  pending: Order[];
  todaySlots: SlotDay[];
  stats: {
    pendingCount: number;
    todayPickups: number;
    todayRevenue: number;
    transferToVerify: number;
    tomorrowPickups: number;
    newInquiries: number;
  };
}

export async function getDashboard(): Promise<Dashboard> {
  const repo = getOrdersRepository();
  const today = todayVN();
  const [open, todayOrders, tomorrowOrders, slots, newInquiries] = await Promise.all([
    repo.list({ statuses: OPEN_STATUSES, limit: 300 }),
    repo.list({ pickupDate: today, limit: 300 }),
    repo.list({ pickupDate: addDays(today, 1), statuses: OPEN_STATUSES, limit: 300 }),
    slotsRepository.list(),
    inquiriesRepository.countNew(),
  ]);
  const activeToday = todayOrders.filter((o) => o.status !== "cancelled" && o.status !== "rejected");
  const pending = open.filter((o) => o.status === "pending_confirmation").sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return {
    today,
    pending,
    todaySlots: slots.map((slot) => ({ slot, orders: activeToday.filter((o) => o.pickupSlotId === slot.id) })),
    stats: {
      pendingCount: pending.length,
      todayPickups: activeToday.length,
      todayRevenue: activeToday.filter((o) => o.status !== "pending_confirmation").reduce((n, o) => n + o.totalVnd, 0),
      transferToVerify: open.filter((o) => o.payment === "transfer" && o.paymentStatus !== "paid").length,
      tomorrowPickups: tomorrowOrders.length,
      newInquiries,
    },
  };
}

/** So luong cho thanh menu (don cho xac nhan, cau hoi moi) */
export async function getNavCounts(): Promise<{ pending: number; inbox: number }> {
  const [pending, inbox] = await Promise.all([getOrdersRepository().count(["pending_confirmation"]), inquiriesRepository.countNew()]);
  return { pending, inbox };
}
