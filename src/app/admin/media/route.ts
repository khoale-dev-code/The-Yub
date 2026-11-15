import { NextResponse, type NextRequest } from "next/server";
import { IMAGE_SOURCE_MAX_BYTES, MEDIA_MAX_BYTES, MEDIA_TYPES, formatMb, sniffMime } from "@/lib/media-rules";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getAdminUser } from "@/modules/admin/session";
import { mediaSrc } from "@/modules/products/media";
import { saveLocalUpload } from "@/modules/products/media-local";

/**
 * Tai anh / video len khi CHUA cau hinh Supabase (luu vao .data/uploads).
 * Co Supabase: trinh duyet tai thang len Supabase Storage bang URL ky san (prepareMediaUploadAction).
 */
export async function POST(request: NextRequest) {
  if (!(await getAdminUser())) return NextResponse.json({ error: "Phiên đăng nhập đã hết – vui lòng đăng nhập lại." }, { status: 401 });
  if (getSupabaseAdmin()) return NextResponse.json({ error: "Đã dùng Supabase – tải lên qua Supabase Storage." }, { status: 400 });

  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > IMAGE_SOURCE_MAX_BYTES) return NextResponse.json({ error: "File quá lớn." }, { status: 413 });

  let file: FormDataEntryValue | null = null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return NextResponse.json({ error: "Không đọc được file." }, { status: 400 });
  }
  if (!(file instanceof File)) return NextResponse.json({ error: "Chưa chọn file." }, { status: 400 });
  if (file.size > MEDIA_MAX_BYTES) return NextResponse.json({ error: `File ${formatMb(file.size)} – tối đa ${formatMb(MEDIA_MAX_BYTES)}.` }, { status: 413 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = sniffMime(bytes);
  if (!mime) return NextResponse.json({ error: "Chỉ nhận ảnh JPG, PNG, WebP, AVIF hoặc video MP4, WebM, MOV." }, { status: 415 });

  const { ext, kind } = MEDIA_TYPES[mime];
  const ref = `products/${crypto.randomUUID()}.${ext}`;
  await saveLocalUpload(ref, bytes);
  return NextResponse.json({ ref, src: mediaSrc(ref), kind });
}
