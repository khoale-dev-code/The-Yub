"use client";

import Image from "next/image";
import gsap from "gsap";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type DragEvent, type PointerEvent as ReactPointerEvent } from "react";
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
import { ChevronLeftIcon, ChevronRightIcon, GripIcon, PlusIcon, XIcon } from "./admin-icons";
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
  const listRef = useRef<HTMLUListElement | null>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;

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

  // ------------------------------------------------------------ keo tha sap xep (chuot + ngon tay)
  // Chuot: nhan giu roi keo (> 6px). Ngon tay: giu ~0,25 giay roi keo (vuot nhanh van cuon trang),
  // hoac keo ngay o nut ⋮⋮. Cac anh khac truot vao cho moi (FLIP), anh dang keo di theo ngon tay.
  const sort = useRef<{
    key: string;
    id: number;
    sx: number;
    sy: number;
    grabX: number;
    grabY: number;
    px: number;
    py: number;
    on: boolean;
    timer: number;
    raf: number;
    before: Map<string, { x: number; y: number }> | null;
  } | null>(null);

  const tileOf = (key: string) => listRef.current?.querySelector<HTMLElement>(`[data-media-key="${CSS.escape(key)}"]`) ?? null;
  const offsets = () => {
    const map = new Map<string, { x: number; y: number }>();
    listRef.current?.querySelectorAll<HTMLElement>("[data-media-key]").forEach((el) => map.set(el.dataset.mediaKey ?? "", { x: el.offsetLeft, y: el.offsetTop }));
    return map;
  };
  const follow = () => {
    const d = sort.current;
    const el = d && tileOf(d.key);
    if (!d || !el) return;
    gsap.set(el, { x: d.px - d.grabX - el.offsetLeft, y: d.py - d.grabY - el.offsetTop });
  };

  // Sau khi doi cho: anh khac truot tu vi tri cu sang vi tri moi; anh dang keo bam lai ngon tay
  useLayoutEffect(() => {
    const d = sort.current;
    if (!d?.on || !d.before) return;
    const before = d.before;
    d.before = null;
    listRef.current?.querySelectorAll<HTMLElement>("[data-media-key]").forEach((el) => {
      const k = el.dataset.mediaKey ?? "";
      if (k === d.key) return;
      const old = before.get(k);
      if (!old) return;
      const dx = old.x - el.offsetLeft;
      const dy = old.y - el.offsetTop;
      if (dx || dy) gsap.fromTo(el, { x: dx, y: dy }, { x: 0, y: 0, duration: 0.32, ease: "power3.out", overwrite: true });
    });
    follow();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chi chay lai khi danh sach doi thu tu
  }, [items]);

  const startSort = () => {
    const d = sort.current;
    const el = d && tileOf(d.key);
    if (!d || !el) return;
    d.on = true;
    setDragKey(d.key);
    gsap.to(el, { scale: 1.05, boxShadow: "0 18px 36px -14px rgba(36,18,13,0.45)", duration: 0.2, ease: "power2.out" });
    if (navigator.vibrate) navigator.vibrate(8);
    follow();
  };

  const onTileDown = (e: ReactPointerEvent<HTMLElement>, item: MediaItem, handle: boolean) => {
    if (item.status !== "done" || e.button !== 0 || sort.current || itemsRef.current.length < 2) return;
    if ((e.target as Element).closest("button") && !handle) return;
    const list = listRef.current;
    const el = tileOf(item.key);
    if (!list || !el) return;
    const lr = list.getBoundingClientRect();
    const px = e.clientX - lr.left;
    const py = e.clientY - lr.top;
    sort.current = { key: item.key, id: e.pointerId, sx: e.clientX, sy: e.clientY, grabX: px - el.offsetLeft, grabY: py - el.offsetTop, px, py, on: false, timer: 0, raf: 0, before: null };
    if (handle || e.pointerType === "mouse") {
      if (handle) startSort();
    } else {
      sort.current.timer = window.setTimeout(startSort, 260);
    }
  };

  useEffect(() => {
    const endSort = (cancel = false) => {
      const d = sort.current;
      if (!d) return;
      window.clearTimeout(d.timer);
      cancelAnimationFrame(d.raf);
      sort.current = null;
      if (!d.on) return;
      const el = tileOf(d.key);
      if (el) gsap.to(el, { x: 0, y: 0, scale: 1, boxShadow: "0 0 0 0 rgba(0,0,0,0)", duration: cancel ? 0.2 : 0.38, ease: "power3.out", clearProps: "transform,boxShadow" });
      setDragKey(null);
    };
    const onMove = (e: PointerEvent) => {
      const d = sort.current;
      const list = listRef.current;
      if (!d || d.id !== e.pointerId || !list) return;
      const moved = Math.hypot(e.clientX - d.sx, e.clientY - d.sy);
      if (!d.on) {
        if (e.pointerType === "mouse" && moved > 6) startSort();
        else if (e.pointerType !== "mouse" && moved > 10) {
          // Vuot truoc khi giu du lau -> nguoi dung dang cuon trang
          window.clearTimeout(d.timer);
          sort.current = null;
        }
        if (!sort.current?.on) return;
      }
      const lr = list.getBoundingClientRect();
      d.px = e.clientX - lr.left;
      d.py = e.clientY - lr.top;
      cancelAnimationFrame(d.raf);
      d.raf = requestAnimationFrame(() => {
        follow();
        // Tim o dang nam duoi ngon tay
        const tiles = Array.from(list.querySelectorAll<HTMLElement>("[data-media-key]"));
        const hit = tiles.find((t) => t.dataset.mediaKey !== d.key && d.px >= t.offsetLeft && d.px <= t.offsetLeft + t.offsetWidth && d.py >= t.offsetTop && d.py <= t.offsetTop + t.offsetHeight);
        if (hit) {
          const to = itemsRef.current.findIndex((x) => x.key === hit.dataset.mediaKey);
          if (to >= 0) {
            d.before = offsets();
            move(d.key, to);
          }
        }
        // Gan mep man hinh -> tu cuon
        const edge = 70;
        if (e.clientY < edge) window.scrollBy(0, -12);
        else if (e.clientY > window.innerHeight - edge) window.scrollBy(0, 12);
      });
    };
    // Dang keo bang ngon tay: chan trang cuon theo
    const onTouchMove = (e: TouchEvent) => {
      if (sort.current?.on && e.cancelable) e.preventDefault();
    };
    const onUp = (e: PointerEvent) => {
      if (sort.current?.id === e.pointerId) endSort();
    };
    const onCancel = (e: PointerEvent) => {
      if (sort.current?.id === e.pointerId) endSort(true);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      document.removeEventListener("touchmove", onTouchMove);
      endSort(true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- move/startSort chi dung ref + setState on dinh
  }, []);

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
        <ul ref={listRef} aria-label="Ảnh và video của món" className="relative m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 xl:grid-cols-4">
          {items.map((item, i) => {
            const isCover = item.key === firstImageKey;
            return (
              <li
                key={item.key}
                data-media-key={item.key}
                onPointerDown={(e) => onTileDown(e, item, false)}
                onContextMenu={(e) => sort.current && e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
                className={`group relative flex flex-col overflow-hidden rounded-[16px] border bg-card ${item.status === "error" ? "border-accent" : isCover ? "border-maroon" : "border-maroon/12"} ${dragKey === item.key ? "z-10 cursor-grabbing" : item.status === "done" ? "cursor-grab" : ""} select-none [-webkit-touch-callout:none]`}
              >
                <div className="relative aspect-square bg-beige">
                  <Thumb item={item} />
                  {item.kind === "video" && (
                    <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-bold text-white">Video</span>
                  )}
                  {isCover && <span className="absolute left-2 top-2 rounded-full bg-maroon px-2 py-0.5 text-[11px] font-bold text-cream">Ảnh bìa</span>}
                  {item.kind === "image" && !isCover && item.status === "done" && (
                    <button type="button" onClick={() => move(item.key, 0)} className="absolute bottom-2 left-2 inline-flex min-h-8 items-center rounded-full border-0 bg-white/90 px-2.5 text-[12px] font-bold text-maroon shadow hover:bg-white">
                      Làm ảnh bìa
                    </button>
                  )}
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
                  {item.status === "done" && items.length > 1 && (
                    <span
                      role="presentation"
                      title="Kéo để đổi chỗ"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        onTileDown(e, item, true);
                      }}
                      className="flex h-9 w-7 flex-none cursor-grab items-center justify-center rounded-full text-muted-2 hover:bg-maroon/6 hover:text-maroon"
                      style={{ touchAction: "none" }}
                    >
                      <GripIcon size={16} />
                    </span>
                  )}
                  <button type="button" onClick={() => move(item.key, i - 1)} disabled={i === 0} aria-label={`Đưa mục ${i + 1} lên trước`} className="flex h-9 w-9 items-center justify-center rounded-full border-0 bg-transparent text-maroon hover:bg-maroon/6 disabled:opacity-30">
                    <ChevronLeftIcon size={16} />
                  </button>
                  <span className="flex-1 text-center text-[12px] font-semibold tabular-nums text-muted">{i + 1}</span>
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
        {uploading ? ` · đang tải ${uploading} file…` : ""} · Ảnh đầu tiên là ảnh bìa trên thẻ bánh. Giữ ảnh rồi kéo để đổi chỗ, hoặc dùng mũi tên.
      </p>
    </div>
  );
}
