import type { Metadata } from "next";
import { FavoritesView } from "@/components/customer/favorites-view";
import { productsRepository } from "@/modules/products/repository";

export const metadata: Metadata = { title: "Món yêu thích", robots: { index: false } };

/** Trang tinh: danh sach mon (cache) – loc theo tim cua khach o trinh duyet. */
export default async function FavoritesPage() {
  const products = await productsRepository.list();
  return (
    <section className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 pb-20 pt-6 sm:px-6 md:pt-10">
      <div className="flex flex-col gap-2">
        <h1 className="m-0 font-display text-[40px] font-semibold leading-[1.05] tracking-[-0.02em] md:text-[56px]">Món yêu thích</h1>
        <p className="m-0 text-[16px] text-muted">Những món bạn đã thả tim – thêm vào giỏ chỉ một chạm.</p>
      </div>
      <FavoritesView products={products} />
    </section>
  );
}
