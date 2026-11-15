import { unstable_cache } from "next/cache";
import { productImages, type ProductImageKey } from "@/lib/images";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { products as seedProducts } from "./data";
import type { Product, ProductCategory, ProductDetails, ProductStatus, ProductVariant } from "./types";

/**
 * Data Access Layer cho san pham – 2 nguon, cung interface:
 *  - Chua cau hinh Supabase: du lieu seed local (sua trong Admin che do xem thu chi luu tam trong bo nho).
 *  - Da cau hinh: bang products / product_variants (Admin sua -> web cap nhat qua revalidateTag("products")).
 */
export const PRODUCTS_TAG = "products";

/** Du lieu ghi tu Admin (da validate bang Zod o action) */
export interface ProductWrite {
  slug: string;
  name: string;
  description: string;
  tagline: string | null;
  category: ProductCategory;
  priceVnd: number;
  compareAtVnd: number | null;
  status: ProductStatus;
  image: ProductImageKey;
  imagePosition: string | null;
  isActive: boolean;
  variants: ProductVariant[];
}

export type ProductPatch = Partial<Pick<ProductWrite, "status" | "isActive" | "priceVnd">>;

interface ProductsSource {
  listAll(): Promise<Product[]>;
  remove(id: string): Promise<void>;
  update(id: string, patch: ProductPatch): Promise<void>;
  save(id: string | null, input: ProductWrite): Promise<string>;
}

// ---------------------------------------------------------------- local
function localStore(): Product[] {
  const g = globalThis as typeof globalThis & { __yubProducts?: Product[] };
  g.__yubProducts ??= seedProducts.map((p) => ({ ...p, isActive: true }));
  return g.__yubProducts;
}

const localSource: ProductsSource = {
  async listAll() {
    return localStore().map((p) => ({ ...p }));
  },
  async remove(id) {
    const store = localStore();
    const idx = store.findIndex((p) => p.id === id);
    if (idx < 0) throw new Error("Không tìm thấy món.");
    store.splice(idx, 1);
  },
  async update(id, patch) {
    const p = localStore().find((x) => x.id === id);
    if (!p) throw new Error("Không tìm thấy món.");
    Object.assign(p, patch);
  },
  async save(id, input) {
    const store = localStore();
    if (store.some((p) => p.slug === input.slug && p.id !== id)) throw new Error("Đường dẫn (slug) đã có món khác dùng.");
    const data: Product = {
      id: id ?? `p-${input.slug}`,
      slug: input.slug,
      name: input.name,
      description: input.description,
      tagline: input.tagline ?? undefined,
      category: input.category,
      status: input.status,
      priceVnd: input.variants[0]?.priceVnd ?? input.priceVnd,
      compareAtVnd: input.compareAtVnd ?? undefined,
      image: input.image,
      imagePosition: input.imagePosition ?? undefined,
      variants: input.variants.length ? input.variants : undefined,
      isActive: input.isActive,
    };
    const existing = id ? store.find((p) => p.id === id) : undefined;
    if (existing) Object.assign(existing, { ...data, gallery: existing.gallery, details: existing.details });
    else store.push(data);
    return data.id;
  },
};

// ---------------------------------------------------------------- supabase
interface ProductRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  tagline: string | null;
  price_vnd: number;
  compare_at_vnd: number | null;
  status: ProductStatus;
  image_path: string | null;
  image_position: string | null;
  gallery: string[] | null;
  details: ProductDetails | null;
  is_active: boolean;
  sort_order: number;
  categories: { slug: string } | { slug: string }[] | null;
  product_variants: { id: string; label: string; price_vnd: number; sort_order: number; is_active: boolean }[] | null;
}

const PRODUCT_SELECT =
  "id, slug, name, description, tagline, price_vnd, compare_at_vnd, status, image_path, image_position, gallery, details, is_active, sort_order, categories(slug), product_variants(id, label, price_vnd, sort_order, is_active)";

const isImageKey = (v: string | null | undefined): v is ProductImageKey => Boolean(v && v in productImages);

function fromRow(r: ProductRow): Product {
  const cat = Array.isArray(r.categories) ? r.categories[0] : r.categories;
  const variants = (r.product_variants ?? [])
    .filter((v) => v.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((v) => ({ id: v.id, label: v.label, priceVnd: v.price_vnd }));
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description,
    tagline: r.tagline ?? undefined,
    category: (cat?.slug ?? "cake") as ProductCategory,
    status: r.status,
    priceVnd: r.price_vnd,
    compareAtVnd: r.compare_at_vnd ?? undefined,
    image: isImageKey(r.image_path) ? r.image_path : "cubeStack",
    imagePosition: r.image_position ?? undefined,
    gallery: (r.gallery ?? []).filter(isImageKey),
    variants: variants.length ? variants : undefined,
    details: r.details ?? undefined,
    isActive: r.is_active,
  };
}

