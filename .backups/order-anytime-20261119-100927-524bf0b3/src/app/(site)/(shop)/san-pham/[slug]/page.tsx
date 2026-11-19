import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FavoriteButton } from "@/components/favorite-button";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductPurchase } from "@/components/product-purchase";
import { ArrowRightIcon, BagIcon, ClockIcon } from "@/components/ui/icons";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatVnd } from "@/lib/format";
import { productImages } from "@/lib/images";
import { getStoreInfo } from "@/modules/settings/store-info-server";
import { productsRepository } from "@/modules/products/repository";
import type { Product, ProductDetails } from "@/modules/products/types";

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  const products = await productsRepository.list();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await productsRepository.findBySlug(slug);
  if (!product) return { title: "Không tìm thấy bánh" };
  return { title: product.name, description: product.description };
}

const chips = [
  { label: "Bơ lạt cán tay", d: "M4 8h16M4 12h16M4 16h16" },
  { label: "Bột ủ qua đêm", d: "M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z" },
  { label: "Nướng mẻ nhỏ", d: "M12 21c-3.6 0-6-2.4-6-5.6 0-3.4 3-5 3.6-8.4 2 1.4 2.4 3.4 2.4 4.6.9-.8 1.5-2 1.6-3.4 2.4 1.8 4.4 4.4 4.4 7.2 0 3.2-2.4 5.6-6 5.6z" },
];

/** Noi dung mac dinh khi chu tiem chua nhap chi tiet cho mon (khong tu bia thanh phan). */
function detailsOf(p: Product, fresh: string): ProductDetails {
  if (p.details) return p.details;
  return {
    highlights: [
      { title: "Làm trong ngày", text: "Hoàn thiện theo từng mẻ nhỏ.", src: p.cover },
      { title: `Mẻ chiều ${fresh}`, text: "Đặt trước để giữ phần.", image: "tartRack" },
      { title: "Hợp cùng đồ uống", text: "Thử cùng cà phê hoặc trà.", image: "croissantCoffee" },
    ],
    ingredients: "Thành phần chi tiết đang chờ tiệm cập nhật.",
    allergens: "Có thể chứa gluten, sữa, trứng; làm chung bếp với các loại hạt.",
  };
}

const usage: Record<string, { best: string; keep: string; warm: string }> = {
  croissant: { best: "Trong ngày", keep: "Nơi khô thoáng", warm: "Lò 160°C · 4 phút" },
  tart: { best: "Trong ngày", keep: "Ngăn mát", warm: "Không cần" },
  cake: { best: "Trong 24 giờ", keep: "Ngăn mát", warm: "Không cần" },
  cookie: { best: "Trong 5 ngày", keep: "Hộp kín, nơi khô", warm: "Không cần" },
  combo: { best: "Dùng ngay", keep: "—", warm: "—" },
};

