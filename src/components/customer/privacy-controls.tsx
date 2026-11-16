"use client";

import { useState, useTransition } from "react";
import { deleteAccountAction, setMarketingAction } from "@/modules/customers/actions";

/** Bat / tat nhan tin uu dai (rut lai dong y rieng) */
export function MarketingSwitch({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4">
      <span className="flex flex-col">
        <strong className="text-[15px]">Nhận tin mẻ bánh mới & ưu đãi</strong>
        <span className="text-[13px] text-muted">{on ? "Đang bật – tắt bất cứ lúc nào." : "Đang tắt."}</span>
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={on}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.checked;
          setOn(next);
          start(async () => {
            const r = await setMarketingAction(next);
            if (!r.ok) setOn(!next);
          });
        }}
        className="peer sr-only"
      />
      <span aria-hidden="true" className={`relative h-7 w-12 flex-none rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-butter ${on ? "bg-[#2F4A1E]" : "bg-maroon/20"}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-6" : "translate-x-1"}`} />
      </span>
    </label>
  );
}

/** Xoa tai khoan: phai go "XOÁ" de xac nhan (thao tac khong hoan tac duoc) */
export function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="self-start rounded-full border border-accent/40 bg-transparent px-5 py-2.5 text-[14px] font-semibold text-accent hover:bg-rose">
        Xoá tài khoản & dữ liệu
      </button>
    );
  return (
    <div className="flex flex-col gap-3 rounded-[18px] border border-accent/30 bg-rose/60 p-4">
      <p className="m-0 text-[14px] text-maroon">
        Hồ sơ, món yêu thích và lịch sử đồng ý sẽ bị <strong>xoá vĩnh viễn</strong>; bạn sẽ bị đăng xuất. Đơn đã đặt vẫn được tiệm lưu cho sổ sách nhưng không còn gắn với bạn. Gõ <strong>XOÁ</strong> để xác nhận.
      </p>
      <input value={text} onChange={(e) => (setText(e.target.value), setError(null))} aria-label="Gõ XOÁ để xác nhận" className="min-h-11 rounded-[12px] border border-accent/40 bg-white px-3.5 text-[15px] uppercase" />
      {error && <p role="alert" className="m-0 text-[13px] font-semibold text-accent">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending || !/^XO[AÁ]$/i.test(text.trim())}
          onClick={() =>
            start(async () => {
              const r = await deleteAccountAction(text);
              if (r && !r.ok) setError(r.error);
            })
          }
          className="min-h-11 rounded-full border-0 bg-accent px-5 text-[14px] font-semibold text-cream disabled:opacity-45"
        >
          {pending ? "Đang xoá…" : "Xoá vĩnh viễn"}
        </button>
        <button type="button" onClick={() => (setOpen(false), setText(""))} className="min-h-11 rounded-full border border-maroon/25 bg-transparent px-5 text-[14px] font-semibold text-maroon">Huỷ</button>
      </div>
    </div>
  );
}
