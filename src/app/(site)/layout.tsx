import type { Metadata } from "next";
import "../globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { CartToast } from "@/components/layout/cart-toast";
import { MobileCartBar, type PriceMap } from "@/components/layout/mobile-cart-bar";
import { ScrollAnimations } from "@/components/motion/scroll-animations";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { CartProvider } from "@/modules/cart/cart-context";
import { productsRepository } from "@/modules/products/repository";

export const metadata: Metadata = {
  title: {
    default: "The Yub – Bakes & More | Nơi giòn rụm gặp thơm bơ",
    template: "%s | The Yub – Bakes & More",
  },
  description:
    "Tiệm bánh The Yub – croissant, tart, bánh kem và đồ uống. Bánh mới ra lò 14:30 mỗi ngày, đặt trước online và ghé tiệm nhận.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const products = await productsRepository.list();
  const prices: PriceMap = Object.fromEntries(
    products.map((p) => [
      p.id,
      { base: p.variants?.[0]?.priceVnd ?? p.priceVnd, variants: p.variants ? Object.fromEntries(p.variants.map((v) => [v.id, v.priceVnd])) : undefined },
    ]),
  );
  return (
    <html lang="vi">
      <body className="overflow-x-hidden bg-page font-sans text-base leading-[1.55] text-maroon antialiased">
        <SmoothScroll>
          <CartProvider>
            <SiteHeader />
            {children}
            <MobileCartBar prices={prices} />
            <CartToast />
          </CartProvider>
          <ScrollAnimations />
        </SmoothScroll>
      </body>
    </html>
  );
}
