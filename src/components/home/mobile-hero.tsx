"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useStoreInfo } from "@/components/brand/store-info-context";
import { ArrowRightIcon } from "../ui/icons";
import { WaveEdge } from "../ui/wave-edge";
import { HERO_AUTOPLAY_MS, type HeroSlide } from "./hero-carousel";

/** Hero cho dien thoai: anh tran vien tu chuyen sau 3 giay, the gia doi theo anh (Mobile-v2). */
export function MobileHero({ slides }: { slides: HeroSlide[] }) {
  const store = useStoreInfo();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setTimeout(() => {
      if (!document.hidden) setIdx((i) => (i + 1) % slides.length);
    }, HERO_AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [idx, slides.length]);

  const slide = slides[idx] ?? slides[0];
  if (!slide) return null;

  return (
    <section aria-roledescription="carousel" aria-label="Giới thiệu" className="relative bg-page md:hidden">
      <div className="relative h-[620px] overflow-hidden bg-dark sm:h-[680px]">
        {slides.map((s, i) => (
          <Image
            key={s.imgMobile}
            src={s.imgMobile}
            alt={i === idx ? s.alt : ""}
            aria-hidden={i !== idx}
            fill
            priority={i === 0}
            sizes="100vw"
            className={`object-cover transition-[opacity,transform] ease-out ${i === idx ? "scale-100 opacity-100 duration-[900ms,3600ms]" : "scale-[1.08] opacity-0 duration-[900ms,0ms]"}`}
            style={{ objectPosition: s.posMobile ?? "center" }}
          />
        ))}
        {/* Phu toi phia duoi cho chu, giu mau anh phia tren */}
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(0deg,rgba(28,12,8,0.82)_0%,rgba(28,12,8,0.55)_32%,rgba(28,12,8,0.05)_62%,rgba(28,12,8,0)_100%)]" />
        <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-cream/25 bg-dark/45 px-3.5 py-2 text-[13px] font-semibold text-cream backdrop-blur-md">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-butter" />
          Mẻ mới ra lò lúc {store.freshBatchTime}
        </span>
        {!slide.brand && slide.item && (
        <div key={idx} className="absolute right-[22px] top-[170px] flex rotate-4 animate-[yub-pop_0.6s_cubic-bezier(0.34,1.56,0.64,1)] flex-col items-center rounded-[18px] bg-butter px-5 py-3 text-maroon shadow-[0_14px_30px_rgba(0,0,0,0.35)]">
          <span aria-hidden="true" className="absolute -left-2 top-1/2 h-[18px] w-[18px] -translate-y-1/2 rotate-45 rounded-[3px] bg-butter" />
          {slide.price && <span className="relative font-display text-[28px] font-semibold leading-[1.1]">{slide.price}</span>}
          <span className={`relative font-bold ${slide.price ? "text-[13px]" : "font-display text-lg"}`}>{slide.item}</span>
          {slide.note && <span className="relative text-xs font-medium">{slide.note}</span>}
        </div>
        )}
        <div className="absolute inset-x-5 bottom-[78px] z-[2] flex flex-col gap-3.5 text-cream">
          <h1 className={`m-0 text-balance font-display text-[40px] font-semibold leading-[1.08] tracking-[-0.015em] text-white transition-opacity duration-500 [text-shadow:0_2px_24px_rgba(0,0,0,0.35)] ${slide.brand ? "opacity-0" : "opacity-100"}`}>
            Giòn rụm, thơm bơ, ra lò mỗi chiều.
          </h1>
          <p className={`m-0 text-base text-cream/92 transition-opacity duration-500 [text-shadow:0_1px_12px_rgba(0,0,0,0.35)] ${slide.brand ? "opacity-0" : "opacity-100"}`}>Bánh nướng theo mẻ nhỏ, cà phê pha khi bạn tới. Hẹn giờ online, ghé lấy khi bánh còn ấm.</p>
          <div className="mt-1.5 grid grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] gap-2.5">
            <Link href="/thuc-don" className="flex min-h-[52px] items-center justify-center gap-1.5 rounded-full bg-cream px-3 text-[15px] font-semibold text-maroon no-underline hover:text-maroon">Xem thực đơn <ArrowRightIcon /></Link>
            <Link href="/thuc-don" className="flex min-h-[52px] items-center justify-center rounded-full border-[1.5px] border-cream/75 px-3 text-[15px] font-semibold text-cream no-underline hover:text-butter">Đặt trước</Link>
          </div>
          <div aria-hidden="true" className="flex justify-center gap-1.5 pt-1">
            {slides.map((s, i) => (
              <span key={s.img} className={`h-1.5 rounded-full transition-all duration-300 ${i === idx ? "w-6 bg-butter" : "w-1.5 bg-cream/50"}`} />
            ))}
          </div>
        </div>
        <WaveEdge fill="#FBF3E3" />
      </div>
    </section>
  );
}
