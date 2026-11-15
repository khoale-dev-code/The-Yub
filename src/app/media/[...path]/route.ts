import type { NextRequest } from "next/server";
import { MIME_BY_EXT, UPLOAD_REF_RE } from "@/lib/media-rules";
import { readLocalUpload } from "@/modules/products/media-local";

/**
 * Phat file da tai len khi chay KHONG co Supabase (.data/uploads).
 * Ho tro Range de video tua duoc / phat duoc tren Safari.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const ref = (await params).path.join("/");
  if (!UPLOAD_REF_RE.test(ref)) return new Response("Not found", { status: 404 });
  const file = await readLocalUpload(ref);
  if (!file) return new Response("Not found", { status: 404 });

  const type = MIME_BY_EXT[ref.split(".").pop() ?? ""] ?? "application/octet-stream";
  const headers: Record<string, string> = {
    "Content-Type": type,
    "Accept-Ranges": "bytes",
    // Ten file la UUID moi -> noi dung khong bao gio doi
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  };

  const range = request.headers.get("range");
  const m = range ? /^bytes=(\d*)-(\d*)$/.exec(range) : null;
  if (m && (m[1] || m[2])) {
    let start = m[1] ? Number(m[1]) : file.size - Number(m[2]);
    let end = m[1] && m[2] ? Number(m[2]) : file.size - 1;
    start = Math.max(0, start);
    end = Math.min(end, file.size - 1);
    if (start > end) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${file.size}` } });
    return new Response(new Uint8Array(file.data.subarray(start, end + 1)), {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${file.size}`, "Content-Length": String(end - start + 1) },
    });
  }
  return new Response(new Uint8Array(file.data), { headers: { ...headers, "Content-Length": String(file.size) } });
}
