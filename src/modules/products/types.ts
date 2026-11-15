import type { ProductImageKey } from "@/lib/images";

/** Ma danh muc banh (Admin > Danh muc) – vd "croissant", "combo" */
export type ProductCategory = string;

export type ProductStatus = "ready" | "oven" | "pre" | "out";

export interface ProductVariant {
  id: string;
  label: string;
  priceVnd: number;
}

export interface ProductDetails {
  /** 3 diem noi bat – khoi "Vi sao ban se thich". src (neu co) uu tien hon image */
  highlights: { title: string; text: string; image?: ProductImageKey; src?: string }[];
  ingredients: string;
  allergens: string;
}

export type MediaKind = "image" | "video";

/** Anh / video cua mon – thu tu = thu tu hien thi, anh dau tien la anh bia */
export interface ProductMedia {
  kind: MediaKind;
  /** Gia tri luu trong DB: "products/<uuid>.webp" (tai len) hoac "lib:<key>" (anh mau cu cua web) */
  ref: string;
  /** URL hien thi (Supabase Storage / /media/... / /images/...) */
  src: string;
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
  /** Anh mau cu (truoc khi co tai anh len) – chi dung de doc du lieu cu */
  image?: ProductImageKey;
  /** object-position cho anh bia */
  imagePosition?: string;
  gallery?: ProductImageKey[];
  /** Anh / video da sap xep (tinh tu cot media, hoac tu image + gallery cu) */
  media: ProductMedia[];
  /** URL anh bia (anh dau tien trong media) – luon co gia tri, chua co anh thi la anh cho */
  cover: string;
  /** Quy cach (1 cai / hop 4 / hop 6). Khong co = ban le 1 phan */
  variants?: ProductVariant[];
  details?: ProductDetails;
  /** false = an khoi web (chi Admin thay). Mac dinh true */
  isActive?: boolean;
}

/** Nhan trang thai theo gio me banh hien tai (doi trong Admin > Cai dat) */
export const productStatusLabel = (s: ProductStatus, freshBatchTime: string) => (s === "oven" ? `Ra lò ${freshBatchTime}` : productStatusLabels[s]);

export const productStatusLabels: Record<ProductStatus, string> = {
  ready: "Có sẵn",
  oven: "Ra lò 14:30",
  pre: "Đặt trước 1 ngày",
  out: "Hết hôm nay",
};

/** Ma danh muc do uong (Admin > Danh muc) – vd "coffee", "tea" */
export type DrinkGroup = string;

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

