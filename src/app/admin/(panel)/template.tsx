"use client";

import gsap from "gsap";
import { useLayoutEffect, useRef, type ReactNode } from "react";

/**
 * Moi lan doi trang quan ly: noi dung "troi len" nhe (0,35s, chi opacity + transform).
 * Xoa transform ngay khi xong de khong anh huong cac thanh sticky/fixed ben trong.
 */
export default function AdminPageTemplate({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(el, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.38, ease: "power3.out", clearProps: "opacity,transform" });
      // The so lieu / danh sach danh dau data-admin-stagger: hien lan luot
      gsap.utils.toArray<HTMLElement>("[data-admin-stagger]", el).forEach((group) => {
        gsap.fromTo(group.children, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out", stagger: 0.05, delay: 0.08, clearProps: "opacity,transform" });
      });
    }, el);
    return () => ctx.revert();
  }, []);
  return <div ref={ref}>{children}</div>;
}
