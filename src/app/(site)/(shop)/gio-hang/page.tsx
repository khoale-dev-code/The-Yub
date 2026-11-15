import type { Metadata } from "next";
import { CartCheckout } from "@/components/cart/cart-checkout";
import { productsRepository } from "@/modules/products/repository";

export const metadata: Metadata = { title: "Giỏ hàng & đặt bánh" };

interface GioHangPageProps {
  searchParams: Promise<{ buoc?: string | string[] }>;
}

export default async function GioHangPage({ searchParams }: GioHangPageProps) {
  const [products, params] = await Promise.all([productsRepository.list(), searchParams]);
  // /gio-hang?buoc=thong-tin : tu trang Dat banh online vao thang buoc dien thong tin
  const initialStep = params.buoc === "thong-tin" ? 2 : 1;
  return <CartCheckout key={initialStep} products={products} initialStep={initialStep} />;
}