function supabaseSource(): ProductsSource | null {
  const db = getSupabaseAdmin();
  if (!db) return null;
  return {
    async listAll() {
      const { data, error } = await db.from("products").select(PRODUCT_SELECT).is("deleted_at", null).order("sort_order").order("name");
      if (error) throw new Error(`Không đọc được danh sách món (${error.code}).`);
      return (data as unknown as ProductRow[]).map(fromRow);
    },
    async remove(id) {
      // Xoa mem: don cu van giu ten mon (name_snapshot); mon bien mat khoi web va Admin
      const { error } = await db.from("products").update({ deleted_at: new Date().toISOString(), is_active: false }).eq("id", id);
      if (error) throw new Error(`Không xoá được món (${error.code}).`);
    },
    async update(id, patch) {
      const row: Record<string, unknown> = {};
      if (patch.status) row.status = patch.status;
      if (patch.isActive !== undefined) row.is_active = patch.isActive;
      if (patch.priceVnd !== undefined) row.price_vnd = patch.priceVnd;
      const { error } = await db.from("products").update(row).eq("id", id);
      if (error) throw new Error(`Không lưu được (${error.code}).`);
    },
    async save(id, input) {
      const { data: cat, error: catErr } = await db.from("categories").select("id").eq("slug", input.category).single();
      if (catErr || !cat) throw new Error("Không tìm thấy loại bánh.");
      const row = {
        slug: input.slug,
        name: input.name,
        description: input.description,
        tagline: input.tagline,
        category_id: cat.id,
        price_vnd: input.variants[0]?.priceVnd ?? input.priceVnd,
        compare_at_vnd: input.compareAtVnd,
        status: input.status,
        image_path: input.image,
        image_position: input.imagePosition,
        is_active: input.isActive,
      };
      const res = id
        ? await db.from("products").update(row).eq("id", id).select("id").single()
        : await db.from("products").insert(row).select("id").single();
      if (res.error) {
        if (res.error.code === "23505") throw new Error("Đường dẫn (slug) đã có món khác dùng.");
        throw new Error(`Không lưu được món (${res.error.code}).`);
      }
      const productId = (res.data as { id: string }).id;
      // Quy cach: xoa cai bi bo, ghi de cai con lai
      const keep = input.variants.map((v) => v.id);
      const del = db.from("product_variants").delete().eq("product_id", productId);
      const { error: delErr } = keep.length ? await del.not("id", "in", `(${keep.join(",")})`) : await del;
      if (delErr) throw new Error(`Không lưu được quy cách (${delErr.code}).`);
      if (input.variants.length) {
        const { error: upErr } = await db.from("product_variants").upsert(
          input.variants.map((v, i) => ({ product_id: productId, id: v.id, label: v.label, price_vnd: v.priceVnd, sort_order: i + 1, is_active: true })),
          { onConflict: "product_id,id" },
        );
        if (upErr) throw new Error(`Không lưu được quy cách (${upErr.code}).`);
      }
      return productId;
    },
  };
}

const source = (): ProductsSource => supabaseSource() ?? localSource;

/** Danh sach day du (ca mon dang an) – co cache, xoa cache bang revalidateTag(PRODUCTS_TAG) */
const supabaseListCached = unstable_cache(async () => source().listAll(), ["yub-products"], { tags: [PRODUCTS_TAG], revalidate: 600 });
// Du lieu local nam trong bo nho -> doc truc tiep (cache tren dia se lech sau khi khoi dong lai)
const listAllCached = () => (getSupabaseAdmin() ? supabaseListCached() : localSource.listAll());

export const productsRepository = {
  /** Mon dang ban tren web */
  async list(): Promise<Product[]> {
    return (await listAllCached()).filter((p) => p.isActive !== false);
  },

  /** Admin: ca mon dang an, doc moi (khong cache) */
  async listAll(): Promise<Product[]> {
    return source().listAll();
  },

  async findById(id: string): Promise<Product | null> {
    return (await source().listAll()).find((p) => p.id === id) ?? null;
  },

  async findBySlug(slug: string): Promise<Product | null> {
    return (await this.list()).find((p) => p.slug === slug) ?? null;
  },

  async findManyBySlugs(slugs: string[]): Promise<Product[]> {
    const all = await this.list();
    return slugs.map((slug) => all.find((p) => p.slug === slug)).filter((p): p is Product => p !== undefined);
  },

  /** Dung khi tao don: doc MOI tu nguon (khong dung cache) de tinh gia chinh xac */
  async findManyByIds(ids: string[]): Promise<Map<string, Product>> {
    const wanted = new Set(ids);
    const found = new Map<string, Product>();
    for (const p of await source().listAll()) {
      if (wanted.has(p.id) && p.isActive !== false) found.set(p.id, p);
    }
    return found;
  },

  update: (id: string, patch: ProductPatch) => source().update(id, patch),
  remove: (id: string) => source().remove(id),
  save: (id: string | null, input: ProductWrite) => source().save(id, input),
};

/** Do uong da tach sang src/modules/drinks – giu export cu de khong vo import */
export { drinksRepository } from "@/modules/drinks/repository";
