"use client";

import gsap from "gsap";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { animationsReduced } from "@/components/motion/motion-config";
import { ArrowRightIcon, CloseIcon } from "@/components/ui/icons";
import { formatVnd } from "@/lib/format";
import { productImages } from "@/lib/images";
import { paymentLabels } from "@/modules/orders/types";
import type { Product } from "@/modules/products/types";

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export const CHECKOUT_INFO_HREF = "/gio-hang?buoc=thong-tin";

export interface BookingRow {
  key: string;
  product: Product;
  variant: string | null;
  unit: number;
  qty: number;
  total: number;
}

export interface BookingBlocker {
  message: string;
  /** Section can sua: "chon-banh" | "hen-gio" */
  target: string;
  action: string;
}

/** So tien "dem" toi gia tri moi (GSAP) – React chi render gia tri ban dau, roi GSAP cap nhat chu. */
export function AnimatedVnd({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const shown = useRef(value);
  const [initial] = useState(value);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el || shown.current === value) return;
    if (animationsReduced()) {
      shown.current = value;
      el.textContent = formatVnd(value);
      return;
    }
    const counter = { v: shown.current };
    const tween = gsap.to(counter, {
      v: value,
      duration: 0.7,
      ease: "power3.out",
      onUpdate: () => {
        shown.current = counter.v;
        el.textContent = formatVnd(Math.round(counter.v));
      },
    });
    gsap.fromTo(el, { scale: 1.06 }, { scale: 1, duration: 0.5, ease: "power2.out", transformOrigin: "100% 50%" });
    return () => {
      tween.kill();
    };
  }, [value]);

  return (
    <>
      <span ref={ref} aria-hidden="true" className={`inline-block tabular-nums ${className ?? ""}`}>{formatVnd(initial)}</span>
      <span className="sr-only">{formatVnd(value)}</span>
    </>
  );
}

interface SummaryProps {
  rows: BookingRow[];
  itemCount: number;
  subtotal: number;
  pickupLabel: string | null;
  blocker: BookingBlocker | null;
  onRemove: (key: string) => void;
  onFix: (target: string) => void;
}

function ContinueAction({ blocker, onFix, children }: { blocker: BookingBlocker | null; onFix: (t: string) => void; children: ReactNode }) {
  const cls = "inline-flex min-h-[58px] w-full items-center justify-center gap-2 rounded-full border-0 px-5 text-base font-bold no-underline transition-[background-color,transform] active:scale-[0.98]";
  if (blocker) {
    return (
      <button type="button" onClick={() => onFix(blocker.target)} className={`${cls} bg-cream/15 text-cream hover:bg-cream/25`}>
        {blocker.action}
      </button>
    );
  }
  return (
    <Link href={CHECKOUT_INFO_HREF} className={`${cls} bg-butter text-maroon hover:bg-cream hover:text-maroon`}>
      {children} <ArrowRightIcon />
    </Link>
  );
}

