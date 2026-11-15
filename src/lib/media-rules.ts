/**
 * Quy tac tai anh / video cho mon (dung chung client + server).
 * Gioi han 7 MB moi file – khop voi gioi han cua bucket Supabase (migration 0006).
 */
export const MEDIA_MAX_BYTES = 7 * 1024 * 1024;
/** Anh goc truoc khi trinh duyet thu nho (anh dien thoai 10–20 MB van nhan) */
export const IMAGE_SOURCE_MAX_BYTES = 40 * 1024 * 1024;
export const MEDIA_MAX_ITEMS = 12;
/** Canh dai nhat sau khi thu nho */
export const IMAGE_MAX_EDGE = 1800;

export const MEDIA_TYPES = {
  "image/webp": { ext: "webp", kind: "image" },
  "image/jpeg": { ext: "jpg", kind: "image" },
  "image/png": { ext: "png", kind: "image" },
  "image/avif": { ext: "avif", kind: "image" },
  "video/mp4": { ext: "mp4", kind: "video" },
  "video/webm": { ext: "webm", kind: "video" },
  "video/quicktime": { ext: "mov", kind: "video" },
} as const;

export type MediaMime = keyof typeof MEDIA_TYPES;

export const isMediaMime = (v: string): v is MediaMime => v in MEDIA_TYPES;

export const MIME_BY_EXT: Record<string, MediaMime> = Object.fromEntries(
  Object.entries(MEDIA_TYPES).map(([mime, t]) => [t.ext, mime as MediaMime]),
);

/** Duong dan file da tai len: products/<uuid>.<ext> */
export const UPLOAD_REF_RE = /^products\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|jpg|png|avif|mp4|webm|mov)$/;

export const kindOfRef = (ref: string): "image" | "video" | null => {
  if (ref.startsWith("lib:")) return "image";
  const ext = ref.split(".").pop() ?? "";
  const mime = MIME_BY_EXT[ext];
  return mime ? MEDIA_TYPES[mime].kind : null;
};

export const formatMb = (bytes: number) => `${(bytes / 1024 / 1024).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} MB`;

/**
 * Nhan dien loai file theo noi dung (khong tin ten file / loai do trinh duyet bao).
 * Tra ve null neu khong phai anh / video duoc phep.
 */
export function sniffMime(b: Uint8Array): MediaMime | null {
  const ascii = (from: number, len: number) => String.fromCharCode(...b.subarray(from, from + len));
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && ascii(1, 3) === "PNG") return "image/png";
  if (ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") return "image/webp";
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return "video/webm";
  if (ascii(4, 4) === "ftyp") {
    const brand = ascii(8, 4);
    if (brand === "avif" || brand === "avis") return "image/avif";
    if (brand === "qt  ") return "video/quicktime";
    return "video/mp4";
  }
  return null;
}
