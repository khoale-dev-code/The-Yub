import { unstable_cache } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { DEFAULT_CATEGORIES, toCategorySlug, type Category, type CategoryKind } from "./types";

export const CATEGORIES_TAG = "categories";

/** Loi Postgres "cot khong ton tai" – chua chay migration 0007 */
const MISSING_COLUMN = "42703";
const MIGRATION_HINT = "Chưa chạy supabase/migrations/0007_categories.sql – chạy trong Supabase SQL Editor rồi thử lại.";

const byOrder = (a: Category, b: Category) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "vi");

// ---------------------------------------------------------------- local (chua co Supabase)
function localStore(): Category[] {
  const g = globalThis as typeof globalThis & { __yubCategories?: Category[] };
  g.__yubCategories ??= DEFAULT_CATEGORIES.map((c) => ({ ...c }));
  return g.__yubCategories;
}

async function localUsage(slug: string, kind: CategoryKind): Promise<number> {
  if (kind === "product") {
    const { productsRepository } = await import("@/modules/products/repository");
    return (await productsRepository.listAll()).filter((p) => p.category === slug).length;
  }
  const { drinksRepository } = await import("@/modules/drinks/repository");
  return (await drinksRepository.listAll()).filter((d) => d.group === slug).length;
}

// ---------------------------------------------------------------- doc
interface Row {
  slug: string;
  name: string;
  sort_order: number;
  kind?: CategoryKind;
}

async function readAll(): Promise<Category[]> {
  const db = getSupabaseAdmin();
  if (!db) return localStore().map((c) => ({ ...c })).sort(byOrder);
  const first = await db.from("categories").select("slug, name, sort_order, kind").order("sort_order");
  if (first.error?.code === MISSING_COLUMN) {
    // Chua chay 0007: bang chi co danh muc banh; nhom do uong lay mac dinh
    const legacy = await db.from("categories").select("slug, name, sort_order").order("sort_order");
    if (legacy.error) throw new Error(`Không đọc được danh mục (${legacy.error.code}).`);
    const products = (legacy.data as Row[]).map((r) => ({ slug: r.slug, name: r.name, sortOrder: r.sort_order, kind: "product" as const }));
    return [...products, ...DEFAULT_CATEGORIES.filter((c) => c.kind === "drink")].sort(byOrder);
  }
  if (first.error) throw new Error(`Không đọc được danh mục (${first.error.code}).`);
  return (first.data as Row[]).map((r) => ({ slug: r.slug, name: r.name, sortOrder: r.sort_order, kind: r.kind ?? "product" })).sort(byOrder);
}

const readCachedSupabase = unstable_cache(readAll, ["yub-categories"], { tags: [CATEGORIES_TAG], revalidate: 600 });
const readCached = () => (getSupabaseAdmin() ? readCachedSupabase() : readAll());

// ---------------------------------------------------------------- ghi
async function uniqueSlug(name: string, taken: Set<string>): Promise<string> {
  const base = toCategorySlug(name) || "danh-muc";
  let slug = base;
  for (let i = 2; taken.has(slug); i++) slug = `${base.slice(0, 46)}-${i}`;
  return slug;
}

