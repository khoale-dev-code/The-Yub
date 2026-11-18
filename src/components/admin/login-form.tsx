"use client";

import { useActionState, useState, type KeyboardEvent } from "react";
import { signInAction, type SignInState } from "@/modules/admin/auth-actions";
import { AlertIcon, ArrowRightIcon, EyeIcon, EyeOffIcon, LockIcon, MailIcon } from "./admin-icons";

const field =
  "peer min-h-[50px] w-full rounded-xl border border-[#806b60] bg-[#281c18] px-12 text-[16px] text-[#fff1dc] transition-[border-color,box-shadow] placeholder:text-[#ae9b90] hover:border-[#ad9484] focus:border-butter focus:outline-none focus:ring-2 focus:ring-butter/45";
const fieldIcon = "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#d8c5b9] transition-colors peer-focus:text-butter";

export function LoginForm({ demo }: { demo: boolean }) {
  const [state, action, pending] = useActionState<SignInState, FormData>(signInAction, { error: null });
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  // Giu email khi dang nhap sai (React reset form sau moi lan gui)
  const [email, setEmail] = useState("");
  const checkCaps = (e: KeyboardEvent<HTMLInputElement>) => setCaps(e.getModifierState?.("CapsLock") ?? false);

  return (
    <form action={action} className="flex flex-col gap-4">
      {demo && (
        <p className="m-0 rounded-2xl bg-[#3c2d1d] px-4 py-3 text-[14px] leading-[1.5] text-[#ffdfa7]">
          <strong>Chế độ xem thử</strong> – nhập mật khẩu <code>ADMIN_DEMO_PASSWORD</code> trong .env.local. Chỉ chạy với <code>npm run dev</code>.
        </p>
      )}

      {!demo && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="admin-email" className="text-[14px] font-semibold text-cream">Email</label>
          <div className="relative">
            <input id="admin-email" name="email" type="email" autoComplete="username" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ten@tiem.vn" className={field} />
            <MailIcon size={20} className={fieldIcon} />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="admin-password" className="text-[14px] font-semibold text-cream">Mật khẩu</label>
        <div className="relative">
          <input
            id="admin-password"
            name="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            required
            onKeyUp={checkCaps}
            onKeyDown={checkCaps}
            onBlur={() => setCaps(false)}
            aria-describedby={caps ? "admin-caps" : undefined}
            className={`${field} pr-14`}
          />
          <LockIcon size={20} className={fieldIcon} />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            aria-pressed={show}
            className="absolute right-1.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl border-0 bg-transparent text-[#d8c5b9] hover:bg-white/10 hover:text-white"
          >
            {show ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
          </button>
        </div>
        {caps && <p id="admin-caps" className="m-0 text-[13px] font-semibold text-[#ffda94]">Đang bật Caps Lock</p>}
      </div>

      {state.error && (
        <p role="alert" className="m-0 flex items-start gap-2 rounded-2xl bg-[#482727] px-4 py-3 text-[14px] font-semibold text-[#ffd2c9]">
          <AlertIcon size={18} className="mt-px flex-none" /> {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="group mt-2 inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-xl border-0 bg-butter px-6 text-[16px] font-bold text-[#2b190e] transition-[background-color,transform] hover:bg-[#f1b955] active:scale-[0.98] disabled:cursor-wait disabled:opacity-80"
      >
        {pending ? (
          <>
            <span aria-hidden="true" className="h-5 w-5 rounded-full border-2 border-cream/30 border-t-cream motion-safe:animate-[yub-spin_0.8s_linear_infinite]" />
            Đang đăng nhập…
          </>
        ) : (
          <>
            Đăng nhập
            <ArrowRightIcon size={18} className="transition-transform group-hover:translate-x-1" />
          </>
        )}
      </button>
    </form>
  );
}
