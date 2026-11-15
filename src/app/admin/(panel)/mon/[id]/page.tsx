import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeftIcon, ExternalIcon } from "@/components/admin/admin-icons";
import { ProductForm } from "@/components/admin/product-form";
import { PageHeader, btn } from "@/components/admin/ui";
import { requireAdmin } from "@/modules/admin/session";
import { productsRepository } from "@/modules/products/repository";

export const metadata: Metadata = { title: "Sửa món" };

export default async function AdminProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  const { id } = await params;
  const product = await productsRepository.findById(decodeURIComponent(id));
  if (!product) notFound();
  return (
    <>
      <PageHeader
        back={<Link href="/admin/mon" className="inline-flex min-h-9 items-center gap-1 self-start text-[14px] font-semibold text-muted no-underline hover:text-maroon"><ChevronLeftIcon size={16} /> Món bánh</Link>}
        title={product.name}
        actions={product.isActive !== false ? <Link href={`/san-pham/${product.slug}`} prefetch={false} target="_blank" className={btn.secondary}><ExternalIcon size={16} /> Xem trên web</Link> : undefined}
      />
      <ProductForm product={product} canDelete={user.role === "owner"} />
    </>
  );
}
