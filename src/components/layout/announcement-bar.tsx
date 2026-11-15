import { storeConfig } from "@/lib/store-config";

export function AnnouncementBar() {
  return (
    <div className="bg-maroon px-6 py-[9px] text-center text-[13px] tracking-[0.04em] text-[#F5E3C8]">
      Bánh mới ra lò lúc <strong className="text-butter">{storeConfig.freshBatchTime}</strong> mỗi ngày
      <span className="hidden sm:inline"> · Mở cửa {storeConfig.openHours} · Nhận đặt trước online</span>
    </div>
  );
}
