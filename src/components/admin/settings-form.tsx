"use client";

import { useMemo, useState, useTransition } from "react";
import { saveSettingsAction } from "@/modules/admin/actions";
import { directionsUrlOf, isMapEmbedUrl, looksLikeIframe, normalizeMapEmbed } from "@/modules/settings/map";
import { defaultStoreInfo, shortTime, toMinutes } from "@/modules/settings/store-info";
import type { StoreSettings } from "@/modules/settings/types";
import { Switch } from "./switch";
import { toast } from "./toast";
import { ClockIcon } from "./admin-icons";
import { btn, card, input, label, saveBar, timeInput } from "./ui";

export function SettingsForm({ initial, readOnly }: { initial: StoreSettings; readOnly: boolean }) {
  // O trong = dang dung mac dinh -> hien san gia tri dang ap dung tren web
  const [s, setS] = useState<StoreSettings>(() => ({
    ...initial,
    storeName: initial.storeName ?? defaultStoreInfo.name,
    phone: initial.phone ?? defaultStoreInfo.phone,
    openTime: initial.openTime ?? defaultStoreInfo.openTime,
    closeTime: initial.closeTime ?? defaultStoreInfo.closeTime,
    freshBatchTime: initial.freshBatchTime ?? defaultStoreInfo.freshBatchTime.padStart(5, "0"),
  }));
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string>(() => JSON.stringify(s));
  const dirty = useMemo(() => JSON.stringify(s) !== saved, [s, saved]);
  const set = <K extends keyof StoreSettings>(k: K, v: StoreSettings[K]) => setS((x) => ({ ...x, [k]: v }));
  const text = (k: "storeName" | "phone" | "openTime" | "closeTime" | "freshBatchTime" | "address" | "mapUrl" | "mapEmbedUrl" | "bankName" | "bankAccountNo" | "bankAccountName" | "orderingPausedMessage") => ({
    value: s[k] ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(k, e.target.value),
    disabled: readOnly,
  });

  const embed = s.mapEmbedUrl ? normalizeMapEmbed(s.mapEmbedUrl) : "";
  const embedOk = embed !== "" && isMapEmbedUrl(embed);
  const directions = directionsUrlOf({ mapUrl: s.mapUrl?.trim() || null, mapEmbedUrl: embedOk ? embed : null, address: s.address?.trim() || null });

  /** Dan ca ma <iframe> vao bat ky o ban do nao -> tu lay link va dua ve dung o */
  const onMapPaste = (k: "mapUrl" | "mapEmbedUrl", v: string) => {
    if (looksLikeIframe(v)) {
      const src = normalizeMapEmbed(v);
      setS((x) => ({ ...x, mapEmbedUrl: src, ...(k === "mapUrl" ? { mapUrl: "" } : {}) }));
      toast(isMapEmbedUrl(src) ? "Đã lấy link bản đồ từ mã nhúng" : "Mã nhúng chưa đúng – hãy chép lại từ Google Maps", isMapEmbedUrl(src) ? "success" : "error");
      return;
    }
    set(k, v);
  };

  const save = () =>
    start(async () => {
      setError(null);
      const res = await saveSettingsAction(s);
      if (res.ok) {
        setSaved(JSON.stringify(s));
        toast("Đã lưu cài đặt – web đã cập nhật");
      }
      else {
        setError(res.error);
        toast(res.error, "error");
      }
    });

  const hoursIssue = (() => {
    const o = s.openTime ?? "";
    const c = s.closeTime ?? "";
    const f = s.freshBatchTime ?? "";
    if (!o || !c || !f) return "Nhập đủ giờ mở cửa, đóng cửa và giờ mẻ bánh.";
    if (toMinutes(o) >= toMinutes(c)) return "Giờ đóng cửa phải sau giờ mở cửa.";
    if (toMinutes(f) < toMinutes(o) || toMinutes(f) >= toMinutes(c)) return "Giờ mẻ bánh phải nằm trong giờ mở cửa.";
    return null;
  })();
  const batchPos = hoursIssue ? 0 : (toMinutes(s.freshBatchTime ?? "") - toMinutes(s.openTime ?? "")) / Math.max(1, toMinutes(s.closeTime ?? "") - toMinutes(s.openTime ?? ""));

  const timeTile = (k: "openTime" | "closeTime" | "freshBatchTime", title: string, hint: string, extra = "") => (
    <label className={`flex min-w-0 cursor-pointer items-center justify-between gap-3 rounded-[18px] border border-maroon/15 bg-white/70 px-4 py-2.5 transition-colors focus-within:border-maroon focus-within:ring-2 focus-within:ring-butter/50 sm:flex-col sm:items-stretch sm:justify-start sm:gap-0.5 sm:px-3.5 sm:py-3 ${extra}`}>
      <span className="flex min-w-0 flex-col">
        <span className="text-[15px] font-semibold text-maroon sm:text-[13px] sm:text-muted">{title}</span>
        <span className="text-[12px] text-muted-2 sm:hidden">{hint}</span>
      </span>
      <input {...text(k)} type="time" required className={`${timeInput} w-[7.2em] max-w-[58%] text-right sm:w-full sm:max-w-none sm:text-left`} />
      <span className="hidden text-[12px] text-muted-2 sm:block">{hint}</span>
    </label>
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="flex flex-col gap-5"
    >
      <section className={`${card} flex flex-col gap-3 p-4 md:p-6 ${s.orderingEnabled ? "" : "ring-2 ring-butter"}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="m-0 font-display text-[20px] font-semibold">Nhận đơn online</h2>
            <p className="m-0 text-[14px] text-muted">Tắt khi tiệm nghỉ hoặc quá tải – khách vẫn xem được thực đơn nhưng không gửi đơn được.</p>
          </div>
          <Switch checked={s.orderingEnabled} onChange={(v) => set("orderingEnabled", v)} label="Nhận đơn online" disabled={readOnly} />
        </div>
        {!s.orderingEnabled && (
          <label className={label}>
            Thông báo cho khách
            <input {...text("orderingPausedMessage")} maxLength={200} placeholder="VD: Tiệm nghỉ Tết đến hết mùng 5 – hẹn gặp lại!" className={input} />
          </label>
        )}
      </section>

      <section className={`${card} flex flex-col gap-4 p-4 md:p-6`}>
        <div>
          <h2 className="m-0 font-display text-[20px] font-semibold">Thông tin tiệm</h2>
          <p className="m-0 mt-1 text-[14px] text-muted">Hiện ở đầu trang, chân trang, trang Ghé tiệm, Đặt bánh… Lưu là cả web đổi theo.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={`${label} min-w-0`}>
            Tên tiệm
            <input {...text("storeName")} required minLength={2} maxLength={80} className={input} />
          </label>
          <label className={`${label} min-w-0`}>
            Số điện thoại / Zalo
            <input {...text("phone")} type="tel" inputMode="tel" required maxLength={20} placeholder="0975 840 157" className={`${input} tabular-nums`} />
          </label>
        </div>
      </section>

      <section className={`${card} flex flex-col gap-4 p-4 md:p-6`}>
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-butter/30 text-maroon"><ClockIcon /></span>
          <div>
            <h2 className="m-0 font-display text-[20px] font-semibold">Giờ mở cửa & mẻ bánh</h2>
            <p className="m-0 mt-1 text-[14px] text-muted">Lưu xong, mọi chỗ hiện giờ trên web (đầu trang, chân trang, Ghé tiệm, thẻ bánh…) đổi theo ngay.</p>
          </div>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-3 sm:gap-3">
          {timeTile("openTime", "Mở cửa", "Giờ tiệm mở")}
          {timeTile("closeTime", "Đóng cửa", "Giờ tiệm đóng")}
          {timeTile("freshBatchTime", "Mẻ bánh chiều", "Giờ bánh ra lò")}
        </div>
        {hoursIssue ? (
          <p role="alert" className="m-0 rounded-2xl bg-rose px-4 py-3 text-[13px] font-semibold text-accent">{hoursIssue}</p>
        ) : (
          <div className="flex flex-col gap-2 rounded-[18px] bg-beige/60 px-4 py-3">
            <div aria-hidden="true" className="relative h-2 rounded-full bg-maroon/12">
              <span className="absolute inset-y-0 left-0 right-0 rounded-full bg-[#5B8A3A]/70" />
              <span className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-butter shadow" style={{ left: `${batchPos * 100}%` }} />
            </div>
            <p className="m-0 text-[13px] text-muted">
              Khách thấy: <strong className="text-maroon">Mở cửa {shortTime(s.openTime ?? "")} – {shortTime(s.closeTime ?? "")}</strong> · <strong className="whitespace-nowrap text-maroon">Ra lò {shortTime(s.freshBatchTime ?? "")}</strong>
            </p>
          </div>
        )}
        <p className="m-0 text-[12px] text-muted">Khung giờ khách chọn khi đặt bánh chỉnh riêng ở mục Khung giờ.</p>
      </section>

      <section className={`${card} flex flex-col gap-4 p-4 md:p-6`}>
        <h2 className="m-0 font-display text-[20px] font-semibold">Địa chỉ & bản đồ</h2>
        <label className={label}>
          Địa chỉ tiệm
          <input {...text("address")} maxLength={200} placeholder="Số nhà, đường, phường, thành phố" className={input} />
          <span className="text-[12px] font-normal text-muted">Để trống thì web hiện “Địa chỉ tiệm – chờ xác nhận”.</span>
        </label>
        <label className={label}>
          Bản đồ nhúng (Google Maps)
          <textarea
            value={s.mapEmbedUrl ?? ""}
            onChange={(e) => onMapPaste("mapEmbedUrl", e.target.value)}
            disabled={readOnly}
            rows={3}
            spellCheck={false}
            placeholder='Dán nguyên mã <iframe src="https://www.google.com/maps/embed?…"></iframe>'
            className={`${input} min-h-[92px] resize-y py-2.5 font-mono text-[12px] leading-relaxed`}
          />
          <span className="text-[12px] font-normal text-muted">Google Maps → tìm tiệm → Chia sẻ → Nhúng bản đồ → Sao chép HTML, rồi dán vào đây (dán cả mã cũng được).</span>
        </label>
        {s.mapEmbedUrl?.trim() && !embedOk && (
          <p role="alert" className="m-0 rounded-2xl bg-rose px-4 py-3 text-[13px] font-semibold text-accent">Mã này chưa phải bản đồ nhúng của Google Maps – hãy chép lại đúng mục “Nhúng bản đồ”.</p>
        )}
        {embedOk && (
          <div className="relative aspect-[16/9] overflow-hidden rounded-[18px] border border-maroon/10 bg-sand">
            <iframe title="Xem trước bản đồ" src={embed} className="absolute inset-0 h-full w-full border-0" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" />
          </div>
        )}
        <label className={label}>
          Link chỉ đường (không bắt buộc)
          <input
            value={s.mapUrl ?? ""}
            onChange={(e) => onMapPaste("mapUrl", e.target.value)}
            disabled={readOnly}
            type="text"
            inputMode="url"
            placeholder="https://maps.app.goo.gl/…"
            className={input}
          />
          <span className="text-[12px] font-normal text-muted">
            Để trống: nút “Chỉ đường” tự mở đúng vị trí tiệm theo bản đồ nhúng.
            {directions && !s.mapUrl?.trim() && (
              <>
                {" "}
                <a href={directions} target="_blank" rel="noopener noreferrer" className="font-semibold">Thử mở</a>
              </>
            )}
          </span>
        </label>
      </section>

      <section className={`${card} flex flex-col gap-4 p-4 md:p-6`}>
        <div>
          <h2 className="m-0 font-display text-[20px] font-semibold">Chuyển khoản</h2>
          <p className="m-0 mt-1 text-[14px] text-muted">Chỉ hiện trong trang quản lý để chép gửi khách khi gọi xác nhận – không hiện công khai trên web.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={`${label} min-w-0`}>
            Ngân hàng
            <input {...text("bankName")} maxLength={80} placeholder="VD: Vietcombank" className={input} />
          </label>
          <label className={`${label} min-w-0`}>
            Số tài khoản
            <input {...text("bankAccountNo")} inputMode="numeric" maxLength={30} className={`${input} tabular-nums`} />
          </label>
        </div>
        <label className={label}>
          Tên chủ tài khoản
          <input {...text("bankAccountName")} maxLength={80} className={input} />
        </label>
      </section>

      {error && <p role="alert" className="m-0 rounded-2xl bg-rose px-4 py-3 text-[14px] font-semibold text-accent">{error}</p>}
      {!readOnly && (
        <div className={saveBar}>
          <span className={`flex min-w-0 flex-1 items-center gap-2 text-[13px] font-semibold ${dirty ? "text-[#7A4A05]" : "text-muted"}`}>
            <span aria-hidden="true" className={`h-2 w-2 flex-none rounded-full ${dirty ? "bg-butter" : "bg-[#5B8A3A]"}`} />
            <span className="truncate">{pending ? "Đang lưu…" : dirty ? "Có thay đổi chưa lưu" : "Đã lưu"}</span>
          </span>
          <button type="submit" disabled={pending || !dirty} className={`${btn.primary} min-h-12 flex-none px-6 text-base sm:px-8`}>{pending ? "Đang lưu…" : "Lưu cài đặt"}</button>
        </div>
      )}
    </form>
  );
}
