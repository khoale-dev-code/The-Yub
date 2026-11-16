"use client";

import gsap from "gsap";
import { animationsReduced } from "@/components/motion/motion-config";

export const CART_ADDED_EVENT = "yub:cart-added";

export interface CartAddedDetail {
  name: string;
  qty: number;
  /** Anh san pham (de hien trong thong bao) */
  image?: string;
  /** Mo ta them, vd quy cach "Hộp 4 cái" */
  note?: string;
}

/** Icon gio hang dang hien tren man hinh (header desktop hoac mobile) */
function visibleCartTarget(): HTMLElement | null {
  const all = Array.from(document.querySelectorAll<HTMLElement>("[data-cart-target]"));
  return all.find((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }) ?? null;
}

/** Bao header hien lai (neu dang an do cuon xuong) va giu hien trong luc anh bay vao gio */
export const SHOW_HEADER_EVENT = "yub:show-header";

/** Icon gio "nay" len + so tren badge bat ra + "+1" bay len */
function pulseCart(target: HTMLElement, qty: number) {
  gsap.fromTo(target, { scale: 1 }, { scale: 1.22, duration: 0.16, ease: "power2.out", yoyo: true, repeat: 1, transformOrigin: "50% 50%", overwrite: "auto" });
  const badge = target.querySelector<HTMLElement>("[data-cart-badge]");
  if (badge) gsap.fromTo(badge, { scale: 0.4 }, { scale: 1, duration: 0.6, ease: "elastic.out(1.2, 0.45)", delay: 0.1, overwrite: "auto" });

  const r = target.getBoundingClientRect();
  const plus = document.createElement("span");
  plus.setAttribute("aria-hidden", "true");
  plus.textContent = `+${qty}`;
  Object.assign(plus.style, {
    position: "fixed",
    left: `${r.left + r.width / 2 - 14}px`,
    top: `${r.top + r.height}px`,
    width: "28px",
    textAlign: "center",
    zIndex: "81",
    pointerEvents: "none",
    font: "700 13px/1 var(--font-sans, system-ui)",
    color: "#3B0F12",
    background: "#E8A93B",
    borderRadius: "999px",
    padding: "4px 0",
  } satisfies Partial<CSSStyleDeclaration>);
  document.body.appendChild(plus);
  gsap
    .timeline({ onComplete: () => plus.remove() })
    .fromTo(plus, { y: 6, opacity: 0, scale: 0.6 }, { y: 14, opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)" })
    .to(plus, { y: 30, opacity: 0, duration: 0.45, ease: "power2.in" }, "+=0.35");
}

/**
 * Anh san pham bay theo duong cong (Bezier) vao icon gio.
 * Diem dich duoc do lai MOI FRAME -> van roi trung gio khi trang dang cuon muot (Lenis)
 * hoac header vua truot xuong. Chi doi transform/opacity (GPU) nen khong gay giat.
 */
function flyToCart(source: HTMLElement, imageSrc: string | undefined, target: HTMLElement, qty: number, onLand: () => void) {
  const from = source.getBoundingClientRect();
  const size = Math.max(56, Math.min(110, Math.min(from.width, from.height)));
  const x0 = from.left + from.width / 2 - size / 2;
  const y0 = from.top + from.height / 2 - size / 2;

  const ghost = document.createElement("div");
  ghost.setAttribute("aria-hidden", "true");
  Object.assign(ghost.style, {
    position: "fixed",
    left: "0px",
    top: "0px",
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: "999px",
    zIndex: "80",
    pointerEvents: "none",
    willChange: "transform, opacity",
    background: imageSrc ? `#EFE4D1 center/cover no-repeat url("${imageSrc.replace(/"/g, "%22")}")` : "#E8A93B",
    boxShadow: "0 14px 30px rgba(36,18,13,0.35), 0 0 0 3px #FFFAF1",
  } satisfies Partial<CSSStyleDeclaration>);
  document.body.appendChild(ghost);

  const setX = gsap.quickSetter(ghost, "x", "px");
  const setY = gsap.quickSetter(ghost, "y", "px");
  const setS = gsap.quickSetter(ghost, "scale");
  const setR = gsap.quickSetter(ghost, "rotation", "deg");
  const p = { t: 0 };

  const place = () => {
    const to = target.getBoundingClientRect();
    const x2 = to.left + to.width / 2 - size / 2;
    const y2 = to.top + to.height / 2 - size / 2;
    // Diem dieu khien: giua 2 diem, nhac cao hon diem cao nhat -> vong cung mem
    const x1 = (x0 + x2) / 2;
    const y1 = Math.min(y0, y2) - Math.max(80, Math.abs(x2 - x0) * 0.25);
    const t = p.t;
    const u = 1 - t;
    setX(u * u * x0 + 2 * u * t * x1 + t * t * x2);
    setY(u * u * y0 + 2 * u * t * y1 + t * t * y2);
    setS(1 - 0.78 * t);
    setR(t * 30);
  };

  gsap
    .timeline({
      onComplete: () => {
        ghost.remove();
        pulseCart(target, qty);
        onLand();
      },
    })
    .set(ghost, { x: x0, y: y0, scale: 0.4, opacity: 0 })
    .to(ghost, { scale: 1.08, opacity: 1, duration: 0.24, ease: "back.out(2.2)" })
    .to(p, { t: 1, duration: 0.8, ease: "power2.inOut", onUpdate: place }, ">-0.04")
    .to(ghost, { opacity: 0.7, duration: 0.18 }, ">-0.18");
}

/**
 * Goi khi khach bam them vao gio: anh san pham bay vao icon gio, gio "nay",
 * va hien thong bao (CartToast lang nghe su kien CART_ADDED_EVENT).
 */
export function announceCartAdd(trigger: HTMLElement, detail: Omit<CartAddedDetail, "image">) {
  const scope = trigger.closest<HTMLElement>("[data-cart-source], article, li");
  const img = scope?.querySelector("img") ?? null;
  const image = img ? img.currentSrc || img.src : undefined;

  const notify = () => window.dispatchEvent(new CustomEvent<CartAddedDetail>(CART_ADDED_EVENT, { detail: { ...detail, image } }));

  // Header dang an (cuon xuong) -> keo xuong lai de thay gio
  window.dispatchEvent(new CustomEvent(SHOW_HEADER_EVENT, { detail: { holdMs: 1800 } }));
  const target = visibleCartTarget();
  if (!target) return notify();
  if (animationsReduced()) {
    pulseCart(target, detail.qty);
    return notify();
  }
  // Thong bao hien ra khi anh vua "roi" vao gio
  flyToCart(img ?? trigger, image, target, detail.qty, notify);
}
