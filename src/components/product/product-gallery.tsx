"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProductMedia } from "@/modules/products/types";
import { ArrowLeftIcon, ArrowRightIcon } from "../ui/icons";

/** Bieu tuong "play" tren o xem truoc video */
function PlayBadge({ small = false }: { small?: boolean }) {
  return (
    <span aria-hidden="true" className={`pointer-events-none absolute inset-0 flex items-center justify-center`}>
      <span className={`flex items-center justify-center rounded-full bg-black/55 text-white ${small ? "h-8 w-8" : "h-14 w-14"}`}>
        <svg width={small ? 14 : 22} height={small ? 14 : 22} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>
      </span>
    </span>
  );
}

/**
 * Anh + video cua mon. Video: bam de phat (co dieu khien), khong tu phat am thanh.
 * Ten tham so "media" giu thu tu Admin sap xep; muc dau tien hien truoc.
 */
export function ProductGallery({ media, fallback, name, position }: { media: ProductMedia[]; fallback: string; name: string; position?: string }) {
  const items: ProductMedia[] = media.length ? media : [{ kind: "image", ref: "fallback", src: fallback }];
  const [idx, setIdx] = useState(0);
  const count = items.length;
  const go = (i: number) => setIdx((i + count) % count);
  const current = items[idx] ?? items[0]!;
  const firstImage = items.findIndex((m) => m.kind === "image");

  return (
    <div className="flex flex-col gap-3.5">
      <div className="relative h-[340px] overflow-hidden rounded-3xl bg-beige sm:h-[420px] lg:h-[480px]">
        {current.kind === "video" ? (
          <video
            key={current.src}
            src={current.src}
            controls
            playsInline
            preload="metadata"
            aria-label={`${name} – video`}
            className="h-full w-full bg-black object-contain"
          />
        ) : (
          <Image
            key={current.src}
            src={current.src}
            alt={idx === 0 ? name : `${name} – ảnh ${idx + 1}`}
            fill
            priority={idx === 0}
            sizes="(min-width: 1024px) 600px, 100vw"
            className="object-cover"
            style={{ objectPosition: idx === firstImage ? (position ?? "center 45%") : "center" }}
          />
        )}
        {count > 1 && (
          <>
            <button type="button" onClick={() => go(idx - 1)} aria-label="Ảnh trước" className="absolute left-4 top-1/2 flex h-[46px] w-[46px] -translate-y-1/2 items-center justify-center rounded-full border-0 bg-card text-maroon shadow-[0_6px_16px_rgba(36,18,13,0.2)] hover:bg-cream">
              <ArrowLeftIcon size={20} />
            </button>
            <button type="button" onClick={() => go(idx + 1)} aria-label="Ảnh tiếp" className="absolute right-4 top-1/2 flex h-[46px] w-[46px] -translate-y-1/2 items-center justify-center rounded-full border-0 bg-card text-maroon shadow-[0_6px_16px_rgba(36,18,13,0.2)] hover:bg-cream">
              <ArrowRightIcon size={20} />
            </button>
            <span className="pointer-events-none absolute right-4 top-4 rounded-full bg-black/50 px-[11px] py-[3px] text-[13px] font-semibold text-white">{idx + 1} / {count}</span>
          </>
        )}
      </div>
      {count > 1 && (
        <div role="group" aria-label="Ảnh và video sản phẩm" className="yub-scroll flex gap-3 overflow-x-auto pb-1">
          {items.map((m, i) => (
            <button
              key={m.ref + i}
              type="button"
              onClick={() => setIdx(i)}
              aria-label={m.kind === "video" ? `Xem video ${i + 1}` : `Xem ảnh ${i + 1}`}
              aria-pressed={i === idx}
              className={`relative h-[72px] w-[92px] flex-none overflow-hidden rounded-2xl border-2 bg-beige p-0 sm:h-[92px] sm:w-[120px] ${i === idx ? "border-maroon opacity-100" : "border-transparent opacity-70 hover:opacity-100"}`}
            >
              {m.kind === "video" ? (
                <>
                  {/* #t=0.1: Safari hien khung hinh dau thay vi o den */}
                  <video src={`${m.src}#t=0.1`} muted playsInline preload="metadata" tabIndex={-1} className="pointer-events-none h-full w-full object-cover" />
                  <PlayBadge small />
                </>
              ) : (
                <Image src={m.src} alt="" fill sizes="140px" className="object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
