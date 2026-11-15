import type { Metadata } from "next";
import { CategoryManager } from "@/components/admin/category-manager";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/modules/admin/session";
import { categoriesRepository } from "@/modules/categories/repository";
import type { CategoryKind } from "@/modules/categories/types";
import { drinksRepository } from "@/modules/drinks/repository";
import { productsRepository } from "@/modules/products/repository";

export const metadata: Metadata = { title: "Danh mục" };

export default async function AdminCategoriesPage({ searchParams }: { searchParams: Promise<{ loai?: string }> }) {
  const user = await requireAdmin();
  const { loai } = await searchParams;
  const kind: CategoryKind = loai === "do-uong" ? "drink" : "product";
  const [categories, products, drinks] = await Promise.all([categoriesRepository.listFresh(), productsRepository.listAll(), drinksRepository.listAll()]);
  const counts: Record<string, number> = {};
  for (const p of products) counts[p.category] = (counts[p.category] ?? 0) + 1;
  for (const d of drinks) counts[d.group] = (counts[d.group] ?? 0) + 1;

  return (
    <>
      <PageHeader title="Danh mục" description="Nhóm bánh và đồ uống hiện trên thực đơn – thêm, đổi tên, sắp xếp thứ tự hiển thị." />
      <CategoryManager key={kind} kind={kind} categories={categories.filter((c) => c.kind === kind)} counts={counts} canDelete={user.role === "owner"} />
    </>
  );
}
