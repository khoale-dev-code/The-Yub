"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import {
  IMAGE_MAX_EDGE,
  IMAGE_SOURCE_MAX_BYTES,
  MEDIA_MAX_BYTES,
  MEDIA_MAX_ITEMS,
  formatMb,
  isMediaMime,
  type MediaMime,
} from "@/lib/media-rules";
import { discardUploadsAction, prepareMediaUploadAction } from "@/modules/admin/actions";
import type { MediaKind, ProductMedia } from "@/modules/products/types";
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, XIcon } from "./admin-icons";
import { toast } from "./toast";

export interface MediaItem {
  key: string;
  kind: MediaKind;
  /** Co khi da tai len xong */
  ref?: string;
  /** URL hien thi: URL that hoac blob: (dang tai) */
  src: string;
  status: "uploading" | "done" | "error";
  progress: number;
  error?: string;
  /** Tai len trong lan sua nay (chua luu) – bo thi xoa luon file */
  fresh?: boolean;
}

export const toItems = (media: ProductMedia[]): MediaItem[] =>
  media.map((m) => ({ key: m.ref, kind: m.kind, ref: m.ref, src: m.src, status: "done", progress: 100 }));

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif,video/mp4,video/webm,video/quicktime";
const VIDEO_BY_EXT: Record<string, MediaMime> = { mp4: "video/mp4", m4v: "video/mp4", webm: "video/webm", mov: "video/quicktime" };

class MediaError extends Error {}

/** Anh: thu nho canh dai <= 1800px va nen WebP (Safari cu khong nen duoc WebP -> JPEG). Anh nho, dung dinh dang -> giu nguyen. */
async function prepareImage(file: File): Promise<Blob> {
  if (file.size > IMAGE_SOURCE_MAX_BYTES) throw new MediaError(`Ảnh ${formatMb(file.size)} quá lớn.`);
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new MediaError(/hei[cf]/i.test(file.type + file.name) ? "Ảnh HEIC chưa đọc được trên trình duyệt này – xuất sang JPG rồi thử lại." : "Không đọc được ảnh này.");
  }
  const edge = Math.max(bitmap.width, bitmap.height);
  const keep = edge <= IMAGE_MAX_EDGE && file.size <= 1_500_000 && isMediaMime(file.type) && file.type.startsWith("image/");
  if (keep) {
    bitmap.close();
    return file;
  }
  const scale = Math.min(1, IMAGE_MAX_EDGE / edge);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new MediaError("Trình duyệt không xử lý được ảnh.");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const encode = (type: string, q: number) => new Promise<Blob | null>((ok) => canvas.toBlob(ok, type, q));
  let blob = await encode("image/webp", 0.86);
  if (!blob || blob.type !== "image/webp") blob = await encode("image/jpeg", 0.88);
  if (!blob) throw new MediaError("Không nén được ảnh.");
  return blob;
}

function videoMime(file: File): MediaMime | null {
  if (isMediaMime(file.type) && file.type.startsWith("video/")) return file.type;
  return VIDEO_BY_EXT[file.name.split(".").pop()?.toLowerCase() ?? ""] ?? null;
}

/** Tai bang XHR de co % tien do */
function send(method: "PUT" | "POST", url: string, body: FormData, headers: Record<string, string>, onProgress: (p: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve(xhr.responseText) : reject(new MediaError(readError(xhr.responseText, xhr.status))));
    xhr.onerror = () => reject(new MediaError("Mất kết nối khi tải lên – thử lại."));
    xhr.send(body);
  });
}

function readError(text: string, status: number): string {
  try {
    const j = JSON.parse(text) as { error?: string; message?: string };
    if (j.error && !/^[a-z_]+$/i.test(j.error)) return j.error;
    if (status === 413 || /size|large/i.test(j.message ?? "")) return `File quá lớn – tối đa ${formatMb(MEDIA_MAX_BYTES)}.`;
    if (/mime|type/i.test(j.message ?? "")) return "Loại file không được nhận.";
  } catch {
    // khong phai JSON
  }
  return `Tải lên lỗi (${status}) – thử lại.`;
}

async function upload(blob: Blob, mime: MediaMime, onProgress: (p: number) => void): Promise<{ ref: string; src: string; kind: MediaKind }> {
  const target = await prepareMediaUploadAction({ mime, size: blob.size });
  if (!target.ok) throw new MediaError(target.error);
  if (target.target === "local") {
    const fd = new FormData();
    fd.append("file", blob, `upload.${mime.split("/")[1]}`);
    return JSON.parse(await send("POST", "/admin/media", fd, {}, onProgress)) as { ref: string; src: string; kind: MediaKind };
  }
  // Tai thang len Supabase Storage (giong supabase-js uploadToSignedUrl)
  const fd = new FormData();
  fd.append("cacheControl", "31536000");
  fd.append("", blob);
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  await send("PUT", target.signedUrl, fd, { "x-upsert": "false", ...(anon ? { apikey: anon } : {}) }, onProgress);
  return { ref: target.ref, src: target.src, kind: target.kind };
}

