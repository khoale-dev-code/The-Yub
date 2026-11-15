"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { createCategoryAction, deleteCategoryAction, renameCategoryAction, reorderCategoriesAction } from "@/modules/admin/actions";
import type { Category, CategoryKind } from "@/modules/categories/types";
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, PencilIcon, PlusIcon, TrashIcon, XIcon } from "./admin-icons";
import { toast } from "./toast";
import { btn, card, input } from "./ui";

const unit = { product: "món", drink: "đồ uống" } as const;

function Row({ cat, count, index, total, canDelete, onMove }: { cat: Category; count: number; index: number; total: number; canDelete: boolean; onMove: (from: number, to: number) => void }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(cat.name);
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editing) ref.current?.select();
  }, [editing]);

  const save = () => {
    const v = name.trim();
    if (v === cat.name) return setEditing(false);
    start(async () => {
      const res = await renameCategoryAction({ slug: cat.slug, name: v });
      if (!res.ok) return toast(res.error, "error");
      toast(`Đã đổi tên: ${v}`);
      setEditing(false);
      router.refresh();
    });
  };

  const remove = () =>
    start(async () => {
      const res = await deleteCategoryAction({ slug: cat.slug });
      setConfirm(false);
      if (!res.ok) return toast(res.error, "error");
      toast(`Đã xoá danh mục ${cat.name}`);
      router.refresh();
    });

  return (
    <li className="flex flex-col gap-2 border-b border-maroon/8 px-3 py-3 last:border-b-0 sm:flex-row sm:items-center sm:gap-3 sm:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-beige text-[13px] font-bold tabular-nums text-muted">{index + 1}</span>
        {editing ? (
          <form
            className="flex min-w-0 flex-1 items-center gap-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <input ref={ref} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} aria-label={`Tên mới cho ${cat.name}`} onKeyDown={(e) => e.key === "Escape" && (setName(cat.name), setEditing(false))} className={`${input} min-h-10`} />
            <button type="submit" disabled={pending || name.trim().length < 2} aria-label="Lưu tên" className="flex h-10 w-10 flex-none items-center justify-center rounded-full border-0 bg-maroon text-cream disabled:opacity-40"><CheckIcon size={18} /></button>
            <button type="button" onClick={() => (setName(cat.name), setEditing(false))} aria-label="Huỷ" className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-maroon/15 bg-card text-maroon"><XIcon size={16} /></button>
          </form>
        ) : (
          <div className="flex min-w-0 flex-1 flex-col">
            <strong className="truncate text-[16px]">{cat.name}</strong>
            <span className="text-[13px] text-muted">{count ? `${count} ${unit[cat.kind]}` : "Chưa có món"}</span>
          </div>
        )}
      </div>

      {!editing && (
        <div className="flex items-center gap-1 self-end sm:self-auto">
          <button type="button" onClick={() => onMove(index, index - 1)} disabled={index === 0 || pending} aria-label={`Đưa ${cat.name} lên trên`} className="flex h-10 w-10 items-center justify-center rounded-full border-0 bg-transparent text-maroon hover:bg-maroon/6 disabled:opacity-30">
            <ChevronLeftIcon size={18} className="rotate-90" />
          </button>
          <button type="button" onClick={() => onMove(index, index + 1)} disabled={index === total - 1 || pending} aria-label={`Đưa ${cat.name} xuống dưới`} className="flex h-10 w-10 items-center justify-center rounded-full border-0 bg-transparent text-maroon hover:bg-maroon/6 disabled:opacity-30">
            <ChevronRightIcon size={18} className="rotate-90" />
          </button>
          <button type="button" onClick={() => setEditing(true)} className={`${btn.ghost} min-h-10 px-3`}>
            <PencilIcon size={16} /> Đổi tên
          </button>
          {canDelete &&
            (confirm ? (
              <span className="flex items-center gap-1" role="alertdialog" aria-label={`Xoá ${cat.name}?`}>
                <button type="button" onClick={remove} disabled={pending} className="min-h-10 rounded-full border-0 bg-accent px-3.5 text-[14px] font-semibold text-cream">Xoá</button>
                <button type="button" onClick={() => setConfirm(false)} className="min-h-10 rounded-full border border-maroon/15 bg-card px-3 text-[14px] font-semibold text-maroon">Không</button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => (count ? toast(`Còn ${count} ${unit[cat.kind]} trong “${cat.name}” – chuyển sang danh mục khác trước khi xoá.`, "error") : setConfirm(true))}
                aria-label={`Xoá danh mục ${cat.name}`}
                className={`flex h-10 w-10 items-center justify-center rounded-full border border-maroon/15 bg-card text-accent hover:border-accent ${count ? "opacity-40" : ""}`}
              >
                <TrashIcon size={16} />
              </button>
            ))}
        </div>
      )}
    </li>
  );
}

