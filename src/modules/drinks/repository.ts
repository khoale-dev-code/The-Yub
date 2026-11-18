import { unstable_cache } from "next/cache";
import { demoRecipes } from "@/modules/recipes/demo-store";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { drinks as seedDrinks } from "@/modules/products/data";
import type { Drink, DrinkGroup } from "@/modules/products/types";

/**
 * Do uong – 2 nguon nhu san pham:
 *  - chua cau hinh Supabase: du lieu seed (sua trong Admin che do xem thu chi luu tam);
 *  - da cau hinh: bang `drinks` (migration 0004).
 */
export const DRINKS_TAG = "drinks";

export interface DrinkWrite {
  name: string;
  description: string;
  group: DrinkGroup;
  temps: ("hot" | "ice")[];
  priceMVnd: number;
  priceLVnd: number | null;
  isActive: boolean;
  soldOut: boolean;
}

function localStore(): Drink[] {
  const g = globalThis as typeof globalThis & { __yubDrinks?: Drink[] };
  g.__yubDrinks ??= seedDrinks.map((d) => ({ ...d, isActive: true, soldOut: false }));
  return g.__yubDrinks;
}

interface Row {
  id: string;
  name: string;
  description: string;
  drink_group: DrinkGroup;
  temps: ("hot" | "ice")[] | null;
  price_m_vnd: number;
  price_l_vnd: number | null;
  is_active: boolean;
  sold_out: boolean;
}

const fromRow = (r: Row): Drink => ({
  id: r.id,
  name: r.name,
  description: r.description,
  group: r.drink_group,
  temps: r.temps?.length ? r.temps : ["ice"],
  priceMVnd: r.price_m_vnd,
  priceLVnd: r.price_l_vnd,
  isActive: r.is_active,
  soldOut: r.sold_out,
});

const toSlug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);

async function listAll(): Promise<Drink[]> {
  const db = getSupabaseAdmin();
  if (!db) return localStore().map((d) => ({ ...d }));
  const { data, error } = await db
    .from("drinks")
    .select("id, name, description, drink_group, temps, price_m_vnd, price_l_vnd, is_active, sold_out")
    .order("sort_order")
    .order("name");
  if (error) throw new Error(`Không đọc được đồ uống (${error.code}).`);
  return (data as Row[]).map(fromRow);
}

const supabaseCached = unstable_cache(listAll, ["yub-drinks"], { tags: [DRINKS_TAG], revalidate: 600 });

export const drinksRepository = {
  /** Thuc don tren web (bo mon dang an) */
  async list(): Promise<Drink[]> {
    const all = getSupabaseAdmin() ? await supabaseCached() : await listAll();
    return all.filter((d) => d.isActive !== false);
  },

  /** Admin: ca mon dang an, doc moi */
  listAll,

  async remove(id: string): Promise<void> {
    const db = getSupabaseAdmin();
    if (!db) {
      const store = localStore();
      const idx = store.findIndex((d) => d.id === id);
      if (demoRecipes().has(`do-uong/${id}`)) throw new Error("Hãy xóa công thức của đồ uống trước khi xóa món.");
      if (idx >= 0) store.splice(idx, 1);
      return;
    }
    const { error } = await db.from("drinks").delete().eq("id", id);
    if (error?.code === "23503" || error?.code === "23001") throw new Error("Đồ uống đang được sử dụng. Kiểm tra và xóa công thức trước khi xóa món.");
    if (error) throw new Error(`Không xoá được đồ uống (${error.code}).`);
  },

  /** Tao moi (id = null) hoac cap nhat; tra ve id */
  async save(id: string | null, input: DrinkWrite): Promise<string> {
    const db = getSupabaseAdmin();
    const existing = await listAll();
    let newId = id;
    if (!newId) {
      const base = `d-${toSlug(input.name) || "mon"}`;
      newId = base;
      for (let i = 2; existing.some((d) => d.id === newId); i++) newId = `${base}-${i}`;
    } else if (!existing.some((d) => d.id === newId)) {
      throw new Error("Không tìm thấy đồ uống.");
    }
    if (!db) {
      const store = localStore();
      const data: Drink = { id: newId, ...input };
      const idx = store.findIndex((d) => d.id === newId);
      if (idx >= 0) store[idx] = data;
      else store.push(data);
      return newId;
    }
    const row = {
      id: newId,
      name: input.name,
      description: input.description,
      drink_group: input.group,
      temps: input.temps,
      price_m_vnd: input.priceMVnd,
      price_l_vnd: input.priceLVnd,
      is_active: input.isActive,
      sold_out: input.soldOut,
      ...(id ? {} : { sort_order: (existing.length + 1) * 10 }),
    };
    const { error } = await db.from("drinks").upsert(row, { onConflict: "id" });
    if (error) throw new Error(`Không lưu được đồ uống (${error.code}).`);
    return newId;
  },
};