function Thumb({ item }: { item: MediaItem }) {
  if (item.kind === "video") {
    return <video src={item.src.startsWith("blob:") ? item.src : `${item.src}#t=0.1`} muted playsInline preload="metadata" className="pointer-events-none h-full w-full object-cover" />;
  }
  if (item.src.startsWith("blob:")) {
    // eslint-disable-next-line @next/next/no-img-element -- anh xem truoc truoc khi tai len xong
    return <img src={item.src} alt="" className="h-full w-full object-cover" />;
  }
  return <Image src={item.src} alt="" fill sizes="160px" className="object-cover" />;
}

/**
 * Anh + video cua mon: chon / keo tha tu may, tai len ngay, sap xep, anh dau tien = anh bia.
 * Gia tri (items) do ProductForm giu; khi luu chi gui ref cua file da tai xong.
 */
export function MediaManager({ items, onChange }: { items: MediaItem[]; onChange: (update: (prev: MediaItem[]) => MediaItem[]) => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const blobs = useRef(new Set<string>());

  useEffect(() => {
    const urls = blobs.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const patch = useCallback((key: string, p: Partial<MediaItem>) => onChange((list) => list.map((x) => (x.key === key ? { ...x, ...p } : x))), [onChange]);

  const addFiles = async (files: File[]) => {
    const room = MEDIA_MAX_ITEMS - items.length;
    if (room <= 0) {
      toast(`Mỗi món tối đa ${MEDIA_MAX_ITEMS} ảnh / video.`, "error");
      return;
    }
    if (files.length > room) toast(`Chỉ thêm được ${room} file nữa (tối đa ${MEDIA_MAX_ITEMS}).`, "error");
    for (const file of files.slice(0, room)) {
      const isVideo = file.type.startsWith("video/") || Boolean(VIDEO_BY_EXT[file.name.split(".").pop()?.toLowerCase() ?? ""]);
      const key = crypto.randomUUID();
      const preview = URL.createObjectURL(file);
      blobs.current.add(preview);
      onChange((list) => [...list, { key, kind: isVideo ? "video" : "image", src: preview, status: "uploading", progress: 0, fresh: true }]);
      void (async () => {
        try {
          let blob: Blob;
          let mime: MediaMime;
          if (isVideo) {
            const vm = videoMime(file);
            if (!vm) throw new MediaError("Video chỉ nhận MP4, WebM hoặc MOV.");
            if (file.size > MEDIA_MAX_BYTES) throw new MediaError(`Video ${formatMb(file.size)} – tối đa ${formatMb(MEDIA_MAX_BYTES)}. Cắt ngắn hoặc nén nhỏ lại rồi thử.`);
            blob = file;
            mime = vm;
          } else {
            blob = await prepareImage(file);
            mime = blob.type as MediaMime;
            if (!isMediaMime(mime)) throw new MediaError("Loại ảnh không được nhận.");
            if (blob.size > MEDIA_MAX_BYTES) throw new MediaError(`Ảnh sau khi nén vẫn ${formatMb(blob.size)} – tối đa ${formatMb(MEDIA_MAX_BYTES)}.`);
          }
          const done = await upload(blob, mime, (p) => patch(key, { progress: p }));
          patch(key, { ref: done.ref, src: done.src, kind: done.kind, status: "done", progress: 100 });
        } catch (err) {
          const message = err instanceof MediaError ? err.message : "Tải lên lỗi – thử lại.";
          patch(key, { status: "error", error: message });
          toast(`${file.name}: ${message}`, "error");
        }
      })();
    }
  };

  const remove = (item: MediaItem) => {
    onChange((list) => list.filter((x) => x.key !== item.key));
    // File vua tai trong lan nay ma bo luon -> xoa khoi kho (file cua mon da luu chi xoa khi bam Luu)
    if (item.fresh && item.ref) void discardUploadsAction([item.ref]);
  };

  const move = (key: string, to: number) =>
    onChange((list) => {
      const from = list.findIndex((x) => x.key === key);
      if (from < 0 || to < 0 || to >= list.length || from === to) return list;
      const next = [...list];
      const [it] = next.splice(from, 1);
      next.splice(to, 0, it!);
      return next;
    });

  const onDropFiles = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (dragKey) return;
    const files = Array.from(e.dataTransfer.files);
    if (files.length) void addFiles(files);
  };

  const firstImageKey = items.find((x) => x.kind === "image" && x.status !== "error")?.key;
  const uploading = items.filter((x) => x.status === "uploading").length;

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!dragKey) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDropFiles}
        className={`flex flex-col items-center gap-2 rounded-[18px] border-2 border-dashed px-4 py-6 text-center transition-colors ${dragOver ? "border-maroon bg-butter/20" : "border-maroon/20 bg-white/50"}`}
      >
        <button type="button" onClick={() => inputRef.current?.click()} disabled={items.length >= MEDIA_MAX_ITEMS} className="inline-flex min-h-11 items-center gap-2 rounded-full border-0 bg-maroon px-5 text-[15px] font-semibold text-cream hover:bg-accent disabled:opacity-50">
          <PlusIcon size={18} /> Chọn ảnh / video từ máy
        </button>
        <span className="text-[13px] text-muted">
          hoặc kéo thả vào đây · Ảnh JPG, PNG, WebP (tự thu nhỏ) · Video MP4, WebM, MOV dưới {formatMb(MEDIA_MAX_BYTES)} · tối đa {MEDIA_MAX_ITEMS}
        </span>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          hidden
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = "";
            if (files.length) void addFiles(files);
          }}
        />
      </div>

      {items.length > 0 ? (
        <ul aria-label="Ảnh và video của món" className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 xl:grid-cols-4">
          {items.map((item, i) => {
            const isCover = item.key === firstImageKey;
            return (
              <li
                key={item.key}
                draggable={item.status === "done"}
                onDragStart={() => setDragKey(item.key)}
                onDragEnd={() => setDragKey(null)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragKey) move(dragKey, i);
                  setDragKey(null);
                }}
                className={`group relative flex flex-col overflow-hidden rounded-[16px] border bg-card ${item.status === "error" ? "border-accent" : isCover ? "border-maroon" : "border-maroon/12"} ${dragKey === item.key ? "opacity-40" : ""}`}
              >
                <div className="relative aspect-square bg-beige">
                  <Thumb item={item} />
                  {item.kind === "video" && (
                    <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-bold text-white">Video</span>
                  )}
                  {isCover && <span className="absolute left-2 top-2 rounded-full bg-maroon px-2 py-0.5 text-[11px] font-bold text-cream">Ảnh bìa</span>}
                  {item.status === "uploading" && (
                    <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-black/55 px-2.5 py-2 text-[12px] font-semibold text-white" role="status">
                      Đang tải… {item.progress}%
                      <span className="h-1.5 overflow-hidden rounded-full bg-white/25">
                        <span className="block h-full rounded-full bg-butter transition-[width] duration-200" style={{ width: `${item.progress}%` }} />
                      </span>
                    </div>
                  )}
                  {item.status === "error" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-rose/90 p-3 text-center text-[12px] font-semibold text-accent" role="alert">{item.error}</div>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(item)}
                    aria-label={`Bỏ ${item.kind === "video" ? "video" : "ảnh"} ${i + 1}`}
                    className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full border-0 bg-white/90 text-maroon shadow hover:bg-white hover:text-accent"
                  >
                    <XIcon size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-1 p-1.5">
                  <button type="button" onClick={() => move(item.key, i - 1)} disabled={i === 0} aria-label={`Đưa mục ${i + 1} lên trước`} className="flex h-9 w-9 items-center justify-center rounded-full border-0 bg-transparent text-maroon hover:bg-maroon/6 disabled:opacity-30">
                    <ChevronLeftIcon size={16} />
                  </button>
                  {item.kind === "image" && !isCover && item.status === "done" ? (
                    <button type="button" onClick={() => move(item.key, 0)} className="min-h-9 flex-1 rounded-full border-0 bg-transparent px-1 text-[12px] font-semibold text-maroon hover:bg-maroon/6">
                      Đặt làm ảnh bìa
                    </button>
                  ) : (
                    <span className="flex-1 text-center text-[12px] text-muted">{i + 1}</span>
                  )}
                  <button type="button" onClick={() => move(item.key, i + 1)} disabled={i === items.length - 1} aria-label={`Đưa mục ${i + 1} ra sau`} className="flex h-9 w-9 items-center justify-center rounded-full border-0 bg-transparent text-maroon hover:bg-maroon/6 disabled:opacity-30">
                    <ChevronRightIcon size={16} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="m-0 text-[14px] text-muted">Món chưa có ảnh – trên web sẽ hiện ảnh chờ có logo tiệm.</p>
      )}
      <p className="m-0 text-[13px] text-muted">
        {items.length}/{MEDIA_MAX_ITEMS}
        {uploading ? ` · đang tải ${uploading} file…` : ""} · Ảnh đầu tiên là ảnh bìa trên thẻ bánh. Kéo thả hoặc dùng mũi tên để sắp xếp.
      </p>
    </div>
  );
}
