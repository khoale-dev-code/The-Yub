"use client";

import "lenis/dist/lenis.css";
import "./motion.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { animationsReduced, motionConfig, osPrefersReducedMotion, smoothScrollDisabled } from "./motion-config";

gsap.registerPlugin(ScrollTrigger);

const LenisContext = createContext<Lenis | null>(null);

/** Truy cap Lenis (vd: dung cuon khi mo menu). */
export const useLenis = () => useContext(LenisContext);


/**
 * Smooth scroll toan trang kieu lenis.dev: Lenis noi suy vi tri cuon (lerp),
 * chay chung mot vong lap voi gsap.ticker de ScrollTrigger va animation khop tung frame.
 * Bao trang thai: them ?motion=debug vao URL de hien huy hieu chan doan.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const [debug, setDebug] = useState<string | null>(null);
  const pathname = usePathname();
  const lastPath = useRef(pathname);
  const bar = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const reduced = osPrefersReducedMotion();
    document.documentElement.classList.toggle("yub-reduced-motion", animationsReduced());
    const wantDebug = new URLSearchParams(window.location.search).get("motion") === "debug";

    if (smoothScrollDisabled()) {
      if (wantDebug) setDebug("Lenis: TẮT (máy bật Giảm chuyển động)");
      return;
    }

    const instance = new Lenis({
      autoRaf: false,
      lerp: motionConfig.lerp,
      wheelMultiplier: motionConfig.wheelMultiplier,
      smoothWheel: true,
      syncTouch: motionConfig.syncTouch,
      anchors: true,
      allowNestedScroll: true,
      // Lenis 1.3 tu tat khi he dieu hanh "giam chuyen dong" – quyet dinh do motionConfig
      respectReducedMotion: motionConfig.smoothScrollRespectsReducedMotion,
    });

    const setBar = (progress: number) => {
      if (bar.current) bar.current.style.transform = `scaleX(${Number.isFinite(progress) ? progress : 0})`;
    };
    instance.on("scroll", (l: Lenis) => {
      ScrollTrigger.update();
      setBar(l.progress);
    });

    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    setLenis(instance);

    if (wantDebug) {
      setDebug(
        `Lenis: BẬT · lerp ${motionConfig.lerp} · Giảm chuyển động (hệ điều hành): ${reduced ? "CÓ" : "không"} · Hiệu ứng: ${animationsReduced() ? "TẮT" : "BẬT"}`,
      );
    }

    return () => {
      gsap.ticker.remove(tick);
      instance.destroy();
      setLenis(null);
    };
  }, []);

  // Doi trang: ve dau trang (hoac toi #anchor) ngay lap tuc, roi tinh lai ScrollTrigger
  useEffect(() => {
    if (!lenis || lastPath.current === pathname) return;
    lastPath.current = pathname;
    const hash = window.location.hash;
    const target = hash ? document.querySelector<HTMLElement>(decodeURIComponent(hash)) : null;
    lenis.resize();
    requestAnimationFrame(() => {
      if (target) lenis.scrollTo(target, { immediate: true }); // ton trong scroll-margin-top (chieu cao header)
      else lenis.scrollTo(0, { immediate: true });
      ScrollTrigger.refresh();
    });
  }, [pathname, lenis]);

  return (
    <LenisContext.Provider value={lenis}>
      <div ref={bar} aria-hidden="true" className="yub-progress pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] bg-butter" />
      {children}
      {debug && (
        <div role="status" className="fixed bottom-4 left-4 z-[70] max-w-[90vw] rounded-xl bg-dark px-4 py-2.5 text-[13px] font-semibold text-cream shadow-lg">
          {debug}
        </div>
      )}
    </LenisContext.Provider>
  );
}
