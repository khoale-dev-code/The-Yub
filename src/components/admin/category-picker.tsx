"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { createCategoryAction } from "@/modules/admin/actions";
import type { Category } from "@/modules/categories/types";
import { CheckIcon, PlusIcon } from "./admin-icons";
import { toast } from "./toast";
import { btn, input } from "./ui";

/**
 * Chon danh muc bang the bam lon (thay cho o chon nho kho bam tren dien thoai)
 * + "Thêm danh mục" ngay tai cho: go ten -> tao -> chon luon, khong phai roi trang.
 */
export function CategoryPicker({ categories, value, onChange }: { categories: Category[]; value: string; onChange: (slug: string) => void }) {
  const [list, setList] = useState(categories);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [pending, start] = useTransition();
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => setList((cur) => [...categories, ...cur.filter((c) => !categories.some((x) => x.slug === c.slug))]), [categories]);
  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  const create = () => {
    const n = name.trim();
    if (n.length < 2) {
      toast("Tên danh mục cần ít nhất 2 ký tự", "error");
      return;
    }
    const same = list.find((c) => c.name.toLowerCase() === n.toLowerCase());
    if (same) {
      onChange(same.slug);
      setAdding(false);
      setName("");
      toast(`Đã chọn danh mục “${same.name}”`);
      return;
    }
    start(async () => {
      const res = await createCategoryAction({ kind: "product", name: n });
      if (!res.ok || !res.id) {
        toast(res.ok ? "Không tạo được danh mục" : res.error, "error");
        return;
      }
      const slug = res.id;
      setList((cur) => [...cur, { slug, name: n, kind: "product", sortOrder: cur.length + 1 }]);
      onChange(slug);
      setAdding(false);
      setName("");
      toast(`Đã thêm danh mục “${n}”`);
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span id="cat-label" className="text-[14px] font-semibold">Danh mục</span>
        <Link href="/admin/danh-muc" className="inline-flex min-h-9 items-center text-[13px] font-semibold text-muted underline-offset-2 hover:text-maroon hover:underline">Sắp xếp, đổi tên</Link>
      </div>
      <div role="radiogroup" aria-labelledby="cat-label" className="flex flex-wrap gap-2">
        {list.map((c) => {
          const on = c.slug === value;
          return (
            <button
              key={c.slug}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(c.slug)}
              className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-[15px] font-semibold transition-[background-color,border-color,color,transform] duration-200 active:scale-[0.96] ${on ? "border-maroon bg-maroon text-cream" : "border-maroon/20 bg-white/70 text-maroon hover:border-maroon"}`}
            >
              {on && <CheckIcon size={16} />}
              {c.name}
            </button>
          );
        })}
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-dashed border-maroon/35 bg-transparent px-4 text-[15px] font-semibold text-maroon hover:border-maroon hover:bg-maroon/5"
          >
            <PlusIcon size={16} /> Thêm danh mục
          </button>
        )}
      </div>
      {adding && (
        <div className="flex flex-col gap-2 rounded-[18px] border border-maroon/15 bg-beige/50 p-3 sm:flex-row sm:items-center">
          <label htmlFor="cat-new" className="sr-only">Tên danh mục mới</label>
          <input
            ref={inputRef}
            id="cat-new"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                create();
              }
              if (e.key === "Escape") setAdding(false);
            }}
            maxLength={60}
            placeholder="Tên danh mục mới, VD: Bánh mì"
            enterKeyHint="done"
            className={`${input} sm:flex-1`}
          />
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <button type="button" onClick={create} disabled={pending} className={btn.primary}>{pending ? "Đang thêm…" : "Thêm"}</button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setName("");
              }}
              className={btn.secondary}
            >
              Huỷ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