/** Quan ly danh muc banh / do uong: them, doi ten, sap xep (mui ten), xoa danh muc trong */
export function CategoryManager({ kind, categories, counts, canDelete }: { kind: CategoryKind; categories: Category[]; counts: Record<string, number>; canDelete: boolean }) {
  const router = useRouter();
  const [list, setList] = useState(categories);
  const [name, setName] = useState("");
  const [pending, start] = useTransition();

  useEffect(() => setList(categories), [categories]);

  const add = () => {
    const v = name.trim();
    if (v.length < 2) return;
    start(async () => {
      const res = await createCategoryAction({ kind, name: v });
      if (!res.ok) return toast(res.error, "error");
      toast(`Đã thêm danh mục ${v}`);
      setName("");
      router.refresh();
    });
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= list.length) return;
    const next = [...list];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it!);
    setList(next);
    start(async () => {
      const res = await reorderCategoriesAction({ kind, slugs: next.map((c) => c.slug) });
      if (!res.ok) {
        toast(res.error, "error");
        setList(categories);
      } else router.refresh();
    });
  };

  const tabs = [
    { kind: "product" as const, label: "Bánh", href: "/admin/danh-muc" },
    { kind: "drink" as const, label: "Đồ uống", href: "/admin/danh-muc?loai=do-uong" },
  ];

  return (
    <div className="flex max-w-[760px] flex-col gap-4">
      <nav aria-label="Loại danh mục" className="flex gap-1.5">
        {tabs.map((t) => (
          <Link key={t.kind} href={t.href} aria-current={t.kind === kind ? "page" : undefined} className={`inline-flex min-h-10 items-center rounded-full border px-4 text-[14px] font-semibold no-underline ${t.kind === kind ? "border-maroon bg-maroon text-cream hover:text-cream" : "border-maroon/20 bg-card text-maroon hover:text-maroon"}`}>
            {t.label}
          </Link>
        ))}
      </nav>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
        className={`${card} flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:p-4`}
      >
        <label htmlFor="new-category" className="sr-only">Tên danh mục mới</label>
        <input id="new-category" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder={kind === "drink" ? "VD: Trà sữa, Đá xay…" : "VD: Bánh mì, Bánh mùa Trung thu…"} className={input} />
        <button type="submit" disabled={pending || name.trim().length < 2} className={`${btn.primary} flex-none`}>
          <PlusIcon size={16} /> Thêm danh mục
        </button>
      </form>

      <ul aria-label={`Danh mục ${kind === "drink" ? "đồ uống" : "bánh"}`} className={`${card} m-0 list-none overflow-hidden p-0`}>
        {list.map((c, i) => (
          <Row key={c.slug} cat={c} count={counts[c.slug] ?? 0} index={i} total={list.length} canDelete={canDelete} onMove={move} />
        ))}
      </ul>
      <p className="m-0 text-[13px] text-muted">
        Thứ tự ở đây là thứ tự hiện trên web (thực đơn, trang đặt bánh, menu đồ uống). Danh mục chưa có món sẽ không hiện cho khách.
        {canDelete ? " Chỉ xoá được danh mục trống." : " Chỉ chủ tiệm xoá được danh mục."}
      </p>
    </div>
  );
}