/** Tom tat don (cot phai, dinh khi cuon tren desktop). */
export function BookingSummary({ rows, itemCount, subtotal, pickupLabel, blocker, onRemove, onFix }: SummaryProps) {
  const list = useRef<HTMLUListElement | null>(null);
  const known = useRef<Set<string> | null>(null);

  // Mon moi them vao: truot vao tu ben phai
  useEffect(() => {
    const keys = new Set(rows.map((r) => r.key));
    const prev = known.current;
    known.current = keys;
    if (!prev || !list.current || animationsReduced()) return;
    const fresh = rows.filter((r) => !prev.has(r.key)).map((r) => list.current?.querySelector(`[data-row="${CSS.escape(r.key)}"]`)).filter(Boolean);
    if (fresh.length) gsap.from(fresh, { x: 28, autoAlpha: 0, duration: 0.6, ease: "expo.out", stagger: 0.05 });
  }, [rows]);

  return (
    <aside
      id="xac-nhan"
      aria-label="Đơn đặt bánh của bạn"
      style={{ scrollMarginTop: "calc(var(--yub-header-h) + 84px)" }}
      className="flex flex-col gap-5 rounded-[26px] bg-maroon p-6 text-cream shadow-[0_28px_56px_-28px_rgba(59,15,18,0.7)] sm:p-7 lg:sticky lg:top-[calc(var(--yub-header-h)+84px)]"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 data-no-split className="m-0 font-display text-[26px] font-semibold">Đơn của bạn</h2>
        <span className="text-sm text-cream/75">{itemCount} món</span>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-[18px] border border-dashed border-cream/25 px-4 py-6">
          <p className="m-0 text-[15px] text-cream/85">Chưa có bánh nào. Bấm biểu tượng giỏ trên thẻ bánh để thêm vào đơn.</p>
          <button type="button" onClick={() => onFix("chon-banh")} className="inline-flex min-h-10 items-center gap-1.5 border-0 bg-transparent p-0 text-[15px] font-semibold text-butter">
            Chọn bánh <ArrowRightIcon size={16} />
          </button>
        </div>
      ) : (
        <ul ref={list} data-lenis-prevent className="yub-scroll -mr-2 m-0 flex max-h-[280px] list-none flex-col gap-1 overflow-y-auto p-0 pr-2">
          {rows.map((r) => (
            <li key={r.key} data-row={r.key} className="grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl py-1.5">
              <span className="relative h-12 w-12 overflow-hidden rounded-xl bg-beige">
                <Image src={productImages[r.product.image]} alt="" fill sizes="48px" className="object-cover" style={{ objectPosition: r.product.imagePosition ?? "center" }} />
              </span>
              <span className="flex min-w-0 flex-col leading-[1.35]">
                <span className="truncate text-[15px] font-semibold">{r.product.name}</span>
                <span className="text-[13px] text-cream/70">{[r.variant, `${r.qty} × ${formatVnd(r.unit)}`].filter(Boolean).join(" · ")}</span>
                {r.product.status === "out" && <span className="text-[12px] font-semibold text-butter">Hết hôm nay – vui lòng xoá</span>}
              </span>
              <span className="flex items-center gap-1">
                <span className="text-[15px] font-semibold tabular-nums">{formatVnd(r.total)}</span>
                <button type="button" onClick={() => onRemove(r.key)} aria-label={`Xoá ${r.product.name} khỏi đơn`} className="flex h-9 w-9 items-center justify-center rounded-full border-0 bg-transparent text-cream/60 hover:bg-cream/10 hover:text-cream">
                  <CloseIcon size={16} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-3 rounded-2xl bg-cream/8 p-3.5">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-none"><path d="M3 10.5 12 4l9 6.5V20H3z" /><path d="M9.5 20v-6h5v6" /></svg>
        <span className="flex min-w-0 flex-col leading-[1.35]">
          <span className="text-[13px] text-cream/75">Nhận tại tiệm</span>
          <strong className="text-[15px]">{pickupLabel ?? "Chưa chọn giờ nhận"}</strong>
        </span>
        <button type="button" onClick={() => onFix("hen-gio")} className="ml-auto min-h-9 flex-none border-0 bg-transparent p-0 text-sm font-semibold text-butter underline underline-offset-4">Đổi</button>
      </div>

      <dl className="m-0 flex flex-col gap-2.5 text-[15px]">
        <div className="flex justify-between gap-3"><dt className="text-cream/80">Phí giao</dt><dd className="m-0">0đ · lấy tại tiệm</dd></div>
        <div className="h-px bg-cream/20" />
        <div className="flex items-baseline justify-between gap-3">
          <dt className="font-semibold">Tạm tính</dt>
          <dd className="m-0 font-display text-[30px] font-semibold text-white"><AnimatedVnd value={subtotal} /></dd>
        </div>
      </dl>

      {blocker && <p role="status" className="m-0 rounded-2xl bg-butter/15 px-3.5 py-2.5 text-[13px] font-semibold text-butter">{blocker.message}</p>}
      <ContinueAction blocker={blocker} onFix={onFix}>Tiếp tục: thông tin nhận bánh</ContinueAction>

      <p className="m-0 text-[13px] leading-[1.55] text-cream/70">
        Tiệm gọi xác nhận đơn trong giờ mở cửa rồi mới chuẩn bị. Thanh toán: {paymentLabels.cod.toLowerCase()} hoặc {paymentLabels.transfer.toLowerCase()} (tiệm đối soát thủ công). Tổng tiền được tiệm tính lại khi nhận đơn.
      </p>
    </aside>
  );
}

/** Thanh duoi man hinh tren dien thoai – an khi khung tom tat dang hien. */
export function BookingMobileBar({ itemCount, subtotal, blocker, hidden, onFix }: { itemCount: number; subtotal: number; blocker: BookingBlocker | null; hidden: boolean; onFix: (t: string) => void }) {
  const cls = "inline-flex min-h-[48px] flex-none items-center gap-1.5 rounded-full border-0 px-5 text-[15px] font-bold no-underline";
  return (
    <div
      aria-hidden={hidden}
      className={`fixed inset-x-3 bottom-4 z-30 flex items-center gap-3 rounded-full bg-maroon py-2 pl-5 pr-2 text-cream shadow-[0_14px_36px_rgba(59,15,18,0.4)] transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] lg:hidden ${hidden ? "pointer-events-none translate-y-[140%] opacity-0" : "translate-y-0 opacity-100"}`}
    >
      <div className="flex min-w-0 flex-1 flex-col leading-[1.3]">
        <span className="text-xs text-cream/80">Đơn của bạn · {itemCount} món</span>
        <strong className="font-display text-lg font-semibold"><AnimatedVnd value={subtotal} /></strong>
      </div>
      {blocker ? (
        <button type="button" tabIndex={hidden ? -1 : 0} onClick={() => onFix(blocker.target)} className={`${cls} bg-cream/15 text-cream`}>{blocker.action}</button>
      ) : (
        <Link href={CHECKOUT_INFO_HREF} tabIndex={hidden ? -1 : 0} className={`${cls} bg-butter text-maroon hover:text-maroon`}>Tiếp tục <ArrowRightIcon size={16} /></Link>
      )}
    </div>
  );
}
