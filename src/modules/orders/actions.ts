"use server";

import { customersRepository } from "@/modules/customers/repository";
import { getCustomer } from "@/modules/customers/session";
import { orderInputSchema } from "./schema";
import { createOrder } from "./service";
import { toReceipt, type OrderReceipt } from "./types";

export type CreateOrderResult = { ok: true; receipt: OrderReceipt } | { ok: false; error: string };

/**
 * Server Action mong – chi lam 2 viec: validate bien (Zod) va goi service.
 * Khong viet nghiep vu o day.
 */
export async function createOrderAction(raw: unknown): Promise<CreateOrderResult> {
  const parsed = orderInputSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first ? first.message : "Thông tin đặt bánh chưa hợp lệ." };
  }
  try {
    // Khach dang nhap: gan don vao tai khoan (id lay tu phien o server, khong tu request)
    const me = await getCustomer();
    const order = await createOrder(parsed.data, { customerId: me?.id ?? null });
    if (me && !me.phone) await customersRepository().fillPhoneIfEmpty(me.id, parsed.data.customer.phone).catch(() => undefined);
    return { ok: true, receipt: toReceipt(order) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Không tạo được đơn, vui lòng thử lại.",
    };
  }
}
