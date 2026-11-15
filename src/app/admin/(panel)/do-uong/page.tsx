import type { Metadata } from "next";
import { DrinkManager } from "@/components/admin/drink-manager";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/modules/admin/session";
import { drinksRepository } from "@/modules/drinks/repository";
import { categoriesRepository } from "@/modules/categories/repository";

export const metadata: Metadata = { title: "Đồ uống" };

export default async function AdminDrinksPage() {
  const user = await requireAdmin();
  const drinks = await drinksRepository.listAll();
  const out = drinks.filter((d) => d.soldOut && d.isActive !== false).length;
  const hidden = drinks.filter((d) => d.isActive === false).length;
  return (
    <>
      <PageHeader title="Đồ uống" description={`${drinks.length - hidden} món trên thực đơn · ${out} tạm hết · ${hidden} đang ẩn`} />
      <DrinkManager drinks={drinks} groups={await categoriesRepository.listFresh("drink")} canDelete={user.role === "owner"} />
    </>
  );
}
