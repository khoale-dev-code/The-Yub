import type { Metadata } from "next";
import { RecipeBook } from "@/components/admin/recipe-book";
import { requireAdmin } from "@/modules/admin/session";
import { listItems, RecipeError } from "@/modules/recipes/repository";
import type { RecipeKind } from "@/modules/recipes/types";

export const metadata: Metadata = { title: "Sổ công thức" };

export default async function RecipesPage() {
  const user = await requireAdmin();
  async function group(kind: RecipeKind) {
    try {
      return { items: await listItems(user, kind), error: null };
    } catch (error) {
      return { items: [], error: error instanceof RecipeError ? error.message : "Chưa tải được thực đơn. Hãy thử lại." };
    }
  }
  const [cakes, drinks] = await Promise.all([group("banh"), group("do-uong")]);
  return <RecipeBook groups={{ banh: cakes, "do-uong": drinks }} owner={user.role === "owner"} />;
}
