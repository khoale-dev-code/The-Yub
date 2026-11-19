// TheYub-Home-Compact-V1
import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { DrinkBoard } from "@/components/home/drink-board";
import { HeroCarousel, type HeroSlide } from "@/components/home/hero-carousel";
import { Marquee } from "@/components/home/marquee";
import { MobileHero } from "@/components/home/mobile-hero";
import { MobileMenuList } from "@/components/home/mobile-menu-list";
import { OvenToGift } from "@/components/home/oven-to-gift";
import { NewsletterForm } from "@/components/home/newsletter-form";
import { PickupPlanner } from "@/components/home/pickup-planner";
import { SiteFooter } from "@/components/layout/site-footer";
import { ProductCard } from "@/components/product-card";
import { StoreMap } from "@/components/brand/store-map";
import { ArrowRightIcon, ClockIcon, CupIcon, PhoneIcon } from "@/components/ui/icons";
import { RuledHeading, h2Cls, h2SmCls } from "@/components/ui/section-heading";
import { formatVnd } from "@/lib/format";
import { productImages } from "@/lib/images";
import { drinksRepository, productsRepository } from "@/modules/products/repository";
import type { Product } from "@/modules/products/types";
import { getStoreInfo } from "@/modules/settings/store-info-server";
import { settingsRepository } from "@/modules/settings/repository";
import { directionsUrlOf } from "@/modules/settings/map";
import { shortTime } from "@/modules/settings/store-info";
import { categoriesRepository } from "@/modules/categories/repository";


const priceOf = (list: Product[], slug: string) => {
  const p = list.find((x) => x.slug === slug);
  return p ? formatVnd(p.priceVnd) : "";
};

