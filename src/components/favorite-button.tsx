"use client";

import gsap from "gsap";
import { useRef } from "react";
import { useCustomer } from "@/modules/customers/customer-context";
import { heartBurst } from "./motion/press-fx";
import { HeartIcon } from "./ui/icons";

/**
 * Nut tim: da dang nhap -> luu vao ho so; chua dang nhap -> luu tam (mat khi tat trinh duyet).
 * Bam them: tim "nay" + vong toa (chi transform/opacity).
 */
export function FavoriteButton({ productId, name, variant = "overlay", className = "" }: { productId: string; name: string; variant?: "overlay" | "outline"; className?: string }) {
  const { isFavorite, toggleFavorite } = useCustomer();
  const on = isFavorite(productId);
  const iconRef = useRef<HTMLSpanElement | null>(null);
  const ringRef = useRef<HTMLSpanElement | null>(null);

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const added = toggleFavorite(productId);
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (iconRef.current) gsap.fromTo(iconRef.current, { scale: added ? 0.6 : 1.15 }, { scale: 1, duration: added ? 0.7 : 0.35, ease: added ? "elastic.out(1.2, 0.4)" : "power2.out", overwrite: true });
      if (added && ringRef.current) gsap.fromTo(ringRef.current, { scale: 0.4, opacity: 0.7 }, { scale: 1.9, opacity: 0, duration: 0.6, ease: "power2.out", overwrite: true });
      if (added) heartBurst(e.currentTarget as HTMLElement, 6);
    }
  };

  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? `Bỏ ${name} khỏi yêu thích` : `Yêu thích ${name}`}
      onClick={onClick}
      className={`flex flex-none items-center justify-center rounded-full ${variant === "overlay" ? "h-11 w-11 border-0 bg-cream/92 hover:text-accent" : "h-12 w-12 border border-maroon/25 bg-card hover:border-accent"} ${on ? "text-accent" : variant === "overlay" ? "text-maroon" : "text-accent"} ${className}`}
    >
      <span ref={iconRef} className="relative flex">
        <span ref={ringRef} aria-hidden="true" className="pointer-events-none absolute -inset-3 rounded-full border-2 border-accent opacity-0" />
        <HeartIcon size={18} fill={on ? "currentColor" : "none"} />
      </span>
    </button>
  );
}
