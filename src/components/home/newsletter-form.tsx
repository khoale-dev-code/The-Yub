"use client";

import { useState, type FormEvent } from "react";

/**
 * Form nhan tin: CHUA noi dich vu email (cho chu tiem chon nha cung cap).
 * Khong gia vo "da dang ky" – chi bao ro trang thai cho kich hoat.
 */
export function NewsletterForm() {
  const [note, setNote] = useState<string | null>(null);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setNote("Tính năng nhận tin đang chờ tiệm kích hoạt. Trong lúc chờ, bạn theo dõi tiệm trên mạng xã hội nhé.");
  };

  return (
    <form onSubmit={onSubmit} className="mt-2 flex w-full max-w-[460px] flex-col gap-1.5">
      <label htmlFor="yub-email" className="text-[13px] font-semibold">Email</label>
      <div className="flex flex-col gap-1 sm:flex-row sm:gap-2">
        <input id="yub-email" name="email" type="email" required autoComplete="email" placeholder="ban@email.com" className="min-h-[50px] min-w-0 flex-1 rounded-[14px] border-[1.5px] border-maroon bg-card px-4 text-base text-maroon sm:min-h-[52px] sm:rounded-full sm:px-5" />
        <button type="submit" className="mt-1 min-h-[50px] rounded-[14px] border-0 bg-maroon px-6 text-[15px] font-semibold text-cream hover:bg-accent sm:mt-0 sm:min-h-[52px] sm:rounded-full">
          <span className="sm:hidden">Đăng ký nhận tin</span><span className="hidden sm:inline">Đăng ký</span>
        </button>
      </div>
      {note && <p role="status" className="m-0 mt-1 text-sm text-muted-2">{note}</p>}
    </form>
  );
}
