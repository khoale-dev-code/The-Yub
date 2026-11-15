import { mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { UPLOAD_REF_RE } from "@/lib/media-rules";

/**
 * Luu file khi CHUA cau hinh Supabase (chay thu tren may): thu muc .data/uploads (khong dua len git).
 * Co Supabase thi file nam o Supabase Storage, khong dung file nay.
 */
export const LOCAL_UPLOAD_DIR = path.join(process.cwd(), ".data", "uploads");

function localPath(ref: string): string {
  if (!UPLOAD_REF_RE.test(ref)) throw new Error("Đường dẫn file không hợp lệ.");
  const full = path.join(LOCAL_UPLOAD_DIR, ref);
  if (!full.startsWith(LOCAL_UPLOAD_DIR + path.sep)) throw new Error("Đường dẫn file không hợp lệ.");
  return full;
}

export async function saveLocalUpload(ref: string, data: Uint8Array): Promise<void> {
  const full = localPath(ref);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, data, { flag: "wx" });
}

export async function readLocalUpload(ref: string): Promise<{ data: Buffer; size: number } | null> {
  try {
    const full = localPath(ref);
    const info = await stat(full);
    if (!info.isFile()) return null;
    return { data: await readFile(full), size: info.size };
  } catch {
    return null;
  }
}

export async function removeLocalUploads(refs: string[]): Promise<void> {
  await Promise.all(refs.map((r) => unlink(localPath(r)).catch(() => undefined)));
}
