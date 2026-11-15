"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { addDays, relativeDateLabel, shortDateLabel, todayVN } from "@/lib/dates";
import { formatVnd } from "@/lib/format";
import { DEFAULT_SLOT_ID, pickupSlots } from "@/lib/pickup";
import { createOrderAdminAction, editOrderAction } from "@/modules/admin/actions";
import { unitPriceOf } from "@/modules/products/pricing";
import { categoryName, type Category } from "@/modules/categories/types";
import type { Product, ProductCategory } from "@/modules/products/types";
import { MinusIcon, PlusIcon } from "@/components/ui/icons";
import { SearchIcon, TrashIcon } from "./admin-icons";
import { toast } from "./toast";
import { btn, card, input, label } from "./ui";

interface Line {
  key: string;
  productId: string;
  variantId?: string;
  qty: number;
  /** Ten luu trong don (khi mon khong con ban) */
  fallbackName?: string;
}

export interface OrderFormInitial {
  code: string;
  customerName: string;
  customerPhone: string;
  pickupDate: string;
  slotId: string;
  payment: "cod" | "transfer";
  note: string;
  paid: boolean;
  items: { productId: string; variantId?: string; qty: number; name: string }[];
}

const lineKey = (productId: string, variantId?: string) => `${productId}::${variantId ?? ""}`;

