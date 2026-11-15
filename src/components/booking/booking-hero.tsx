"use client";

import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef } from "react";
import { StoreStatus } from "@/components/brand/store-status";
import { animationsReduced } from "@/components/motion/motion-config";
import { useLenis } from "@/components/motion/smooth-scroll";
import { ArrowRightIcon, PhoneIcon } from "@/components/ui/icons";
import { productImages, type ProductImageKey } from "@/lib/images";
import { storeConfig } from "@/lib/store-config";

gsap.registerPlugin(SplitText);

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const BADGE_TEXT = "ĐẶT TRƯỚC · HẸN GIỜ · GHÉ LẤY · ";
const RIBBON_SECONDS = 46;

/** Dai anh banh chay ngang (lap 2 lan de chay vo tan) */
const ribbon: { key: ProductImageKey; pos?: string; tall?: boolean }[] = [
  { key: "strawberryCake", pos: "center 70%", tall: true },
  { key: "choco", pos: "center 45%" },
  { key: "berryTartBox", pos: "center 45%", tall: true },
  { key: "eggTarts" },
  { key: "redBoxCake", pos: "center 55%", tall: true },
  { key: "cookies", pos: "center 55%" },
  { key: "lemonCake", pos: "center 65%", tall: true },
  { key: "fruitEggTarts" },
];

const steps = [
  { target: "chon-banh", title: "Chọn bánh", text: "Bánh kem, hộp quà đặt trước 1 ngày" },
  { target: "hen-gio", title: "Hẹn giờ ghé lấy", text: `Khung ${storeConfig.freshBatchTime} có mẻ bánh vừa ra lò` },
  { target: "xac-nhan", title: "Tiệm gọi xác nhận", text: "Nhận tại tiệm, không phí giao" },
];

/**
 * Hero trang Đặt bánh online: tieu de can giua, 3 buoc bam duoc (cuon muot toi tung phan),
 * dai anh banh chay ngang (GSAP, re chuot thi dung, cuon nhanh thi chay nhanh) + huy hieu xoay.
 */
