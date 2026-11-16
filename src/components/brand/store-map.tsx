"use client";

import { useEffect, useRef, useState } from "react";

const PinIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
    <circle cx="12" cy="10" r="2.4" />
  </svg>
);

/**
 * Ban do Google Maps nhung, toi uu do muot:
 *  - Chi tai iframe khi sap cuon toi (IntersectionObserver) -> khong lam nang luc tai trang.
 *  - Mac dinh "khoa" thao tac tren ban do de con lan chuot/vuot van cuon trang (Lenis) binh thuong;
 *    bam "Di chuyển bản đồ" moi mo khoa, roi chuot khoi ban do thi tu khoa lai.
 */
export function StoreMap({
  src,
  title,
  directionsUrl,
  address,
  fill = false,
  className = "",
}: {
  src: string;
  title: string;
  directionsUrl?: string | null;
  /** Hien dia chi tren ban do (goc duoi trai) */
  address?: string | null;
  /** true = phu kin khung cha (absolute inset-0); false = tu co chieu cao qua className */
  fill?: boolean;
  className?: string;
}) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [near, setNear] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={boxRef} onMouseLeave={() => setActive(false)} className={`${fill ? "absolute inset-0" : "relative"} isolate overflow-hidden bg-sand ${className}`}>
      {/* Nen cho trong luc tai */}
      <div aria-hidden="true" className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${loaded ? "opacity-0" : "opacity-100"}`}>
        <svg className="absolute inset-0 h-full w-full opacity-40" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
          <g fill="none" stroke="#C9B79C" strokeWidth="10" strokeLinecap="round">
            <path d="M-20 80 C 80 60, 160 130, 420 90" />
            <path d="M60 -20 C 90 100, 40 200, 120 320" />
            <path d="M-20 230 C 120 210, 260 260, 420 200" />
            <path d="M280 -20 C 250 90, 330 180, 300 320" />
          </g>
        </svg>
        <span className="relative flex h-14 w-14 animate-pulse items-center justify-center rounded-full bg-maroon text-butter shadow-[0_12px_24px_rgba(59,15,18,0.3)]">
          <PinIcon />
        </span>
      </div>

      {near && (
        <iframe
          title={title}
          src={src}
          onLoad={() => setLoaded(true)}
          className={`absolute inset-0 h-full w-full border-0 transition-opacity duration-700 ${loaded ? "opacity-100" : "opacity-0"} ${active ? "" : "pointer-events-none"}`}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      )}

      {!active && (
        <button
          type="button"
          onClick={() => setActive(true)}
          className={`absolute inset-0 z-[1] flex bg-transparent p-4 text-left ${address ? "items-start justify-end pt-16 sm:pt-4" : "items-end justify-center"}`}
          aria-label="Bấm để di chuyển, phóng to bản đồ"
        >
          <span className="inline-flex min-h-10 items-center gap-2 rounded-full bg-dark/75 px-4 text-[13px] font-semibold text-cream shadow-lg backdrop-blur-md">
            <PinIcon size={16} /> Bấm để di chuyển bản đồ
          </span>
        </button>
      )}
      {active && (
        <button type="button" onClick={() => setActive(false)} className="absolute right-3 top-3 z-[1] inline-flex min-h-10 items-center rounded-full bg-dark/80 px-4 text-[13px] font-semibold text-cream shadow-lg">
          Xong
        </button>
      )}
      {address && (
        <p className="pointer-events-none absolute bottom-3 left-3 right-3 z-[2] m-0 flex max-w-[420px] items-start gap-2 rounded-[16px] bg-card/95 px-3.5 py-2.5 text-[14px] font-semibold leading-snug text-maroon shadow-[0_12px_24px_-10px_rgba(36,18,13,0.45)]">
          <span className="mt-0.5 flex-none text-accent"><PinIcon size={16} /></span>
          {address}
        </p>
      )}
      {directionsUrl && (
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute left-3 top-3 z-[2] inline-flex min-h-10 items-center gap-1.5 rounded-full bg-butter px-4 text-[13px] font-bold text-maroon no-underline shadow-[0_10px_20px_-8px_rgba(36,18,13,0.5)] hover:bg-cream hover:text-maroon"
        >
          <PinIcon size={16} /> Chỉ đường
        </a>
      )}
    </div>
  );
}
