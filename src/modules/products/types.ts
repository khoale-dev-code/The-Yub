import type { ProductImageKey } from "@/lib/images";

export type ProductCategory = "croissant" | "tart" | "cake" | "cookie" | "combo";

export type ProductStatus = "ready" | "oven" | "pre" | "out";

export interface ProductVariant {
  id: string;
  label: string;
  priceVnd: number;
}

export interface ProductDetails {
  /** 3 diem noi bat – khoi "Vi sao ban se thich" */
  highlights: { title: string; text: string; image: ProductImageKey }[];
  ingredients: string;
  allergens: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  /** Mo ta ngan cho the san pham (neu khac mo ta day du) */
  tagline?: string;
  category: ProductCategory;
  status: ProductStatus;
  /** Gia mau de demo – gia chinh thuc do chu tiem cau hinh */
  priceVnd: number;
  /** Gia le khi mua rieng (chi dung cho combo) */
  compareAtVnd?: number;
  image: ProductImageKey;
  /** object-position cho anh cover */
  imagePosition?: string;
  gallery?: ProductImageKey[];
  /** Quy cach (1 cai / hop 4 / hop 6). Khong co = ban le 1 phan */
  variants?: ProductVariant[];
  details?: ProductDetails;
  /** false = an khoi web (chi Admin thay). Mac dinh true */
  isActive?: boolean;
}

export const productCategories: ProductCategory[] = ["croissant", "tart", "cake", "cookie", "combo"];

export const productStatusLabels: Record<ProductStatus, string> = {
  ready: "Có sẵn",
  oven: "Ra lò 14:30",
  pre: "Đặt trước 1 ngày",
  out: "Hết hôm nay",
};

export const categoryLabels: Record<ProductCategory, string> = {
  croissant: "Croissant",
  tart: "Tart",
  cake: "Bánh kem & bánh ngọt",
  cookie: "Cookie",
  combo: "Combo",
};

export type DrinkGroup = "coffee" | "tea" | "other" | "juice";

export interface Drink {
  id: string;
  name: string;
  /** Mo ta ngan – vd "Đậm vị, hậu đắng nhẹ." */
  description: string;
  temps: ("hot" | "ice")[];
  group: DrinkGroup;
  priceMVnd: number;
  /** null = chi co size M (mon nong) */
  priceLVnd: number | null;
  /** false = an khoi web (chi Admin thay). Mac dinh true */
  isActive?: boolean;
  /** true = tam het hom nay (van hien tren thuc don, gach mo) */
  soldOut?: boolean;
}

export const drinkGroups: DrinkGroup[] = ["coffee", "tea", "other", "juice"];

export const drinkGroupLabels: Record<DrinkGroup, string> = {
  coffee: "Cà phê",
  tea: "Trà & trái cây",
  other: "Không cà phê",
  juice: "Nước ép & sinh tố",
};
