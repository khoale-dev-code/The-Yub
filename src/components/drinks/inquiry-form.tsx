"use client";

import { useState, useTransition, type FormEvent } from "react";
import { sendInquiryAction } from "@/modules/inquiries/actions";

const fieldCls = "min-h-11 border-0 border-b-[1.5px] border-maroon/45 bg-transparent p-0 text-base font-normal text-maroon focus:border-maroon";

export function InquiryForm() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = { name: data.get("name"), phone: data.get("phone"), message: data.get("message") };
    setResult(null);
    startTransition(async () => {
      const res = await sendInquiryAction(payload);
      if (res.ok) {
        form.reset();
        setResult({ ok: true, text: "Đã gửi – tiệm sẽ gọi lại trong giờ mở cửa." });
      } else {
        setResult({ ok: false, text: res.error });
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-[18px]" noValidate>
      <label className="flex flex-col gap-0.5 text-[13px] font-semibold">
        Tên của bạn
        <input name="name" type="text" autoComplete="name" required className={fieldCls} />
      </label>
      <label className="flex flex-col gap-0.5 text-[13px] font-semibold">
        Số điện thoại
        <input name="phone" type="tel" inputMode="tel" autoComplete="tel" required className={fieldCls} />
      </label>
      <label className="flex flex-col gap-0.5 text-[13px] font-semibold">
        Câu hỏi hoặc lời nhắn
        <input name="message" type="text" required className={fieldCls} />
      </label>
      {result && (
        <p role="status" className={`m-0 text-sm font-semibold ${result.ok ? "text-[#2F4A1E]" : "text-accent"}`}>{result.text}</p>
      )}
      <button type="submit" disabled={pending} className="mt-2 min-h-[54px] rounded-full border-0 bg-maroon text-[15px] font-semibold text-cream hover:bg-accent disabled:opacity-60">
        {pending ? "Đang gửi…" : "Gửi"}
      </button>
    </form>
  );
}
