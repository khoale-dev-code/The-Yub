// TheYub-Order-Anytime-V1
"use client";

import gsap from "gsap";
import Lenis from "lenis";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatVnd } from "@/lib/format";
import { useStoreInfo } from "@/components/brand/store-info-context";
import type { Category } from "@/modules/categories/types";
import type { Product, ProductCategory, ProductStatus } from "@/modules/products/types";
import { AddToCartButton } from "../add-to-cart-button";
import { FavoriteButton } from "../favorite-button";
import { motionConfig } from "../motion/motion-config";
import { useLenis } from "../motion/smooth-scroll";
import { SearchIcon } from "../ui/icons";
import { statusMeta } from "../ui/status-badge";
import { productStatusLabel } from "@/modules/products/types";

const PAGE = 6;

type CatFilter = "all" | ProductCategory;
type StatusFilter = "all" | Exclude<ProductStatus, "out">;
type PriceFilter = "all" | "low" | "mid" | "high";
type SortKey = "popular" | "asc" | "desc" | "fresh";

const statusFilters: { id: StatusFilter; label: string; dot: string }[] = [
  { id: "all", label: "Tất cả", dot: "#3B0F12" },
  { id: "ready", label: "Có sẵn hôm nay", dot: "#5B8A3A" },
  { id: "oven", label: "Ra lò chiều nay", dot: "#E8A93B" },
  { id: "pre", label: "Đặt trước", dot: "#7A2A2E" },
];

const priceFilters: { id: PriceFilter; label: string; test: (n: number) => boolean }[] = [
  { id: "all", label: "Mọi mức giá", test: () => true },
  { id: "low", label: "Dưới 40.000đ", test: (n) => n < 40000 },
  { id: "mid", label: "40.000đ – 100.000đ", test: (n) => n >= 40000 && n <= 100000 },
  { id: "high", label: "Trên 100.000đ (hộp, bánh kem)", test: (n) => n > 100000 },
];

const statusOrder: Record<ProductStatus, number> = { oven: 0, ready: 1, pre: 2, out: 3 };

const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").toLowerCase();

const filterBtn = (on: boolean) =>
  `flex min-h-11 items-center gap-2.5 rounded-[14px] border px-3.5 text-left text-[15px] font-medium text-maroon ${on ? "border-maroon bg-card" : "border-maroon/20 bg-transparent hover:border-maroon/50"}`;

