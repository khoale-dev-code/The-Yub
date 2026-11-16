"use client";

import gsap from "gsap";
import { animationsReduced } from "./motion-config";

/**
 * Hieu ung bam cho nut tren thanh menu – chi transform/opacity, tu don dep sau khi chay.
 * Dung o onPointerDown / onClick, khong chan dieu huong cua link.
 */

/** Gon xuong roi bat lai (cam giac "an" nut that) */
export function squash(el: HTMLElement) {
  if (animationsReduced()) return;
  gsap.fromTo(el, { scale: 0.9 }, { scale: 1, duration: 0.55, ease: "elastic.out(1.1, 0.45)", overwrite: "auto" });
}

/** Vong song lan ra tu diem bam (nut can overflow-hidden + relative) */
export function ripple(el: HTMLElement, e: { clientX: number; clientY: number }, color = "rgba(232,169,59,0.45)") {
  if (animationsReduced()) return;
  const r = el.getBoundingClientRect();
  const size = Math.max(r.width, r.height) * 2.2;
  const dot = document.createElement("span");
  dot.setAttribute("aria-hidden", "true");
  Object.assign(dot.style, {
    position: "absolute",
    left: `${(e.clientX || r.left + r.width / 2) - r.left - size / 2}px`,
    top: `${(e.clientY || r.top + r.height / 2) - r.top - size / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: "999px",
    background: color,
    pointerEvents: "none",
  } satisfies Partial<CSSStyleDeclaration>);
  el.appendChild(dot);
  gsap.fromTo(dot, { scale: 0, opacity: 1 }, { scale: 1, opacity: 0, duration: 0.65, ease: "power2.out", onComplete: () => dot.remove() });
}

/** Lac nhe icon (gio hang) */
export function wiggle(el: Element | null) {
  if (!el || animationsReduced()) return;
  gsap.fromTo(el, { rotation: 0 }, { keyframes: { rotation: [-16, 12, -8, 4, 0] }, duration: 0.55, ease: "power1.out", transformOrigin: "50% 15%", overwrite: "auto" });
}

const HEART = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>';

/** Tim nho bung ra quanh nut (icon yeu thich) */
export function heartBurst(el: HTMLElement, count = 7) {
  if (animationsReduced()) return;
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  for (let i = 0; i < count; i++) {
    const h = document.createElement("span");
    h.setAttribute("aria-hidden", "true");
    h.innerHTML = HEART;
    Object.assign(h.style, { position: "fixed", left: `${cx - 7}px`, top: `${cy - 7}px`, zIndex: "90", pointerEvents: "none", color: i % 2 ? "#B5372F" : "#E8A93B" } satisfies Partial<CSSStyleDeclaration>);
    document.body.appendChild(h);
    const angle = (Math.PI * 2 * i) / count - Math.PI / 2 + (Math.random() - 0.5) * 0.4;
    const dist = 26 + Math.random() * 14;
    gsap
      .timeline({ onComplete: () => h.remove() })
      .fromTo(h, { scale: 0.2, opacity: 1 }, { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, scale: 0.6 + Math.random() * 0.5, rotation: (Math.random() - 0.5) * 60, duration: 0.55, ease: "power3.out" })
      .to(h, { opacity: 0, y: `-=10`, duration: 0.3, ease: "power1.in" }, "-=0.15");
  }
}

/** Icon "nay" (to len roi ve lai) */
export function pop(el: Element | null, from = 0.7) {
  if (!el || animationsReduced()) return;
  gsap.fromTo(el, { scale: from }, { scale: 1, duration: 0.6, ease: "elastic.out(1.2, 0.4)", overwrite: "auto" });
}
