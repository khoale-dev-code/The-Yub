"use client";

import { useActionState, useState, type KeyboardEvent } from "react";
import { signInAction, type SignInState } from "@/modules/admin/auth-actions";
import { AlertIcon, ArrowRightIcon, EyeIcon, EyeOffIcon, LockIcon, MailIcon } from "./admin-icons";

const field =
  "peer min-h-[54px] w-full rounded-2xl border border-maroon/15 bg-white px-12 text-[16px] text-maroon shadow-[0_1px_0_rgba(59,15,18,0.04)] transition-[border-color,box-shadow] placeholder:text-muted-2/70 hover:border-maroon/35 focus:border-maroon focus:outline-none focus:ring-4 focus:ring-butter/40";
const fieldIcon = "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-2 transition-colors peer-focus:text-maroon";

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
        <p className="m-0 rounded-2xl bg-butter/30 px-4 py-3 text-[14px] leading-[1.5] text-maroon">
          <strong>Chế độ xem thử</strong> – nhập mật khẩu <code>ADMIN_DEMO_PASSWORD</code> trong .env.local. Chỉ chạy với <code>npm run dev</code>.
        </p>
      )}

      {!demo && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="admin-email" className="text-[14px] font-semibold text-maroon">Email</label>
          <div className="relative">
            <input id="admin-email" name="email" type="email" autoComplete="username" inputMode="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ten@tiem.vn" className={field} />
            <MailIcon size={20} className={fieldIcon} />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="admin-password" className="text-[14px] font-semibold text-maroon">Mật khẩu</label>
        <div className="relative">
          <input
            id="admin-password"
            name="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            required
            autoFocus={demo}
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
            className="absolute right-1.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl border-0 bg-transparent text-muted hover:bg-maroon/6 hover:text-maroon"
          >
            {show ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
          </button>
        </div>
        {caps && <p id="admin-caps" className="m-0 text-[13px] font-semibold text-[#9a6200]">Đang bật Caps Lock</p>}
      </div>

      {state.error && (
        <p role="alert" className="m-0 flex items-start gap-2 rounded-2xl bg-rose px-4 py-3 text-[14px] font-semibold text-accent">
          <AlertIcon size={18} className="mt-px flex-none" /> {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="group mt-2 inline-flex min-h-[56px] items-center justify-center gap-2.5 rounded-full border-0 bg-maroon px-6 text-[16px] font-bold text-cream transition-[background-color,transform] hover:bg-accent active:scale-[0.98] disabled:cursor-wait disabled:opacity-80"
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
