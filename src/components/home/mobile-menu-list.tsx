"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { formatVnd } from "@/lib/format";
import { productImages } from "@/lib/images";
import type { Product, ProductCategory } from "@/modules/products/types";
import { AddToCartButton } from "../add-to-cart-button";
import { statusMeta } from "../ui/status-badge";

const cats: { id: "all" | ProductCategory; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "croissant", label: "Croissant" },
  { id: "tart", label: "Tart" },
  { id: "cake", label: "Bánh kem" },
  { id: "cookie", label: "Cookie" },
];

/** "Banh cua tiem" tren dien thoai: chip loai + dong san pham anh trai (Mobile-v2). */
export function MobileMenuList({ products, featured }: { products: Product[]; featured: Product[] }) {
  const [cat, setCat] = useState<(typeof cats)[number]["id"]>("all");
  const list = cat === "all" ? featured : products.filter((p) => p.category === cat).slice(0, 4);

  return (
    <>
      <div role="group" aria-label="Lọc theo loại" className="flex flex-wrap gap-2 px-1">
        {cats.map((c) => (
          <button key={c.id} type="button" aria-pressed={c.id === cat} onClick={() => setCat(c.id)} className={`min-h-11 rounded-full border border-maroon px-4 text-sm font-semibold ${c.id === cat ? "bg-maroon text-cream" : "bg-transparent text-maroon"}`}>
            {c.label}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {list.map((p) => {
          const soldOut = p.status === "out";
          const meta = statusMeta[p.status];
          return (
            <article key={p.id} className="flex items-stretch gap-3.5 rounded-[22px] border border-maroon/10 bg-card p-2.5">
              <Link href={`/san-pham/${p.slug}`} aria-label={`Xem ${p.name}`} className="relative h-[124px] w-28 flex-none overflow-hidden rounded-2xl bg-beige">
                <Image src={productImages[p.image]} alt={p.name} fill sizes="112px" className={`object-cover ${soldOut ? "opacity-55" : ""}`} style={{ objectPosition: p.imagePosition ?? "center" }} />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-[3px] pr-0.5 pt-0.5">
                <span className={`self-start rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.className}`}>{meta.label}</span>
                <h3 className="m-0 mt-0.5 font-display text-lg font-semibold leading-[1.25]"><Link href={`/san-pham/${p.slug}`} className="no-underline">{p.name}</Link></h3>
                <p className="m-0 text-[13px] leading-[1.45] text-muted-2">{p.tagline ?? p.description}</p>
                <div className="mt-auto flex items-center justify-between gap-2 pt-1.5">
                  <span className="font-display text-lg font-semibold">{formatVnd(p.priceVnd)}</span>
                  {soldOut ? (
                    <span className="inline-flex min-h-11 items-center text-[13px] font-semibold text-[#6B5A50]">Hết hôm nay</span>
                  ) : (
                    <AddToCartButton productId={p.id} productName={p.name} variantId={p.variants?.[0]?.id} tone="filled" size={44} />
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
