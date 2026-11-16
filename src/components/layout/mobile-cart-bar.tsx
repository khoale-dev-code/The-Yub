"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatVnd } from "@/lib/format";
import { useCart } from "@/modules/cart/cart-context";
import { ArrowRightIcon } from "../ui/icons";

export type PriceMap = Record<string, { base: number; variants?: Record<string, number> }>;

/**
 * Thanh gio hang noi tren dien thoai (Mobile-v2). Tong tien chi de xem truoc –
 * server tinh lai khi tao don.
 */
export function MobileCartBar({ prices }: { prices: PriceMap }) {
  const { lines, count } = useCart();
  const pathname = usePathname();
  if (count === 0 || pathname.startsWith("/gio-hang") || pathname.startsWith("/don-hang")) return null;

  const total = lines.reduce((sum, l) => {
    const p = prices[l.productId];
    if (!p) return sum;
    const unit = l.variantId ? (p.variants?.[l.variantId] ?? p.base) : p.base;
    return sum + unit * l.qty;
  }, 0);

  return (
    <div className="fixed inset-x-3 bottom-4 z-30 flex items-center gap-3 rounded-full bg-maroon py-2 pl-5 pr-2 text-cream shadow-[0_12px_32px_rgba(59,15,18,0.35)] md:hidden">
      <div className="flex min-w-0 flex-1 flex-col leading-[1.3]">
        <span className="text-xs text-cream/80">Giỏ hàng · {count} món</span>
        <strong className="text-[15px]">{formatVnd(total)}</strong>
      </div>
      <Link href="/gio-hang" className="inline-flex min-h-[52px] items-center gap-1.5 rounded-full bg-butter px-[22px] font-semibold text-maroon no-underline hover:text-maroon">
        Đặt bánh <ArrowRightIcon />
      </Link>
    </div>
  );
}
