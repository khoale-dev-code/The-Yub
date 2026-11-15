"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";
import { useLenis } from "../motion/smooth-scroll";
import { useStoreInfo } from "@/components/brand/store-info-context";

const wordsOf = (fresh: string) => ["Giòn rụm", "Thơm bơ", `Ra lò ${fresh}`, "Cà phê & trà", "Bakes & More", "Đặt trước online"];
const LOOP_SECONDS = 32;

/**
 * Dai chu chay duoi banner: tu chay lien tuc (GSAP), re chuot vao thi cham dan roi dung,
 * re chuot ra thi chay lai; cuon trang nhanh thi dai chu chay nhanh theo (kieu lenis.dev).
 */
export function Marquee() {
  const track = useRef<HTMLDivElement | null>(null);
  const tween = useRef<gsap.core.Tween | null>(null);
  const hovering = useRef(false);
  const lenis = useLenis();

  useEffect(() => {
    if (!track.current) return;
    tween.current = gsap.to(track.current, { xPercent: -50, duration: LOOP_SECONDS, ease: "none", repeat: -1 });
    return () => {
      tween.current?.kill();
      tween.current = null;
    };
  }, []);

  useEffect(() => {
    if (!lenis) return;
    const onScroll = ({ velocity }: { velocity: number }) => {
      const t = tween.current;
      if (!t || hovering.current) return;
      const boost = 1 + Math.min(Math.abs(velocity) / 6, 5);
      t.timeScale(Math.max(t.timeScale(), boost));
      gsap.to(t, { timeScale: 1, duration: 0.9, ease: "power2.out", overwrite: true });
    };
    lenis.on("scroll", onScroll);
    return () => lenis.off("scroll", onScroll);
  }, [lenis]);

  const slowTo = (value: number) => {
    if (tween.current) gsap.to(tween.current, { timeScale: value, duration: value === 0 ? 0.6 : 0.8, ease: "power2.out", overwrite: true });
  };

  const words = wordsOf(useStoreInfo().freshBatchTime);
  const items = [...words, ...words];
  return (
    <div className="overflow-hidden pb-2 pt-7">
      <div
        aria-hidden="true"
        onMouseEnter={() => {
          hovering.current = true;
          slowTo(0);
        }}
        onMouseLeave={() => {
          hovering.current = false;
          slowTo(1);
        }}
        className="-ml-[2%] w-[104%] -rotate-[1.6deg] cursor-default overflow-hidden bg-maroon py-3.5"
      >
        <div ref={track} className="flex w-max will-change-transform">
          {items.map((t, i) => (
            <span key={i} className="inline-flex items-center gap-8 whitespace-nowrap pr-8 font-display text-[22px] text-cream md:text-[28px]">
              {t}
              <span className="text-xl text-butter">✦</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
