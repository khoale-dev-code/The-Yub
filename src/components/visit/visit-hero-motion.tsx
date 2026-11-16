"use client";

import gsap from "gsap";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import { animationsReduced } from "../motion/motion-config";

/**
 * Mo dau trang Ghe tiem: chu tieu de "nay" len tung chu, anh mo khung + thu nho ve 1,
 * the "Me chieu nay" bat ra, cac dong con lai troi len. Chay 1 lan khi vao trang.
 */
export function VisitHeroMotion({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || animationsReduced()) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.from("[data-hc]", { yPercent: 115, rotate: 6, duration: 0.9, ease: "back.out(1.8)", stagger: 0.045 })
        .from("[data-hero-fade]", { y: 22, opacity: 0, duration: 0.8, stagger: 0.07 }, 0.2)
        .fromTo("[data-hero-media]", { clipPath: "inset(12% 10% 12% 10% round 32px)" }, { clipPath: "inset(0% 0% 0% 0% round 32px)", duration: 1.2, ease: "expo.inOut", clearProps: "clipPath" }, 0)
        .from("[data-hero-img]", { scale: 1.18, duration: 1.6, clearProps: "transform" }, 0)
        .from("[data-hero-badge]", { scale: 0.6, rotate: -12, opacity: 0, duration: 0.8, ease: "back.out(2)" }, 0.55);
    }, el);
    return () => ctx.revert();
  }, []);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
