import { unitPriceOf } from "@/modules/products/pricing";
import type { Product } from "@/modules/products/types";
import type { Order } from "@/modules/orders/types";

export interface ReorderLine {
  productId: string;
  variantId?: string;
  qty: number;
  name: string;
  /** Con ban duoc khong (mon con trong thuc don, chua het, quy cach con) */
  available: boolean;
}

/**
 * Chuan bi "Mua lai": chi dua ma mon + quy cach + so luong vao gio.
 * Gia KHONG lay tu don cu – gio hang va server tinh lai theo gia hien tai.
 */
export function reorderLinesOf(order: Order, products: Map<string, Product>): ReorderLine[] {
  return order.items.map((it) => {
    const p = it.productId ? products.get(it.productId) : undefined;
    const ok = Boolean(p && p.status !== "out" && unitPriceOf(p, it.variantId) !== null);
    return { productId: it.productId, variantId: it.variantId, qty: Math.min(20, Math.max(1, it.qty)), name: it.name, available: ok };
  });
}
