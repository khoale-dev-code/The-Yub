"use client";

import { useEffect, useState } from "react";
import { useStoreInfo } from "@/components/brand/store-info-context";
import { shortTime, type StoreInfo } from "@/modules/settings/store-info";

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

/** Phut hien tai trong ngay theo gio Viet Nam (khong phu thuoc mui gio may khach) */
function nowMinutesVN(timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return h * 60 + m;
}

const fmtDuration = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h} giờ ${m > 0 ? `${m} phút` : ""}`.trim() : `${m} phút`;
};

interface Status {
  open: boolean;
  label: string;
  detail: string;
  /** 0..1 – vi tri hien tai tren thanh 7:30 → 19:00 */
  progress: number | null;
}

function computeStatus(store: StoreInfo): Status {
  const now = nowMinutesVN(store.timeZone);
  const open = toMinutes(store.openTime);
  const close = toMinutes(store.closeTime);
  const batch = toMinutes(store.freshBatchTime);
  if (now < open) return { open: false, label: "Chưa mở cửa", detail: `Mở lúc ${shortTime(store.openTime)} – còn ${fmtDuration(open - now)}`, progress: null };
  if (now >= close) return { open: false, label: "Đã đóng cửa", detail: `Hẹn bạn ngày mai từ ${shortTime(store.openTime)}`, progress: null };
  const progress = (now - open) / (close - open);
  if (now < batch) return { open: true, label: "Đang mở cửa", detail: `Mẻ chiều ra lò sau ${fmtDuration(batch - now)}`, progress };
  if (now < batch + 60) return { open: true, label: "Đang mở cửa", detail: "Mẻ chiều vừa ra lò – bánh còn ấm", progress };
  return { open: true, label: "Đang mở cửa", detail: `Đóng cửa sau ${fmtDuration(close - now)}`, progress };
}

/** Huy hieu "Đang mở cửa / Đã đóng cửa" + thanh tien do trong ngay. Tinh o client de dung gio thuc. */
export function StoreStatus({ withTimeline = false, tone = "light" }: { withTimeline?: boolean; tone?: "light" | "dark" }) {
  const store = useStoreInfo();
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    const update = () => setStatus(computeStatus(store));
    update();
    const t = setInterval(update, 30_000);
    return () => clearInterval(t);
  }, [store]);

  const dark = tone === "dark";
  const open = toMinutes(store.openTime);
  const close = toMinutes(store.closeTime);
  const batchPos = (toMinutes(store.freshBatchTime) - open) / (close - open);

  return (
    <div className="flex flex-col gap-4" aria-live="polite">
      <div className={`inline-flex items-center gap-3 self-start rounded-full border px-4 py-2 ${dark ? "border-cream/25 bg-cream/8 text-cream" : "border-maroon/15 bg-card text-maroon"}`}>
        <span aria-hidden="true" className="relative flex h-2.5 w-2.5">
          {status?.open && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#5B8A3A] opacity-60" />}
          <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${status ? (status.open ? "bg-[#5B8A3A]" : "bg-accent") : "bg-maroon/30"}`} />
        </span>
        <span className="text-sm font-bold">{status?.label ?? "Giờ mở cửa"}</span>
        <span className={`text-sm ${dark ? "text-cream/75" : "text-muted"}`}>{status?.detail ?? store.openHours}</span>
      </div>
      {withTimeline && (
        <div className="flex flex-col gap-2">
          <div className={`relative h-2.5 rounded-full ${dark ? "bg-cream/15" : "bg-sand"}`}>
            <span aria-hidden="true" className="absolute inset-y-0 left-0 rounded-full bg-butter transition-[width] duration-700" style={{ width: `${Math.round((status?.progress ?? 0) * 100)}%` }} />
            <span aria-hidden="true" className="absolute -top-1.5 h-5 w-[3px] rounded-full bg-maroon" style={{ left: `${batchPos * 100}%` }} />
          </div>
          <div className={`relative flex justify-between text-xs font-semibold ${dark ? "text-cream/75" : "text-muted"}`}>
            <span>{shortTime(store.openTime)}<span className="hidden sm:inline"> mở cửa</span></span>
            <span className={`absolute -translate-x-1/2 ${dark ? "text-butter" : "text-maroon"}`} style={{ left: `${batchPos * 100}%` }}>{store.freshBatchTime}<span className="hidden sm:inline"> mẻ chiều</span></span>
            <span>{shortTime(store.closeTime)}<span className="hidden sm:inline"> đóng cửa</span></span>
          </div>
        </div>
      )}
    </div>
  );
}
