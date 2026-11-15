import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeftIcon } from "@/components/admin/admin-icons";
import { ProductForm } from "@/components/admin/product-form";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/modules/admin/session";

export const metadata: Metadata = { title: "Thêm món" };

export default async function AdminProductNewPage() {
  await requireAdmin();
  return (
    <>
      <PageHeader
        back={<Link href="/admin/mon" className="inline-flex min-h-9 items-center gap-1 self-start text-[14px] font-semibold text-muted no-underline hover:text-maroon"><ChevronLeftIcon size={16} /> Món bánh</Link>}
        title="Thêm món mới"
        description="Giá do tiệm tự nhập – web chỉ hiển thị, đơn hàng luôn tính lại giá ở máy chủ."
      />
      <ProductForm product={null} />
    </>
  );
}
