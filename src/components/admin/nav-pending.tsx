"use client";

import { useLinkStatus } from "next/link";

/**
 * Dat BEN TRONG <Link>: hien vong xoay ngay khi bam, trong luc trang moi dang tai
 * (nguoi dung biet minh da bam, khong bam lai nhieu lan).
 */
export function NavPending({ tone = "light" }: { tone?: "light" | "dark" }) {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden="true"
      className={`h-4 w-4 flex-none rounded-full border-2 transition-opacity duration-150 motion-safe:animate-[yub-spin_0.8s_linear_infinite] ${
        tone === "light" ? "border-cream/25 border-t-cream" : "border-maroon/20 border-t-maroon"
      } ${pending ? "opacity-100 delay-100" : "opacity-0"}`}
    />
  );
}

/** Thanh mong duoi icon tab (mobile) khi dang tai */
export function NavPendingBar() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden="true"
      className={`absolute bottom-1 left-1/2 h-[3px] w-8 -translate-x-1/2 overflow-hidden rounded-full bg-butter/30 transition-opacity ${pending ? "opacity-100" : "opacity-0"}`}
    >
      <span className="block h-full w-1/2 rounded-full bg-maroon motion-safe:animate-[yub-nav-bar_0.9s_ease-in-out_infinite]" />
    </span>
  );
}
