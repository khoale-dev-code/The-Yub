"use client";

import { useState } from "react";
import { HeartIcon } from "./ui/icons";

/** Yeu thich: tam thoi chi la trang thai tren trang (chua co tai khoan khach). */
export function FavoriteButton({ name, variant = "overlay", className = "" }: { name: string; variant?: "overlay" | "outline"; className?: string }) {
  const [on, setOn] = useState(false);
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={`Yêu thích ${name}`}
      onClick={() => setOn((v) => !v)}
      className={`flex flex-none items-center justify-center rounded-full ${variant === "overlay" ? "h-11 w-11 border-0 bg-cream/92 text-maroon hover:text-accent" : "h-12 w-12 border border-maroon/25 bg-card text-accent hover:border-accent"} ${className}`}
    >
      <HeartIcon size={18} fill={on ? "currentColor" : "none"} />
    </button>
  );
}
