"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AdminAuthError, assertAdmin } from "@/modules/admin/session";
import { RecipeError, writeRecipe } from "./repository";
import { recipeHome, recipeLimits } from "./types";

const targetSchema = z.object({
  kind: z.enum(["banh", "do-uong"]),
  id: z.string().min(1).max(200),
  revision: z.string().uuid().nullable(),
  intent: z.enum(["save", "delete"]),
});
const fieldsSchema = z.object({
  batch: z.string().trim().min(1, "Nhập thành phẩm cho một lần làm.").max(recipeLimits.batch, "Phần thành phẩm quá dài."),
  ingredients: z.string().trim().min(1, "Nhập nguyên liệu và định lượng.").max(recipeLimits.ingredients, "Danh sách nguyên liệu quá dài."),
  steps: z.string().trim().min(1, "Nhập ít nhất một bước thực hiện.").max(recipeLimits.steps, "Phần cách làm quá dài."),
  notes: z.string().trim().max(recipeLimits.notes, "Ghi chú quá dài."),
});

export async function changeRecipe(target: unknown, form: FormData): Promise<string | null> {
  const parsed = targetSchema.safeParse(target);
  if (!parsed.success) return "Yêu cầu không hợp lệ. Hãy mở lại món.";
  const { kind, id, revision, intent } = parsed.data;
  try {
    const actor = await assertAdmin("owner");
    if (intent === "delete") {
      await writeRecipe(actor, kind, id, revision, null);
    } else {
      const result = fieldsSchema.safeParse(Object.fromEntries(form));
      if (!result.success) return result.error.issues[0]?.message ?? "Kiểm tra lại các ô vừa nhập.";
      await writeRecipe(actor, kind, id, revision, result.data);
    }
  } catch (err) {
    if (err instanceof RecipeError || err instanceof AdminAuthError) return err.message;
    return "Chưa thể xác nhận kết quả. Hãy tải lại món trước khi thử tiếp.";
  }
  revalidatePath(recipeHome, "layout");
  return null;
}
