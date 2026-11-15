"use client";

import { useState, useTransition } from "react";
import { saveSettingsAction } from "@/modules/admin/actions";
import type { StoreSettings } from "@/modules/settings/types";
import { Switch } from "./switch";
import { toast } from "./toast";
import { btn, card, input, label } from "./ui";

export function SettingsForm({ initial, readOnly }: { initial: StoreSettings; readOnly: boolean }) {
  const [s, setS] = useState<StoreSettings>(initial);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof StoreSettings>(k: K, v: StoreSettings[K]) => setS((x) => ({ ...x, [k]: v }));
  const text = (k: "address" | "mapUrl" | "mapEmbedUrl" | "bankName" | "bankAccountNo" | "bankAccountName" | "orderingPausedMessage") => ({
    value: s[k] ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(k, e.target.value),
    disabled: readOnly,
  });

  const save = () =>
    start(async () => {
      setError(null);
      const res = await saveSettingsAction(s);
      if (res.ok) toast("Đã lưu cài đặt – web đã cập nhật");
      else {
        setError(res.error);
        toast(res.error, "error");
      }
    });

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
        <h2 className="m-0 font-display text-[20px] font-semibold">Địa chỉ & bản đồ</h2>
        <label className={label}>
          Địa chỉ tiệm
          <input {...text("address")} maxLength={200} placeholder="Số nhà, đường, phường, thành phố" className={input} />
          <span className="text-[12px] font-normal text-muted">Để trống thì web hiện “Địa chỉ tiệm – chờ xác nhận”.</span>
        </label>
        <label className={label}>
          Link chỉ đường (Google Maps)
          <input {...text("mapUrl")} type="url" placeholder="https://maps.app.goo.gl/…" className={input} />
        </label>
        <label className={label}>
          Link bản đồ nhúng
          <input {...text("mapEmbedUrl")} type="url" placeholder="https://www.google.com/maps/embed?pb=…" className={input} />
          <span className="text-[12px] font-normal text-muted">Google Maps → Chia sẻ → Nhúng bản đồ → chép phần trong src=&quot;…&quot;.</span>
        </label>
      </section>

      <section className={`${card} flex flex-col gap-4 p-4 md:p-6`}>
        <div>
          <h2 className="m-0 font-display text-[20px] font-semibold">Chuyển khoản</h2>
          <p className="m-0 mt-1 text-[14px] text-muted">Chỉ hiện trong trang quản lý để chép gửi khách khi gọi xác nhận – không hiện công khai trên web.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={label}>
            Ngân hàng
            <input {...text("bankName")} maxLength={80} placeholder="VD: Vietcombank" className={input} />
          </label>
          <label className={label}>
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
        <div className="sticky bottom-[76px] z-10 lg:static">
          <button type="submit" disabled={pending} className={`${btn.primary} min-h-[52px] w-full text-base sm:w-auto sm:px-10`}>{pending ? "Đang lưu…" : "Lưu cài đặt"}</button>
        </div>
      )}
    </form>
  );
}