/** Tao don ho khach (goi dien / inbox) hoac sua don – gia luon do may chu tinh lai */
export function OrderForm({ products, categories, initial }: { products: Product[]; categories: Category[]; initial?: OrderFormInitial }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const today = todayVN();
  const dates = useMemo(() => {
    const list = Array.from({ length: 7 }, (_, i) => addDays(today, i));
    if (initial && !list.includes(initial.pickupDate)) list.unshift(initial.pickupDate);
    return list;
  }, [today, initial]);

  const [lines, setLines] = useState<Line[]>(
    () => initial?.items.map((i) => ({ key: lineKey(i.productId, i.variantId), productId: i.productId, variantId: i.variantId, qty: i.qty, fallbackName: i.name })) ?? [],
  );
  const [name, setName] = useState(initial?.customerName ?? "");
  const [phone, setPhone] = useState(initial?.customerPhone ?? "");
  const [date, setDate] = useState(initial?.pickupDate ?? addDays(today, 1));
  const [slotId, setSlotId] = useState(initial?.slotId ?? DEFAULT_SLOT_ID);
  const [payment, setPayment] = useState<"cod" | "transfer">(initial?.payment ?? "cod");
  const [note, setNote] = useState(initial?.note ?? "");
  const [confirmNow, setConfirmNow] = useState(true);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<ProductCategory | "all">("all");
  const [variantPick, setVariantPick] = useState<Record<string, string>>({});

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const rows = lines.map((l) => {
    const p = byId.get(l.productId);
    const unit = p ? unitPriceOf(p, l.variantId) : null;
    const variant = p?.variants?.find((v) => v.id === l.variantId)?.label;
    return { ...l, product: p, unit, label: p ? (variant ? `${p.name} – ${variant}` : p.name) : (l.fallbackName ?? "Món không còn bán") };
  });
  const invalid = rows.filter((r) => !r.product || r.unit === null || r.product.status === "out");
  const total = rows.reduce((n, r) => n + (r.unit ?? 0) * r.qty, 0);
  const count = rows.reduce((n, r) => n + r.qty, 0);

  const add = (p: Product) => {
    const variantId = p.variants?.length ? (variantPick[p.id] ?? p.variants[0]?.id) : undefined;
    const key = lineKey(p.id, variantId);
    setLines((ls) => (ls.some((l) => l.key === key) ? ls.map((l) => (l.key === key ? { ...l, qty: Math.min(20, l.qty + 1) } : l)) : [...ls, { key, productId: p.id, variantId, qty: 1 }]));
  };
  const setQty = (key: string, qty: number) => setLines((ls) => (qty <= 0 ? ls.filter((l) => l.key !== key) : ls.map((l) => (l.key === key ? { ...l, qty: Math.min(20, qty) } : l))));

  const term = q.trim().toLowerCase();
  const pickable = products.filter((p) => (cat === "all" || p.category === cat) && (!term || p.name.toLowerCase().includes(term)));

  const submit = () => {
    setError(null);
    if (lines.length === 0) return setError("Chọn ít nhất 1 món.");
    if (invalid.length) return setError("Có món không còn bán / đã hết – xoá dòng đó trước khi lưu.");
    const payload = {
      customer: { name, phone },
      pickupDate: date,
      slotId,
      payment,
      note: note.trim() || undefined,
      items: lines.map((l) => ({ productId: l.productId, variantId: l.variantId, qty: l.qty })),
    };
    start(async () => {
      const res = initial
        ? await editOrderAction({ ...payload, code: initial.code })
        : await createOrderAdminAction({ ...payload, idempotencyKey: crypto.randomUUID(), confirmNow });
      if (!res.ok) {
        setError(res.error);
        toast(res.error, "error");
        return;
      }
      toast(initial ? `Đã lưu đơn ${initial.code}` : `Đã tạo đơn ${res.id ?? ""}`);
      router.push(`/admin/don-hang/${res.id ?? initial?.code ?? ""}`);
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8"
    >
      <div className="flex min-w-0 flex-col gap-5">
        {/* Món trong đơn */}
        <section className={`${card} flex flex-col gap-3 p-4 md:p-5`}>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="m-0 font-display text-[20px] font-semibold">Món trong đơn</h2>
            <span className="text-[14px] text-muted">{count} món</span>
          </div>
          {rows.length === 0 ? (
            <p className="m-0 rounded-2xl border border-dashed border-maroon/20 px-4 py-6 text-center text-[14px] text-muted">Chưa có món – chọn ở danh sách bên dưới.</p>
          ) : (
            <ul className="m-0 flex list-none flex-col p-0">
              {rows.map((r) => (
                <li key={r.key} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 border-b border-maroon/8 py-2.5 last:border-b-0">
                  <span className="flex min-w-0 flex-col">
                    <strong className="truncate text-[15px]">{r.label}</strong>
                    {r.product && r.unit !== null && r.product.status !== "out" ? (
                      <span className="text-[13px] text-muted tabular-nums">{formatVnd(r.unit)} · {formatVnd(r.unit * r.qty)}</span>
                    ) : (
                      <span className="text-[13px] font-semibold text-accent">{r.product?.status === "out" ? "Đang hết – xoá hoặc đổi món" : "Không còn bán – xoá dòng này"}</span>
                    )}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-maroon/20 bg-card">
                    <button type="button" onClick={() => setQty(r.key, r.qty - 1)} aria-label={`Giảm 1 ${r.label}`} className="flex h-9 w-9 items-center justify-center border-0 bg-transparent text-maroon"><MinusIcon size={15} /></button>
                    <span className="w-6 text-center font-bold tabular-nums">{r.qty}</span>
                    <button type="button" onClick={() => setQty(r.key, r.qty + 1)} aria-label={`Tăng 1 ${r.label}`} className="flex h-9 w-9 items-center justify-center border-0 bg-transparent text-maroon"><PlusIcon size={15} /></button>
                  </span>
                  <button type="button" onClick={() => setQty(r.key, 0)} aria-label={`Xoá ${r.label}`} className="flex h-9 w-9 items-center justify-center rounded-full border-0 bg-transparent text-accent hover:bg-rose"><TrashIcon /></button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Chọn món */}
        <section className={`${card} flex flex-col gap-3 p-4 md:p-5`}>
          <h2 className="m-0 font-display text-[20px] font-semibold">Thêm món</h2>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-2" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm món…" aria-label="Tìm món" className={`${input} pl-10`} />
          </div>
          <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
            {["all", ...categories.filter((x) => products.some((p) => p.category === x.slug)).map((x) => x.slug)].map((c) => (
              <button key={c} type="button" onClick={() => setCat(c)} aria-pressed={cat === c} className={`min-h-9 flex-none rounded-full border-0 px-3 text-[13px] font-semibold ${cat === c ? "bg-dark text-cream" : "bg-beige/70 text-muted"}`}>
                {c === "all" ? "Tất cả" : categoryName(categories, c)}
              </button>
            ))}
          </div>
          <ul className="m-0 grid max-h-[420px] list-none gap-1.5 overflow-y-auto p-0 sm:grid-cols-2">
            {pickable.map((p) => {
              const out = p.status === "out";
              const vId = variantPick[p.id] ?? p.variants?.[0]?.id;
              const price = unitPriceOf(p, vId) ?? p.priceVnd;
              return (
                <li key={p.id} className={`flex items-center gap-2.5 rounded-[16px] border border-maroon/8 p-2 ${out ? "opacity-50" : ""}`}>
                  <span className="relative h-11 w-11 flex-none overflow-hidden rounded-xl bg-beige">
                    <Image src={p.cover} alt="" fill sizes="44px" className="object-cover" style={{ objectPosition: p.imagePosition ?? "center" }} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[14px] font-semibold">{p.name}</span>
                    {p.variants && p.variants.length > 1 ? (
                      <select value={vId} onChange={(e) => setVariantPick((m) => ({ ...m, [p.id]: e.target.value }))} aria-label={`Quy cách ${p.name}`} className="mt-0.5 min-h-8 rounded-lg border border-maroon/15 bg-white/70 px-1.5 text-[12px]">
                        {p.variants.map((v) => <option key={v.id} value={v.id}>{v.label} · {formatVnd(v.priceVnd)}</option>)}
                      </select>
                    ) : (
                      <span className="text-[12px] text-muted tabular-nums">{out ? "Đang hết" : formatVnd(price)}</span>
                    )}
                  </span>
                  <button type="button" disabled={out} onClick={() => add(p)} aria-label={`Thêm ${p.name}`} className="flex h-10 w-10 flex-none items-center justify-center rounded-full border-0 bg-maroon text-cream disabled:bg-maroon/20">
                    <PlusIcon size={16} />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      {/* Thông tin khách + nhận bánh */}
      <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
        <section className={`${card} flex flex-col gap-3 p-4 md:p-5`}>
          <h2 className="m-0 font-display text-[20px] font-semibold">Khách hàng</h2>
          <label className={label}>
            Họ tên
            <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} autoComplete="off" className={input} />
          </label>
          <label className={label}>
            Số điện thoại
            <input value={phone} onChange={(e) => setPhone(e.target.value)} required inputMode="tel" maxLength={16} autoComplete="off" className={`${input} tabular-nums`} />
          </label>
        </section>

        <section className={`${card} flex flex-col gap-3 p-4 md:p-5`}>
          <h2 className="m-0 font-display text-[20px] font-semibold">Nhận bánh</h2>
          <div role="radiogroup" aria-label="Ngày nhận" className="grid grid-cols-4 gap-1.5">
            {dates.map((d) => (
              <button key={d} type="button" role="radio" aria-checked={date === d} onClick={() => setDate(d)} className={`flex min-h-[54px] flex-col items-center justify-center rounded-[14px] border text-[12px] font-semibold leading-tight ${date === d ? "border-maroon bg-maroon text-cream" : "border-maroon/15 bg-card text-maroon"}`}>
                <span>{relativeDateLabel(d, today).replace(/ \d+\/\d+$/, "")}</span>
                <span className="text-[13px] font-bold">{shortDateLabel(d).split(" ")[1]}</span>
              </button>
            ))}
          </div>
          <div role="radiogroup" aria-label="Khung giờ" className="grid grid-cols-3 gap-1.5">
            {pickupSlots.map((s) => (
              <button key={s.id} type="button" role="radio" aria-checked={slotId === s.id} onClick={() => setSlotId(s.id)} className={`min-h-10 rounded-[12px] border px-1 text-[12px] font-semibold tabular-nums ${slotId === s.id ? "border-maroon bg-maroon text-cream" : "border-maroon/15 bg-card text-maroon"}`}>
                {s.label}
              </button>
            ))}
          </div>
          <div role="radiogroup" aria-label="Thanh toán" className="grid grid-cols-2 gap-1.5">
            {(["cod", "transfer"] as const).map((m) => (
              <button key={m} type="button" role="radio" aria-checked={payment === m} onClick={() => setPayment(m)} disabled={initial?.paid} className={`min-h-10 rounded-[12px] border text-[13px] font-semibold disabled:opacity-50 ${payment === m ? "border-maroon bg-maroon text-cream" : "border-maroon/15 bg-card text-maroon"}`}>
                {m === "cod" ? "Trả khi nhận" : "Chuyển khoản"}
              </button>
            ))}
          </div>
          <label className={label}>
            Ghi chú
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={500} placeholder="VD: viết chữ “Happy Birthday” trên bánh" className={`${input} py-2.5`} />
          </label>
          {!initial && (
            <label className="flex min-h-11 items-center gap-2.5 text-[14px] font-semibold">
              <input type="checkbox" checked={confirmNow} onChange={(e) => setConfirmNow(e.target.checked)} className="h-5 w-5 accent-[#3b0f12]" />
              Xác nhận đơn luôn (đã nói chuyện với khách)
            </label>
          )}
        </section>

        {error && <p role="alert" className="m-0 rounded-2xl bg-rose px-4 py-3 text-[14px] font-semibold text-accent">{error}</p>}
        <div className="sticky bottom-[76px] z-10 flex items-center gap-3 rounded-[22px] bg-dark p-2 pl-5 text-cream shadow-[0_14px_30px_-12px_rgba(36,18,13,0.5)] lg:static">
          <span className="flex flex-1 flex-col leading-tight">
            <span className="text-[12px] text-cream/70">Tạm tính · {count} món</span>
            <strong className="font-display text-[20px] font-semibold tabular-nums">{formatVnd(total)}</strong>
          </span>
          <Link href={initial ? `/admin/don-hang/${initial.code}` : "/admin/don-hang"} className="min-h-11 rounded-full px-3 text-[14px] font-semibold leading-[44px] text-cream/80 no-underline hover:text-cream">Huỷ</Link>
          <button type="submit" disabled={pending} className={`${btn.butter} min-h-12 px-6`}>{pending ? "Đang lưu…" : initial ? "Lưu đơn" : "Tạo đơn"}</button>
        </div>
      </aside>
    </form>
  );
}