/** "Tat ca banh": chip loai, bo loc tinh trang + gia, sap xep, tai them khi cuon. */
export function CatalogBrowser({ products, categories, initialQuery = "", initialCategory = "all" }: { products: Product[]; categories: Category[]; initialQuery?: string; initialCategory?: CatFilter }) {
  const store = useStoreInfo();
  const [cat, setCat] = useState<CatFilter>(initialCategory);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [price, setPrice] = useState<PriceFilter>("all");
  const [sort, setSort] = useState<SortKey>("popular");
  const [query, setQuery] = useState(initialQuery);
  const [visible, setVisible] = useState(PAGE);
  const [loading, setLoading] = useState(false);
  const sentinel = useRef<HTMLDivElement | null>(null);
  /** Khu vuc san pham (cuon rieng tren may tinh) */
  const rowRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const innerLenis = useRef<Lenis | null>(null);
  const pageLenis = useLenis();
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // May tinh: khu san pham co thanh cuon rieng, muot bang mot Lenis rieng.
  // Con tro trong khu san pham -> chi cuon san pham; ra ngoai -> cuon trang.
  useEffect(() => {
    const wrapper = scrollRef.current;
    const content = contentRef.current;
    if (!desktop || !wrapper || !content) return;
    const lenis = new Lenis({
      wrapper,
      content,
      eventsTarget: wrapper,
      autoRaf: false,
      lerp: motionConfig.lerp,
      smoothWheel: true,
      overscroll: false,
      respectReducedMotion: motionConfig.smoothScrollRespectsReducedMotion,
    });
    innerLenis.current = lenis;
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      innerLenis.current = null;
    };
  }, [desktop]);

  // Neu khu san pham chua "dinh" ngay duoi header: lan chuot dau tien se dua trang toi vi tri do truoc
  useEffect(() => {
    const wrapper = scrollRef.current;
    if (!desktop || !wrapper) return;
    const onWheel = (e: WheelEvent) => {
      const row = rowRef.current;
      if (!row) return;
      const headerH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--yub-header-h")) || 0;
      const dock = headerH + 16;
      const top = row.getBoundingClientRect().top;
      if (Math.abs(top - dock) <= 24) return; // da dinh -> de Lenis cua khu san pham xu ly
      e.preventDefault();
      e.stopImmediatePropagation();
      if (pageLenis) {
        // scroll-margin-top cua #danh-sach da tinh chieu cao header
        if (!pageLenis.isScrolling) pageLenis.scrollTo(row, { duration: 0.9 });
      } else {
        window.scrollBy({ top: top - dock, behavior: "smooth" });
      }
    };
    wrapper.addEventListener("wheel", onWheel, { capture: true, passive: false });
    return () => wrapper.removeEventListener("wheel", onWheel, { capture: true });
  }, [desktop, pageLenis]);

  const scrollProductsTop = () => {
    if (innerLenis.current) innerLenis.current.scrollTo(0, { immediate: true });
    else if (scrollRef.current) scrollRef.current.scrollTop = 0;
  };

  /** Xem het san pham -> cuon trang toi phan tiep theo */
  const continuePage = () => {
    const next = rowRef.current?.closest("section")?.nextElementSibling as HTMLElement | null;
    if (!next) return;
    if (pageLenis) pageLenis.scrollTo(next, { duration: 1.2 });
    else next.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => setQuery(initialQuery), [initialQuery]);
  useEffect(() => setCat(initialCategory), [initialCategory]);

  const reset = (fn: () => void) => {
    fn();
    setVisible(PAGE);
    scrollProductsTop();
  };

  const cats = useMemo(() => {
    return [
      { id: "all" as CatFilter, label: "Tất cả", count: products.length },
      ...categories
        .map((c) => ({ id: c.slug as CatFilter, label: c.name, count: products.filter((p) => p.category === c.slug).length }))
        .filter((c) => c.count > 0),
    ];
  }, [products, categories]);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    const priceTest = (priceFilters.find((f) => f.id === price) ?? priceFilters[0])!.test;
    const list = products.filter(
      (p) =>
        (cat === "all" || p.category === cat) &&
        (status === "all" || p.status === status) &&
        priceTest(p.priceVnd) &&
        (!q || normalize(`${p.name} ${p.description}`).includes(q)),
    );
    const sorted = [...list];
    if (sort === "asc") sorted.sort((a, b) => a.priceVnd - b.priceVnd);
    if (sort === "desc") sorted.sort((a, b) => b.priceVnd - a.priceVnd);
    if (sort === "fresh") sorted.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
    return sorted;
  }, [products, cat, status, price, sort, query]);

  const shown = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;

  const loadMore = () => {
    if (loading || !hasMore) return;
    setLoading(true);
    // tre ngan de skeleton khong nhay (du lieu da co san o client)
    setTimeout(() => {
      setVisible((v) => v + PAGE);
      setLoading(false);
    }, 350);
  };

  const loadMoreRef = useRef(loadMore);
  loadMoreRef.current = loadMore;

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore) return;
    // May tinh: quan sat trong khung cuon cua san pham; dien thoai: theo man hinh
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) loadMoreRef.current();
    }, { root: desktop ? scrollRef.current : null, rootMargin: "240px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, visible, desktop]);

  const clearAll = () => reset(() => { setCat("all"); setStatus("all"); setPrice("all"); setQuery(""); });

  return (
    <>
      <section id="tat-ca" className="mx-auto flex max-w-[1200px] scroll-mt-4 flex-col gap-4 px-4 pt-9 sm:gap-6 sm:px-6 md:pt-[88px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="m-0 font-display text-[32px] font-semibold leading-[1.05] tracking-[-0.015em] md:text-[clamp(40px,4.4vw,56px)]">Tất cả bánh</h2>
          <nav aria-label="Nhóm thực đơn" className="grid w-full grid-cols-2 gap-1 rounded-full bg-beige p-1 sm:inline-flex sm:w-auto">
            <Link href="/thuc-don" aria-current="page" className="flex min-h-11 items-center justify-center rounded-full bg-maroon px-6 font-semibold text-cream no-underline hover:text-cream">Bánh</Link>
            <Link href="/do-uong" className="flex min-h-11 items-center justify-center rounded-full px-6 font-semibold text-maroon no-underline">Đồ uống</Link>
          </nav>
        </div>
        <label className="flex min-h-[50px] items-center gap-2.5 rounded-full border border-maroon/20 bg-card px-4 text-muted-2 md:hidden">
          <SearchIcon />
          <span className="sr-only">Tìm bánh</span>
          <input type="search" value={query} onChange={(e) => reset(() => setQuery(e.target.value))} placeholder="Tìm bánh…" className="min-w-0 flex-1 border-0 bg-transparent text-base text-maroon" />
        </label>
        <div role="group" aria-label="Lọc theo loại" className="flex flex-wrap gap-2 sm:gap-2.5">
          {cats.map((c) => (
            <button key={c.id} type="button" aria-pressed={c.id === cat} onClick={() => reset(() => setCat(c.id))} className={`inline-flex min-h-[42px] items-center gap-2 rounded-full border px-3.5 text-sm font-semibold sm:min-h-[46px] sm:px-5 sm:text-[15px] ${c.id === cat ? "border-maroon bg-maroon text-cream" : "border-maroon/30 bg-transparent text-maroon hover:border-maroon"}`}>
              {c.label}
              <span className="text-xs font-semibold opacity-70">{c.count}</span>
            </button>
          ))}
        </div>
      </section>

      <section data-no-reveal className="mx-auto max-w-[1200px] px-4 pb-[104px] pt-6 sm:px-6 md:pt-8">
        <div
          ref={rowRef}
          id="danh-sach"
          className="flex items-stretch gap-10 md:h-[calc(100svh-var(--yub-header-h)-40px)] md:min-h-[560px]"
        >
          <aside className="no-scrollbar hidden min-w-[220px] flex-[0_1_250px] flex-col gap-7 md:flex md:overflow-y-auto">
            <div className="flex flex-col gap-2.5">
              <h2 data-no-split className="m-0 text-[13px] font-bold uppercase tracking-[0.16em] text-accent">Tình trạng</h2>
              {statusFilters.map((f) => (
                <button key={f.id} type="button" aria-pressed={f.id === status} onClick={() => reset(() => setStatus(f.id))} className={filterBtn(f.id === status)}>
                  <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: f.dot }} />
                  {f.id === "oven" ? `Ra lò ${store.freshBatchTime}` : f.label}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2.5">
              <h2 data-no-split className="m-0 text-[13px] font-bold uppercase tracking-[0.16em] text-accent">Khoảng giá</h2>
              {priceFilters.map((f) => (
                <button key={f.id} type="button" aria-pressed={f.id === price} onClick={() => reset(() => setPrice(f.id))} className={filterBtn(f.id === price)}>
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2 rounded-[20px] bg-maroon p-5 text-cream">
              <strong className="font-display text-xl font-semibold">Bánh kem &amp; hộp quà</strong>
              <span className="text-sm text-cream/85">Vui lòng đặt trước ít nhất 1 ngày. Tiệm sẽ gọi xác nhận trước khi làm bánh.</span>
              <a href={store.phoneHref} className="mt-1 text-sm font-semibold text-butter hover:text-cream">Gọi tiệm: {store.phone}</a>
            </div>
          </aside>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm text-muted sm:text-[15px]" aria-live="polite">
                Đang xem <strong className="text-maroon">{shown.length} / {filtered.length} món</strong>
                <span className="md:hidden"> · Đặt bánh bất cứ lúc nào</span>
                <span className="hidden md:inline"> · Cuộn trong khung để xem thêm</span>
              </span>
              <label className="hidden items-center gap-2.5 text-sm text-muted sm:inline-flex">
                Sắp xếp
                <select value={sort} onChange={(e) => reset(() => setSort(e.target.value as SortKey))} className="min-h-11 rounded-xl border border-maroon/25 bg-card px-3.5 text-sm text-maroon">
                  <option value="popular">Phổ biến</option>
                  <option value="asc">Giá thấp đến cao</option>
                  <option value="desc">Giá cao đến thấp</option>
                  <option value="fresh">Mới ra lò</option>
                </select>
              </label>
            </div>

            <div
              ref={scrollRef}
              {...(desktop ? { "data-lenis-prevent": "" } : {})}
              tabIndex={desktop ? 0 : undefined}
              aria-label={desktop ? "Danh sách bánh – cuộn để xem thêm" : undefined}
              className="yub-scroll relative min-h-0 flex-1 md:-mr-3 md:overflow-y-auto md:overscroll-contain md:pr-3 md:pt-2 md:[mask-image:linear-gradient(to_bottom,transparent,black_12px,black_calc(100%-28px),transparent)]"
            >
              <div ref={contentRef} className="flex flex-col gap-5 pb-2 md:pb-8">
                {filtered.length > 0 ? (
                  <div className="grid grid-cols-2 gap-x-3 gap-y-[18px] sm:gap-x-6 sm:gap-y-7 lg:grid-cols-3">
                    {shown.map((p) => <CatalogCard key={p.id} product={p} />)}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 rounded-3xl bg-beige px-6 py-14 text-center">
                    <strong className="font-display text-2xl font-semibold">Chưa có món phù hợp</strong>
                    <span className="text-muted">Thử đổi bộ lọc, hoặc đặt trước để tiệm làm riêng cho bạn.</span>
                    <button type="button" onClick={clearAll} className="mt-1.5 min-h-12 rounded-full border-0 bg-maroon px-6 text-[15px] font-semibold text-cream hover:bg-accent">Xoá bộ lọc</button>
                  </div>
                )}

                {loading && (
                  <div role="status" aria-label="Đang tải thêm bánh" className="grid grid-cols-2 gap-x-3 gap-y-[18px] sm:gap-x-6 lg:grid-cols-3">
                    {Array.from({ length: 3 }, (_, i) => (
                      <div key={i} className="flex animate-pulse flex-col gap-3">
                        <div className="aspect-[1/0.92] rounded-[22px] bg-beige" />
                        <div className="h-5 w-[70%] rounded-lg bg-beige" />
                        <div className="h-3.5 w-[90%] rounded-lg bg-beige" />
                      </div>
                    ))}
                  </div>
                )}

                {hasMore && (
                  <div ref={sentinel} className="flex flex-col items-center gap-2.5 pt-2">
                    <span className="text-sm text-muted">Cuộn xuống để xem thêm · còn {filtered.length - visible} món</span>
                    <button type="button" onClick={loadMore} className="min-h-12 rounded-full border border-maroon bg-transparent px-[26px] text-[15px] font-semibold text-maroon hover:bg-maroon hover:text-cream">Xem thêm bánh</button>
                  </div>
                )}
                {!hasMore && filtered.length > 0 && (
                  <div className="flex flex-col items-center gap-3 pt-2">
                    <span className="text-sm text-muted">Bạn đã xem hết {filtered.length} món</span>
                    <button type="button" onClick={continuePage} className="hidden min-h-12 items-center gap-2 rounded-full border-0 bg-maroon px-6 text-[15px] font-semibold text-cream hover:bg-accent md:inline-flex">
                      Tiếp tục xem trang <span aria-hidden="true">↓</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function CatalogCard({ product: p }: { product: Product }) {
  const store = useStoreInfo();
  const soldOut = p.status === "out";
  const meta = statusMeta[p.status];
  const href = `/san-pham/${p.slug}`;
  return (
    <article className="flex flex-col overflow-hidden rounded-[18px] border border-maroon/10 bg-card sm:rounded-[22px]">
      <div className="relative h-40 overflow-hidden bg-beige sm:h-auto sm:aspect-[1/0.92]">
        <Link href={href} aria-label={`Xem ${p.name}`} className="group absolute inset-0 block">
          <Image src={p.cover} alt={p.name} fill sizes="(min-width: 1024px) 300px, 50vw" className={`object-cover transition-transform duration-500 group-hover:scale-[1.03] ${soldOut ? "opacity-55" : ""}`} style={{ objectPosition: p.imagePosition ?? "center" }} />
        </Link>
        <span className={`pointer-events-none absolute left-2 top-2 rounded-full px-2.5 py-0.5 text-[11px] font-semibold sm:left-3 sm:top-3 sm:px-3 sm:py-1 sm:text-xs ${meta.className}`}>{productStatusLabel(p.status, store.freshBatchTime)}</span>
        <FavoriteButton productId={p.id} name={p.name} className="absolute right-1.5 top-1.5 sm:right-2 sm:top-2" />
      </div>
      <div className="flex grow flex-col gap-0.5 px-2.5 pb-3 pt-2.5 sm:px-[18px] sm:pb-[18px] sm:pt-4">
        <Link href={href} className="no-underline">
          <h3 className="m-0 font-display text-base font-semibold leading-[1.3] sm:text-xl sm:leading-[1.25]">{p.name}</h3>
        </Link>
        <span className="hidden text-sm text-muted sm:block">{p.tagline ?? p.description}</span>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2 sm:gap-3 sm:pt-3.5">
          <span className="font-display text-[15px] font-semibold sm:text-[19px]">{formatVnd(p.priceVnd)}</span>
          {soldOut ? (
            <span className="flex min-h-11 items-center text-xs font-semibold text-[#6B5A50] sm:text-sm">Hết hôm nay</span>
          ) : (
            <AddToCartButton productId={p.id} productName={p.name} variantId={p.variants?.[0]?.id} tone="filled" size={44} />
          )}
        </div>
      </div>
    </article>
  );
}
