import { getOrdersRepository } from "@/modules/orders/repository";
import { isLocalCustomers, customersRepository } from "./repository";
import type { CustomerSummary } from "./types";

/** Danh sach khach cho Admin (kem so don, tong tien). Goi SAU assertAdmin/requireAdmin. */
export async function listCustomersForAdmin(q: string): Promise<CustomerSummary[]> {
  const list = await customersRepository().list(q);
  if (!isLocalCustomers()) return list;
  // Che do xem thu: tinh so don tu bo nho + loc tim kiem
  const term = q.trim().toLowerCase();
  const out: CustomerSummary[] = [];
  for (const c of list) {
    if (term && ![c.fullName, c.email, c.phone ?? ""].some((v) => v.toLowerCase().includes(term))) continue;
    const orders = await getOrdersRepository().listByCustomer(c.id);
    out.push({
      ...c,
      orderCount: orders.length,
      totalVnd: orders.filter((o) => o.status !== "cancelled" && o.status !== "rejected").reduce((s, o) => s + o.totalVnd, 0),
      lastOrderAt: orders[0]?.createdAt ?? null,
    });
  }
  return out;
}