export function BookingHero() {
  const root = useRef<HTMLDivElement | null>(null);
  const badge = useRef<HTMLDivElement | null>(null);
  const track = useRef<HTMLDivElement | null>(null);
  const spin = useRef<gsap.core.Tween | null>(null);
  const loop = useRef<gsap.core.Tween | null>(null);
  const hovering = useRef(false);
  const lenis = useLenis();

  useIsoLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      if (animationsReduced()) return;
      if (badge.current) spin.current = gsap.to(badge.current, { rotation: 360, duration: 22, ease: "none", repeat: -1 });
      if (track.current) loop.current = gsap.to(track.current, { xPercent: -50, duration: RIBBON_SECONDS, ease: "none", repeat: -1 });

      const title = el.querySelector<HTMLElement>("[data-hero-title]");
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      if (title) {
        const split = SplitText.create(title, { type: "lines", mask: "lines", linesClass: "yub-line" });
        tl.from(split.lines, { yPercent: 110, duration: 1.2, stagger: 0.1 }, 0.05);
      }
      tl.from("[data-hero-fade]", { y: 24, opacity: 0, duration: 1, stagger: 0.07 }, 0.25)
        .from("[data-hero-step]", { y: 30, opacity: 0, duration: 1, stagger: 0.09 }, 0.5)
        .from("[data-hero-line]", { scaleX: 0, duration: 1.2, ease: "expo.inOut" }, 0.6)
        .from("[data-hero-photo]", { y: 90, opacity: 0, duration: 1.3, stagger: 0.06 }, 0.35)
        .from(badge.current, { scale: 0, rotation: -120, duration: 1.1, ease: "back.out(1.6)" }, 0.9);
    }, el);
    return () => ctx.revert();
  }, []);

  // Cuon nhanh -> dai anh + huy hieu chay nhanh theo (cam giac lenis.dev)
  useEffect(() => {
    if (!lenis) return;
    const onScroll = ({ velocity }: { velocity: number }) => {
      const boost = 1 + Math.min(Math.abs(velocity) / 4, 7);
      for (const t of [spin.current, hovering.current ? null : loop.current]) {
        if (!t) continue;
        t.timeScale(Math.max(t.timeScale(), boost));
        gsap.to(t, { timeScale: 1, duration: 1.1, ease: "power2.out", overwrite: true });
      }
    };
    lenis.on("scroll", onScroll);
    return () => lenis.off("scroll", onScroll);
  }, [lenis]);

  const slowRibbon = (to: number) => {
    hovering.current = to === 0;
    if (loop.current) gsap.to(loop.current, { timeScale: to, duration: to === 0 ? 0.7 : 0.9, ease: "power2.out", overwrite: true });
  };

  const scrollToId = (id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    if (lenis) lenis.scrollTo(target, { duration: 1.4 });
    else target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section data-no-reveal className="mx-auto max-w-[1248px] px-3 pt-3 sm:px-6 sm:pt-6">
      <div ref={root} className="relative overflow-hidden rounded-[26px] bg-maroon text-cream md:rounded-[32px]">
        {/* Nội dung chính – căn giữa */}
        <div className="relative z-10 flex flex-col items-center gap-5 px-5 pb-7 pt-6 text-center md:px-12 md:pb-9 md:pt-7">
          <div data-hero-fade className="flex w-full flex-wrap items-center justify-center gap-3 md:justify-between">
            <nav aria-label="Đường dẫn" className="text-[13px] text-cream/70 md:text-sm">
              <Link href="/" className="text-cream/70 hover:text-butter">Trang chủ</Link> <span aria-hidden="true">/</span> Đặt bánh online
            </nav>
            <div className="hidden md:block"><StoreStatus tone="dark" /></div>
          </div>

          <h1 data-hero-title className="m-0 max-w-[980px] text-balance font-display text-[52px] font-semibold leading-[0.95] tracking-[-0.025em] md:mt-1 md:text-[clamp(64px,7vw,100px)]">
            Đặt bánh online
          </h1>
          <p data-hero-fade className="m-0 max-w-[560px] text-balance text-[16px] text-cream/85 md:text-lg">
            Chọn bánh, hẹn ngày và khung giờ ghé lấy — tiệm gọi xác nhận rồi mới chuẩn bị, phần của bạn được để riêng khi tới.
          </p>
          <div data-hero-fade className="flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
            <button type="button" onClick={() => scrollToId("chon-banh")} className="inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-full border-0 bg-butter px-7 text-base font-bold text-maroon transition-[background-color,transform] hover:bg-cream active:scale-[0.97] sm:w-auto">
              Bắt đầu chọn bánh <ArrowRightIcon />
            </button>
            <a href={storeConfig.phoneHref} className="inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-full border-[1.5px] border-cream/50 px-6 font-semibold text-cream no-underline hover:border-butter hover:text-butter sm:w-auto">
              <PhoneIcon /> Gọi {storeConfig.phone}
            </a>
          </div>

          {/* 3 bước – bấm để cuộn tới phần tương ứng */}
          <ol aria-label="Cách đặt bánh" className="relative m-0 mt-2 grid w-full max-w-[900px] list-none grid-cols-3 gap-2 p-0 md:mt-4 md:gap-6">
            <span data-hero-line aria-hidden="true" className="absolute left-[16.6%] right-[16.6%] top-5 h-0 origin-left border-t-[1.5px] border-dashed border-cream/35 md:top-6" />
            {steps.map((s, i) => (
              <li key={s.target} data-hero-step className="relative">
                <button type="button" onClick={() => scrollToId(s.target)} className="group flex w-full flex-col items-center gap-2 rounded-2xl border-0 bg-transparent px-1 pb-1 text-cream">
                  <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-butter font-display text-lg font-semibold text-maroon ring-[6px] ring-maroon transition-transform duration-300 group-hover:scale-110 md:h-12 md:w-12 md:text-xl">{i + 1}</span>
                  <span className="text-[14px] font-bold leading-[1.25] group-hover:text-butter md:text-base">{s.title}</span>
                  <span className="hidden max-w-[230px] text-balance text-[13px] leading-[1.45] text-cream/70 sm:block md:text-sm">{s.text}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>

        {/* Dải ảnh chạy ngang */}
        <div
          aria-hidden="true"
          onMouseEnter={() => slowRibbon(0)}
          onMouseLeave={() => slowRibbon(1)}
          className="relative overflow-hidden pb-6 md:pb-8"
        >
          <div ref={track} className="flex w-max items-end gap-3 md:gap-4">
            {[...ribbon, ...ribbon].map((r, i) => (
              <div
                key={`${r.key}-${i}`}
                data-hero-photo={i < ribbon.length ? "" : undefined}
                className={`relative flex-none overflow-hidden rounded-[20px] bg-beige ${r.tall ? "h-[140px] w-[110px] md:h-[184px] md:w-[148px]" : "h-[116px] w-[140px] md:h-[150px] md:w-[190px]"} ${i % 2 === 0 ? "rotate-[-1.5deg]" : "rotate-[1.5deg]"}`}
              >
                <Image src={productImages[r.key]} alt="" fill sizes="(min-width: 768px) 220px, 150px" className="object-cover" style={{ objectPosition: r.pos ?? "center" }} />
              </div>
            ))}
          </div>
        </div>

        {/* Huy hiệu xoay */}
        <div className="pointer-events-none absolute left-8 top-[17%] z-20 hidden h-[120px] w-[120px] -rotate-6 lg:block xl:left-14 xl:h-[140px] xl:w-[140px]">
          <div className="absolute inset-0 rounded-full bg-butter shadow-[0_18px_36px_-12px_rgba(36,18,13,0.55)]" />
          <div ref={badge} className="absolute inset-0">
            <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden="true">
              <defs>
                <path id="yub-badge-circle" d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0" />
              </defs>
              <text className="fill-maroon font-sans" style={{ fontSize: 17, fontWeight: 700 }}>
                <textPath href="#yub-badge-circle" textLength={464} lengthAdjust="spacing">{BADGE_TEXT}</textPath>
              </text>
            </svg>
          </div>
          <div className="absolute inset-[30%] flex items-center justify-center rounded-full bg-maroon text-butter">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="8.5" />
              <path d="M12 7.5V12l3 2" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
