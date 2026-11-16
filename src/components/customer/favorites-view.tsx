"use client";

import gsap from "gsap";
import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import { useCustomer } from "@/modules/customers/customer-context";
import type { Product } from "@/modules/products/types";
import { ProductCard } from "../product-card";
import { ArrowRightIcon, HeartIcon } from "../ui/icons";

export function FavoritesView({ products }: { products: Product[] }) {
  const { ready, loggedIn, favorites } = useCustomer();
  const byId = new Map(products.map((p) => [p.id, p]));
  const list = favorites.map((id) => byId.get(id)).filter((p): p is Product => Boolean(p));
  const gridRef = useRef<HTMLDivElement | null>(null);
  const shown = useRef(false);

  // Lan dau hien danh sach: the "troi len" lan luot
  useLayoutEffect(() => {
    const el = gridRef.current;
    if (!ready || !el || shown.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    shown.current = true;
    const tween = gsap.from(el.children, { y: 30, opacity: 0, duration: 0.7, ease: "expo.out", stagger: 0.06, clearProps: "transform,opacity" });
    return () => {
      tween.kill();
    };
  }, [ready, list.length]);

  return (
    <div className="flex flex-col gap-6">
      {!loggedIn && ready && (
        <div className="flex flex-col items-start gap-3 rounded-[22px] bg-beige p-4 sm:flex-row sm:items-center sm:justify-between md:p-5">
          <p className="m-0 text-[15px]">
            <strong>Bạn chưa đăng nhập.</strong> Món yêu thích đang lưu tạm – tắt trình duyệt là mất. Đăng nhập để lưu vào hồ sơ và xem trên mọi thiết bị.
          </p>
          <Link href="/dang-nhap?next=/yeu-thich" className="inline-flex min-h-11 flex-none items-center gap-2 rounded-full bg-maroon px-5 text-[14px] font-semibold text-cream no-underline hover:bg-accent hover:text-cream">
            Đăng nhập <ArrowRightIcon />
          </Link>
        </div>
      )}

      {!ready ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="aspect-[1/1.5] animate-pulse rounded-[18px] bg-beige" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-[28px] border border-dashed border-maroon/25 bg-card px-6 py-14 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-rose text-accent"><HeartIcon size={28} /></span>
          <p className="m-0 font-display text-[26px] font-semibold">Chưa có món yêu thích</p>
          <p className="m-0 max-w-[420px] text-[15px] text-muted">Bấm biểu tượng trái tim trên món bạn thích để lưu lại đây.</p>
          <Link href="/thuc-don" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-maroon px-6 font-semibold text-cream no-underline hover:bg-accent hover:text-cream">Xem thực đơn <ArrowRightIcon /></Link>
        </div>
      ) : (
        <div ref={gridRef} className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
          {list.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