export const categoriesRepository = {
  /** Cho web (co cache) */
  async list(kind: CategoryKind): Promise<Category[]> {
    return (await readCached()).filter((c) => c.kind === kind);
  },
  /** Cho Admin (doc moi) */
  async listFresh(kind?: CategoryKind): Promise<Category[]> {
    const all = await readAll();
    return kind ? all.filter((c) => c.kind === kind) : all;
  },
  async exists(slug: string, kind: CategoryKind): Promise<boolean> {
    return (await readAll()).some((c) => c.slug === slug && c.kind === kind);
  },

  async create(kind: CategoryKind, name: string): Promise<Category> {
    const all = await readAll();
    if (all.some((c) => c.kind === kind && c.name.toLocaleLowerCase("vi") === name.toLocaleLowerCase("vi"))) throw new Error("Đã có danh mục cùng tên.");
    const slug = await uniqueSlug(name, new Set(all.map((c) => c.slug)));
    const sortOrder = Math.max(0, ...all.filter((c) => c.kind === kind).map((c) => c.sortOrder)) + 1;
    const cat: Category = { slug, name, kind, sortOrder };
    const db = getSupabaseAdmin();
    if (!db) {
      localStore().push(cat);
      return cat;
    }
    const { error } = await db.from("categories").insert({ slug, name, kind, sort_order: sortOrder });
    if (error?.code === MISSING_COLUMN || error?.code === "PGRST204") throw new Error(MIGRATION_HINT);
    if (error?.code === "23505") throw new Error("Mã danh mục bị trùng – thử tên khác.");
    if (error) throw new Error(`Không thêm được danh mục (${error.code}).`);
    return cat;
  },

  async rename(slug: string, name: string): Promise<void> {
    const all = await readAll();
    const cat = all.find((c) => c.slug === slug);
    if (!cat) throw new Error("Không tìm thấy danh mục.");
    if (all.some((c) => c.kind === cat.kind && c.slug !== slug && c.name.toLocaleLowerCase("vi") === name.toLocaleLowerCase("vi"))) throw new Error("Đã có danh mục cùng tên.");
    const db = getSupabaseAdmin();
    if (!db) {
      const c = localStore().find((x) => x.slug === slug);
      if (c) c.name = name;
      return;
    }
    const { error } = await db.from("categories").update({ name }).eq("slug", slug);
    if (error) throw new Error(`Không đổi được tên (${error.code}).`);
  },

  /** Ghi lai thu tu theo danh sach ma (cung loai) */
  async reorder(kind: CategoryKind, slugs: string[]): Promise<void> {
    const all = (await readAll()).filter((c) => c.kind === kind);
    if (slugs.length !== all.length || !all.every((c) => slugs.includes(c.slug))) throw new Error("Danh sách đã thay đổi – tải lại trang.");
    const db = getSupabaseAdmin();
    if (!db) {
      for (const c of localStore()) if (c.kind === kind) c.sortOrder = slugs.indexOf(c.slug) + 1;
      return;
    }
    for (const [i, slug] of slugs.entries()) {
      const { error } = await db.from("categories").update({ sort_order: i + 1 }).eq("slug", slug);
      if (error) throw new Error(`Không lưu được thứ tự (${error.code}).`);
    }
  },

  /** So mon / do uong dang thuoc danh muc (khong tinh mon da xoa) */
  async usage(slug: string, kind: CategoryKind): Promise<number> {
    const db = getSupabaseAdmin();
    if (!db) return localUsage(slug, kind);
    if (kind === "drink") {
      const { count, error } = await db.from("drinks").select("id", { count: "exact", head: true }).eq("drink_group", slug);
      if (error) throw new Error(`Không kiểm tra được (${error.code}).`);
      return count ?? 0;
    }
    const { data: cat } = await db.from("categories").select("id").eq("slug", slug).maybeSingle();
    if (!cat) return 0;
    const { count, error } = await db.from("products").select("id", { count: "exact", head: true }).eq("category_id", (cat as { id: string }).id).is("deleted_at", null);
    if (error) throw new Error(`Không kiểm tra được (${error.code}).`);
    return count ?? 0;
  },

  /** Chi xoa duoc danh muc trong; phai con it nhat 1 danh muc moi loai */
  async remove(slug: string): Promise<void> {
    const all = await readAll();
    const cat = all.find((c) => c.slug === slug);
    if (!cat) throw new Error("Không tìm thấy danh mục.");
    const same = all.filter((c) => c.kind === cat.kind && c.slug !== slug);
    if (!same.length) throw new Error("Phải còn ít nhất 1 danh mục.");
    const used = await this.usage(slug, cat.kind);
    if (used > 0) throw new Error(`Còn ${used} ${cat.kind === "drink" ? "đồ uống" : "món"} trong danh mục – chuyển sang danh mục khác trước khi xoá.`);
    const db = getSupabaseAdmin();
    if (!db) {
      const store = localStore();
      store.splice(store.findIndex((c) => c.slug === slug), 1);
      return;
    }
    if (cat.kind === "product") {
      // Mon da xoa (xoa mem) van tro toi danh muc -> chuyen sang danh muc dau tien con lai
      const { data: ids } = await db.from("categories").select("id, slug").in("slug", [slug, same[0]!.slug]);
      const rows = (ids ?? []) as { id: string; slug: string }[];
      const from = rows.find((r) => r.slug === slug)?.id;
      const to = rows.find((r) => r.slug === same[0]!.slug)?.id;
      if (from && to) await db.from("products").update({ category_id: to }).eq("category_id", from).not("deleted_at", "is", null);
    }
    const { error } = await db.from("categories").delete().eq("slug", slug);
    if (error?.code === "23503") throw new Error("Danh mục vẫn còn món – chuyển món sang danh mục khác trước.");
    if (error) throw new Error(`Không xoá được danh mục (${error.code}).`);
  },
};
