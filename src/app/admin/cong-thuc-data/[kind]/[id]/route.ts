import { getAdminUser } from "@/modules/admin/session";
import { readItem, RecipeError } from "@/modules/recipes/repository";
import { isRecipeKind } from "@/modules/recipes/types";

export const dynamic = "force-dynamic";

const reply = (body: object, status = 200) => Response.json(body, {
  status, headers: { "Cache-Control": "private, no-store", Vary: "Cookie" },
});

export async function GET(_request: Request, { params }: { params: Promise<{ kind: string; id: string }> }) {
  const user = await getAdminUser();
  if (!user) return reply({ error: "Phiên quản lý đã hết. Hãy đăng nhập lại." }, 403);
  const { kind, id } = await params;
  if (!isRecipeKind(kind)) return reply({ error: "Nhóm món không tồn tại." }, 404);
  try {
    const item = await readItem(user, kind, id);
    return item ? reply({ recipe: item.recipe }) : reply({ error: "Không tìm thấy món." }, 404);
  } catch (error) {
    return reply({ error: error instanceof RecipeError ? error.message : "Chưa đọc được công thức." }, 503);
  }
}
