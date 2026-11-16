"use client";

import { useState, useTransition } from "react";
import { updateProfileAction } from "@/modules/customers/actions";

const inputCls = "min-h-12 w-full rounded-[14px] border border-maroon/25 bg-white/80 px-4 text-[15px] font-normal text-maroon placeholder:text-muted-2/70 focus:border-maroon focus:outline-none focus:ring-2 focus:ring-butter/50";

export function ProfileForm({ initial }: { initial: { fullName: string; phone: string | null; address: string | null } }) {
  const [v, setV] = useState({ fullName: initial.fullName, phone: initial.phone ?? "", address: initial.address ?? "" });
  const [state, setState] = useState<{ ok?: boolean; error?: string } | null>(null);
  const [pending, start] = useTransition();
  const dirty = v.fullName !== initial.fullName || v.phone !== (initial.phone ?? "") || v.address !== (initial.address ?? "");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await updateProfileAction(v);
          setState(r.ok ? { ok: true } : { error: r.error });
        });
      }}
      className="flex flex-col gap-4"
    >
      <label className="flex flex-col gap-1.5 text-[14px] font-semibold">
        Họ tên
        <input value={v.fullName} onChange={(e) => (setV({ ...v, fullName: e.target.value }), setState(null))} required minLength={2} maxLength={80} autoComplete="name" className={inputCls} />
      </label>
      <label className="flex flex-col gap-1.5 text-[14px] font-semibold">
        Số điện thoại
        <input value={v.phone} onChange={(e) => (setV({ ...v, phone: e.target.value }), setState(null))} type="tel" inputMode="tel" maxLength={20} autoComplete="tel" placeholder="VD: 0901 234 567" className={`${inputCls} tabular-nums`} />
        <span className="text-[12px] font-normal text-muted">Tiệm gọi số này để xác nhận đơn; tự điền sẵn khi bạn đặt bánh.</span>
      </label>
      <label className="flex flex-col gap-1.5 text-[14px] font-semibold">
        Địa chỉ
        <textarea value={v.address} onChange={(e) => (setV({ ...v, address: e.target.value }), setState(null))} rows={2} maxLength={200} autoComplete="street-address" placeholder="Để tiệm liên hệ khi cần (không bắt buộc)" className={`${inputCls} resize-y py-3`} />
      </label>
      {state?.error && <p role="alert" className="m-0 rounded-2xl bg-rose px-4 py-3 text-[14px] font-semibold text-accent">{state.error}</p>}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending || !dirty} className="min-h-12 rounded-full border-0 bg-maroon px-7 text-[15px] font-semibold text-cream hover:bg-accent disabled:cursor-not-allowed disabled:opacity-45">
          {pending ? "Đang lưu…" : "Lưu thông tin"}
        </button>
        {state?.ok && !dirty && <span role="status" className="text-[14px] font-semibold text-[#2F4A1E]">Đã lưu</span>}
      </div>
    </form>
  );
}
