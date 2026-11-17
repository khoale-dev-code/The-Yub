"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import { useCart } from "@/modules/cart/cart-context";
import { announceCartAdd } from "@/modules/cart/cart-fx";
import { CartAddIcon, CheckIcon } from "./ui/icons";

interface AddToCartButtonProps {
  productId: string;
  productName: string;
  variantId?: string;
  /** outline: vien maroon (the banh) · filled: nen maroon (ban chay, combo) · butter: tren nen toi */
  tone?: "outline" | "filled" | "butter";
  size?: number;
  disabled?: boolean;
}

const toneCls = {
  outline: "border-[1.5px] border-maroon bg-transparent text-maroon hover:bg-maroon hover:text-cream",
  filled: "border-0 bg-maroon text-cream hover:bg-accent",
  butter: "border-0 bg-butter text-maroon hover:bg-cream",
} as const;

/** Nut icon gio hang (khong dung chu "Them vao gio") – phan hoi bang dau tick ngan. */
export function AddToCartButton({ productId, productName, variantId, tone = "outline", size = 46, disabled = false }: AddToCartButtonProps) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Hieu ung + dau tick hien ngay; cap nhat gio (ve lai header, thanh gio...) chay o muc uu tien thap
    // -> ngon tay bam xong thay phan hoi tuc thi, khong bi khung hinh dung tren dien thoai.
    announceCartAdd(e.currentTarget, { name: productName, qty: 1 });
    setAdded(true);
    startTransition(() => add(productId, 1, variantId));
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1400);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={disabled ? `${productName} đã hết hôm nay` : `Thêm ${productName} vào giỏ hàng`}
      className={`flex flex-none items-center justify-center rounded-full transition-colors active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${toneCls[tone]}`}
      style={{ width: size, height: size }}
    >
      {added ? <CheckIcon size={20} /> : <CartAddIcon size={size >= 48 ? 22 : size <= 40 ? 18 : 21} />}
      <span className="sr-only" aria-live="polite">{added ? "Đã thêm vào giỏ" : ""}</span>
    </button>
  );
}
