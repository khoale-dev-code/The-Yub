"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { formatVnd } from "@/lib/format";
import { saveProductAction } from "@/modules/admin/actions";
import type { Category } from "@/modules/categories/types";
import { productStatusLabel, type Product, type ProductCategory, type ProductStatus } from "@/modules/products/types";
import { PlusIcon, TrashIcon } from "./admin-icons";
import { CategoryPicker } from "./category-picker";
import { CoverFramer } from "./cover-framer";
import { DeleteButton } from "./delete-button";
import { MediaManager, toItems, type MediaItem } from "./media-manager";
import { Switch } from "./switch";
import { toast } from "./toast";
import { btn, card, input, label, productStatusTone } from "./ui";
import { useStoreInfo } from "@/components/brand/store-info-context";


export const toSlug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

/** Anh cho khi mon chua co anh (giong tren web) */
const PLACEHOLDER = "/images/brand/placeholder-product.png";

const parsePrice = (s: string) => Number(s.replace(/\D/g, "") || "0");
const showPrice = (n: number) => (n ? n.toLocaleString("vi-VN") : "");

interface VariantRow {
  key: string;
  id: string;
  label: string;
  price: number;
}

export function ProductForm({ product, categories, canDelete = false }: { product: Product | null; categories: Category[]; canDelete?: boolean }) {
  const store = useStoreInfo();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [category, setCategory] = useState<ProductCategory>(product?.category ?? categories[0]?.slug ?? "");
  const [tagline, setTagline] = useState(product?.tagline ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product?.priceVnd ?? 0);
  const [compareAt, setCompareAt] = useState(product?.compareAtVnd ?? 0);
  const [status, setStatus] = useState<ProductStatus>(product?.status ?? "ready");
  const [media, setMedia] = useState<MediaItem[]>(() => toItems(product?.media ?? []));
  const [position, setPosition] = useState<string>(product?.imagePosition ?? "center");
  const [isActive, setIsActive] = useState(product?.isActive !== false);
  const [variants, setVariants] = useState<VariantRow[]>(
    (product?.variants ?? []).map((v) => ({ key: v.id, id: v.id, label: v.label, price: v.priceVnd })),
  );

  const finalSlug = slugTouched ? slug : toSlug(name);
  const shownPrice = variants[0]?.price ?? price;
  const coverItem = media.find((m) => m.kind === "image" && m.status !== "error");

  const addVariant = () => setVariants((v) => [...v, { key: crypto.randomUUID(), id: "", label: "", price: 0 }]);

  const submit = () => {
    setError(null);
    if (media.some((m) => m.status === "uploading")) {
      setError("Ảnh / video đang tải lên – đợi xong rồi lưu.");
      return;
    }
    const used = new Set<string>();
    const vs = variants
      .filter((v) => v.label.trim())
      .map((v, i) => {
        let id = v.id || toSlug(v.label).slice(0, 18) || `qc${i + 1}`;
        while (used.has(id)) id = `${id.slice(0, 16)}-${i + 1}`;
        used.add(id);
        return { id, label: v.label.trim(), priceVnd: v.price };
      });
    start(async () => {
      const res = await saveProductAction({
        id: product?.id ?? null,
        name,
        slug: finalSlug,
        category,
        tagline: tagline.trim() || null,
        description,
        priceVnd: vs[0]?.priceVnd ?? price,
        compareAtVnd: compareAt || null,
        status,
        media: media.filter((m) => m.status === "done" && m.ref).map((m) => m.ref as string),
        imagePosition: position === "center" ? null : position,
        isActive,
        variants: vs,
      });
      if (!res.ok) {
        setError(res.error);
        toast(res.error, "error");
        return;
      }
      // Da luu: file moi khong con la "vua tai" (bo sau nay se xoa khi bam Luu)
      setMedia((list) => list.filter((m) => m.status === "done").map((m) => ({ ...m, fresh: false })));
      toast(product ? "Đã lưu thay đổi – web đã cập nhật" : "Đã thêm món mới");
      if (!product && res.id) router.replace(`/admin/mon/${encodeURIComponent(res.id)}`);
      else router.refresh();
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8"
    >
      <div className="flex flex-col gap-5">
        <section className={`${card} flex flex-col gap-4 p-4 md:p-6`}>
          <h2 className="m-0 font-display text-[20px] font-semibold">Thông tin món</h2>
          <label className={label}>
            Tên món
            <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} className={input} placeholder="VD: Croissant bơ" />
          </label>
          <CategoryPicker categories={categories} value={category} onChange={(v) => setCategory(v as ProductCategory)} />
          <label className={label}>
            Đường dẫn trên web
            <span className="flex min-w-0 items-center gap-0 overflow-hidden rounded-[14px] border border-maroon/20 bg-white/70 focus-within:border-maroon">
              <span className="flex-none whitespace-nowrap pl-3.5 text-[14px] text-muted-2">/san-pham/</span>
              <input value={finalSlug} onChange={(e) => { setSlugTouched(true); setSlug(e.target.value.toLowerCase()); }} className="min-h-11 w-full min-w-0 border-0 bg-transparent pr-3 text-[15px] focus:outline-none" aria-describedby="slug-hint" />
            </span>
            <span id="slug-hint" className="text-[12px] font-normal text-muted">Tự tạo từ tên – chữ thường không dấu.</span>
          </label>
          <label className={label}>
            Mô tả ngắn <span className="text-[12px] font-normal text-muted">(hiện trên thẻ bánh, không bắt buộc)</span>
            <input value={tagline} onChange={(e) => setTagline(e.target.value)} maxLength={120} className={input} placeholder="VD: Sô-cô-la đen chảy bên trong." />
          </label>
          <label className={label}>
            Mô tả
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={3} maxLength={600} className={`${input} py-2.5`} />
          </label>
        </section>

        <section className={`${card} flex flex-col gap-4 p-4 md:p-6`}>
          <h2 className="m-0 font-display text-[20px] font-semibold">Giá & quy cách</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={`${label} min-w-0`}>
              Giá bán (VND)
              <input inputMode="numeric" value={showPrice(variants.length ? shownPrice : price)} disabled={variants.length > 0} onChange={(e) => setPrice(parsePrice(e.target.value))} className={`${input} tabular-nums disabled:opacity-60`} placeholder="35.000" />
              {variants.length > 0 && <span className="text-[12px] font-normal text-muted">Lấy theo quy cách đầu tiên.</span>}
            </label>
            {category === "combo" && (
              <label className={label}>
                Giá lẻ khi mua riêng (VND)
                <input inputMode="numeric" value={showPrice(compareAt)} onChange={(e) => setCompareAt(parsePrice(e.target.value))} className={`${input} tabular-nums`} />
              </label>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[14px] font-semibold">Quy cách <span className="font-normal text-muted">(1 cái / hộp 4 / hộp 6… – không bắt buộc)</span></span>
            {variants.map((v, i) => (
              <div key={v.key} className="grid grid-cols-[minmax(0,1fr)_120px_44px] gap-2 sm:grid-cols-[minmax(0,1fr)_160px_44px]">
                <input aria-label={`Tên quy cách ${i + 1}`} value={v.label} onChange={(e) => setVariants((list) => list.map((x) => (x.key === v.key ? { ...x, label: e.target.value } : x)))} placeholder="VD: Hộp 4 cái" maxLength={40} className={input} />
                <input aria-label={`Giá quy cách ${i + 1}`} inputMode="numeric" value={showPrice(v.price)} onChange={(e) => setVariants((list) => list.map((x) => (x.key === v.key ? { ...x, price: parsePrice(e.target.value) } : x)))} placeholder="Giá" className={`${input} tabular-nums`} />
                <button type="button" onClick={() => setVariants((list) => list.filter((x) => x.key !== v.key))} aria-label={`Xoá quy cách ${i + 1}`} className="flex h-11 w-11 items-center justify-center rounded-full border border-maroon/15 bg-card text-accent hover:border-accent"><TrashIcon /></button>
              </div>
            ))}
            <button type="button" onClick={addVariant} className={`${btn.ghost} self-start`}><PlusIcon size={16} /> Thêm quy cách</button>
          </div>
        </section>

        <section className={`${card} flex flex-col gap-4 p-4 md:p-6`}>
          <h2 className="m-0 font-display text-[20px] font-semibold">Ảnh & video</h2>
          <MediaManager items={media} onChange={setMedia} />
          {coverItem && coverItem.kind === "image" && <CoverFramer src={coverItem.src} value={position} onChange={setPosition} />}
        </section>
      </div>

      {/* Cột phải: trạng thái + xem trước + lưu */}
      <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
        <section className={`${card} flex flex-col gap-3 p-4`}>
          <strong className="text-[15px]">Trạng thái hôm nay</strong>
          <div role="radiogroup" aria-label="Trạng thái" className="grid grid-cols-2 gap-1.5">
            {(["ready", "oven", "pre", "out"] as const).map((s) => (
              <button key={s} type="button" role="radio" aria-checked={status === s} onClick={() => setStatus(s)} className={`min-h-10 rounded-[12px] border px-2 text-[13px] font-semibold ${status === s ? `${productStatusTone[s]} border-transparent` : "border-maroon/15 bg-card text-muted"}`}>
                {productStatusLabel(s, store.freshBatchTime)}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-maroon/8 pt-2">
            <span className="text-[14px] font-semibold">Hiện trên web</span>
            <Switch checked={isActive} onChange={setIsActive} label="Hiện trên web" />
          </div>
        </section>

        <section className={`${card} overflow-hidden`} aria-label="Xem trước thẻ bánh">
          <div className="relative aspect-[1/0.92] bg-beige">
            {coverItem?.src.startsWith("blob:") ? (
              // eslint-disable-next-line @next/next/no-img-element -- anh dang tai len (xem truoc tam)
              <img src={coverItem.src} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: position }} />
            ) : (
              <Image src={coverItem?.src ?? PLACEHOLDER} alt="" fill sizes="320px" className="object-cover" style={{ objectPosition: position }} />
            )}
            <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold ${productStatusTone[status]}`}>{productStatusLabel(status, store.freshBatchTime)}</span>
          </div>
          <div className="flex flex-col gap-1 p-4">
            <strong className="font-display text-[18px] font-semibold">{name || "Tên món"}</strong>
            <span className="line-clamp-2 text-[14px] text-muted">{tagline || description || "Mô tả món"}</span>
            <strong className="mt-1">{formatVnd(shownPrice)}</strong>
          </div>
        </section>

        {error && <p role="alert" className="m-0 rounded-2xl bg-rose px-4 py-3 text-[14px] font-semibold text-accent">{error}</p>}
        <div className="sticky bottom-[calc(12px+env(safe-area-inset-bottom))] z-10 flex gap-2 rounded-full bg-[#F7F0E3] p-1 shadow-[0_-10px_24px_-18px_rgba(36,18,13,0.4)] lg:static lg:shadow-none lg:bg-transparent lg:p-0">
          <button type="submit" disabled={pending} className={`${btn.primary} min-h-[52px] flex-1 text-base`}>{pending ? "Đang lưu…" : product ? "Lưu thay đổi" : "Thêm món"}</button>
          <Link href="/admin/mon" className={`${btn.secondary} min-h-[52px]`}>Huỷ</Link>
        </div>
        {product && canDelete && (
          <DeleteButton kind="product" id={product.id} name={product.name} redirectTo="/admin/mon" note="Món biến mất khỏi web và trang quản lý. Đơn cũ vẫn giữ tên món. Chỉ muốn tạm ngừng bán thì tắt “Hiện trên web”." />
        )}
      </aside>
    </form>
  );
}