export default async function HomePage() {
  const store = await getStoreInfo();
  const [products, drinks, productCats, drinkCats, settings] = await Promise.all([productsRepository.list(), drinksRepository.list(), categoriesRepository.list("product"), categoriesRepository.list("drink"), settingsRepository.get()]);
  const directions = directionsUrlOf(settings);
  const bySlugs = (slugs: string[]) => slugs.map((s) => products.find((p) => p.slug === s)).filter((p): p is Product => Boolean(p));

  /* Anh banner: public/images/hero/*-desktop.jpg (ngang) + *-mobile.jpg (doc) */
  const tartTrung = products.find((p) => p.slug === "tart-trung");
  const slides: HeroSlide[] = [
    { img: "/images/hero/croissant-desktop.jpg", imgMobile: "/images/hero/croissant-mobile.jpg", pos: "center 50%", posMobile: "center 40%", alt: "Chiếc croissant bẻ đôi lơ lửng, lộ ruột bánh nhiều lớp", headline: "Giòn rụm,\nthơm bơ,\nra lò mỗi chiều.", sub: `Croissant, tart và bánh ngọt của The Yub — nướng theo mẻ nhỏ, ra lò lúc ${store.freshBatchTime}.`, cta: "Xem thực đơn", href: "#thuc-don", item: "Croissant bơ", price: priceOf(products, "croissant-bo"), note: `Ra lò ${store.freshBatchTime}` },
    { img: "/images/hero/egg-tart-desktop.jpg", imgMobile: "/images/hero/egg-tart-mobile.jpg", pos: "center 50%", posMobile: "center 35%", alt: "Bánh tart trứng vàng óng bẻ đôi, vỏ ngàn lớp", headline: "Vỏ ngàn lớp,\nnhân trứng sữa.", sub: "Tart trứng nướng mỗi chiều — vỏ giòn tan, nhân béo mịn, ngon nhất khi còn ấm.", cta: "Xem các loại tart", href: "/thuc-don?loai=tart#danh-sach", item: tartTrung?.name ?? "Tart trứng", price: tartTrung ? formatVnd(tartTrung.priceVnd) : "", note: "Có sẵn hôm nay" },
    { img: "/images/hero/gift-box-desktop.jpg", imgMobile: "/images/hero/gift-box-mobile.jpg", pos: "center 50%", posMobile: "center 50%", alt: "Hộp tart mix vị và bánh kem trái cây đặt trong hộp quà", headline: "Hộp quà nhỏ,\nniềm vui lớn.", sub: "Bánh kem trái cây, hộp tart mix vị — đặt trước cho sinh nhật và những dịp đặc biệt.", cta: "Chọn hộp quà", href: "/thuc-don", item: "Hộp tart 4 vị", price: priceOf(products, "hop-tart-4-vi"), note: "Đặt trước 1 ngày" },
    { img: "/images/hero/tiramisu-red-desktop.jpg", imgMobile: "/images/hero/tiramisu-red-mobile.jpg", pos: "center 60%", posMobile: "center 62%", alt: "Lát tiramisu nhiều lớp, bột cacao rơi trên nền rèm đỏ", headline: "Đặt trước,\nhẹn giờ,\nghé lấy.", sub: "Chọn bánh online, hẹn khung giờ nhận — tiệm gọi xác nhận rồi mới chuẩn bị.", cta: "Đặt bánh ngay", href: "/thuc-don", item: "Hẹn giờ nhận", note: "Tiệm gọi xác nhận" },
  ];


  const breads = bySlugs(["croissant-mam-xoi", "tart-trung", "cookie-hop-6-vi", "bong-lan-chanh"]);
  const best = bySlugs(["banh-kem-dau", "cheesecake-viet-quat", "tart-trai-cay", "tart-kem-mua"]);
  const pairs = bySlugs(["combo-croissant-cacao", "combo-banh-cuon-latte", "combo-pancake-americano"]);
  const pairDrink: Record<string, string> = { "combo-croissant-cacao": "cacao nóng", "combo-banh-cuon-latte": "latte đá", "combo-pancake-americano": "americano đá" };

  return (
    <>
      <main>
      <MobileHero slides={slides} />
      <HeroCarousel slides={slides} />

      {/* Thông tin nhanh – chỉ trên điện thoại */}
      <section aria-label="Thông tin tiệm" className="grid grid-cols-3 gap-2 px-4 pb-2 pt-6 md:hidden">
        <div className="flex flex-col gap-0.5 rounded-[18px] border border-maroon/10 bg-card px-2.5 py-3.5">
          <span className="font-display text-2xl font-semibold leading-[1.15]">{shortTime(store.openTime)}</span>
          <span className="text-xs leading-[1.35] text-muted-2">Mở cửa đến {shortTime(store.closeTime)}</span>
        </div>
        <div className="flex flex-col gap-0.5 rounded-[18px] bg-maroon px-2.5 py-3.5 text-cream">
          <span className="font-display text-2xl font-semibold leading-[1.15] text-butter">{store.freshBatchTime}</span>
          <span className="text-xs leading-[1.35] text-cream/85">Mẻ bánh mới ra lò</span>
        </div>
        <div className="flex flex-col gap-0.5 rounded-[18px] border border-maroon/10 bg-card px-2.5 py-3.5">
          <span className="font-display text-2xl font-semibold leading-[1.15]">Hẹn</span>
          <span className="text-xs leading-[1.35] text-muted-2">Đặt trước, ghé lấy</span>
        </div>
      </section>

      <div className="hidden md:block"><Marquee /></div>

      {/* BÁNH CỦA TIỆM */}
      <section id="thuc-don" className="mx-auto flex max-w-[1200px] scroll-mt-16 flex-col gap-[18px] px-4 pb-14 pt-10 md:gap-8 md:px-6 md:pb-28 md:pt-[88px]">
        <div className="flex flex-wrap items-end justify-between gap-4 px-1 md:px-0">
          <h2 className={`${h2Cls} max-md:text-[32px]`}>Bánh của tiệm</h2>
          <Link href="/thuc-don" className="hidden min-h-11 items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.08em] md:inline-flex">Xem cả thực đơn <ArrowRightIcon /></Link>
        </div>
        <div className="flex flex-col gap-[18px] md:hidden">
          <MobileMenuList products={products} featured={breads} categories={productCats} />
          <Link href="/thuc-don" className="inline-flex min-h-12 items-center gap-2 self-center rounded-full border-[1.5px] border-maroon px-[22px] font-semibold no-underline">Xem cả thực đơn <ArrowRightIcon /></Link>
        </div>
        <div className="hidden grid-cols-2 gap-6 md:grid lg:grid-cols-4">
          {breads.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* BÁN CHẠY */}
      <section className="mx-auto flex max-w-[1200px] flex-col gap-3 px-5 pb-6 pt-2 md:gap-10 md:px-6 md:pb-8 md:pt-0">
        <RuledHeading className={`${h2Cls} max-md:text-[32px]`}>Bán chạy</RuledHeading>
        <ol className="m-0 flex list-none flex-col p-0 md:hidden">
          {best.map((p, i) => (
            <li key={p.id} className="flex items-center gap-3.5 border-b border-accent/20 py-4">
              <div className="relative w-24 flex-none">
                <Link href={`/san-pham/${p.slug}`} aria-label={`Xem ${p.name}`} className="relative block h-28 w-24 overflow-hidden rounded-[18px] bg-[#E9C9A0]">
                  <Image src={p.cover} alt={p.name} fill sizes="96px" className="object-cover" style={{ objectPosition: p.imagePosition ?? "center" }} />
                </Link>
                <span className="absolute -left-1.5 -top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-maroon font-display text-[13px] font-semibold text-cream">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <h3 className="m-0 font-display text-[19px] font-semibold leading-[1.25]"><Link href={`/san-pham/${p.slug}`} className="no-underline">{p.name}</Link></h3>
                <p className="m-0 text-[13px] leading-[1.45] text-muted-2">{p.tagline ?? p.description}</p>
                <div className="mt-1.5 flex items-center justify-between gap-2.5">
                  <span className="font-display text-lg font-semibold">{formatVnd(p.priceVnd)}</span>
                  <AddToCartButton productId={p.id} productName={p.name} tone="filled" size={44} disabled={p.status === "out"} />
                </div>
              </div>
            </li>
          ))}
        </ol>
        <div className="hidden grid-cols-2 gap-7 md:grid lg:grid-cols-4">
          {best.map((p, i) => (
            <article key={p.id} className="flex flex-col items-center gap-4 text-center">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[26px] bg-[#E9C9A0]">
                <Link href={`/san-pham/${p.slug}`} aria-label={`Xem ${p.name}`} className="group block h-full w-full">
                  <Image src={p.cover} alt={p.name} fill sizes="(min-width: 1024px) 280px, (min-width: 640px) 45vw, 90vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" style={{ objectPosition: p.imagePosition ?? "center" }} />
                </Link>
                <span className="absolute left-3.5 top-3.5 flex h-10 w-10 items-center justify-center rounded-full bg-cream font-display text-base font-semibold text-maroon">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <span className="rounded-full border-[1.5px] border-accent px-[18px] py-[5px] text-xs font-semibold uppercase tracking-[0.12em] text-accent">{p.name}</span>
              <p className="m-0 max-w-[240px] grow text-sm text-muted-2">{p.description}</p>
              <div className="flex w-full items-center justify-between gap-3 border-t border-maroon/15 pt-3.5">
                <span className="font-display text-[22px] font-semibold">{formatVnd(p.priceVnd)}</span>
                <AddToCartButton productId={p.id} productName={p.name} tone="filled" size={48} disabled={p.status === "out"} />
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* QUẦY NƯỚC */}
      <section id="do-uong" className="mx-auto flex max-w-[1200px] flex-col gap-5 px-4 pb-12 pt-8 md:gap-12 md:px-6 md:pb-16 md:pt-12">
        {/* mobile: ảnh tràn viền + thẻ tiêu đề đè lên + thẻ menu sáng */}
        <div className="-mx-4 flex flex-col md:hidden">
          <div className="relative h-[300px]">
            <Image src={productImages.croissantCoffee} alt="Ly cà phê bên khay croissant nhiều vị" fill sizes="100vw" className="object-cover" style={{ objectPosition: "center 12%" }} />
          </div>
          <div className="relative mx-4 -mt-16 flex flex-col gap-2.5 rounded-t-3xl bg-page px-5 pb-1 pt-[22px]">
            <h2 className="m-0 text-balance font-display text-[30px] font-semibold leading-[1.15] tracking-[-0.01em]">Thơm bơ, đậm vị cà phê</h2>
            <p className="m-0 text-[15px] text-muted-2">Cà phê, trà trái cây và đồ uống không cà phê — pha khi bạn tới, uống tại tiệm hoặc mang đi.</p>
          </div>
        </div>
        <div className="md:hidden"><DrinkBoard drinks={drinks} groups={drinkCats} variant="light" /></div>

        <div className="hidden flex-wrap items-end justify-between gap-x-16 gap-y-6 md:flex">
          <h2 className={`${h2Cls} min-w-0 flex-[1_1_460px]`}>Thơm bơ, đậm vị cà phê</h2>
          <p className="m-0 min-w-0 flex-[1_1_340px] text-[17px] text-muted-2">Bánh ngon cần một ly nước hợp vị. Quầy nước của The Yub có cà phê, trà trái cây và đồ uống không cà phê — pha khi bạn tới, uống tại tiệm hoặc mang đi.</p>
        </div>
        <div className="hidden flex-wrap items-stretch gap-10 md:flex">
          <div className="relative min-h-[420px] min-w-0 flex-[1_1_360px] overflow-hidden rounded-[240px_240px_28px_28px] md:min-h-[580px]">
            <Image src={productImages.croissantCoffee} alt="Ly cà phê bên khay croissant nhiều vị" fill sizes="(min-width: 1024px) 480px, 100vw" className="object-cover" style={{ objectPosition: "center 20%" }} />
          </div>
          <DrinkBoard drinks={drinks} groups={drinkCats} />
        </div>

        {/* Cặp đôi */}
        <div id="cap-doi" className="mt-6 flex scroll-mt-16 flex-col gap-4 md:mt-0 md:gap-7">
          <div className="flex items-center justify-between gap-3.5 px-1 md:hidden">
            <h3 className="m-0 font-display text-[26px] font-semibold leading-[1.2] tracking-[-0.01em]">Cặp đôi ăn ý</h3>
            <span className="inline-flex flex-none items-center gap-1.5 text-[13px] font-semibold text-accent">Vuốt xem thêm <ArrowRightIcon size={16} /></span>
          </div>
          <div className="hidden md:block">
            <RuledHeading as="h3" className="m-0 font-display text-[34px] font-semibold leading-[1.15] tracking-[-0.01em]">Cặp đôi ăn ý</RuledHeading>
          </div>
          <div role="list" aria-label="Cặp đôi ăn ý" className="no-scrollbar relative -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2.5 pt-0.5 md:mx-0 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:p-0 lg:grid-cols-3">
            {pairs.map((pr) => (
              <article key={pr.id} role="listitem" className="flex w-[292px] flex-none snap-start flex-col overflow-hidden rounded-3xl bg-[#F5F5F7] md:w-auto md:rounded-[26px]">
                <div className="relative h-[230px] md:h-80">
                  <Image src={pr.cover} alt={pr.description} fill sizes="(min-width: 1024px) 380px, (min-width: 768px) 50vw, 100vw" className="object-cover" style={{ objectPosition: pr.imagePosition ?? "center" }} />
                  <span className="absolute bottom-3.5 left-3.5 inline-flex items-center gap-2 rounded-full bg-cream py-1.5 pl-1.5 pr-3.5 text-[13px] font-semibold text-maroon shadow-[0_6px_18px_rgba(0,0,0,0.18)]">
                    <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-maroon text-cream"><CupIcon /></span>
                    Kèm {pairDrink[pr.slug]}
                  </span>
                </div>
                <div className="flex grow flex-col gap-1.5 px-4 pb-[18px] pt-4 md:gap-2 md:px-6 md:pb-6 md:pt-[22px]">
                  <h4 className="m-0 font-display text-xl font-semibold leading-[1.2] md:text-2xl">{pr.name}</h4>
                  <p className="m-0 text-sm leading-[1.55] text-muted md:min-h-[3.1em] md:text-[15px]">{pr.description}</p>
                  <div className="mt-auto flex items-center justify-between gap-3 border-t border-maroon/15 pt-4">
                    <span className="flex flex-col leading-[1.25]">
                      <span className="font-display text-[22px] font-semibold">{formatVnd(pr.priceVnd)}</span>
                      {pr.compareAtVnd && <span className="text-[13px] text-muted">Giá lẻ {formatVnd(pr.compareAtVnd)}</span>}
                    </span>
                    <AddToCartButton productId={pr.id} productName={`cặp ${pr.name}`} tone="filled" size={48} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* TỪ LÒ NƯỚNG ĐẾN HỘP QUÀ — giữ đích liên kết câu chuyện */}
      <div id="cau-chuyen" className="scroll-mt-20">
        <OvenToGift />
      </div>

      {/* ĐẶT BÁNH THEO GIỜ HẸN */}
      <section id="dat-banh" className="mx-auto flex max-w-[1200px] scroll-mt-16 flex-col items-center gap-5 px-4 pb-14 pt-10 md:gap-12 md:px-6 md:py-[120px]">
        <h2 className={`${h2Cls} text-center max-md:text-[32px]`}>Đặt bánh theo giờ hẹn</h2>
        <div className="w-full md:hidden"><PickupPlanner variant="sheet" /></div>
        <div className="hidden w-full md:block"><PickupPlanner /></div>
      </section>

      {/* GHÉ TIỆM – BẢN ĐỒ (chỉ hiện khi Admin đã dán bản đồ nhúng) */}
      {settings.mapEmbedUrl && (
        <section id="ban-do" className="mx-auto max-w-[1200px] px-4 pb-16 md:px-6 md:pb-[120px]">
          <div className="grid overflow-hidden rounded-[28px] bg-maroon text-cream md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:rounded-[36px]">
            <div className="flex flex-col gap-6 p-6 md:justify-center md:gap-7 md:p-12">
              <h2 className={`${h2SmCls} max-md:text-[30px]`}>Ghé tiệm</h2>
              {settings.address && <p className="m-0 text-[17px] leading-relaxed text-cream/85 md:text-lg">{settings.address}</p>}
              <ul className="m-0 flex list-none flex-col gap-3 p-0 text-[15px]">
                <li className="flex items-center gap-3"><span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-cream/10 text-butter"><ClockIcon size={18} /></span>Mở cửa {store.openHours} · Ra lò {store.freshBatchTime}</li>
                <li className="flex items-center gap-3"><span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-cream/10 text-butter"><PhoneIcon size={18} /></span><a href={store.phoneHref} className="font-semibold text-cream no-underline hover:text-butter">{store.phone}</a></li>
              </ul>
              <div className="flex flex-wrap gap-3">
                {directions && (
                  <a href={directions} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[52px] items-center gap-2 rounded-full bg-butter px-6 font-bold text-maroon no-underline hover:bg-cream hover:text-maroon">Chỉ đường <ArrowRightIcon /></a>
                )}
                <Link href="/ghe-tiem" className="inline-flex min-h-[52px] items-center rounded-full border-[1.5px] border-cream/50 px-6 font-semibold text-cream no-underline hover:border-butter hover:text-butter">Giờ nhận bánh</Link>
              </div>
            </div>
            <StoreMap src={settings.mapEmbedUrl} title={`Bản đồ đến ${store.name}`} className="min-h-[320px] md:min-h-[480px]" />
          </div>
        </section>
      )}

      {/* NHẬN TIN */}
      <section className="bg-beige">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-12 px-6 pb-14 pt-[88px] md:pb-10">
          <div aria-hidden="true" className="grid min-w-0 flex-[1_1_360px] grid-cols-3 gap-3">
            {[
              { src: productImages.blueberryCheesecake, cls: "mt-[18px] md:mt-8" },
              { src: productImages.eggTarts, cls: "" },
              { src: productImages.berryTartBox, cls: "mt-[18px] md:mt-8" },
            ].map((im) => (
              <div key={im.src} className={`relative h-[130px] overflow-hidden rounded-[14px] md:h-auto md:aspect-[3/4] md:rounded-[18px] ${im.cls}`}>
                <Image src={im.src} alt="" fill sizes="200px" className="object-cover" />
              </div>
            ))}
          </div>
          <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-4">
            <h2 className={`${h2SmCls} max-md:text-[28px]`}>Nhận tin mẻ bánh mới</h2>
            <p className="m-0 text-[17px] text-muted-2">Bánh theo mùa, vị mới và ưu đãi cho khách quen. Không spam — chỉ có bánh.</p>
            <NewsletterForm />
          </div>
        </div>
      </section>
      </main>
      <SiteFooter backdrop="var(--color-beige)" />
    </>
  );
}
