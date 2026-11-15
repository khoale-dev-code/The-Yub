"use client";

import { useStoreInfo } from "@/components/brand/store-info-context";

/** Dai thong bao tren cung (nam trong SiteHeader – component client) */
export function AnnouncementBar() {
  const store = useStoreInfo();
  return (
    <div className="bg-maroon px-6 py-[9px] text-center text-[13px] tracking-[0.04em] text-[#F5E3C8]">
      Bánh mới ra lò lúc <strong className="text-butter">{store.freshBatchTime}</strong> mỗi ngày
      <span className="hidden sm:inline"> · Mở cửa {store.openHours} · Nhận đặt trước online</span>
    </div>
  );
}
