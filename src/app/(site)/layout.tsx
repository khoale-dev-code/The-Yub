import type { Metadata } from "next";
import "../fonts";
import "../globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { CartToast } from "@/components/layout/cart-toast";
import {
  MobileCartBar,
  type PriceMap,
} from "@/components/layout/mobile-cart-bar";
import { PageTransition } from "@/components/motion/page-transition";
import { ScrollAnimations } from "@/components/motion/scroll-animations";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { CartProvider } from "@/modules/cart/cart-context";
import { CustomerProvider } from "@/modules/customers/customer-context";
import { StoreInfoProvider } from "@/components/brand/store-info-context";
import { drinksRepository, productsRepository } from "@/modules/products/repository";
import type { SearchItem } from "@/components/layout/search-panel";
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
  const [products, store, drinks] = await Promise.all([
    productsRepository.list(),
    getStoreInfo(),
    drinksRepository.list().catch(() => []),
  ]);
  // Du lieu gon cho o tim kiem tren thanh menu (tim ngay trong trinh duyet, khong goi lai server)
  const searchItems: SearchItem[] = [
    ...products.map((p) => ({ kind: "banh" as const, id: p.id, name: p.name, sub: p.tagline ?? p.description, priceVnd: p.variants?.[0]?.priceVnd ?? p.priceVnd, href: `/san-pham/${p.slug}`, img: p.cover })),
    ...drinks
      .filter((d) => d.isActive !== false)
      .map((d) => ({ kind: "nuoc" as const, id: d.id, name: d.name, sub: d.description, priceVnd: d.priceMVnd, href: `/do-uong#nuoc-${d.group}`, img: null })),
  ];
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
              <CustomerProvider>
                <SiteHeader searchItems={searchItems} />
                {children}
                <MobileCartBar prices={prices} />
                <CartToast />
              </CustomerProvider>
            </CartProvider>
            <ScrollAnimations />
            <PageTransition />
          </SmoothScroll>
        </StoreInfoProvider>
      </body>
    </html>
  );
}
