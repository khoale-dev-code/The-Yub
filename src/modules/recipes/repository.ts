import { createSupabaseSessionClient } from "@/lib/supabase/ssr";
import type { AdminUser } from "@/modules/admin/session";
import { drinksRepository } from "@/modules/drinks/repository";
import { productsRepository } from "@/modules/products/repository";
import { demoRecipes } from "./demo-store";
import type { Recipe, RecipeFields, RecipeKind } from "./types";

export class RecipeError extends Error {}
const conflict = "Công thức đã thay đổi hoặc quyền quản lý đã đổi. Hãy mở lại món để xem bản mới.";
function checkDatabase(error: { code: string } | null) {
  if (!error) return;
  if (error.code === "23505") throw new RecipeError(conflict);
  if (error.code === "42501") throw new RecipeError("Tài khoản không có quyền thực hiện thao tác này.");
  if (error.code === "23503") throw new RecipeError("Món đã bị xóa. Hãy trở về danh sách.");
  if (["42P01", "PGRST200", "PGRST205"].includes(error.code)) {
    throw new RecipeError("Cần chạy 0009_admin_recipes.sql trong Supabase SQL Editor để mở sổ công thức.");
  }
  throw new RecipeError("Không thể truy cập sổ công thức. Vui lòng thử lại.");
}

async function sessionDb() {
  const db = await createSupabaseSessionClient();
  if (!db) throw new RecipeError("Không thể kết nối Supabase.");
  return db;
}

const demoMenu = (kind: RecipeKind) => kind === "banh" ? productsRepository.listAll() : drinksRepository.listAll();
type MenuRow<T> = { id: string; name: string; item_recipes: T | T[] | null };
function first<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

async function menuQuery(kind: RecipeKind, fields: string, id?: string) {
  const db = await sessionDb();
  let query = db.from(kind === "banh" ? "products" : "drinks").select(`id,name,item_recipes(${fields})`);
  if (kind === "banh") query = query.is("deleted_at", null);
  if (id !== undefined) query = query.eq("id", id);
  const result = await query.order("sort_order").order("name").order("id");
  checkDatabase(result.error);
  return result.data ?? [];
}

export async function listItems(user: AdminUser, kind: RecipeKind) {
  if (user.demo) {
    return (await demoMenu(kind)).map(({ id, name }) => ({ id, name, revision: demoRecipes().get(`${kind}/${id}`)?.revision ?? null }));
  }
  const rows = await menuQuery(kind, "revision") as unknown as MenuRow<{ revision: string }>[];
  return rows.map(({ id, name, item_recipes }) => ({ id, name, revision: first(item_recipes)?.revision ?? null }));
}

export async function readItem(user: AdminUser, kind: RecipeKind, id: string) {
  if (user.demo) {
    const item = (await demoMenu(kind)).find((dish) => dish.id === id);
    return item ? { name: item.name, recipe: demoRecipes().get(`${kind}/${id}`) ?? null } : null;
  }
  if (kind === "banh" && !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) return null;
  const rows = await menuQuery(kind, "revision,batch,ingredients,steps,notes", id) as unknown as MenuRow<Recipe>[];
  const row = rows[0];
  return row ? { name: row.name, recipe: first(row.item_recipes) } : null;
}

export async function writeRecipe(user: AdminUser, kind: RecipeKind, id: string, revision: string | null, fields: RecipeFields | null) {
  if (user.role !== "owner") throw new RecipeError("Chỉ chủ tiệm mới được thay đổi công thức.");
  if (!fields && !revision) throw new RecipeError("Món chưa có công thức để xóa.");
  if (user.demo) {
    if (!(await demoMenu(kind)).some((item) => item.id === id)) throw new RecipeError("Không tìm thấy món.");
    const store = demoRecipes();
    const key = `${kind}/${id}`;
    if ((store.get(key)?.revision ?? null) !== revision) throw new RecipeError(conflict);
    if (fields) store.set(key, { ...fields, revision: crypto.randomUUID() });
    else store.delete(key);
    return;
  }
  const table = (await sessionDb()).from("item_recipes");
  const column = kind === "banh" ? "product_id" : "drink_id";
  if (!revision && fields) {
    const { error } = await table.insert({ [column]: id, ...fields });
    checkDatabase(error);
    return;
  }
  const query = fields ? table.update(fields) : table.delete();
  const { data, error } = await query.eq(column, id).eq("revision", revision).select("revision").maybeSingle();
  checkDatabase(error);
  if (!data) throw new RecipeError(conflict);
}
