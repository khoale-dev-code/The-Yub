import type { Product } from "./types";

/**
 * Don gia cua 1 phan san pham theo quy cach – nguon duy nhat cho ca
 * UI (hien thi) va server (tinh tien don). Tra ve null neu quy cach khong hop le.
 */
export function unitPriceOf(product: Product, variantId?: string): number | null {
  if (!product.variants || product.variants.length === 0) {
    return variantId ? null : product.priceVnd;
  }
  const variant = variantId
    ? product.variants.find((v) => v.id === variantId)
    : product.variants[0];
  return variant ? variant.priceVnd : null;
}

export function variantLabelOf(product: Product, variantId?: string): string | null {
  if (!variantId || !product.variants) return null;
  return product.variants.find((v) => v.id === variantId)?.label ?? null;
}
