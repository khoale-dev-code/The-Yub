"use client";

import Image from "next/image";
import { useState } from "react";
import { productImages, type ProductImageKey } from "@/lib/images";
import { ArrowLeftIcon, ArrowRightIcon } from "../ui/icons";

export function ProductGallery({ images, name, position }: { images: ProductImageKey[]; name: string; position?: string }) {
  const [idx, setIdx] = useState(0);
  const count = images.length;
  const go = (i: number) => setIdx((i + count) % count);
  const current = images[idx] ?? images[0];
  if (!current) return null;

  return (
    <div className="flex flex-col gap-3.5">
      <div className="relative h-[340px] overflow-hidden rounded-3xl bg-beige sm:h-[420px] lg:h-[480px]">
        <Image key={current} src={productImages[current]} alt={idx === 0 ? name : `${name} – ảnh ${idx + 1}`} fill priority sizes="(min-width: 1024px) 600px, 100vw" className="object-cover" style={{ objectPosition: idx === 0 ? (position ?? "center 45%") : "center 45%" }} />
        {count > 1 && (
          <>
            <button type="button" onClick={() => go(idx - 1)} aria-label="Ảnh trước" className="absolute left-4 top-1/2 flex h-[46px] w-[46px] -translate-y-1/2 items-center justify-center rounded-full border-0 bg-card text-maroon shadow-[0_6px_16px_rgba(36,18,13,0.2)] hover:bg-cream">
              <ArrowLeftIcon size={20} />
            </button>
            <button type="button" onClick={() => go(idx + 1)} aria-label="Ảnh tiếp" className="absolute right-4 top-1/2 flex h-[46px] w-[46px] -translate-y-1/2 items-center justify-center rounded-full border-0 bg-card text-maroon shadow-[0_6px_16px_rgba(36,18,13,0.2)] hover:bg-cream">
              <ArrowRightIcon size={20} />
            </button>
            <span className="absolute bottom-4 right-4 rounded-full bg-black/50 px-[11px] py-[3px] text-[13px] font-semibold text-white">{idx + 1} / {count}</span>
          </>
        )}
      </div>
      {count > 1 && (
        <div role="group" aria-label="Ảnh sản phẩm" className="grid grid-cols-4 gap-3">
          {images.map((img, i) => (
            <button key={img + i} type="button" onClick={() => setIdx(i)} aria-label={`Xem ảnh ${i + 1}`} aria-pressed={i === idx} className={`relative h-[72px] overflow-hidden rounded-2xl border-2 bg-beige p-0 sm:h-[92px] ${i === idx ? "border-maroon opacity-100" : "border-transparent opacity-70 hover:opacity-100"}`}>
              <Image src={productImages[img]} alt="" fill sizes="140px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
