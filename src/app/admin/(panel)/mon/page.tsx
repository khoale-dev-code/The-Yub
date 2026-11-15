import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "@/components/admin/admin-icons";
import { ProductManager } from "@/components/admin/product-manager";
import { PageHeader, btn } from "@/components/admin/ui";
import { requireAdmin } from "@/modules/admin/session";
import { productsRepository } from "@/modules/products/repository";

export const metadata: Metadata = { title: "Món bánh" };

export default async function AdminProductsPage() {
  await requireAdmin();
  const products = await productsRepository.listAll();
  const selling = products.filter((p) => p.isActive !== false && p.status !== "out").length;
  const out = products.filter((p) => p.isActive !== false && p.status === "out").length;
  const hidden = products.filter((p) => p.isActive === false).length;

  return (
    <>
      <PageHeader
        title="Món bánh"
        description={`${selling} món đang bán · ${out} hết hôm nay · ${hidden} đang ẩn`}
        actions={
          <Link href="/admin/mon/moi" className={btn.primary}>
            <PlusIcon size={17} /> Thêm món
          </Link>
        }
      />
      <ProductManager products={products} />
    </>
  );
}
