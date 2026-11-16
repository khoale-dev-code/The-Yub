"use client";

import gsap from "gsap";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatVnd } from "@/lib/format";
import { lineKey, useCart } from "@/modules/cart/cart-context";
import { animationsReduced } from "../motion/motion-config";
import { useLenis } from "../motion/smooth-scroll";
import { ArrowRightIcon, BagIcon, CloseIcon, MinusIcon, PlusIcon, TrashIcon } from "../ui/icons";

export type CartCatalog = Record<
  string,
  { name: string; img: string; priceVnd: number; out: boolean; variants?: { id: string; label: string; priceVnd: number }[] }
>;

/**
 * Gio hang nhanh: bam icon gio tren thanh menu -> khung "nay" ra ngay duoi nut (may tinh)
 * hoac truot len tu day man hinh (dien thoai). Sua so luong, xoa mon, roi "Đặt bánh".
 * Chi transform/opacity, Lenis tam dung khi mo -> muot. Gia o day chi de tham khao,
 * server tinh lai khi tao don.
 */
export function CartDrawer({ open, onClose, catalog, anchor }: { open: boolean; onClose: () => void; catalog: CartCatalog; anchor: HTMLElement | null }) {
  const cart = useCart();
  const lenis = useLenis();
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);

  const rows = cart.lines
    .map((l) => {
      const p = catalog[l.productId];
      if (!p) return null;
      const v = l.variantId ? p.variants?.find((x) => x.id === l.variantId) : p.variants?.[0];
      const unit = v?.priceVnd ?? p.priceVnd;
      return { key: lineKey(l), line: l, p, label: l.variantId ? v?.label : undefined, unit, total: unit * l.qty };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);
  const subtotal = rows.reduce((s, r) => s + r.total, 0);
  const count = rows.reduce((s, r) => s + r.line.qty, 0);

  useEffect(() => {
    if (!open) return;
    setMounted(true);
    // May tinh: dat khung ngay duoi nut gio
    if (anchor && window.matchMedia("(min-width: 768px)").matches) {
      const r = anchor.getBoundingClientRect();
      setPos({ top: r.bottom + 12, right: Math.max(16, window.innerWidth - r.right) });
    } else setPos(null);
  }, [open, anchor]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const panel = panelRef.current;
    if (!mounted || !root || !panel) return;
    const mobile = !window.matchMedia("(min-width: 768px)").matches;
    if (open) {
      lenis?.stop();
      gsap.set([root, panel], { visibility: "visible" });
      if (animationsReduced()) gsap.set([root, panel], { opacity: 1 });
      else {
        gsap.fromTo(root, { opacity: 0 }, { opacity: 1, duration: 0.2 });
        // "Nay" ra: phong tu nut gio (may tinh) / bat len tu day (dien thoai)
        if (mobile) gsap.fromTo(panel, { yPercent: 100, opacity: 1 }, { yPercent: 0, duration: 0.6, ease: "back.out(1.15)" });
        else gsap.fromTo(panel, { y: -14, scale: 0.86, opacity: 0, transformOrigin: "92% 0%" }, { y: 0, scale: 1, opacity: 1, duration: 0.55, ease: "back.out(1.9)" });
        gsap.fromTo(panel.querySelectorAll("[data-cart-row]"), { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power3.out", stagger: 0.04, delay: 0.1 });
      }
      panel.querySelector<HTMLElement>("button, a")?.focus({ preventScroll: true });
      const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeRef.current();
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
    lenis?.start();
    const done = () => setMounted(false);
    if (animationsReduced()) return done();
    if (mobile) gsap.to(panel, { yPercent: 100, duration: 0.3, ease: "power2.in" });
    else gsap.to(panel, { y: -8, scale: 0.94, opacity: 0, duration: 0.2, ease: "power2.in" });
    gsap.to(root, { opacity: 0, duration: 0.28, onComplete: done });
  }, [open, mounted, lenis]);

  if (!mounted) return null;

  const qtyBtn = "flex h-9 w-9 items-center justify-center rounded-full border-0 bg-transparent text-maroon hover:bg-maroon/8 disabled:opacity-35";

  return createPortal(
    <div ref={rootRef} className="invisible fixed inset-0 z-[75] opacity-0" role="dialog" aria-modal="true" aria-label="Giỏ hàng">
      <button type="button" tabIndex={-1} aria-hidden="true" onClick={onClose} className="absolute inset-0 border-0 bg-dark/35 md:bg-dark/15" />
      <div
        ref={panelRef}
        style={pos ? { top: pos.top, right: pos.right } : undefined}
        className="invisible absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-[28px] bg-page opacity-0 shadow-[0_-24px_60px_-24px_rgba(36,18,13,0.6)] md:inset-x-auto md:bottom-auto md:max-h-[min(620px,calc(100dvh-120px))] md:w-[400px] md:rounded-[26px] md:shadow-[0_30px_70px_-24px_rgba(36,18,13,0.55)]"
      >
        <span aria-hidden="true" className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-maroon/15 md:hidden" />
        <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-3 md:pt-4">
          <strong className="font-display text-[24px] font-semibold">Giỏ hàng{count ? ` · ${count} món` : ""}</strong>
          <button type="button" onClick={onClose} aria-label="Đóng giỏ hàng" className="flex h-10 w-10 items-center justify-center rounded-full border-0 bg-maroon/6 text-maroon hover:bg-maroon/12">
            <CloseIcon size={18} />
          </button>
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 pb-8 pt-4 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-beige text-accent"><BagIcon size={28} /></span>
            <p className="m-0 font-display text-[22px] font-semibold">Giỏ hàng đang trống</p>
            <p className="m-0 text-[14px] text-muted">Chọn vài món ngon để giữ phần nhé.</p>
            <Link href="/thuc-don" onClick={onClose} className="mt-1 inline-flex min-h-12 items-center gap-2 rounded-full bg-maroon px-6 font-semibold text-cream no-underline hover:bg-accent hover:text-cream">Xem thực đơn <ArrowRightIcon /></Link>
          </div>
        ) : (
          <>
            <ul data-lenis-prevent className="m-0 flex min-h-0 flex-1 list-none flex-col gap-1 overflow-y-auto overscroll-contain px-3 p-0">
              {rows.map((r) => (
                <li key={r.key} data-cart-row className="flex items-center gap-3 rounded-[18px] p-2 hover:bg-maroon/4">
                  <span className="relative h-16 w-16 flex-none overflow-hidden rounded-[14px] bg-beige">
                    <Image src={r.p.img} alt="" fill sizes="64px" className="object-cover" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col leading-tight">
                    <strong className="truncate text-[15px]">{r.p.name}</strong>
                    <span className="truncate text-[12px] text-muted">{r.label ? `${r.label} · ` : ""}{formatVnd(r.unit)}{r.p.out ? " · Hết hôm nay" : ""}</span>
                    <span className="mt-1.5 inline-flex items-center self-start rounded-full border border-maroon/15 bg-card">
                      <button type="button" aria-label={`Giảm ${r.p.name}`} onClick={() => (r.line.qty <= 1 ? cart.remove(r.key) : cart.setQty(r.key, r.line.qty - 1))} className={qtyBtn}>
                        {r.line.qty <= 1 ? <TrashIcon size={15} /> : <MinusIcon size={15} />}
                      </button>
                      <span className="w-6 text-center text-[14px] font-bold tabular-nums" aria-live="polite">{r.line.qty}</span>
                      <button type="button" aria-label={`Tăng ${r.p.name}`} disabled={r.line.qty >= 20} onClick={() => cart.setQty(r.key, r.line.qty + 1)} className={qtyBtn}>
                        <PlusIcon size={15} />
                      </button>
                    </span>
                  </span>
                  <strong className="flex-none self-start pt-1 font-display text-[16px] font-semibold tabular-nums">{formatVnd(r.total)}</strong>
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-3 border-t border-maroon/10 px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-4">
              <div className="flex items-baseline justify-between">
                <span className="text-[14px] text-muted">Tạm tính</span>
                <strong className="font-display text-[26px] font-semibold tabular-nums">{formatVnd(subtotal)}</strong>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-2">
                <Link href="/gio-hang" onClick={onClose} className="flex min-h-12 items-center justify-center rounded-full border border-maroon/25 text-[15px] font-semibold text-maroon no-underline hover:border-maroon">Xem giỏ</Link>
                <Link href="/gio-hang?buoc=thong-tin" onClick={onClose} className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-maroon text-[15px] font-semibold text-cream no-underline hover:bg-accent hover:text-cream">Đặt bánh <ArrowRightIcon /></Link>
              </div>
              <p className="m-0 text-center text-[12px] text-muted">Nhận tại tiệm · tiệm tính lại tổng tiền khi xác nhận đơn.</p>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
