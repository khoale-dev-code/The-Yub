"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MoveIcon } from "./admin-icons";

/** "center 35%" -> 35 ; "center" / khong hop le -> 50 */
const parseY = (v: string) => {
  const m = /^center(?: (\d{1,3})%)?$/.exec(v);
  return m?.[1] ? Math.min(100, Math.max(0, Number(m[1]))) : 50;
};
const fmt = (y: number) => (y === 50 ? "center" : `center ${y}%`);
const clamp = (n: number) => Math.min(100, Math.max(0, Math.round(n)));

const PRESETS = [
  { y: 20, l: "Phần trên" },
  { y: 50, l: "Giữa" },
  { y: 80, l: "Phần dưới" },
] as const;

/**
 * Chon phan anh bia hien tren the banh: keo anh len / xuong trong khung (dung ti le the banh tren web),
 * hoac dung thanh truot / nut nhanh. Luu dang "center N%" (may chu chi nhan dang nay).
 */
export function CoverFramer({ src, value, onChange }: { src: string; value: string; onChange: (v: string) => void }) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [y, setY] = useState(() => parseY(value));
  const [room, setRoom] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ id: number; startY: number; fromY: number } | null>(null);

  useEffect(() => setY(parseY(value)), [value]);

  /** Phan anh du ra theo chieu doc (px) – = 0 nghia la anh vua khung, khong can keo */
  const measure = useCallback(() => {
    const frame = frameRef.current;
    const img = imgRef.current;
    if (!frame || !img || !img.naturalWidth) return;
    const w = frame.clientWidth;
    const h = frame.clientHeight;
    const rendered = Math.max(w, h * (img.naturalWidth / img.naturalHeight)) * (img.naturalHeight / img.naturalWidth);
    setRoom(Math.max(0, rendered - h));
  }, []);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const ro = new ResizeObserver(measure);
    ro.observe(frame);
    return () => ro.disconnect();
  }, [measure]);

  const commit = (n: number) => {
    const v = clamp(n);
    setY(v);
    onChange(fmt(v));
  };

  const canDrag = room > 4;

  return (
    <div className="flex flex-col gap-3 border-t border-maroon/8 pt-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-[14px] font-semibold">Phần ảnh bìa hiện trên thẻ bánh</span>
        <span className="text-[13px] text-muted">{canDrag ? "Kéo ảnh lên / xuống trong khung để chọn phần đẹp nhất." : "Ảnh đã vừa khung thẻ bánh."}</span>
      </div>
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:gap-5">
        <div
          ref={frameRef}
          role="presentation"
          onPointerDown={(e) => {
            if (!canDrag || e.button !== 0) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            drag.current = { id: e.pointerId, startY: e.clientY, fromY: y };
            setDragging(true);
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (!d || d.id !== e.pointerId) return;
            // Keo xuong -> thay phan tren nhieu hon -> % giam
            const next = clamp(d.fromY - ((e.clientY - d.startY) / room) * 100);
            if (imgRef.current) imgRef.current.style.objectPosition = `center ${next}%`;
            setY(next);
          }}
          onPointerUp={(e) => {
            const d = drag.current;
            if (!d || d.id !== e.pointerId) return;
            drag.current = null;
            setDragging(false);
            commit(y);
          }}
          onPointerCancel={() => {
            drag.current = null;
            setDragging(false);
            commit(y);
          }}
          className={`relative aspect-[1/0.92] w-full max-w-[300px] flex-none select-none overflow-hidden rounded-[22px] bg-beige ring-1 ring-maroon/10 ${canDrag ? (dragging ? "cursor-grabbing" : "cursor-grab") : ""}`}
          style={{ touchAction: canDrag ? "none" : "auto" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- can kich thuoc goc de tinh phan keo duoc */}
          <img ref={imgRef} src={src} alt="" draggable={false} onLoad={measure} className="pointer-events-none absolute inset-0 h-full w-full object-cover" style={{ objectPosition: `center ${y}%` }} />
          <span aria-hidden="true" className={`pointer-events-none absolute inset-0 transition-opacity duration-200 ${dragging ? "opacity-100" : "opacity-0"}`}>
            <span className="absolute inset-x-0 top-1/3 h-px bg-white/70" />
            <span className="absolute inset-x-0 top-2/3 h-px bg-white/70" />
            <span className="absolute inset-y-0 left-1/3 w-px bg-white/70" />
            <span className="absolute inset-y-0 left-2/3 w-px bg-white/70" />
          </span>
          {canDrag && (
            <span aria-hidden="true" className={`pointer-events-none absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-dark/75 px-3 py-1.5 text-[12px] font-semibold text-cream transition-opacity duration-200 ${dragging ? "opacity-0" : "opacity-100"}`}>
              <MoveIcon size={14} /> Kéo để chỉnh
            </span>
          )}
        </div>
        {canDrag && (
          <div className="flex w-full max-w-[300px] flex-col gap-3 sm:pt-1">
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-muted">
              Vị trí (trên → dưới)
              <input type="range" min={0} max={100} step={1} value={y} onChange={(e) => commit(Number(e.target.value))} className="h-8 w-full accent-[#3B0F12]" />
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button key={p.y} type="button" aria-pressed={y === p.y} onClick={() => commit(p.y)} className={`min-h-10 rounded-full border px-3.5 text-[13px] font-semibold ${y === p.y ? "border-maroon bg-maroon text-cream" : "border-maroon/20 bg-card text-maroon"}`}>
                  {p.l}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
