import type { Metadata } from "next";
import "../fonts";
import "../globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { CartToast } from "@/components/layout/cart-toast";
import {
  MobileCartBar,
  type PriceMap,
} from "@/components/layout/mobile-cart-bar";
import { ScrollAnimations } from "@/components/motion/scroll-animations";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { CartProvider } from "@/modules/cart/cart-context";
import { StoreInfoProvider } from "@/components/brand/store-info-context";
import { productsRepository } from "@/modules/products/repository";
import { getStoreInfo } from "@/modules/settings/store-info-server";

export async function generateMetadata(): Promise<Metadata> {
  const store = await getStoreInfo();
  return {
    title: {
      default: `${store.name} | ${store.slogan}`,
      template: `%s | ${store.name}`,
    },
    description: `Tiệm bánh ${store.name} – croissant, tart, bánh kem và đồ uống. Bánh mới ra lò ${store.freshBatchTime} mỗi ngày, đặt trước online và ghé tiệm nhận.`,
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [products, store] = await Promise.all([
    productsRepository.list(),
    getStoreInfo(),
  ]);
  const prices: PriceMap = Object.fromEntries(
    products.map((p) => [
      p.id,
      {
        base: p.variants?.[0]?.priceVnd ?? p.priceVnd,
        variants: p.variants
          ? Object.fromEntries(p.variants.map((v) => [v.id, v.priceVnd]))
          : undefined,
      },
    ]),
  );
  return (
    <html lang="vi">
      <body className="overflow-x-hidden bg-page font-sans text-base leading-[1.55] text-maroon antialiased">
        <StoreInfoProvider value={store}>
          <SmoothScroll>
            <CartProvider>
              <SiteHeader />
              {children}
              <MobileCartBar prices={prices} />
              <CartToast />
            </CartProvider>
            <ScrollAnimations />
          </SmoothScroll>
        </StoreInfoProvider>
      </body>
    </html>
  );
}