export default async function SanPhamPage({ params }: { params: Promise<Params> }) {
  const store = await getStoreInfo();
  const { slug } = await params;
  const product = await productsRepository.findBySlug(slug);
  if (!product) notFound();

  const all = await productsRepository.list();
  const related = all.filter((p) => p.id !== product.id && p.status !== "out").sort((a, b) => Number(b.category === product.category) - Number(a.category === product.category)).slice(0, 5);
  const details = detailsOf(product, store.freshBatchTime);
  // Danh muc tu them trong Admin chua co huong dan rieng -> dung muc chung
  const use = usage[product.category] ?? { best: "Trong ngày", keep: "Theo hướng dẫn của tiệm", warm: "—" };

  return (
    <div className="mx-auto flex max-w-[1248px] flex-col gap-6 px-3 pt-4 sm:px-6 sm:pt-5 md:gap-7">
      <nav aria-label="Đường dẫn" className="px-1 text-[13px] text-muted sm:text-sm">
        <Link href="/" className="text-muted">Trang chủ</Link> <span aria-hidden="true">/</span>{" "}
        <Link href="/thuc-don" className="text-muted">Thực đơn bánh</Link> <span aria-hidden="true">/</span>{" "}
        <span className="text-maroon">{product.name}</span>
      </nav>

      {/* Khối sản phẩm */}
      <section data-cart-source className="grid items-start gap-6 rounded-[26px] bg-cream p-3 sm:p-7 md:rounded-[32px] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-12">
        <ProductGallery media={product.media} fallback={product.cover} name={product.name} position={product.imagePosition} />
        <div className="flex flex-col gap-[22px] px-2 pb-3 pt-1.5 sm:px-0">
          <div className="flex flex-col gap-2.5">
            <StatusBadge status={product.status} className="self-start text-[13px]" />
            <div className="flex items-start justify-between gap-3">
              <h1 className="m-0 font-display text-[38px] font-semibold leading-[1.05] tracking-[-0.015em] sm:text-5xl">{product.name}</h1>
              <FavoriteButton productId={product.id} name={product.name} variant="outline" />
            </div>
            <p className="m-0 max-w-[480px] text-[17px] text-muted">{product.description}</p>
          </div>
          {product.category !== "combo" && (
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {chips.map((c) => (
                <li key={c.label} className="inline-flex items-center gap-2 rounded-full border border-maroon/12 bg-card py-2 pl-2 pr-3.5 text-sm font-semibold">
                  <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-full bg-maroon text-cream">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d={c.d} /></svg>
                  </span>
                  {c.label}
                </li>
              ))}
            </ul>
          )}
          {product.compareAtVnd && (
            <p className="m-0 self-start rounded-[10px] bg-[#E3EBD3] px-3 py-1.5 text-sm font-semibold text-[#2F4A1E]">Giá cặp đôi – mua lẻ {formatVnd(product.compareAtVnd)}</p>
          )}
          <ProductPurchase product={product} />
          <a href="#thong-tin" className="inline-flex min-h-10 items-center gap-1.5 self-start font-semibold">Nguyên liệu &amp; bảo quản <ArrowRightIcon /></a>
        </div>
      </section>

      {/* Vì sao bạn sẽ thích */}
      <section className="flex flex-col gap-[26px] rounded-[26px] bg-beige px-5 pb-8 pt-7 sm:px-10 sm:pb-10 sm:pt-9 md:rounded-[32px]">
        <h2 className="m-0 font-display text-[30px] font-semibold leading-[1.1] sm:text-[38px]">Vì sao bạn sẽ thích</h2>
        <div className="grid gap-5 md:grid-cols-3 md:gap-0">
          {details.highlights.map((h, i) => (
            <div key={h.title} className={`grid grid-cols-[80px_minmax(0,1fr)] items-center gap-[18px] sm:grid-cols-[96px_minmax(0,1fr)] ${i === 0 ? "md:pr-7" : i === 1 ? "md:border-l md:border-maroon/20 md:px-7" : "md:border-l md:border-maroon/20 md:pl-7"}`}>
              <span className="relative h-20 w-20 overflow-hidden rounded-full sm:h-24 sm:w-24">
                <Image src={h.src ?? (h.image ? productImages[h.image] : product.cover)} alt="" fill sizes="96px" className="object-cover" style={{ objectPosition: "center 45%" }} />
              </span>
              <span className="flex flex-col gap-0.5">
                <strong className="font-display text-xl font-semibold">{h.title}</strong>
                <span className="text-[15px] text-muted">{h.text}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Nguyên liệu + thông tin */}
      <section id="thong-tin" className="grid scroll-mt-4 gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="grid items-center gap-7 rounded-[26px] bg-cream p-6 sm:grid-cols-[200px_minmax(0,1fr)] sm:p-8 md:rounded-[32px]">
          <span className="relative mx-auto h-40 w-40 overflow-hidden rounded-full sm:h-[200px] sm:w-[200px]">
            <Image src={product.cover} alt="" fill sizes="200px" className="object-cover" style={{ objectPosition: "center 35%" }} />
          </span>
          <div className="flex flex-col gap-3">
            <h2 className="m-0 font-display text-[30px] font-semibold leading-[1.15]">Nguyên liệu</h2>
            <p className="m-0 text-[15px] text-muted">{details.ingredients}</p>
            <ul className="m-0 flex list-none flex-col gap-2 p-0 text-[15px]">
              <li className="flex items-center gap-2.5">
                <span aria-hidden="true" className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full border-[1.5px] border-maroon">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                </span>
                Nướng trong ngày
              </li>
              <li className="flex items-center gap-2.5">
                <span aria-hidden="true" className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full border-[1.5px] border-accent text-[13px] font-bold text-accent">!</span>
                {details.allergens}
              </li>
            </ul>
          </div>
        </div>
        <div className="rounded-[26px] border border-maroon/12 bg-card p-6 sm:p-8 md:rounded-[32px]">
          <div className="mb-2.5 flex items-baseline justify-between gap-3">
            <h2 className="m-0 font-display text-[30px] font-semibold leading-[1.15]">Thông tin bánh</h2>
            <span className="text-[13px] text-muted">{product.variants?.[0]?.label ?? "1 phần"}</span>
          </div>
          <dl className="m-0 flex flex-col text-[15px]">
            {[
              ["Trọng lượng", "Chờ tiệm cập nhật"],
              ["Ra lò", product.status === "pre" ? "Đặt trước 1 ngày" : `${store.freshBatchTime} mỗi chiều`],
              ["Dùng ngon nhất", use.best],
              ["Bảo quản", use.keep],
              ["Hâm nóng", use.warm],
            ].map(([dt, dd], i, arr) => (
              <div key={dt} className={`flex justify-between gap-3 py-2.5 ${i < arr.length - 1 ? "border-b border-dotted border-maroon/30" : ""}`}>
                <dt className="text-muted">{dt}</dt>
                <dd className="m-0 text-right font-semibold">{dd}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Bạn cũng sẽ thích */}
      <section className="flex flex-col gap-[22px] pt-5 md:pt-7">
        <div className="flex items-end justify-between gap-4">
          <h2 className="m-0 font-display text-[30px] font-semibold leading-[1.1] sm:text-[38px]">Bạn cũng sẽ thích</h2>
          <Link href="/thuc-don" className="inline-flex min-h-11 items-center font-semibold">Xem cả thực đơn →</Link>
        </div>
        <div className="no-scrollbar relative -mx-3 flex snap-x gap-3 overflow-x-auto px-3 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-5">
          {related.map((r) => (
            <article key={r.id} className="flex w-[46%] flex-none snap-start flex-col overflow-hidden rounded-[20px] bg-cream sm:w-auto">
              <Link href={`/san-pham/${r.slug}`} aria-label={`Xem ${r.name}`} className="group relative block h-[140px] bg-beige sm:h-[170px]">
                <Image src={r.cover} alt={r.name} fill sizes="(min-width: 1024px) 230px, 46vw" className="object-cover" style={{ objectPosition: r.imagePosition ?? "center" }} />
              </Link>
              <div className="flex grow flex-col gap-0.5 px-3.5 pb-4 pt-3.5">
                <h3 className="m-0 font-display text-[17px] font-semibold leading-[1.25]">{r.name}</h3>
                <span className="text-[13px] text-muted">{r.tagline ?? r.description}</span>
                <Link href={`/san-pham/${r.slug}`} className="mt-3 inline-flex min-h-10 items-center gap-1.5 self-start rounded-full bg-maroon px-3.5 text-[13px] font-semibold text-cream no-underline hover:bg-accent hover:text-cream">{formatVnd(r.priceVnd)} · Xem</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Băng cuối trang */}
      <section className="mb-20 mt-6 grid overflow-hidden rounded-[26px] bg-[#F6D58E] md:mb-[88px] md:mt-8 md:min-h-[240px] md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,0.8fr)] md:rounded-[32px]">
        <div className="flex flex-col items-start justify-center gap-3 px-6 py-8 md:px-10 md:py-9">
          <h2 className="m-0 font-display text-[32px] font-semibold leading-[1.08] md:text-[40px]">Ghé tiệm chiều nay</h2>
          <p className="m-0 text-ink">Bánh ra lò {store.freshBatchTime} – giữ phần trước để không lỡ mẻ ấm.</p>
          <Link href="/thuc-don" className="inline-flex min-h-[50px] items-center gap-2 rounded-full bg-maroon px-[22px] font-semibold text-cream no-underline hover:bg-accent hover:text-cream">Xem tất cả bánh <ArrowRightIcon /></Link>
        </div>
        <div className="relative h-48 md:h-auto">
          <Image src={productImages.croissantCoffee} alt="Croissant và cà phê trên bàn" fill sizes="(min-width: 768px) 420px, 100vw" className="object-cover" style={{ objectPosition: "center 40%" }} />
        </div>
        <ul className="m-0 flex list-none flex-col justify-center gap-4 p-6 font-semibold md:p-8">
          <li className="flex items-center gap-3"><ClockIcon size={24} />Ra lò {store.freshBatchTime}</li>
          <li className="flex items-center gap-3"><BagIcon size={24} />Hẹn giờ ghé lấy</li>
          <li className="flex items-center gap-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 10.5 12 4l9 6.5V20H3z" /><path d="M9.5 20v-6h5v6" /></svg>
            Mở {store.openHours}
          </li>
        </ul>
      </section>
    </div>
  );
}
