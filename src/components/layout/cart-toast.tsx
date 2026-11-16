"use client";

import gsap from "gsap";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CART_ADDED_EVENT, clearCartFx, type CartAddedDetail } from "@/modules/cart/cart-fx";
import { useCart } from "@/modules/cart/cart-context";
import { CheckIcon, CloseIcon } from "../ui/icons";

const SHOW_MS = 3200;

/** Thong bao "Đã thêm vào giỏ" – goc phai duoi header (may tinh) / tren thanh gio (dien thoai). */
export function CartToast() {
  const [item, setItem] = useState<(CartAddedDetail & { key: number }) | null>(null);
  const { count } = useCart();
  const box = useRef<HTMLDivElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const onAdd = (e: Event) => {
      const detail = (e as CustomEvent<CartAddedDetail>).detail;
      setItem({ ...detail, key: Date.now() });
    };
    window.addEventListener(CART_ADDED_EVENT, onAdd);
    return () => window.removeEventListener(CART_ADDED_EVENT, onAdd);
  }, []);

  // Doi trang: dong thong bao + don cac hieu ung bay vao gio con sot
  useEffect(() => {
    setItem(null);
    clearCartFx();
  }, [pathname]);

  useEffect(() => {
    if (!item) return;
    if (box.current) gsap.fromTo(box.current, { y: -16, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.6)" });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(close, SHOW_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.key]);

  function close() {
    if (!box.current) return setItem(null);
    gsap.to(box.current, { y: -10, opacity: 0, duration: 0.25, ease: "power2.in", onComplete: () => setItem(null) });
  }


  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-3 bottom-[calc(112px+env(safe-area-inset-bottom))] z-[75] flex justify-center md:inset-x-auto md:bottom-auto md:right-6 md:top-[calc(var(--yub-header-h)+12px)]">
      {item && (
        <div
          ref={box}
          key={item.key}
          role="status"
          onMouseEnter={() => timer.current && clearTimeout(timer.current)}
          onMouseLeave={() => (timer.current = setTimeout(close, 1500))}
          className="pointer-events-auto flex w-full max-w-[400px] items-center gap-3 rounded-[20px] bg-card p-3 pr-2 text-maroon shadow-[0_20px_40px_-12px_rgba(59,15,18,0.45)] ring-1 ring-maroon/10"
        >
          <span className="relative h-14 w-14 flex-none">
            <span className="block h-full w-full overflow-hidden rounded-2xl bg-beige">
              {item.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image} alt="" className="h-full w-full object-cover" />
              )}
            </span>
            <span className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#2F4A1E] text-white ring-2 ring-card">
              <CheckIcon size={14} />
            </span>
          </span>
          <span className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="text-xs font-semibold text-[#2F4A1E]">Đã thêm vào giỏ</span>
            <strong className="line-clamp-2 text-[15px]">{item.qty > 1 ? `${item.qty} × ` : ""}{item.name}</strong>
            <span className="text-xs text-muted">{item.note ? `${item.note} · ` : ""}Giỏ hàng: {count} món</span>
          </span>
          <Link href="/gio-hang" className="flex min-h-11 flex-none items-center rounded-full bg-maroon px-4 text-sm font-semibold text-cream no-underline hover:bg-accent hover:text-cream">Xem giỏ</Link>
          <button type="button" onClick={close} aria-label="Đóng thông báo" className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-muted hover:bg-beige">
            <CloseIcon size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
