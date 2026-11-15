"use client";

import { useState } from "react";
import { formatVnd } from "@/lib/format";

/** "1.250.000" -> "1,25 tr", "85.000" -> "85k" (truc so) */
export function compactVnd(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 2 })} tr`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}

/** Chia truc dep: 0 · 1/2 · max (lam tron len) */
function niceMax(v: number): number {
  if (v <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(v));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * pow >= v) ?? 10;
  return step * pow;
}

export interface Column {
  key: string;
  label: string;
  value: number;
  /** Dong phu trong tooltip, vd "3 đơn" */
  detail?: string;
}

/**
 * Bieu do cot 1 chuoi (khong can chu thich – tieu de da noi ten).
 * Ren chuot / tab vao cot de xem so lieu; co bang so lieu ben duoi cho nguoi dung trinh doc man hinh.
 */
export function ColumnChart({ data, unit = "vnd", label }: { data: Column[]; unit?: "vnd" | "count"; label: string }) {
  const format = (n: number) => (unit === "vnd" ? formatVnd(n) : n.toLocaleString("vi-VN"));
  const axis = (n: number) => (unit === "vnd" ? compactVnd(n) : String(Math.round(n)));
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(0, ...data.map((d) => d.value)));
  const every = Math.max(1, Math.ceil(data.length / 7));
  const active = hover !== null ? data[hover] : undefined;

  return (
    <div className="flex flex-col gap-2" onMouseLeave={() => setHover(null)}>
      <div className="relative grid h-[220px] grid-cols-[44px_minmax(0,1fr)] md:h-[260px]">
        {/* Truc y */}
        <div aria-hidden="true" className="relative text-right text-[11px] tabular-nums text-muted-2">
          {[1, 0.5, 0].map((t) => (
            <span key={t} className="absolute right-2 -translate-y-1/2" style={{ top: `${(1 - t) * 100}%` }}>{axis(max * t)}</span>
          ))}
        </div>
        <div className="relative">
          {[0, 0.5, 1].map((t) => (
            <span key={t} aria-hidden="true" className={`absolute inset-x-0 h-px ${t === 1 ? "bg-maroon/25" : "bg-maroon/8"}`} style={{ top: `${t * 100}%` }} />
          ))}
          <div role="list" aria-label={label} className="absolute inset-0 flex items-end gap-[2px]">
            {data.map((d, i) => {
              const h = (d.value / max) * 100;
              const on = hover === i;
              return (
                <button
                  key={d.key}
                  type="button"
                  role="listitem"
                  aria-label={`${d.label}: ${format(d.value)}${d.detail ? `, ${d.detail}` : ""}`}
                  onMouseEnter={() => setHover(i)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  className="group relative flex h-full min-w-0 flex-1 items-end justify-center border-0 bg-transparent p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon"
                >
                  <span className={`absolute inset-x-0 inset-y-0 rounded-[6px] transition-colors ${on ? "bg-maroon/5" : ""}`} />
                  <span
                    className={`relative w-full max-w-[36px] rounded-t-[4px] transition-[background-color,height] duration-500 ${on ? "bg-accent" : "bg-maroon"}`}
                    style={{ height: d.value > 0 ? `max(${h}%, 3px)` : 0 }}
                  />
                </button>
              );
            })}
          </div>
          {active && hover !== null && (
            <div
              role="status"
              className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-[12px] bg-dark px-3 py-2 text-[13px] text-cream shadow-[0_10px_24px_-10px_rgba(36,18,13,0.6)]"
              style={{ left: `clamp(60px, ${((hover + 0.5) / data.length) * 100}%, calc(100% - 60px))` }}
            >
              <div className="text-cream/70">{active.label}</div>
              <strong className="tabular-nums">{format(active.value)}</strong>
              {active.detail && <span className="text-cream/70"> · {active.detail}</span>}
            </div>
          )}
        </div>
      </div>
      {/* Nhan truc x */}
      <div aria-hidden="true" className="grid grid-cols-[44px_minmax(0,1fr)]">
        <span />
        <div className="flex gap-[2px]">
          {data.map((d, i) => (
            <span key={d.key} className={`min-w-0 flex-1 overflow-visible whitespace-nowrap text-[11px] text-muted-2 ${i === data.length - 1 && data.length > 10 ? "flex justify-end" : "text-center"}`}>
              {i % every === 0 || i === data.length - 1 ? d.label : ""}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export interface BarRow {
  label: string;
  value: number;
  valueLabel: string;
  sub?: string;
}

/** Thanh ngang xep hang (mon ban chay, khung gio) – nhan va so ghi truc tiep, khong can chu thich */
export function BarList({ rows, label }: { rows: BarRow[]; label: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (rows.every((r) => r.value === 0)) return <p className="m-0 py-6 text-center text-[14px] text-muted">Chưa có dữ liệu trong kỳ này.</p>;
  return (
    <ol aria-label={label} className="m-0 flex list-none flex-col gap-3 p-0">
      {rows.map((r) => (
        <li key={r.label} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3 text-[14px]">
            <span className="min-w-0 truncate font-semibold">{r.label}</span>
            <span className="flex-none tabular-nums">
              <strong>{r.valueLabel}</strong>
              {r.sub && <span className="text-muted"> · {r.sub}</span>}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-beige" aria-hidden="true">
            <span className="block h-full rounded-full bg-maroon transition-[width] duration-700" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ol>
  );
}
