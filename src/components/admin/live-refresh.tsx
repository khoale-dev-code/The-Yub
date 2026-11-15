"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { RefreshIcon } from "./admin-icons";

const fmt = (d: Date) => d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Ho_Chi_Minh" });

/** Tu tai lai du lieu moi 30 giay khi tab dang mo (de thay don moi ma khong can bam F5) */
export function LiveRefresh({ intervalMs = 30_000 }: { intervalMs?: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [at, setAt] = useState<string | null>(null);

  useEffect(() => {
    setAt(fmt(new Date()));
    const tick = () => {
      if (document.visibilityState !== "visible") return;
      start(() => router.refresh());
      setAt(fmt(new Date()));
    };
    const id = window.setInterval(tick, intervalMs);
    const onVisible = () => document.visibilityState === "visible" && tick();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [intervalMs, router]);

  return (
    <button
      type="button"
      onClick={() => {
        start(() => router.refresh());
        setAt(fmt(new Date()));
      }}
      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-maroon/15 bg-card px-3.5 text-[13px] font-semibold text-muted hover:border-maroon/40"
      title="Tải lại ngay"
    >
      <span aria-hidden="true" className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#5B8A3A] opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#5B8A3A]" />
      </span>
      {pending ? "Đang cập nhật…" : at ? `Tự cập nhật · ${at}` : "Tự cập nhật"}
      <RefreshIcon size={15} className={pending ? "animate-spin" : ""} />
    </button>
  );
}
