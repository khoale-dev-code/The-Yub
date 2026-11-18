"use client";

import gsap from "gsap";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { startLoginAction } from "@/modules/customers/actions";
import { animationsReduced } from "../motion/motion-config";
import { freezeScroll } from "../motion/scroll-lock";
import { useLenis } from "../motion/smooth-scroll";
import { BagIcon, CheckIcon, CloseIcon, HeartIcon } from "../ui/icons";

import { GoogleG } from "../ui/google-icon";

const ReceiptIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
    <path d="M9 8h6M9 12h6" />
  </svg>
);

interface Props {
  storeName: string;
  next: string;
  mode: "supabase" | "demo" | "off";
  error: string | null;
}

type Consents = { policy: boolean; processing: boolean; age: boolean; marketing: boolean };
const EMPTY: Consents = { policy: false, processing: false, age: false, marketing: false };

/**
 * Trang dang nhap gon: chi 1 nut Google. Bam nut -> popup xin dong y
 * (3 o bat buoc, KHONG tick san, tung muc dich rieng + 1 o tuy chon) roi moi chuyen sang Google.
 */
export function LoginPanel({ storeName, next, mode, error: initialError }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el || animationsReduced()) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-login-in]", { y: 24, opacity: 0, duration: 0.8, ease: "expo.out", stagger: 0.07 });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="flex flex-col items-center gap-6 text-center">
      <div data-login-in className="flex flex-col gap-2">
        <h1 className="m-0 font-display text-[40px] font-semibold leading-[1.05] tracking-[-0.02em] md:text-[48px]">Đăng nhập</h1>
        <p className="m-0 text-[16px] text-muted">Một chạm với tài khoản Google – không cần nhớ thêm mật khẩu.</p>
      </div>

      <ul data-login-in className="m-0 grid w-full list-none grid-cols-3 gap-2 p-0">
        {[
          { icon: <HeartIcon size={20} />, t: "Lưu món yêu thích" },
          { icon: <ReceiptIcon />, t: "Xem lịch sử đơn" },
          { icon: <BagIcon size={20} />, t: "Mua lại 1 chạm" },
        ].map((b) => (
          <li key={b.t} className="flex flex-col items-center gap-2 rounded-[18px] bg-beige/70 px-2 py-3.5 text-[13px] font-semibold leading-tight">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-card text-accent">{b.icon}</span>
            {b.t}
          </li>
        ))}
      </ul>

      {error && (
        <p data-login-in role="alert" className="m-0 w-full rounded-2xl bg-rose px-4 py-3 text-left text-[14px] font-semibold text-accent">{error}</p>
      )}

      <div data-login-in className="flex w-full flex-col gap-3">
        {mode === "off" ? (
          <p className="m-0 rounded-2xl bg-beige px-4 py-3 text-[14px] text-muted">Đăng nhập tài khoản đang được tiệm hoàn thiện – bạn vẫn đặt bánh được mà không cần đăng nhập.</p>
        ) : (
          <button
            ref={triggerRef}
            type="button"
            onClick={() => (setError(null), setOpen(true))}
            aria-haspopup="dialog"
            className="flex min-h-[58px] w-full items-center justify-center gap-3 rounded-full border border-maroon/15 bg-white px-6 text-[16px] font-semibold text-[#1f1f1f] shadow-[0_14px_30px_-16px_rgba(36,18,13,0.55)] transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
          >
            {mode === "demo" ? <span aria-hidden="true">🧪</span> : <GoogleG />}
            {mode === "demo" ? "Đăng nhập xem thử (chạy thử)" : "Tiếp tục với Google"}
          </button>
        )}
        <p className="m-0 text-[13px] text-muted">
          Lần đầu đăng nhập sẽ tự tạo tài khoản. Xem <Link href="/chinh-sach-bao-mat" className="font-semibold">Chính sách bảo mật</Link>.
        </p>
      </div>

      <ConsentDialog
        open={open}
        storeName={storeName}
        mode={mode}
        next={next}
        onClose={() => {
          setOpen(false);
          triggerRef.current?.focus();
        }}
      />
    </div>
  );
}

