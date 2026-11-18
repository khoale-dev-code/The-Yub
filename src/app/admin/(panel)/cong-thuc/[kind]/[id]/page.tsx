import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/modules/admin/session";
import { isRecipeKind, recipeHome } from "@/modules/recipes/types";

export default async function LegacyRecipePage({ params, searchParams }: {
  params: Promise<{ kind: string; id: string }>; searchParams: Promise<{ sua?: string }>;
}) {
  const user = await requireAdmin();
  const { kind, id } = await params;
  if (!isRecipeKind(kind)) notFound();
  const query = new URLSearchParams({ loai: kind, mon: id });
  if (user.role === "owner" && (await searchParams).sua === "1") query.set("sua", "1");
  redirect(`${recipeHome}?${query}`);
}
