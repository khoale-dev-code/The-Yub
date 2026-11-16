"use client";

import gsap from "gsap";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { animationsReduced } from "../motion/motion-config";
import { ArrowRightIcon } from "../ui/icons";
import { WaveEdge } from "../ui/wave-edge";

export interface HeroSlide {
  /** Anh ngang cho may tinh (khuyen nghi >= 1920x912) */
  img: string;
  /** Anh doc cho dien thoai (khuyen nghi >= 1200x1900) */
  imgMobile: string;
  pos: string;
  posMobile?: string;
  alt: string;
  headline: string;
  sub: string;
  cta: string;
  href: string;
  /** The gia – bo trong price neu khong gan voi 1 mon co gia */
  item?: string;
  price?: string;
  note?: string;
  /** Anh da co san logo/chu thuong hieu: an tieu de + the gia, chi giu nut */
  brand?: boolean;
}

/** Banner tu chuyen sau 3 giay */
export const HERO_AUTOPLAY_MS = 3000;

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [idx, setIdx] = useState(0);
  const [hidden, setHidden] = useState(false);
  const textRef = useRef<HTMLDivElement | null>(null);
  const tagRef = useRef<HTMLDivElement | null>(null);
  const go = useCallback((i: number) => setIdx((i + slides.length) % slides.length), [slides.length]);

  // Tam dung khi tab bi an (tiet kiem tai nguyen), chay tiep khi quay lai
  useEffect(() => {
    const onVis = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    if (hidden || slides.length < 2) return;
    const t = setTimeout(() => go(idx + 1), HERO_AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [idx, hidden, go, slides.length]);

  // Chu tieu de "truot len" tung dong + the gia bat ra moi lan doi slide
  useEffect(() => {
    if (animationsReduced()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-line]", { yPercent: 110 }, { yPercent: 0, duration: 0.9, ease: "power4.out", stagger: 0.08 });
      gsap.fromTo("[data-hero-fade]", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: "power3.out", delay: 0.25, stagger: 0.08 });
      if (tagRef.current) {
        gsap.fromTo(tagRef.current, { scale: 0.85, rotate: -4, opacity: 0 }, { scale: 1, rotate: 4, opacity: 1, duration: 0.8, ease: "back.out(1.8)", delay: 0.35 });
      }
    }, textRef.current?.parentElement ?? undefined);
    return () => ctx.revert();
  }, [idx]);

  const slide = slides[idx] ?? slides[0];
  if (!slide) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Giới thiệu"
      className="relative hidden min-h-[800px] items-center justify-center overflow-hidden bg-dark px-6 pb-[170px] pt-28 text-cream md:flex"
    >
      <div data-parallax="0.16" className="absolute inset-x-0 -inset-y-[10%]">
      {slides.map((s, i) => (
        <Image
          key={s.img}
          src={s.img}
          alt={i === idx ? s.alt : ""}
          aria-hidden={i !== idx}
          fill
          priority={i === 0}
          sizes="100vw"
          className={`object-cover transition-[opacity,transform] ease-out ${i === idx ? "scale-100 opacity-100 duration-[900ms,3600ms]" : "scale-[1.08] opacity-0 duration-[900ms,0ms]"}`}
          style={{ objectPosition: s.pos }}
        />
      ))}
      </div>
      {/* Lop phu toi de chu o giua de doc (nhu UI cu); slide thuong hieu khong phu */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 bg-[rgba(28,12,8,0.48)] transition-opacity duration-700 ${slide.brand ? "opacity-0" : "opacity-100"}`}
      />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[38%] bg-[linear-gradient(0deg,rgba(28,12,8,0.45),transparent)]" />
      {/* Hat nhieu (anh PNG lap lai) – nhe hon nhieu so voi filter SVG + mix-blend khi cuon */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[url(/images/brand/grain.png)] bg-[length:160px_160px] opacity-50" />

      {slide.brand ? (
        <div ref={textRef} aria-live="polite" className="absolute bottom-[170px] left-[26.5%] z-10 -translate-x-1/2">
          <h1 className="sr-only">{slide.headline.replace(/\n/g, " ")}</h1>
          <Link data-hero-fade href={slide.href} className="inline-flex min-h-[52px] items-center gap-2.5 bg-maroon px-[30px] text-[15px] font-semibold tracking-[0.04em] text-cream no-underline shadow-[0_14px_30px_-10px_rgba(59,15,18,0.6)] hover:bg-accent hover:text-cream">
            {slide.cta} <ArrowRightIcon />
          </Link>
        </div>
      ) : (
        <div ref={textRef} aria-live="polite" className="relative mx-auto flex max-w-[980px] flex-col items-center gap-7 text-center">
          <span className="absolute -left-10 -top-11 hidden -rotate-9 rounded-[14px] bg-butter px-5 py-2 font-display text-[22px] font-semibold text-maroon shadow-[0_10px_24px_rgba(0,0,0,0.25)] md:block">
            Giòn rụm
          </span>
          <h1 key={slide.headline} className="m-0 text-balance font-display text-[clamp(46px,6.8vw,100px)] font-semibold leading-[1.02] tracking-[-0.02em] [text-shadow:0_2px_30px_rgba(0,0,0,0.3)]">
            {slide.headline.split("\n").map((line) => (
              /* Mat na co dem tren/duoi: khong cat net chu g, y, p va dau tieng Viet */
              <span key={line} className="-my-[0.16em] block overflow-hidden py-[0.2em]">
                <span data-line className="block">{line}</span>
              </span>
            ))}
          </h1>
          <p data-hero-fade className="m-0 max-w-[560px] text-lg text-cream/90 [text-shadow:0_1px_14px_rgba(0,0,0,0.35)]">{slide.sub}</p>
          <Link data-hero-fade href={slide.href} className="inline-flex min-h-[52px] items-center gap-2.5 bg-cream px-[30px] text-[15px] font-semibold tracking-[0.04em] text-maroon no-underline hover:bg-butter hover:text-maroon">
            {slide.cta} <ArrowRightIcon />
          </Link>
        </div>
      )}

      {!slide.brand && slide.item && (
        <div ref={tagRef} className="absolute bottom-40 right-[7%] hidden rotate-4 flex-col items-center rounded-[22px] bg-butter px-[26px] py-4 text-maroon shadow-[0_16px_36px_rgba(0,0,0,0.3)] md:flex">
          <span aria-hidden="true" className="absolute -left-[9px] top-1/2 h-5 w-5 -translate-y-1/2 rotate-45 rounded-[3px] bg-butter" />
          {slide.price && <span className="relative font-display text-4xl font-semibold leading-[1.1]">{slide.price}</span>}
          <span className={`relative font-bold ${slide.price ? "text-sm" : "font-display text-2xl"}`}>{slide.item}</span>
          {slide.note && <span className="relative text-xs font-medium">{slide.note}</span>}
        </div>
      )}

      {/* Dieu khien slide: goc trai duoi (doi xung voi the gia ben phai) -> khong de len nut CTA o giua */}
      <div className="absolute bottom-[clamp(118px,10.5vw,176px)] left-[6%] z-[2] flex items-center gap-1">
        <span aria-hidden="true" className="mr-2 font-display text-[15px] font-semibold tabular-nums text-cream/90">
          {String(idx + 1).padStart(2, "0")}
          <span className="text-cream/50"> / {String(slides.length).padStart(2, "0")}</span>
        </span>
        {slides.map((s, i) => (
          <button key={s.img} type="button" onClick={() => go(i)} aria-label={`Slide ${i + 1}`} aria-current={i === idx} className="flex h-11 w-11 items-center justify-center p-0">
            <span className={`relative block h-2 overflow-hidden rounded-full transition-[width] duration-300 ${i === idx ? "w-10 bg-cream/35" : "w-2 bg-cream/55 hover:bg-cream"}`}>
              {i === idx && !hidden && (
                <span key={idx} className="absolute inset-0 origin-left rounded-full bg-butter" style={{ animation: `yub-dot-fill ${HERO_AUTOPLAY_MS}ms linear forwards` }} />
              )}
            </span>
          </button>
        ))}
      </div>

      <WaveEdge fill="#FBF3E3" />
    </section>
  );
}
