"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import styles from "./oven-to-gift.module.css";
import { useStoreInfo } from "@/components/brand/store-info-context";
import { animationsReduced } from "../motion/motion-config";
import { ArrowRightIcon } from "../ui/icons";
import { h2Cls } from "../ui/section-heading";
import { WaveEdge } from "../ui/wave-edge";

gsap.registerPlugin(ScrollTrigger);

interface Step {
  title: string;
  text: string;
  img: string;
  /** Ti le goc cua anh -> khung dung ti le, khong cat anh */
  ratio: string;
  alt: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * "Tu lo nuong den hop qua" – ke chuyen theo cuon (May tinh):
 * cot trai dung yen (sticky) voi 4 buoc + thanh tien do, cot phai la anh lon cuon qua;
 * anh nao vao giua man hinh thi buoc tuong ung sang len, mo ta "truot len".
 * Dien thoai: danh sach the anh + chu, hien dan khi cuon.
 */
export function OvenToGift() {
  const store = useStoreInfo();
  const steps: Step[] = [
    { title: "Cuộn từng chiếc", text: "Bột bơ cán mỏng, gấp nhiều lớp rồi cuộn tay từng chiếc croissant.", img: "/images/story/shaping-hands.jpg", ratio: "1048 / 1200", alt: "Đôi tay cuộn những chiếc croissant chưa nướng" },
    { title: `Ra lò lúc ${store.freshBatchTime}`, text: `Nướng theo mẻ nhỏ — mẻ mới ra lò lúc ${store.freshBatchTime} mỗi ngày, ghé sớm để còn ấm.`, img: "/images/story/croissant-tray.jpg", ratio: "736 / 920", alt: "Khay croissant vàng óng vừa ra lò" },
    { title: "Hoàn thiện theo mẻ", text: "Tart, croissant và bánh ngọt được hoàn thiện theo từng mẻ trong ngày.", img: "/images/products/tart-rack.jpg", ratio: "802 / 1200", alt: "Khay tart nhiều vị vừa hoàn thiện" },
    { title: "Gói hộp mang tặng", text: "Đặt trước bánh kem, hộp tart mix vị cho sinh nhật và những dịp đặc biệt.", img: "/images/products/red-box-cake.jpg", ratio: "1034 / 1300", alt: "Bánh kem trái cây đặt trong hộp quà màu đỏ" },
  ];

  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLElement | null>(null);
  const fillRef = useRef<HTMLSpanElement | null>(null);
  const descRef = useRef<HTMLDivElement | null>(null);
  const first = useRef(true);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [canStick, setCanStick] = useState(false);

  // Never pin a panel taller than the usable viewport (including browser zoom).
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    let frame = 0;
    let disposed = false;
    const measure = () => {
      const top = parseFloat(getComputedStyle(panel).top) || 0;
      const fits = window.innerWidth >= 768 && panel.getBoundingClientRect().height <= window.innerHeight - top - 24;
      setCanStick(fits);
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(panel);
    observer.observe(document.documentElement);
    window.addEventListener("resize", schedule);
    document.fonts.ready.then(() => { if (!disposed) schedule(); });
    schedule();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", schedule);
    };
  }, []);

  // Theo doi anh dang o giua man hinh + thanh tien do chay theo cuon
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const mm = gsap.matchMedia();
    mm.add("(min-width: 768px)", () => {
      const cards = gsap.utils.toArray<HTMLElement>("[data-step-card]", root);
      cards.forEach((card, i) => {
        ScrollTrigger.create({ trigger: card, start: "top 58%", end: "bottom 58%", onToggle: (self) => self.isActive && setActive(i) });
      });
      if (fillRef.current && cards.length) {
        gsap.fromTo(
          fillRef.current,
          { scaleY: 0 },
          { scaleY: 1, ease: "none", scrollTrigger: { trigger: cards[0], endTrigger: cards[cards.length - 1], start: "top 58%", end: "bottom 58%", scrub: 0.6 } },
        );
      }
      if (!animationsReduced()) {
        // Anh truot len + phong nhe khi vao khung
        cards.forEach((card) => {
          const fig = card.querySelector("[data-step-img]");
          if (!fig) return;
          // Chi transform + opacity (chay tren GPU) – khong dung clip-path vi phai ve lai anh moi frame
          gsap.fromTo(fig, { y: 70, scale: 0.94, opacity: 0.35 }, { y: 0, scale: 1, opacity: 1, ease: "none", scrollTrigger: { trigger: card, start: "top 98%", end: "top 50%", scrub: 0.6 } });
        });
      }
    });
    mm.add("(max-width: 767.98px)", () => {
      if (animationsReduced()) return;
      gsap.utils.toArray<HTMLElement>("[data-step-card]", root).forEach((card) => {
        gsap.from(card, { y: 50, opacity: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: card, start: "top 88%", once: true } });
      });
    });
    return () => mm.revert();
  }, []);

  // Doi buoc: so lon + mo ta "nay" len
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const el = descRef.current;
    if (!el || animationsReduced()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-num-char]", { yPercent: 110 }, { yPercent: 0, duration: 0.7, ease: "back.out(2)", stagger: 0.06 });
      gsap.fromTo("[data-desc-line]", { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out", delay: 0.08 });
    }, el);
    return () => ctx.revert();
  }, [active]);

  const current = steps[active] ?? steps[0];

  return (
    <section ref={rootRef} data-no-reveal data-sticky={canStick ? "true" : "false"} className={`${styles.root} relative bg-maroon text-cream`}>
      <WaveEdge fill="#FBF3E3" edge="top" mirror />
      <div className={`${styles.layout} mx-auto grid max-w-[1200px] gap-10 px-5 pb-[104px] pt-[92px]`}>
        {/* ---------------- Cot trai: dung yen khi cuon (may tinh) */}
        <div ref={panelRef} className={styles.panel}>
          <h2 className={`${h2Cls} ${styles.heading} max-md:text-[32px]`}>Từ lò nướng đến hộp quà</h2>
          <p className={`${styles.intro} mb-0 mt-4 max-w-[420px] text-[17px] text-cream/75`}>Một ngày ở {store.name} — từ mẻ bột đầu tiên đến chiếc hộp bạn mang đi.</p>

          <div className={`${styles.details} mt-10 hidden md:block`}>
            <div className="relative pl-8">
              <span aria-hidden="true" className="absolute bottom-3 left-[7px] top-3 w-[2px] rounded-full bg-cream/15" />
              <span ref={fillRef} aria-hidden="true" className="absolute bottom-3 left-[7px] top-3 w-[2px] origin-top scale-y-0 rounded-full bg-butter" />
              <ol className="m-0 flex list-none flex-col gap-1 p-0">
                {steps.map((s, i) => {
                  const on = i === active;
                  const done = i < active;
                  return (
                    <li key={s.img} className="relative">
                      <span
                        aria-hidden="true"
                        className={`absolute -left-8 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 transition-all duration-500 ${on ? "scale-110 border-butter bg-butter shadow-[0_0_0_6px_rgba(232,169,59,0.18)]" : done ? "border-butter bg-maroon" : "border-cream/30 bg-maroon"}`}
                      />
                      <span className={`${styles.stepRow} flex items-baseline gap-4 py-2.5 transition-colors duration-500 ${on ? "text-cream" : "text-cream/40"}`}>
                        <span className={`w-7 font-display text-[15px] font-semibold tabular-nums ${on ? "text-butter" : ""}`}>{pad(i + 1)}</span>
                        <span className={`${styles.stepTitle} font-display text-[clamp(22px,2.1vw,28px)] font-semibold leading-tight`}>{s.title}</span>
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>

            <div ref={descRef} aria-live="polite" className={`${styles.description} mt-8 flex min-h-[150px] items-start gap-5 rounded-[24px] border border-cream/12 bg-cream/[0.04] p-6`}>
              <span aria-hidden="true" className={`${styles.number} flex flex-none overflow-hidden pb-[0.08em] font-display text-[64px] font-semibold leading-none tabular-nums text-butter`}>
                {pad(active + 1)
                  .split("")
                  .map((c, i) => (
                    <span key={`${active}-${i}`} data-num-char className="inline-block">
                      {c}
                    </span>
                  ))}
              </span>
              <p data-desc-line className={`${styles.descriptionText} m-0 pt-1 text-[16px] leading-relaxed text-cream/85`}>{current?.text}</p>
            </div>

            <Link href="/thuc-don" className={`${styles.cta} mt-8 inline-flex min-h-[52px] items-center gap-2.5 rounded-full bg-butter px-7 text-[15px] font-bold text-maroon no-underline transition-transform hover:-translate-y-0.5 hover:text-maroon`}>
              Đặt trước bánh kem & hộp quà <ArrowRightIcon />
            </Link>
          </div>
        </div>

        {/* ---------------- Cot phai: anh lon cuon qua */}
        <ol className={`${styles.cards} m-0 flex list-none flex-col gap-12 p-0`}>
          {steps.map((s, i) => (
            <li key={s.img} data-step-card className="flex flex-col gap-5 md:mx-auto md:w-full md:max-w-[500px]">
              <div data-step-img className={`${styles.image} relative w-full overflow-hidden rounded-[22px] md:rounded-[28px]`} style={{ aspectRatio: s.ratio, "--story-image-ratio": `calc(${s.ratio})` } as CSSProperties}>
                <Image src={s.img} alt={s.alt} fill sizes="(min-width: 768px) 500px, 100vw" className="object-contain" />
                <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-dark/80 px-3.5 py-2 text-[13px] font-semibold text-cream">
                  <span className="text-butter">{pad(i + 1)}</span>
                  <span aria-hidden="true" className="h-3 w-px bg-cream/30" />
                  {s.title}
                </span>
              </div>
              {/* Chu cho dien thoai (may tinh dung cot trai) */}
              <div className={`${styles.caption} flex items-start gap-4 md:hidden`}>
                <span className="flex-none font-display text-[30px] font-semibold leading-none text-butter">{pad(i + 1)}</span>
                <span className="flex flex-col gap-1">
                  <strong className="text-[19px] font-semibold">{s.title}</strong>
                  <span className="text-[15px] text-cream/80">{s.text}</span>
                </span>
              </div>
            </li>
          ))}
        </ol>

        <Link href="/thuc-don" className="flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-butter font-bold text-maroon no-underline hover:text-maroon md:hidden">
          Đặt trước bánh kem & hộp quà <ArrowRightIcon />
        </Link>
      </div>
      <WaveEdge fill="#FBF3E3" />
    </section>
  );
}
