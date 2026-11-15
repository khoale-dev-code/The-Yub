import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { CatalogBrowser } from "@/components/catalog/catalog-browser";
import { ArrowRightIcon } from "@/components/ui/icons";
import { formatVnd } from "@/lib/format";
import { productImages } from "@/lib/images";
import { productsRepository } from "@/modules/products/repository";
import { categoryLabels, type Product, type ProductCategory } from "@/modules/products/types";

export const metadata: Metadata = {
  title: "Thực đơn bánh",
  description: "Croissant, tart, bánh kem ra lò lúc 14:30. Chọn món, hẹn giờ ghé lấy khi bánh còn ấm.",
};

const features: { label: [string, string]; icon: React.ReactNode }[] = [
  { label: ["Ra lò 14:30", "mỗi chiều"], icon: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></> },
  { label: ["Nướng", "mẻ nhỏ"], icon: <path d="M12 21c-3.6 0-6-2.4-6-5.6 0-3.4 3-5 3.6-8.4 2 1.4 2.4 3.4 2.4 4.6.9-.8 1.5-2 1.6-3.4 2.4 1.8 4.4 4.4 4.4 7.2 0 3.2-2.4 5.6-6 5.6z" /> },
  { label: ["Bột ủ", "qua đêm"], icon: <path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z" /> },
  { label: ["Đặt trước", "online"], icon: <><rect x="4" y="5.5" width="16" height="14.5" rx="2.5" /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" /></> },
  { label: ["Hẹn giờ", "ghé lấy"], icon: <><path d="M5 8h14l-1 12H6L5 8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></> },
  { label: ["Hộp quà", "gói sẵn"], icon: <><rect x="4" y="9" width="16" height="11" rx="1.5" /><path d="M3 9h18M12 9v11M12 9c-1.5-3.5-5.5-4-5.5-1.5S10 9 12 9zm0 0c1.5-3.5 5.5-4 5.5-1.5S14 9 12 9z" /></> },
];

const favorites: { slug: string; tag: string; tint: string }[] = [
  { slug: "croissant-so-co-la", tag: "Bán chạy", tint: "#F6D58E" },
  { slug: "tart-trung", tag: "Bán chạy", tint: "#F1DCCB" },
  { slug: "croissant-mam-xoi", tag: "Mới", tint: "#E3EBD3" },
  { slug: "banh-kem-dau", tag: "Mới", tint: "#EFE4D1" },
];

export default async function ThucDonPage({ searchParams }: { searchParams: Promise<{ q?: string | string[]; loai?: string | string[] }> }) {
  const { q, loai } = await searchParams;
  const query = typeof q === "string" ? q.slice(0, 60) : "";
  const initialCategory = typeof loai === "string" && loai in categoryLabels ? (loai as ProductCategory) : "all";
  const products = await productsRepository.list();
  const find = (slug: string) => products.find((p) => p.slug === slug);
  const raspberry = find("croissant-mam-xoi");
  const giftBox = find("hop-tart-7-vi");
  const favs = favorites.map((f) => ({ ...f, product: find(f.slug) })).filter((f): f is typeof f & { product: Product } => Boolean(f.product));

  return (
    <>
      {/* HERO dạng thẻ */}
      <section className="mx-auto max-w-[1248px] px-3 pt-3 sm:px-6 sm:pt-7">
        <div className="relative grid overflow-hidden rounded-[26px] bg-beige md:min-h-[500px] md:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] md:rounded-[32px]">
          <div className="order-2 flex flex-col items-start justify-center gap-3 px-[18px] pb-[22px] pt-5 md:order-1 md:gap-5 md:py-14 md:pl-16 md:pr-14">
            <nav aria-label="Đường dẫn" className="text-[13px] text-muted md:text-sm">
              <Link href="/" className="text-muted">Trang chủ</Link> <span aria-hidden="true">/</span> Thực đơn bánh
            </nav>
            <h1 className="m-0 text-balance font-display text-[38px] font-semibold leading-[1.02] tracking-[-0.02em] md:text-[clamp(52px,5.6vw,80px)]">Bánh nướng mỗi chiều</h1>
            <p className="m-0 max-w-[420px] text-muted md:text-lg">Croissant, tart, bánh kem ra lò lúc 14:30. Chọn món, hẹn giờ ghé lấy khi bánh còn ấm.</p>
            <div className="mt-1 grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:gap-3 md:mt-1.5">
              <a href="#danh-sach" className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-full bg-maroon px-[26px] font-semibold text-cream no-underline hover:bg-accent hover:text-cream md:min-h-[54px]">
                <span className="sm:hidden">Xem tất cả</span><span className="hidden sm:inline">Xem tất cả bánh</span> <ArrowRightIcon className="hidden sm:block" />
              </a>
              <Link href="/thuc-don?loai=cake#tat-ca" className="inline-flex min-h-[50px] items-center justify-center rounded-full border-[1.5px] border-maroon px-6 font-semibold text-maroon no-underline hover:bg-maroon hover:text-cream md:min-h-[54px]">Đặt bánh kem</Link>
            </div>
          </div>
          <div className="relative order-1 h-[250px] md:order-2 md:h-auto">
            <Image src={productImages.choco} alt="Croissant sô-cô-la vừa ra lò" fill priority sizes="(min-width: 768px) 640px, 100vw" className="object-cover" style={{ objectPosition: "center 45%" }} />
            <div className="absolute right-3.5 top-3.5 flex rotate-4 flex-col rounded-xl bg-butter px-3 py-[7px] leading-[1.2] text-maroon shadow-[0_12px_24px_rgba(36,18,13,0.25)] md:right-7 md:top-7 md:rounded-2xl md:px-[18px] md:py-3">
              <span className="text-[11px] font-semibold md:text-[13px]">Mẻ chiều nay</span>
              <strong className="font-display text-[19px] font-semibold md:text-[26px]">14:30</strong>
            </div>
            {raspberry && (
              <Link href={`/san-pham/${raspberry.slug}`} className="absolute bottom-7 left-7 hidden items-center gap-3 rounded-full bg-card py-2 pl-2 pr-[18px] no-underline shadow-[0_12px_24px_rgba(36,18,13,0.2)] md:flex">
                <span className="relative h-[52px] w-[52px] overflow-hidden rounded-full">
                  <Image src={productImages[raspberry.image]} alt="" fill sizes="52px" className="object-cover" />
                </span>
                <span className="flex flex-col leading-[1.25]">
                  <strong className="text-[15px]">{raspberry.name}</strong>
                  <span className="text-sm text-muted">{formatVnd(raspberry.priceVnd)} · Xem bánh →</span>
                </span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Hàng cam kết */}
      <section className="mx-auto max-w-[1200px] px-4 pb-2 pt-8 sm:px-6 md:pt-10">
        <ul className="m-0 grid list-none grid-cols-3 gap-y-6 p-0 lg:grid-cols-6">
          {features.map((f, i) => (
            <li key={f.label.join(" ")} className={`flex flex-col items-center gap-2.5 border-maroon/15 px-2 py-1 text-center sm:px-3 ${i % 3 !== 0 ? "border-l" : ""} ${i === 3 ? "lg:border-l" : ""}`}>
              <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-full bg-maroon text-cream sm:h-14 sm:w-14">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">{f.icon}</svg>
              </span>
              <span className="text-[13px] font-semibold leading-[1.35] sm:text-[15px]">{f.label[0]}<br />{f.label[1]}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Được yêu thích */}
      <section className="mx-auto max-w-[1248px] px-3 pt-8 sm:px-6 md:pt-10">
        <div className="flex flex-col gap-5 rounded-[26px] bg-cream px-4 pb-6 pt-7 sm:gap-7 md:rounded-[32px] md:px-10 md:pb-10 md:pt-11">
          <div className="flex items-end justify-between gap-4">
            <h2 className="m-0 font-display text-[32px] font-semibold leading-[1.05] tracking-[-0.015em] md:text-[clamp(40px,4.4vw,56px)]">Được yêu thích</h2>
            <a href="#tat-ca" className="inline-flex min-h-11 items-center gap-2 font-semibold">Xem tất cả <ArrowRightIcon /></a>
          </div>
          <div className="no-scrollbar relative -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-4 md:gap-5 md:overflow-visible md:px-0">
            {favs.map(({ product: p, tag, tint }) => (
              <article key={p.id} className="flex w-[72%] flex-none snap-start flex-col overflow-hidden rounded-[22px] bg-card shadow-[0_14px_30px_-22px_rgba(59,15,18,0.5)] sm:w-[44%] md:w-auto">
                <Link href={`/san-pham/${p.slug}`} aria-label={`Xem ${p.name}`} className="group relative block aspect-[1/0.92] overflow-hidden" style={{ background: tint }}>
                  <Image src={productImages[p.image]} alt={p.name} fill sizes="(min-width: 768px) 280px, 72vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" style={{ objectPosition: p.imagePosition ?? "center" }} />
                  <span className="absolute left-3 top-3 rounded-full bg-card px-3 py-1 text-xs font-bold text-maroon">{tag}</span>
                </Link>
                <div className="flex grow flex-col gap-0.5 px-4 pb-[18px] pt-4">
                  <h3 className="m-0 font-display text-[19px] font-semibold leading-[1.25]"><Link href={`/san-pham/${p.slug}`} className="no-underline">{p.name}</Link></h3>
                  <span className="text-sm text-muted">{p.tagline ?? p.description}</span>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-3.5">
                    <span className="font-display text-[19px] font-semibold">{formatVnd(p.priceVnd)}</span>
                    <AddToCartButton productId={p.id} productName={p.name} variantId={p.variants?.[0]?.id} tone="filled" size={44} disabled={p.status === "out"} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <CatalogBrowser products={products} initialQuery={query} initialCategory={initialCategory} />

      {/* Nguyên liệu */}
      <section className="mx-auto grid max-w-[1200px] items-center gap-8 px-4 pb-20 pt-6 sm:px-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,2fr)] md:gap-14 md:pb-24">
        <div className="flex flex-col gap-4">
          <h2 className="m-0 text-balance font-display text-[34px] font-semibold leading-[1.04] tracking-[-0.015em] md:text-[clamp(40px,4.4vw,58px)]">Nguyên liệu thật, bánh ngon thật</h2>
          <svg aria-hidden="true" width="200" height="14" viewBox="0 0 200 14" fill="none"><path d="M3 9c40-6 110-8 194-3" stroke="#E8A93B" strokeWidth={6} strokeLinecap="round" /></svg>
        </div>
        <div className="flex flex-col gap-7">
          <div className="grid grid-cols-1 gap-7 sm:grid-cols-3">
            {[
              { img: "/images/ingredients/rolling-dough.jpg", pos: "55% 55%", alt: "Đôi tay cán bột bằng cây cán gỗ", title: "Bơ lạt cán tay", text: "Gấp bột với bơ lạnh nhiều lần để vỏ bánh tách lớp, giòn rụm." },
              { img: "/images/ingredients/flour-eggs.jpg", pos: "40% 42%", alt: "Bột mì, trứng và bơ trên mặt bàn", title: "Bột ủ qua đêm", text: "Bột, trứng, bơ thật – nghỉ lạnh từ tối hôm trước cho vị thơm và ruột mềm dai nhẹ." },
              { img: "/images/ingredients/fruit-tarts.jpg", pos: "50% 52%", alt: "Tart trái cây với việt quất, dâu, cherry, cam và kiwi", title: "Trái cây tươi", text: "Dâu, việt quất, cherry, kiwi… cắt trong ngày cho tart và bánh kem." },
            ].map((n) => (
              <div key={n.title} className="flex items-start gap-4 sm:flex-col sm:gap-2.5">
                <span className="relative h-24 w-24 flex-none overflow-hidden rounded-full sm:h-[150px] sm:w-[150px]">
                  <Image src={n.img} alt={n.alt} fill sizes="150px" className="object-cover" style={{ objectPosition: n.pos }} />
                </span>
                <span className="flex flex-col gap-2.5">
                  <h3 className="m-0 font-display text-xl font-semibold sm:mt-1.5">{n.title}</h3>
                  <p className="m-0 text-[15px] text-muted">{n.text}</p>
                </span>
              </div>
            ))}
          </div>
          <Link href="/#cau-chuyen" className="inline-flex min-h-[50px] items-center gap-2 self-center rounded-full bg-maroon px-6 font-semibold text-cream no-underline hover:bg-accent hover:text-cream">
            Câu chuyện của tiệm <ArrowRightIcon />
          </Link>
        </div>
      </section>

      {/* Băng chia đôi: hộp quà */}
      {giftBox && (
        <section className="mx-auto max-w-[1248px] px-3 pb-20 sm:px-6 md:pb-24">
          <div className="grid overflow-hidden rounded-[26px] md:min-h-[380px] md:grid-cols-2 md:rounded-[32px]">
            <div className="relative h-60 md:h-auto">
              <Image src={productImages.berryTartBox} alt="Hộp tart trái cây xếp sẵn" fill sizes="(min-width: 768px) 620px, 100vw" className="object-cover" />
            </div>
            <div className="relative flex flex-col items-start justify-center gap-4 overflow-hidden bg-rose px-6 py-10 md:px-14 md:py-12">
              <h2 className="relative m-0 max-w-[360px] text-balance font-display text-[34px] font-semibold leading-[1.08] tracking-[-0.01em] md:text-[44px]">{giftBox.name} cho buổi gặp mặt</h2>
              <p className="relative m-0 max-w-[320px] text-ink">Đặt trước 1 ngày, tiệm gói hộp sẵn để bạn mang đi tặng.</p>
              <Link href={`/san-pham/${giftBox.slug}`} className="relative inline-flex min-h-[52px] items-center gap-2 rounded-full bg-maroon px-6 font-semibold text-cream no-underline hover:bg-accent hover:text-cream">
                Đặt hộp quà · {formatVnd(giftBox.priceVnd)} <ArrowRightIcon />
              </Link>
              <span aria-hidden="true" className="absolute -bottom-[70px] -right-[70px] hidden h-60 w-60 overflow-hidden rounded-full border-8 border-card sm:block">
                <Image src={productImages.tartRack} alt="" fill sizes="240px" className="object-cover" />
              </span>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
