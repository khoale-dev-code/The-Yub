/** Danh muc banh / do uong – chu tiem tu them, doi ten, sap xep trong Admin > Danh muc */
export type CategoryKind = "product" | "drink";

export interface Category {
  /** Ma co dinh (khong doi khi doi ten) – vd "croissant", "tra-sua" */
  slug: string;
  name: string;
  kind: CategoryKind;
  sortOrder: number;
}

export const CATEGORY_KIND_LABEL: Record<CategoryKind, string> = { product: "Bánh", drink: "Đồ uống" };

/** Danh muc ban dau (giong du lieu cu) – dung khi chua co Supabase hoac chua chay migration 0007 */
export const DEFAULT_CATEGORIES: Category[] = [
  { slug: "croissant", name: "Croissant", kind: "product", sortOrder: 1 },
  { slug: "tart", name: "Tart", kind: "product", sortOrder: 2 },
  { slug: "cake", name: "Bánh kem & bánh ngọt", kind: "product", sortOrder: 3 },
  { slug: "cookie", name: "Cookie", kind: "product", sortOrder: 4 },
  { slug: "combo", name: "Combo", kind: "product", sortOrder: 5 },
  { slug: "coffee", name: "Cà phê", kind: "drink", sortOrder: 1 },
  { slug: "tea", name: "Trà & trái cây", kind: "drink", sortOrder: 2 },
  { slug: "other", name: "Không cà phê", kind: "drink", sortOrder: 3 },
  { slug: "juice", name: "Nước ép & sinh tố", kind: "drink", sortOrder: 4 },
];

/** Ten hien thi cua 1 ma danh muc (khong tim thay -> tra ve chinh ma) */
export const categoryName = (list: Category[], slug: string) => list.find((c) => c.slug === slug)?.name ?? slug;

export const toCategorySlug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)
    .replace(/-+$/g, "");
