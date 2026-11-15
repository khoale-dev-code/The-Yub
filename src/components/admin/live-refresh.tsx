"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { RefreshIcon } from "./admin-icons";
import { FreshnessGuard } from "./freshness-guard";

/** Dang go chu / mo hop thoai -> hoan tu cap nhat de khong lam giat man hinh */
function userBusy(): boolean {
  const el = document.activeElement;
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) return true;
  if (el instanceof HTMLElement && el.isContentEditable) return true;
  return Boolean(document.querySelector('[role="dialog"], [role="alertdialog"]'));
}

const fmt = (d: Date) => d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Ho_Chi_Minh" });

/** Tu tai lai du lieu moi 30 giay khi tab dang mo (de thay don moi ma khong can bam F5) */
/** renderedAt: thoi diem server dung trang (Date.now()) – trang mo tu bo nho tam se tu lam moi neu da cu */
export function LiveRefresh({ intervalMs = 30_000, renderedAt }: { intervalMs?: number; renderedAt?: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [at, setAt] = useState<string | null>(null);

  // Gio hien thi = gio du lieu tren man hinh (khong phai gio mo trang)
  useEffect(() => {
    if (renderedAt) setAt(fmt(new Date(renderedAt)));
  }, [renderedAt]);

  useEffect(() => {
    if (!renderedAt) setAt(fmt(new Date()));
    const tick = () => {
      if (document.visibilityState !== "visible" || userBusy()) return;
      start(() => router.refresh());
      if (!renderedAt) setAt(fmt(new Date()));
    };
    const id = window.setInterval(tick, intervalMs);
    const onVisible = () => document.visibilityState === "visible" && tick();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [intervalMs, router, renderedAt]);

  return (
    <>
    {renderedAt ? <FreshnessGuard renderedAt={renderedAt} /> : null}
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
    </>
  );
}
