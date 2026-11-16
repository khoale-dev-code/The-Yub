"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/modules/cart/cart-context";
import { announceCartAdd } from "@/modules/cart/cart-fx";
import type { ReorderLine } from "@/modules/customers/reorder";
import { CartAddIcon } from "../ui/icons";

/** Mua lai: them cac mon con ban vao gio (gia tinh lai theo hien tai) roi mo gio hang. */
export function ReorderButton({ lines, size = "md", goToCart = true }: { lines: ReorderLine[]; size?: "sm" | "md"; goToCart?: boolean }) {
  const cart = useCart();
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const ok = lines.filter((l) => l.available);
  const missing = lines.length - ok.length;

  const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!ok.length) return setMsg("Các món trong đơn này hiện không còn bán.");
    for (const l of ok) cart.add(l.productId, l.qty, l.variantId);
    announceCartAdd(e.currentTarget, { name: ok.length === 1 ? (ok[0]?.name ?? "") : `${ok.length} món từ đơn cũ`, qty: ok.reduce((s, l) => s + l.qty, 0) });
    setMsg(missing ? `Đã thêm ${ok.length} món – ${missing} món không còn bán.` : null);
    if (goToCart) window.setTimeout(() => router.push("/gio-hang"), 900);
  };

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={!ok.length}
        className={`inline-flex items-center gap-2 rounded-full border-0 bg-maroon font-semibold text-cream transition-[background-color,transform] hover:bg-accent active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45 ${size === "sm" ? "min-h-10 px-4 text-[14px]" : "min-h-[52px] px-6 text-[15px]"}`}
      >
        <CartAddIcon size={size === "sm" ? 17 : 19} /> Mua lại
      </button>
      {msg && <span role="status" className="text-[12px] text-muted">{msg}</span>}
    </span>
  );
}
