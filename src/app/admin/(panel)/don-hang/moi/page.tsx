import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeftIcon } from "@/components/admin/admin-icons";
import { OrderForm } from "@/components/admin/order-form";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/modules/admin/session";
import { productsRepository } from "@/modules/products/repository";
import { categoriesRepository } from "@/modules/categories/repository";

export const metadata: Metadata = { title: "Tạo đơn" };

export default async function AdminNewOrderPage() {
  await requireAdmin();
  const products = (await productsRepository.listAll()).filter((p) => p.isActive !== false);
  return (
    <>
      <PageHeader
        back={<Link href="/admin/don-hang" className="inline-flex min-h-9 items-center gap-1 self-start text-[14px] font-semibold text-muted no-underline hover:text-maroon"><ChevronLeftIcon size={16} /> Đơn hàng</Link>}
        title="Tạo đơn"
        description="Cho khách đặt qua điện thoại, Zalo hoặc tại quầy. Giá do máy chủ tính theo thực đơn hiện tại."
      />
      <OrderForm products={products} categories={await categoriesRepository.list("product")} />
    </>
  );
}
