"use client";

import gsap from "gsap";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useStoreInfo } from "@/components/brand/store-info-context";
import { animationsReduced } from "./motion-config";
import { freezeScroll } from "./scroll-lock";
import { useLenis } from "./smooth-scroll";

/** Thoi gian cho trang moi toi da truoc khi tu mo man (tranh ket man che khi mang cham) */
const MAX_WAIT_MS = 6000;

/**
 * Chuyen trang tu thanh menu: man che nau truot len, ten trang "nay" len tung chu,
 * trong luc do Lenis dung + cuon ve dau trang moi, roi man che truot di.
 * Gan cho link bang data-transition (va data-transition-label="Ten hien thi").
 */
export function PageTransition() {
  const store = useStoreInfo();
  const router = useRouter();
  const pathname = usePathname();
  const lenis = useLenis();
  const [label, setLabel] = useState("");
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const state = useRef({ busy: false, coverDone: false, target: "", hash: "", arrived: false, timer: 0 });
  const lenisRef = useRef(lenis);
  lenisRef.current = lenis;
  const releaseRef = useRef<(() => void) | null>(null);

  const reveal = useRef(() => {});
  reveal.current = () => {
    const s = state.current;
    const el = overlayRef.current;
    if (!el || !s.busy || !s.coverDone || !s.arrived) return;
    window.clearTimeout(s.timer);
    s.coverDone = false;
    // Trang moi da ve xong duoi man che: bat lai Lenis va dat vi tri cuon (dau trang hoac #muc)
    releaseRef.current?.();
    releaseRef.current = null;
    const l = lenisRef.current;
    if (l) {
      l.start();
      const anchor = s.hash ? document.querySelector<HTMLElement>(decodeURIComponent(s.hash)) : null;
      l.resize();
      l.scrollTo(anchor ?? 0, { immediate: true, force: true });
    }
    const chars = el.querySelectorAll("[data-pt-char]");
    gsap
      .timeline({
        delay: 0.15,
        onComplete: () => {
          gsap.set(el, { autoAlpha: 0, yPercent: 100 });
          s.busy = false;
        },
      })
      .to(chars, { yPercent: -120, opacity: 0, duration: 0.35, ease: "power3.in", stagger: 0.015 })
      .to("[data-pt-sub]", { y: -16, opacity: 0, duration: 0.3, ease: "power2.in" }, "<")
      .to(el, { yPercent: -100, duration: 0.7, ease: "power4.inOut" }, "-=0.1");
  };

  // Den trang moi -> mo man
  useEffect(() => {
    const s = state.current;
    if (!s.busy || pathname !== s.target) return;
    // Cho trang moi ve xong + cac hieu ung khoi tao (tach chu, ScrollTrigger) chay het
    // duoi man che, roi moi mo man -> luc mo man khong bi khung hinh nao bi khung.
    let idle = 0;
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const go = () => {
          s.arrived = true;
          reveal.current();
        };
        if (typeof window.requestIdleCallback === "function") idle = window.requestIdleCallback(go, { timeout: 400 });
        else idle = setTimeout(go, 60) as unknown as number;
      }),
    );
    return () => {
      cancelAnimationFrame(raf);
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idle);
      clearTimeout(idle);
    };
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest<HTMLAnchorElement>("a[data-transition]");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      const s = state.current;
      e.preventDefault();
      if (s.busy) return;
      // Cung trang: chi cuon muot ve dau trang
      if (url.pathname === window.location.pathname) {
        if (url.hash) lenisRef.current?.scrollTo(url.hash);
        else if (lenisRef.current) lenisRef.current.scrollTo(0, { duration: 1.1 });
        else window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      const href = url.pathname + url.search + url.hash;
      const el = overlayRef.current;
      if (!el || animationsReduced()) {
        router.push(href);
        return;
      }
      s.busy = true;
      s.coverDone = false;
      s.arrived = false;
      s.target = url.pathname;
      s.hash = url.hash;
      router.prefetch(href);
      setLabel(a.dataset.transitionLabel || a.textContent?.trim() || store.name);
      releaseRef.current?.();
      releaseRef.current = freezeScroll(lenisRef.current);
      // Doi React ve xong chu moi roi moi chay hieu ung
      requestAnimationFrame(() => {
        const chars = el.querySelectorAll("[data-pt-char]");
        gsap
          .timeline({
            onComplete: () => {
              s.coverDone = true;
              router.push(href);
              s.timer = window.setTimeout(() => {
                s.arrived = true;
                reveal.current();
              }, MAX_WAIT_MS);
              reveal.current();
            },
          })
          .set(el, { autoAlpha: 1, y: 0, yPercent: 100 })
          .set(chars, { yPercent: 130, rotate: 8, opacity: 0 })
          .set("[data-pt-sub]", { y: 16, opacity: 0 })
          .to(el, { yPercent: 0, duration: 0.6, ease: "power4.inOut" })
          .to(chars, { yPercent: 0, rotate: 0, opacity: 1, duration: 0.75, ease: "back.out(2.4)", stagger: 0.03 }, "-=0.2")
          .to("[data-pt-sub]", { y: 0, opacity: 1, duration: 0.45, ease: "power3.out" }, "<0.15");
      });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router, store.name]);

  const words = label.split(" ");
  return (
    <div
      ref={overlayRef}
      aria-hidden="true"
      className="pointer-events-auto invisible fixed inset-0 z-[80] flex flex-col items-center justify-center gap-4 bg-maroon px-6 text-cream opacity-0"
    >
      {/* Mep cong tren/duoi khi man che truot */}
      <span aria-hidden="true" className="absolute inset-x-0 -top-[60px] h-[61px] rounded-t-[50%] bg-maroon" />
      <span aria-hidden="true" className="absolute inset-x-0 -bottom-[60px] h-[61px] rounded-b-[50%] bg-maroon" />
      <p className="m-0 flex flex-wrap justify-center gap-x-[0.28em] text-center font-display text-[clamp(48px,9vw,132px)] font-semibold leading-[1.05] tracking-[-0.02em]">
        {words.map((w, wi) => (
          <span key={`${w}-${wi}`} className="-my-[0.2em] inline-flex overflow-hidden py-[0.2em]">
            {Array.from(w).map((c, ci) => (
              <span key={ci} data-pt-char className="inline-block will-change-transform">
                {c}
              </span>
            ))}
          </span>
        ))}
      </p>
      <span data-pt-sub className="text-sm font-semibold tracking-[0.2em] text-butter">
        {store.name}
      </span>
    </div>
  );
}
