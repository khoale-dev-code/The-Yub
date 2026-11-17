"use client";

import Link from "next/link";
import { startTransition, useState } from "react";
import { formatVnd } from "@/lib/format";
import { unitPriceOf } from "@/modules/products/pricing";
import type { Product } from "@/modules/products/types";
import { useCart } from "@/modules/cart/cart-context";
import { announceCartAdd } from "@/modules/cart/cart-fx";
import { CartAddIcon } from "./ui/icons";

const MAX = 20;

/**
 * Chon quy cach + so luong. Tong tien o day CHI de hien thi;
 * server tinh lai gia tu repository khi tao don.
 */
export function ProductPurchase({ product }: { product: Product }) {
  const { add } = useCart();
  const variants = product.variants ?? [];
  const [variantId, setVariantId] = useState<string | undefined>(variants[0]?.id);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const soldOut = product.status === "out";
  const unit = unitPriceOf(product, variantId) ?? product.priceVnd;

  const onAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
    announceCartAdd(e.currentTarget, { name: product.name, qty, note: variants.find((v) => v.id === variantId)?.label });
    setAdded(true);
    startTransition(() => add(product.id, qty, variantId));
  };

  return (
    <div className="flex flex-col gap-[22px]">
      {variants.length > 0 && (
        <fieldset className="m-0 border-0 p-0">
          <legend className="mb-2.5 p-0 font-semibold">Quy cách</legend>
          <div role="radiogroup" aria-label="Quy cách" className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button key={v.id} type="button" role="radio" aria-checked={v.id === variantId} onClick={() => { setVariantId(v.id); setAdded(false); }} className={`min-h-[46px] rounded-full border-[1.5px] px-[18px] text-[15px] font-semibold ${v.id === variantId ? "border-maroon bg-maroon text-cream" : "border-maroon/25 bg-card text-maroon hover:border-maroon"}`}>
                {v.label}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <span id="sp-qty" className="font-semibold">Số lượng</span>
          <div role="group" aria-labelledby="sp-qty" className="inline-flex items-center rounded-full border border-maroon/25 bg-card">
            <button type="button" onClick={() => { setQty((q) => Math.max(1, q - 1)); setAdded(false); }} disabled={qty <= 1} aria-label="Giảm số lượng" className="h-[46px] w-[46px] border-0 bg-transparent text-[22px] text-maroon disabled:opacity-40">−</button>
            <span aria-live="polite" className="min-w-8 text-center text-[17px] font-bold">{qty}</span>
            <button type="button" onClick={() => { setQty((q) => Math.min(MAX, q + 1)); setAdded(false); }} disabled={qty >= MAX} aria-label="Tăng số lượng" className="h-[46px] w-[46px] border-0 bg-transparent text-[22px] text-maroon disabled:opacity-40">+</button>
          </div>
        </div>
        <strong className="font-display text-[34px] font-semibold leading-none sm:text-[40px]">{formatVnd(unit * qty)}</strong>
      </div>

      <button type="button" onClick={onAdd} disabled={soldOut} className="inline-flex min-h-[58px] items-center justify-center gap-2.5 rounded-full border-0 bg-maroon text-[17px] font-semibold text-cream hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50">
        <CartAddIcon />
        {soldOut ? "Hết hôm nay" : "Thêm vào giỏ"}
      </button>
      {added && (
        <div role="status" className="flex items-center justify-between gap-3 text-sm text-[#2F4A1E]">
          <span>Đã thêm vào giỏ.</span>
          <Link href="/gio-hang" className="font-semibold text-maroon">Xem giỏ hàng →</Link>
        </div>
      )}
    </div>
  );
}
