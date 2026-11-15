import { addDays, todayVN } from "@/lib/dates";
import { pickupSlots } from "@/lib/pickup";
import { getOrdersRepository } from "@/modules/orders/repository";
import type { Order, OrderStatus, PaymentMethod } from "@/modules/orders/types";

/** Ky bao cao – tinh theo NGAY NHAN BANH (gio Viet Nam) */
export const PERIODS = [
  { id: "7-ngay", label: "7 ngày" },
  { id: "30-ngay", label: "30 ngày" },
  { id: "thang-nay", label: "Tháng này" },
  { id: "thang-truoc", label: "Tháng trước" },
] as const;
export type PeriodId = (typeof PERIODS)[number]["id"];

export function periodRange(id: string, today = todayVN()): { id: PeriodId; from: string; to: string } {
  const [y, m] = today.split("-").map(Number) as [number, number];
  const pad = (n: number) => String(n).padStart(2, "0");
  const monthEnd = (yy: number, mm: number) => new Date(Date.UTC(yy, mm, 0)).getUTCDate();
  switch (id) {
    case "30-ngay":
      return { id, from: addDays(today, -29), to: today };
    case "thang-nay":
      return { id, from: `${y}-${pad(m)}-01`, to: `${y}-${pad(m)}-${pad(monthEnd(y, m))}` };
    case "thang-truoc": {
      const py = m === 1 ? y - 1 : y;
      const pm = m === 1 ? 12 : m - 1;
      return { id, from: `${py}-${pad(pm)}-01`, to: `${py}-${pad(pm)}-${pad(monthEnd(py, pm))}` };
    }
    default:
      return { id: "7-ngay", from: addDays(today, -6), to: today };
  }
}

const DONE: OrderStatus[] = ["completed"];
const EXPECTED: OrderStatus[] = ["confirmed", "preparing", "ready"];
const CLOSED: OrderStatus[] = ["cancelled", "rejected"];

export interface Report {
  from: string;
  to: string;
  days: { date: string; revenue: number; orders: number }[];
  totals: {
    revenueDone: number;
    revenueExpected: number;
    activeOrders: number;
    completed: number;
    closed: number;
    avgOrder: number;
    closedRate: number;
    paidTransfer: number;
  };
  topProducts: { name: string; qty: number; revenue: number }[];
  bySlot: { label: string; orders: number }[];
  byPayment: Record<PaymentMethod, { orders: number; revenue: number }>;
}

/**
 * Doanh thu = tong cac don "Đã giao" (completed). Don da xac nhan nhung chua giao tinh vao "dự kiến".
 * Don huy / tu choi khong tinh doanh thu.
 */
export function buildReport(orders: Order[], from: string, to: string): Report {
  const active = orders.filter((o) => !CLOSED.includes(o.status));
  const done = orders.filter((o) => DONE.includes(o.status));

  const days: Report["days"] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) {
    days.push({
      date: d,
      revenue: done.filter((o) => o.pickupDate === d).reduce((n, o) => n + o.totalVnd, 0),
      orders: active.filter((o) => o.pickupDate === d).length,
    });
    if (days.length > 62) break;
  }

  const products = new Map<string, { qty: number; revenue: number }>();
  for (const o of active) {
    for (const i of o.items) {
      const cur = products.get(i.name) ?? { qty: 0, revenue: 0 };
      cur.qty += i.qty;
      cur.revenue += i.lineTotalVnd;
      products.set(i.name, cur);
    }
  }

  const revenueDone = done.reduce((n, o) => n + o.totalVnd, 0);
  const byPayment: Report["byPayment"] = { cod: { orders: 0, revenue: 0 }, transfer: { orders: 0, revenue: 0 } };
  for (const o of done) {
    byPayment[o.payment].orders += 1;
    byPayment[o.payment].revenue += o.totalVnd;
  }

  return {
    from,
    to,
    days,
    totals: {
      revenueDone,
      revenueExpected: orders.filter((o) => EXPECTED.includes(o.status)).reduce((n, o) => n + o.totalVnd, 0),
      activeOrders: active.length,
      completed: done.length,
      closed: orders.length - active.length,
      avgOrder: done.length ? Math.round(revenueDone / done.length) : 0,
      closedRate: orders.length ? (orders.length - active.length) / orders.length : 0,
      paidTransfer: orders.filter((o) => o.payment === "transfer" && o.paymentStatus === "paid").reduce((n, o) => n + o.totalVnd, 0),
    },
    topProducts: [...products.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.qty - a.qty || b.revenue - a.revenue)
      .slice(0, 8),
    bySlot: pickupSlots.map((s) => ({ label: s.label, orders: active.filter((o) => o.pickupSlotId === s.id).length })),
    byPayment,
  };
}

export async function getReport(periodId: string): Promise<Report & { period: PeriodId }> {
  const { id, from, to } = periodRange(periodId);
  const orders = await getOrdersRepository().list({ pickupFrom: from, pickupTo: to, limit: 5000 });
  return { ...buildReport(orders, from, to), period: id };
}
