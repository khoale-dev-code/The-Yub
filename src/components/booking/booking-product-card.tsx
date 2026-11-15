"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type MouseEvent } from "react";
import { CartAddIcon, MinusIcon, PlusIcon } from "@/components/ui/icons";
import { formatVnd } from "@/lib/format";
import { productImages } from "@/lib/images";
import { lineKey, useCart } from "@/modules/cart/cart-context";
import { announceCartAdd } from "@/modules/cart/cart-fx";
import { unitPriceOf, variantLabelOf } from "@/modules/products/pricing";
import type { Product } from "@/modules/products/types";

const MAX_QTY = 20;

const statusBadge: Record<Product["status"], { label: string; cls: string }> = {
  ready: { label: "Có sẵn", cls: "bg-card/95 text-maroon" },
  oven: { label: "Ra lò 14:30", cls: "bg-butter text-maroon" },
  pre: { label: "Đặt trước 1 ngày", cls: "bg-maroon text-cream" },
  out: { label: "Hết hôm nay", cls: "bg-dark/80 text-cream" },
};

/** The banh trong trang Dat banh: chon quy cach + tang/giam so luong ngay tren the. */
export function BookingProductCard({ product }: { product: Product }) {
  const cart = useCart();
  const [variantId, setVariantId] = useState<string | undefined>(product.variants?.[0]?.id);
  const key = lineKey({ productId: product.id, variantId });
  const qty = cart.lines.find((l) => lineKey(l) === key)?.qty ?? 0;
  const unit = unitPriceOf(product, variantId) ?? product.priceVnd;
  const soldOut = product.status === "out";
  const badge = statusBadge[product.status];
  const totalInCart = cart.lines.filter((l) => l.productId === product.id).reduce((n, l) => n + l.qty, 0);

  const addFirst = (e: MouseEvent<HTMLButtonElement>) => {
    cart.add(product.id, 1, variantId);
    announceCartAdd(e.currentTarget, { name: product.name, qty: 1, note: variantLabelOf(product, variantId) ?? undefined });
  };
  const dec = () => (qty <= 1 ? cart.remove(key) : cart.setQty(key, qty - 1));
  const inc = () => cart.setQty(key, qty + 1);

  return (
    <article
      data-cart-source
      data-booking-card
      className={`group relative flex gap-3.5 rounded-[22px] border bg-card p-2.5 transition-[border-color,box-shadow] duration-300 sm:flex-col sm:gap-0 sm:overflow-hidden sm:p-0 ${qty > 0 ? "border-maroon/45 shadow-[0_16px_34px_-22px_rgba(59,15,18,0.55)]" : "border-maroon/10 hover:border-maroon/25"}`}
    >
      <Link href={`/san-pham/${product.slug}`} aria-label={`Xem chi tiết ${product.name}`} className="relative block h-[108px] w-[104px] flex-none overflow-hidden rounded-[16px] bg-beige sm:aspect-[4/3] sm:h-auto sm:w-full sm:rounded-none">
        <Image
          src={productImages[product.image]}
          alt=""
          fill
          sizes="(min-width: 1024px) 240px, (min-width: 640px) 45vw, 104px"
          className={`object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06] ${soldOut ? "grayscale-[0.6]" : ""}`}
          style={{ objectPosition: product.imagePosition ?? "center" }}
        />
        <span className={`absolute left-1.5 top-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold sm:left-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-xs ${badge.cls}`}>{badge.label}</span>
        {totalInCart > 0 && (
          <span key={totalInCart} className="absolute right-1.5 top-1.5 flex h-7 min-w-7 items-center justify-center rounded-full bg-maroon px-1.5 text-[13px] font-bold text-cream shadow-[0_6px_14px_rgba(36,18,13,0.35)] animate-[yub-qty-pop_.4s_cubic-bezier(.34,1.56,.64,1)] sm:right-3 sm:top-3 sm:h-8 sm:min-w-8">
            ×{totalInCart}
          </span>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 py-0.5 pr-1 sm:gap-2 sm:p-4">
        <h3 className="m-0 font-display text-[17px] font-semibold leading-[1.2] sm:text-lg">
          <Link href={`/san-pham/${product.slug}`} className="no-underline">{product.name}</Link>
        </h3>
        <p className="m-0 line-clamp-2 text-[13px] leading-[1.45] text-muted sm:text-sm">{product.tagline ?? product.description}</p>

        {product.variants && product.variants.length > 1 && (
          <div role="radiogroup" aria-label={`Quy cách ${product.name}`} className="flex flex-wrap gap-1.5">
            {product.variants.map((v) => {
              const on = v.id === variantId;
              return (
                <button
                  key={v.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setVariantId(v.id)}
                  className={`min-h-8 rounded-full border px-2.5 text-xs font-semibold transition-colors ${on ? "border-maroon bg-maroon text-cream" : "border-maroon/25 bg-transparent text-maroon hover:border-maroon"}`}
                >
                  {v.label}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="text-[15px] font-semibold sm:text-base">{formatVnd(unit)}</span>
          {soldOut ? (
            <span className="text-[13px] font-semibold text-accent">Hết hôm nay</span>
          ) : qty === 0 ? (
            <button
              type="button"
              onClick={addFirst}
              aria-label={`Thêm ${product.name}${variantId ? ` (${variantLabelOf(product, variantId) ?? ""})` : ""} vào đơn`}
              className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-full border-[1.5px] border-maroon bg-transparent text-maroon transition-[background-color,color,transform] hover:bg-maroon hover:text-cream active:scale-[0.94]"
            >
              <CartAddIcon size={20} />
            </button>
          ) : (
            <div role="group" aria-label={`Số lượng ${product.name}`} className="inline-flex h-[42px] items-center rounded-full bg-maroon text-cream">
              <button type="button" onClick={dec} aria-label={`Bớt 1 ${product.name}`} className="flex h-[42px] w-[38px] items-center justify-center rounded-full border-0 bg-transparent text-cream hover:text-butter active:scale-90">
                <MinusIcon size={16} />
              </button>
              <span key={qty} aria-live="polite" className="min-w-6 text-center text-[15px] font-bold tabular-nums animate-[yub-qty-pop_.35s_ease-out]">{qty}</span>
              <button type="button" onClick={inc} disabled={qty >= MAX_QTY} aria-label={`Thêm 1 ${product.name}`} className="flex h-[42px] w-[38px] items-center justify-center rounded-full border-0 bg-transparent text-cream hover:text-butter active:scale-90 disabled:opacity-40">
                <PlusIcon size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
