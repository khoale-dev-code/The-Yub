"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { formatVnd } from "@/lib/format";
import { productImages, type ProductImageKey } from "@/lib/images";
import { saveProductAction } from "@/modules/admin/actions";
import { categoryLabels, productCategories, productStatusLabels, type Product, type ProductCategory, type ProductStatus } from "@/modules/products/types";
import { PlusIcon, TrashIcon } from "./admin-icons";
import { DeleteButton } from "./delete-button";
import { Switch } from "./switch";
import { toast } from "./toast";
import { btn, card, input, label, productStatusTone } from "./ui";

const POSITIONS = [
  { v: "center 30%", l: "Trên" },
  { v: "center 45%", l: "Giữa trên" },
  { v: "center", l: "Giữa" },
  { v: "center 60%", l: "Giữa dưới" },
  { v: "center 75%", l: "Dưới" },
] as const;

export const toSlug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const parsePrice = (s: string) => Number(s.replace(/\D/g, "") || "0");
const showPrice = (n: number) => (n ? n.toLocaleString("vi-VN") : "");

interface VariantRow {
  key: string;
  id: string;
  label: string;
  price: number;
}

export function ProductForm({ product, canDelete = false }: { product: Product | null; canDelete?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [category, setCategory] = useState<ProductCategory>(product?.category ?? "croissant");
  const [tagline, setTagline] = useState(product?.tagline ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product?.priceVnd ?? 0);
  const [compareAt, setCompareAt] = useState(product?.compareAtVnd ?? 0);
  const [status, setStatus] = useState<ProductStatus>(product?.status ?? "ready");
  const [image, setImage] = useState<ProductImageKey>(product?.image ?? "cubeStack");
  const [position, setPosition] = useState<string>(product?.imagePosition ?? "center");
  const [isActive, setIsActive] = useState(product?.isActive !== false);
  const [variants, setVariants] = useState<VariantRow[]>(
    (product?.variants ?? []).map((v) => ({ key: v.id, id: v.id, label: v.label, price: v.priceVnd })),
  );

  const finalSlug = slugTouched ? slug : toSlug(name);
  const shownPrice = variants[0]?.price ?? price;
  const imageKeys = useMemo(() => Object.keys(productImages) as ProductImageKey[], []);

  const addVariant = () => setVariants((v) => [...v, { key: crypto.randomUUID(), id: "", label: "", price: 0 }]);

  const submit = () => {
    setError(null);
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
        image,
        imagePosition: position === "center" ? null : position,
        isActive,
        variants: vs,
      });
      if (!res.ok) {
        setError(res.error);
        toast(res.error, "error");
        return;
      }
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
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={label}>
              Loại
              <select value={category} onChange={(e) => setCategory(e.target.value as ProductCategory)} className={input}>
                {productCategories.map((c) => (
                  <option key={c} value={c}>{categoryLabels[c]}</option>
                ))}
              </select>
            </label>
            <label className={label}>
              Đường dẫn trên web
              <span className="flex items-center gap-0 overflow-hidden rounded-[14px] border border-maroon/20 bg-white/70 focus-within:border-maroon">
                <span className="flex-none whitespace-nowrap pl-3.5 text-[14px] text-muted-2">/san-pham/</span>
                <input value={finalSlug} onChange={(e) => { setSlugTouched(true); setSlug(e.target.value.toLowerCase()); }} className="min-h-11 w-full border-0 bg-transparent pr-3 text-[15px] focus:outline-none" aria-describedby="slug-hint" />
              </span>
              <span id="slug-hint" className="text-[12px] font-normal text-muted">Tự tạo từ tên – chữ thường không dấu.</span>
            </label>
          </div>
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
            <label className={label}>
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
          <h2 className="m-0 font-display text-[20px] font-semibold">Ảnh</h2>
          <div role="radiogroup" aria-label="Chọn ảnh" className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-7">
            {imageKeys.map((k) => (
              <button key={k} type="button" role="radio" aria-checked={image === k} aria-label={k} onClick={() => setImage(k)} className={`relative aspect-square overflow-hidden rounded-[14px] border-0 p-0 ring-offset-2 ring-offset-card ${image === k ? "ring-[3px] ring-maroon" : "opacity-80 hover:opacity-100"}`}>
                <Image src={productImages[k]} alt="" fill sizes="96px" className="object-cover" />
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[14px] font-semibold">Phần ảnh hiển thị</span>
            <div className="flex flex-wrap gap-1.5">
              {POSITIONS.map((p) => (
                <button key={p.v} type="button" aria-pressed={position === p.v} onClick={() => setPosition(p.v)} className={`min-h-9 rounded-full border px-3 text-[13px] font-semibold ${position === p.v ? "border-maroon bg-maroon text-cream" : "border-maroon/20 bg-card text-maroon"}`}>{p.l}</button>
              ))}
            </div>
          </div>
          <p className="m-0 text-[13px] text-muted">Ảnh lấy từ thư viện ảnh của web (public/images/products). Thay ảnh thật của tiệm bằng cách thay file cùng tên.</p>
        </section>
      </div>

      {/* Cột phải: trạng thái + xem trước + lưu */}
      <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
        <section className={`${card} flex flex-col gap-3 p-4`}>
          <strong className="text-[15px]">Trạng thái hôm nay</strong>
          <div role="radiogroup" aria-label="Trạng thái" className="grid grid-cols-2 gap-1.5">
            {(["ready", "oven", "pre", "out"] as const).map((s) => (
              <button key={s} type="button" role="radio" aria-checked={status === s} onClick={() => setStatus(s)} className={`min-h-10 rounded-[12px] border px-2 text-[13px] font-semibold ${status === s ? `${productStatusTone[s]} border-transparent` : "border-maroon/15 bg-card text-muted"}`}>
                {productStatusLabels[s]}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-maroon/8 pt-2">
            <span className="text-[14px] font-semibold">Hiện trên web</span>
            <Switch checked={isActive} onChange={setIsActive} label="Hiện trên web" />
          </div>
        </section>

        <section className={`${card} overflow-hidden`} aria-label="Xem trước thẻ bánh">
          <div className="relative aspect-[4/3] bg-beige">
            <Image src={productImages[image]} alt="" fill sizes="320px" className="object-cover" style={{ objectPosition: position }} />
            <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold ${productStatusTone[status]}`}>{productStatusLabels[status]}</span>
          </div>
          <div className="flex flex-col gap-1 p-4">
            <strong className="font-display text-[18px] font-semibold">{name || "Tên món"}</strong>
            <span className="line-clamp-2 text-[14px] text-muted">{tagline || description || "Mô tả món"}</span>
            <strong className="mt-1">{formatVnd(shownPrice)}</strong>
          </div>
        </section>

        {error && <p role="alert" className="m-0 rounded-2xl bg-rose px-4 py-3 text-[14px] font-semibold text-accent">{error}</p>}
        <div className="sticky bottom-[76px] z-10 flex gap-2 rounded-full bg-[#F7F0E3]/90 p-1 backdrop-blur lg:static lg:bg-transparent lg:p-0">
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
