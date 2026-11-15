import { productImages, type ProductImageKey } from "@/lib/images";
import { kindOfRef, UPLOAD_REF_RE } from "@/lib/media-rules";
import { getSupabaseAdmin, supabaseUrl } from "@/lib/supabase/server";
import type { ProductMedia } from "./types";

/** Bucket Supabase Storage (cong khai, gioi han 7 MB – migration 0006) */
export const MEDIA_BUCKET = "product-media";

/** Anh cho khi mon chua co anh */
export const PLACEHOLDER_IMAGE = "/images/brand/placeholder-product.png";

const isLibKey = (k: string): k is ProductImageKey => k in productImages;

/** Ref hop le: anh tai len (products/<uuid>.<ext>) hoac anh mau cu (lib:<key>) */
export function isValidMediaRef(ref: string): boolean {
  if (ref.startsWith("lib:")) return isLibKey(ref.slice(4));
  return UPLOAD_REF_RE.test(ref);
}

/** Ref -> URL hien thi. Co Supabase: URL cong khai cua bucket; chay local: /media/... */
export function mediaSrc(ref: string): string {
  if (ref.startsWith("lib:")) {
    const key = ref.slice(4);
    return isLibKey(key) ? productImages[key] : PLACEHOLDER_IMAGE;
  }
  const base = getSupabaseAdmin() ? supabaseUrl() : null;
  return base ? `${base}/storage/v1/object/public/${MEDIA_BUCKET}/${ref}` : `/media/${ref}`;
}

export function toMedia(refs: string[]): ProductMedia[] {
  const out: ProductMedia[] = [];
  for (const ref of refs) {
    const kind = kindOfRef(ref);
    if (!kind || !isValidMediaRef(ref)) continue;
    out.push({ kind, ref, src: mediaSrc(ref) });
  }
  return out;
}

/** Du lieu cu (chua tung luu media): anh chinh + gallery mau */
export function legacyRefs(image: string | null | undefined, gallery: readonly string[] | null | undefined): string[] {
  const keys = [image, ...(gallery ?? [])].filter((k): k is string => Boolean(k && isLibKey(k)));
  return [...new Set(keys)].map((k) => `lib:${k}`);
}

export function coverOf(media: ProductMedia[]): string {
  return media.find((m) => m.kind === "image")?.src ?? PLACEHOLDER_IMAGE;
}

/** Xoa file da tai len khong con dung (anh mau lib: khong bao gio bi xoa). Loi bo qua – khong chan viec luu mon. */
export async function deleteUploads(refs: string[]): Promise<void> {
  const uploads = refs.filter((r) => UPLOAD_REF_RE.test(r));
  if (!uploads.length) return;
  const db = getSupabaseAdmin();
  if (db) {
    await db.storage.from(MEDIA_BUCKET).remove(uploads).catch(() => undefined);
    return;
  }
  const { removeLocalUploads } = await import("./media-local");
  await removeLocalUploads(uploads);
}