function ConsentDialog({ open, onClose, storeName, mode, next }: { open: boolean; onClose: () => void; storeName: string; mode: Props["mode"]; next: string }) {
  const [c, setC] = useState<Consents>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const lenis = useLenis();
  const releaseRef = useRef<(() => void) | null>(null);
  useEffect(() => () => releaseRef.current?.(), []);
  const ready = c.policy && c.processing && c.age;
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const pendingRef = useRef(pending);
  pendingRef.current = pending;

  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const sheet = sheetRef.current;
    if (!mounted || !root || !sheet) return;
    const mobile = window.matchMedia("(max-width: 639px)").matches;
    if (open) {
      releaseRef.current?.();
      releaseRef.current = freezeScroll(lenis);
      gsap.set([root, sheet], { visibility: "visible" });
      if (!animationsReduced()) {
        gsap.fromTo(root, { opacity: 0 }, { opacity: 1, duration: 0.25 });
        gsap.fromTo(sheet, mobile ? { yPercent: 100, opacity: 1 } : { y: 30, scale: 0.96, opacity: 0 }, mobile ? { yPercent: 0, duration: 0.55, ease: "expo.out" } : { y: 0, scale: 1, opacity: 1, duration: 0.5, ease: "expo.out" });
        gsap.fromTo(sheet.querySelectorAll("[data-consent-row]"), { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power3.out", stagger: 0.05, delay: 0.12 });
      } else gsap.set([root, sheet], { opacity: 1 });
      const t = window.setTimeout(() => sheet.querySelector<HTMLInputElement>("input")?.focus(), 60);
      const onKey = (e: KeyboardEvent) => e.key === "Escape" && !pendingRef.current && closeRef.current();
      window.addEventListener("keydown", onKey);
      return () => {
        window.clearTimeout(t);
        window.removeEventListener("keydown", onKey);
      };
    }
    releaseRef.current?.();
    releaseRef.current = null;
    const done = () => {
      setMounted(false);
      setError(null);
    };
    if (animationsReduced()) return done();
    gsap.to(sheet, mobile ? { yPercent: 100, duration: 0.3, ease: "power2.in" } : { y: 20, scale: 0.97, autoAlpha: 0, duration: 0.22, ease: "power2.in" });
    gsap.to(root, { autoAlpha: 0, duration: 0.3, onComplete: done });
  }, [open, mounted, lenis]);

  if (!mounted) return null;

  const submit = () =>
    start(async () => {
      setError(null);
      const res = await startLoginAction({ ...c, next });
      // Thanh cong: server chuyen huong (sang Google / trang Tai khoan)
      if (res && !res.ok) setError(res.error);
    });

  const row = (key: keyof Consents, label: React.ReactNode, required = true) => (
    <label data-consent-row className={`flex cursor-pointer items-start gap-3 rounded-[16px] border p-3 text-left transition-colors ${c[key] ? "border-maroon/40 bg-butter/15" : "border-maroon/12 bg-card hover:border-maroon/30"}`}>
      <input type="checkbox" checked={c[key]} onChange={(e) => setC((x) => ({ ...x, [key]: e.target.checked }))} className="peer sr-only" />
      <span aria-hidden="true" className={`mt-0.5 flex h-[22px] w-[22px] flex-none items-center justify-center rounded-[7px] border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-butter ${c[key] ? "border-maroon bg-maroon text-cream" : "border-maroon/35 bg-white"}`}>
        {c[key] && <CheckIcon size={14} />}
      </span>
      <span className="text-[14px] leading-relaxed text-maroon">
        {required ? <strong className="mr-1 text-accent">*</strong> : <span className="mr-1 text-muted">(Không bắt buộc)</span>}
        {label}
      </span>
    </label>
  );

  // Gan vao <body> (portal): thoat khoi lop xep chong cua header / trang -> luon phu tren cung
  return createPortal(
    <div ref={rootRef} className="invisible fixed inset-0 z-[85] flex items-end justify-center opacity-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="consent-title">
      <button type="button" tabIndex={-1} aria-hidden="true" onClick={() => !pending && onClose()} className="absolute inset-0 border-0 bg-dark/55 md:backdrop-blur-[3px]" />
      <div ref={sheetRef} data-lenis-prevent className="relative flex max-h-[92dvh] w-full max-w-[520px] flex-col overflow-y-auto rounded-t-[28px] bg-page px-5 pb-[calc(20px+env(safe-area-inset-bottom))] pt-3 text-left shadow-[0_-20px_50px_-20px_rgba(36,18,13,0.6)] sm:rounded-[28px] sm:px-7 sm:pb-7 sm:pt-6">
        <span aria-hidden="true" className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-maroon/15 sm:hidden" />
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 id="consent-title" className="m-0 font-display text-[26px] font-semibold leading-tight">Trước khi đăng nhập</h2>
            <p className="m-0 text-[14px] text-muted">Theo quy định về bảo vệ dữ liệu cá nhân, vui lòng xác nhận các mục dưới đây.</p>
          </div>
          <button type="button" onClick={onClose} disabled={pending} aria-label="Đóng" className="flex h-10 w-10 flex-none items-center justify-center rounded-full border-0 bg-maroon/6 text-maroon hover:bg-maroon/12">
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {row(
            "policy",
            <>
              Tôi đã đọc và đồng ý với{" "}
              <Link href="/chinh-sach-bao-mat" target="_blank" className="font-semibold">Chính sách bảo mật</Link> của {storeName}.
            </>,
          )}
          {row("processing", <>Tôi đồng ý để tiệm xử lý họ tên, email, ảnh đại diện (từ Google), số điện thoại, địa chỉ tôi cung cấp, lịch sử đơn và món yêu thích – chỉ để quản lý tài khoản, xử lý đơn và liên hệ khi có sự cố.</>)}
          {row("age", <>Tôi từ đủ 16 tuổi, hoặc đã được cha mẹ / người giám hộ đồng ý.</>)}
          {row("marketing", <>Nhận tin mẻ bánh mới & ưu đãi (tắt được bất cứ lúc nào).</>, false)}
        </div>

        {error && <p role="alert" className="mb-0 mt-3 rounded-2xl bg-rose px-4 py-3 text-[14px] font-semibold text-accent">{error}</p>}

        <button
          type="button"
          onClick={submit}
          disabled={!ready || pending}
          className="mt-4 flex min-h-[56px] w-full items-center justify-center gap-3 rounded-full border-0 bg-maroon px-6 text-[16px] font-semibold text-cream transition-[background-color,opacity] hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
        >
          {mode !== "demo" && (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white">
              <GoogleG />
            </span>
          )}
          {pending ? "Đang chuyển…" : mode === "demo" ? "Đồng ý & đăng nhập thử" : "Đồng ý & tiếp tục với Google"}
        </button>
        <p className="mb-0 mt-2.5 text-center text-[12px] text-muted">{ready ? "Bạn đăng nhập trên trang của Google – tiệm không nhận mật khẩu của bạn." : "Tick đủ 3 mục có dấu * để tiếp tục."}</p>
      </div>
    </div>,
    document.body,
  );
}
