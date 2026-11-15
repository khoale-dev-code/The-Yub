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

/** Icon gio "nay" len + so tren badge bat ra */
function pulseCart(target: HTMLElement) {
  gsap.fromTo(target, { scale: 1 }, { scale: 1.28, duration: 0.18, ease: "power2.out", yoyo: true, repeat: 1, transformOrigin: "50% 50%" });
  const badge = target.querySelector<HTMLElement>("[data-cart-badge]");
  if (badge) gsap.fromTo(badge, { scale: 0.4 }, { scale: 1, duration: 0.6, ease: "elastic.out(1.2, 0.45)", delay: 0.12 });
}

/** Anh san pham bay theo duong cong vao icon gio hang */
function flyToCart(source: HTMLElement, imageSrc: string | undefined, target: HTMLElement, onLand: () => void) {
  const from = source.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  const size = Math.max(56, Math.min(120, Math.min(from.width, from.height)));
  const startX = from.left + from.width / 2 - size / 2;
  const startY = from.top + from.height / 2 - size / 2;
  const endX = to.left + to.width / 2 - size / 2;
  const endY = to.top + to.height / 2 - size / 2;

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
    background: imageSrc ? `#EFE4D1 center/cover no-repeat url("${imageSrc.replace(/"/g, "%22")}")` : "#E8A93B",
    boxShadow: "0 14px 30px rgba(36,18,13,0.35), 0 0 0 3px #FFFAF1",
  } satisfies Partial<CSSStyleDeclaration>);
  document.body.appendChild(ghost);

  // Duong cong: nay len nhe, roi x di nhanh truoc (power2.out) + y bat kip sau (power3.in)
  const tl = gsap.timeline({ onComplete: () => { ghost.remove(); pulseCart(target); onLand(); } });
  tl.set(ghost, { x: startX, y: startY, scale: 0.5, opacity: 0 })
    .to(ghost, { y: startY - 28, scale: 1, opacity: 1, duration: 0.28, ease: "back.out(2)" })
    .to(ghost, { x: endX, duration: 0.75, ease: "power2.out" }, ">-0.02")
    .to(ghost, { y: endY, duration: 0.75, ease: "power3.in" }, "<")
    .to(ghost, { scale: 0.2, duration: 0.75, ease: "power2.in" }, "<")
    .to(ghost, { opacity: 0.6, duration: 0.2 }, ">-0.2");
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

  const target = visibleCartTarget();
  if (!target) return notify();
  if (animationsReduced()) {
    pulseCart(target);
    return notify();
  }
  // Thong bao hien ra khi anh vua "roi" vao gio
  flyToCart(img ?? trigger, image, target, notify);
}
