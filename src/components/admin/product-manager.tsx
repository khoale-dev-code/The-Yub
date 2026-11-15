"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useOptimistic, useState, useTransition } from "react";
import { formatVnd } from "@/lib/format";
import { productImages } from "@/lib/images";
import { updateProductQuickAction } from "@/modules/admin/actions";
import { categoryLabels, productCategories, productStatusLabels, type Product, type ProductCategory, type ProductStatus } from "@/modules/products/types";
import { SearchIcon } from "./admin-icons";
import { Switch } from "./switch";
import { toast } from "./toast";
import { card, input, productStatusTone } from "./ui";

const STATUSES: ProductStatus[] = ["ready", "oven", "pre", "out"];
const shortStatus: Record<ProductStatus, string> = { ready: "Có sẵn", oven: "Ra lò", pre: "Đặt trước", out: "Hết" };

type Patch = { id: string; status?: ProductStatus; isActive?: boolean };

/** Danh sach mon: doi trang thai / an-hien ngay tai cho (luu tuc thi, cap nhat web) */
export function ProductManager({ products }: { products: Product[] }) {
  const [cat, setCat] = useState<ProductCategory | "all">("all");
  const [q, setQ] = useState("");
  const [, start] = useTransition();
  const [items, applyOptimistic] = useOptimistic(products, (list: Product[], p: Patch) => list.map((x) => (x.id === p.id ? { ...x, ...p } : x)));

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    return items.filter((p) => (cat === "all" || p.category === cat) && (!term || p.name.toLowerCase().includes(term)));
  }, [items, cat, q]);

  const save = (p: Patch, msg: string) =>
    start(async () => {
      applyOptimistic(p);
      const res = await updateProductQuickAction(p);
      if (res.ok) toast(msg);
      else toast(res.error, "error");
    });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative md:w-[300px]">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-2" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm món…" aria-label="Tìm món" className={`${input} pl-10`} />
        </div>
        <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {(["all", ...productCategories] as const).map((c) => (
            <button key={c} type="button" onClick={() => setCat(c)} aria-pressed={cat === c} className={`min-h-10 flex-none rounded-full border-0 px-3.5 text-[14px] font-semibold ${cat === c ? "bg-dark text-cream" : "bg-transparent text-muted hover:bg-maroon/5"}`}>
              {c === "all" ? "Tất cả" : categoryLabels[c]}
            </button>
          ))}
        </div>
      </div>

      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
        {visible.map((p) => {
          const hidden = p.isActive === false;
          return (
            <li key={p.id} className={`${card} grid grid-cols-[64px_minmax(0,1fr)] gap-x-3.5 gap-y-3 p-3 md:grid-cols-[64px_minmax(0,1fr)_auto_auto_auto] md:items-center md:gap-x-5 md:px-4 ${hidden ? "opacity-70" : ""}`}>
              <span className="relative row-span-2 h-16 w-16 overflow-hidden rounded-[14px] bg-beige md:row-span-1">
                <Image src={productImages[p.image]} alt="" fill sizes="64px" className="object-cover" style={{ objectPosition: p.imagePosition ?? "center" }} />
              </span>
              <div className="flex min-w-0 flex-col">
                <Link href={`/admin/mon/${encodeURIComponent(p.id)}`} className="truncate text-[16px] font-bold no-underline hover:text-accent">{p.name}</Link>
                <span className="text-[13px] text-muted">
                  {categoryLabels[p.category]} · {p.variants?.length ? `${p.variants.length} quy cách, từ ${formatVnd(Math.min(...p.variants.map((v) => v.priceVnd)))}` : formatVnd(p.priceVnd)}
                  {hidden && <span className="ml-1.5 rounded-full bg-maroon/10 px-1.5 text-[12px] font-semibold">Đang ẩn</span>}
                </span>
              </div>

              <div role="radiogroup" aria-label={`Trạng thái ${p.name}`} className="col-span-2 grid grid-cols-4 gap-1 rounded-full bg-beige p-1 md:col-span-1 md:w-[340px]">
                {STATUSES.map((s) => {
                  const on = p.status === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      title={productStatusLabels[s]}
                      onClick={() => !on && save({ id: p.id, status: s }, `${p.name}: ${productStatusLabels[s]}`)}
                      className={`min-h-9 rounded-full border-0 px-2 text-[13px] font-semibold transition-colors ${on ? `${productStatusTone[s]} shadow-sm` : "bg-transparent text-muted hover:text-maroon"}`}
                    >
                      {shortStatus[s]}
                    </button>
                  );
                })}
              </div>

              <div className="col-span-2 flex items-center justify-between gap-3 md:col-span-1 md:justify-end">
                <Switch checked={!hidden} onChange={(v) => save({ id: p.id, isActive: v }, v ? `Đã hiện ${p.name} trên web` : `Đã ẩn ${p.name}`)} label="Hiện trên web" showLabel />
                <Link href={`/admin/mon/${encodeURIComponent(p.id)}`} className="inline-flex min-h-10 items-center rounded-full border border-maroon/15 px-4 text-[14px] font-semibold no-underline md:hidden">Sửa</Link>
              </div>
              <Link href={`/admin/mon/${encodeURIComponent(p.id)}`} className="hidden min-h-10 items-center rounded-full border border-maroon/15 px-4 text-[14px] font-semibold no-underline hover:border-maroon md:inline-flex">Sửa</Link>
            </li>
          );
        })}
      </ul>
      {visible.length === 0 && <p className="m-0 py-10 text-center text-muted">Không có món phù hợp.</p>}
    </div>
  );
}
