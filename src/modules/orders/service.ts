import { timingSafeEqual } from "node:crypto";
import { isToday, isValidPickupDate, pickupSlots } from "@/lib/pickup";
import { unitPriceOf, variantLabelOf } from "@/modules/products/pricing";
import { productsRepository } from "@/modules/products/repository";
import { settingsRepository } from "@/modules/settings/repository";
import { getOrdersRepository, OrderCreateError, type OrderDraft } from "./repository";
import type { OrderInput } from "./schema";
import type { Order } from "./types";

/**
 * Tinh lai gia tung dong tu repository (single source of truth) – dung cho tao don va sua don.
 * Khong bao gio tin so tien tu client.
 */
export async function priceOrderLines(lines: OrderInput["items"], pickupDate: string): Promise<OrderDraft["items"]> {
  const found = await productsRepository.findManyByIds(lines.map((i) => i.productId));
  const items: OrderDraft["items"] = [];
  for (const line of lines) {
    const product = found.get(line.productId);
    if (!product) {
      throw new Error("Có món không còn trong thực đơn, vui lòng xem lại giỏ hàng.");
    }
    if (product.status === "pre" && isToday(pickupDate)) {
      throw new Error(`"${product.name}" cần đặt trước 1 ngày – vui lòng chọn ngày nhận từ ngày mai.`);
    }
    if (product.status === "out") {
      throw new Error(`"${product.name}" đã hết hôm nay, vui lòng bỏ khỏi giỏ.`);
    }
    const unitPrice = unitPriceOf(product, line.variantId);
    if (unitPrice === null) {
      throw new Error(`Quy cách của "${product.name}" không hợp lệ, vui lòng chọn lại.`);
    }
    const variantLabel = variantLabelOf(product, line.variantId);
    items.push({
      productId: product.id,
      name: variantLabel ? `${product.name} – ${variantLabel}` : product.name,
      unitPriceVnd: unitPrice,
      qty: line.qty,
      lineTotalVnd: unitPrice * line.qty,
      variantId: line.variantId,
      variantLabel: variantLabel ?? undefined,
    });
  }
  return items;
}

export function validatePickup(input: Pick<OrderInput, "pickupDate" | "slotId">) {
  if (!isValidPickupDate(input.pickupDate)) {
    throw new Error("Ngày nhận không hợp lệ (trong vòng 7 ngày tới).");
  }
  if (!pickupSlots.some((s) => s.id === input.slotId)) {
    throw new Error("Khung giờ nhận không hợp lệ.");
  }
}

export function orderErrorMessage(err: unknown): never {
  if (err instanceof OrderCreateError) {
    if (err.code === "SLOT_FULL") throw new Error("Khung giờ này đã kín đơn – vui lòng chọn khung giờ khác.");
    if (err.code === "SLOT_UNAVAILABLE") throw new Error("Khung giờ này tạm không nhận đơn – vui lòng chọn khung giờ khác.");
    throw new Error("Không lưu được đơn, vui lòng thử lại.");
  }
  throw err;
}

/**
 * Tao don. Khach dat tren web: kiem tra "tam ngung nhan don".
 * Tiem tao ho khach (Admin, don goi dien/inbox): bo qua kiem tra tam ngung.
 */
export async function createOrder(input: OrderInput, opts: { byAdmin?: boolean } = {}): Promise<Order> {
  if (!opts.byAdmin) {
    const settings = await settingsRepository.getFresh();
    if (!settings.orderingEnabled) {
      throw new Error(settings.orderingPausedMessage || `Tiệm đang tạm ngưng nhận đơn online – vui lòng gọi tiệm để đặt bánh.`);
    }
  }
  validatePickup(input);
  const items = await priceOrderLines(input.items, input.pickupDate);

  try {
    return await getOrdersRepository().create({
      idempotencyKey: input.idempotencyKey ?? null,
      customerName: input.customer.name,
      customerPhone: input.customer.phone,
      pickupDate: input.pickupDate,
      pickupSlotId: input.slotId,
      payment: input.payment,
      note: input.note ?? "",
      items,
      totalVnd: items.reduce((sum, i) => sum + i.lineTotalVnd, 0),
    });
  } catch (err) {
    if (err instanceof OrderCreateError) {
      if (err.code === "SLOT_FULL") throw new Error("Khung giờ này đã kín đơn – vui lòng chọn khung giờ khác.");
      if (err.code === "SLOT_UNAVAILABLE") throw new Error("Khung giờ này tạm không nhận đơn – vui lòng chọn khung giờ khác.");
      throw new Error("Không tạo được đơn, vui lòng thử lại hoặc gọi tiệm.");
    }
    throw err;
  }
}

/**
 * Tra cuu don cho khach: CAN ca ma don + access token (so sanh hang-thoi-gian).
 * Ma don cong khai khong bao gio du de xem thong tin don.
 */
export async function findOrderForCustomer(code: string, token: string): Promise<Order | null> {
  if (!code || !token || code.length > 40) return null;
  const order = await getOrdersRepository().findByCode(code);
  if (!order) return null;
  const a = Buffer.from(order.accessToken);
  const b = Buffer.from(token);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return order;
}
