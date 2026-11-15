import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { DrinkBoard } from "@/components/home/drink-board";
import { HeroCarousel, type HeroSlide } from "@/components/home/hero-carousel";
import { Marquee } from "@/components/home/marquee";
import { MobileHero } from "@/components/home/mobile-hero";
import { MobileMenuList } from "@/components/home/mobile-menu-list";
import { NewsletterForm } from "@/components/home/newsletter-form";
import { PickupPlanner } from "@/components/home/pickup-planner";
import { SiteFooter } from "@/components/layout/site-footer";
import { ProductCard } from "@/components/product-card";
import { ArrowRightIcon, CupIcon } from "@/components/ui/icons";
import { RuledHeading, h2Cls, h2SmCls } from "@/components/ui/section-heading";
import { TornWave } from "@/components/ui/torn-wave";
import { formatVnd } from "@/lib/format";
import { productImages } from "@/lib/images";
import { drinksRepository, productsRepository } from "@/modules/products/repository";
import type { Product } from "@/modules/products/types";

const linkCaps = "inline-flex min-h-11 items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.08em]";

const priceOf = (list: Product[], slug: string) => {
  const p = list.find((x) => x.slug === slug);
  return p ? formatVnd(p.priceVnd) : "";
};

export default async function HomePage() {
  const [products, drinks] = await Promise.all([productsRepository.list(), drinksRepository.list()]);
  const bySlugs = (slugs: string[]) => slugs.map((s) => products.find((p) => p.slug === s)).filter((p): p is Product => Boolean(p));

  /* Anh banner: public/images/hero/*-desktop.jpg (ngang) + *-mobile.jpg (doc) */
  const tartTrung = products.find((p) => p.slug === "tart-trung");
  const slides: HeroSlide[] = [
    { img: "/images/hero/croissant-desktop.jpg", imgMobile: "/images/hero/croissant-mobile.jpg", pos: "center 50%", posMobile: "center 40%", alt: "Chiếc croissant bẻ đôi lơ lửng, lộ ruột bánh nhiều lớp", headline: "Giòn rụm,\nthơm bơ,\nra lò mỗi chiều.", sub: "Croissant, tart và bánh ngọt của The Yub — nướng theo mẻ nhỏ, ra lò lúc 14:30.", cta: "Xem thực đơn", href: "#thuc-don", item: "Croissant bơ", price: priceOf(products, "croissant-bo"), note: "Ra lò 14:30" },
    { img: "/images/hero/egg-tart-desktop.jpg", imgMobile: "/images/hero/egg-tart-mobile.jpg", pos: "center 50%", posMobile: "center 35%", alt: "Bánh tart trứng vàng óng bẻ đôi, vỏ ngàn lớp", headline: "Vỏ ngàn lớp,\nnhân trứng sữa.", sub: "Tart trứng nướng mỗi chiều — vỏ giòn tan, nhân béo mịn, ngon nhất khi còn ấm.", cta: "Xem các loại tart", href: "/thuc-don?loai=tart#danh-sach", item: tartTrung?.name ?? "Tart trứng", price: tartTrung ? formatVnd(tartTrung.priceVnd) : "", note: "Có sẵn hôm nay" },
    { img: "/images/hero/tiramisu-desktop.jpg", imgMobile: "/images/hero/tiramisu-mobile.jpg", pos: "center 55%", posMobile: "center 60%", alt: "Lát bánh tiramisu nhiều lớp phủ bột cacao", headline: "Đặt trước,\nhẹn giờ,\nghé lấy.", sub: "Chọn bánh online, hẹn khung giờ nhận — tiệm gọi xác nhận rồi mới chuẩn bị.", cta: "Đặt bánh ngay", href: "/dat-banh", item: "Bánh kem & hộp quà", note: "Đặt trước 1 ngày" },
    { img: "/images/hero/drinks-desktop.jpg", imgMobile: "/images/hero/drinks-mobile.jpg", pos: "30% 50%", posMobile: "center 50%", alt: "Logo The Yub – Bakes & More bên ba ly cà phê sữa, matcha và cà phê đen đá", headline: "The Yub – Bakes & More\nQuầy nước", sub: "", cta: "Xem đồ uống", href: "/do-uong", brand: true },
  ];


  const breads = bySlugs(["croissant-mam-xoi", "tart-trung", "cookie-hop-6-vi", "bong-lan-chanh"]);
  const best = bySlugs(["banh-kem-dau", "cheesecake-viet-quat", "tart-trai-cay", "tart-kem-mua"]);
  const pairs = bySlugs(["combo-croissant-cacao", "combo-banh-cuon-latte", "combo-pancake-americano"]);
  const pairDrink: Record<string, string> = { "combo-croissant-cacao": "cacao nóng", "combo-banh-cuon-latte": "latte đá", "combo-pancake-americano": "americano đá" };
  const secrets = bySlugs(["croissant-bo", "croissant-so-co-la"]);

  return (
    <>
      <main>
      <MobileHero slides={slides} />
      <HeroCarousel slides={slides} />

      {/* Thông tin nhanh – chỉ trên điện thoại */}
      <section aria-label="Thông tin tiệm" className="grid grid-cols-3 gap-2 px-4 pb-2 pt-6 md:hidden">
        <div className="flex flex-col gap-0.5 rounded-[18px] border border-maroon/10 bg-card px-2.5 py-3.5">
          <span className="font-display text-2xl font-semibold leading-[1.15]">7:30</span>
          <span className="text-xs leading-[1.35] text-muted-2">Mở cửa đến 19:00</span>
        </div>
        <div className="flex flex-col gap-0.5 rounded-[18px] bg-maroon px-2.5 py-3.5 text-cream">
          <span className="font-display text-2xl font-semibold leading-[1.15] text-butter">14:30</span>
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
          <MobileMenuList products={products} featured={breads} />
          <Link href="/thuc-don" className="inline-flex min-h-12 items-center gap-2 self-center rounded-full border-[1.5px] border-maroon px-[22px] font-semibold no-underline">Xem cả thực đơn <ArrowRightIcon /></Link>
        </div>
        <div className="hidden grid-cols-2 gap-6 md:grid lg:grid-cols-4">
          {breads.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* BÍ QUYẾT */}
      <section id="cau-chuyen" className="bg-beige">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-12 px-6 py-20 md:gap-[72px] md:py-[104px]">
          <div className="relative aspect-[4/5] min-w-0 flex-[1_1_440px] overflow-hidden rounded-[28px] shadow-[0_24px_48px_rgba(59,15,18,0.12)]">
            <Image src={productImages.crossSection} alt="Bốn lát croissant cắt đôi xếp chồng: bơ, kem hạnh nhân, phô mai mâm xôi và sô-cô-la" fill sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" style={{ objectPosition: "center 45%" }} />
          </div>
          <div className="flex min-w-0 flex-[1_1_400px] flex-col gap-[22px]">
            <h2 className={h2Cls}>Bí quyết nằm trong từng lớp bơ</h2>
            <p className="m-0 text-[17px] text-muted">Cắt đôi một chiếc croissant của The Yub, bạn sẽ thấy rõ từng lớp bột mỏng xếp chồng — kết quả của việc cán và gấp bột cùng bơ nhiều lần. Vỏ ngoài giòn rụm, ruột bên trong rỗng nhẹ và thơm bơ.</p>
            <ol className="m-0 mt-1 flex list-none flex-col border-t border-maroon/20 p-0">
              {[
                ["Bơ nguyên bản", secrets[0] ? formatVnd(secrets[0].priceVnd) : ""],
                ["Kem hạnh nhân", priceOf(products, "croissant-hanh-nhan")],
                ["Phô mai mâm xôi", priceOf(products, "croissant-mam-xoi")],
                ["Sô-cô-la chảy", secrets[1] ? formatVnd(secrets[1].priceVnd) : ""],
              ].map(([name, price], i) => (
                <li key={name} className="flex items-baseline gap-4 border-b border-maroon/20 py-3">
                  <span className="w-7 flex-none font-display text-[15px] font-semibold text-accent">{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex-1 font-semibold">{name}</span>
                  <span className="text-sm text-muted">{price}</span>
                </li>
              ))}
            </ol>
            <p className="m-0 text-[15px] text-muted">Mẻ chiều ra lò lúc 14:30 — đặt trước để phần bánh của bạn được để riêng.</p>
            <Link href="/cau-chuyen" className={`${linkCaps} self-start text-sm`}>Đọc câu chuyện của tiệm <ArrowRightIcon /></Link>
          </div>
        </div>
      </section>

      {/* GIÁ TRỊ */}
      <section className="mx-auto flex max-w-[1100px] flex-col items-center gap-14 px-6 py-20 text-center md:py-[104px]">
        <h2 className={h2SmCls}>Đơn giản. Tử tế. Mỗi ngày.</h2>
        <div className="grid w-full grid-cols-1 gap-10 md:grid-cols-3">
          {[
            { title: "Ra lò mỗi chiều", text: "Mẻ bánh mới lúc 14:30. Đặt trước để giữ phần cho mình.", icon: <><path d="M10 46c0-10 10-16 22-16s22 6 22 16c0 3-2 5-5 5H15c-3 0-5-2-5-5z" /><path d="M24 30c2 4 2 8 0 12M32 30c2 4 2 8 0 12M40 30c2 4 2 8 0 12" /><path d="M26 22c-2-3 2-5 0-9M33 22c-2-3 2-5 0-9M40 22c-2-3 2-5 0-9" /></> },
            { title: "Mẻ nhỏ, làm tay", text: "Từng mẻ bột được cán, gấp và tạo hình trong bếp của tiệm.", icon: <><path d="M32 58V12" /><path d="M32 20c-6-2-9-7-8-12 6 1 9 6 8 12zM32 20c6-2 9-7 8-12-6 1-9 6-8 12zM32 32c-6-2-9-7-8-12 6 1 9 6 8 12zM32 32c6-2 9-7 8-12-6 1-9 6-8 12zM32 44c-6-2-9-7-8-12 6 1 9 6 8 12zM32 44c6-2 9-7 8-12-6 1-9 6-8 12z" /></> },
            { title: "Hẹn giờ, ghé lấy", text: "Chọn khung giờ nhận online, tiệm gọi xác nhận rồi mới chuẩn bị.", icon: <><circle cx="32" cy="34" r="22" /><path d="M32 20v14l9 6" /><path d="M26 6h12M32 6v6" /></> },
          ].map((v) => (
            <div key={v.title} className="flex flex-col items-center gap-3">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="#3B0F12" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{v.icon}</svg>
              <h3 className="m-0 text-base font-bold">{v.title}</h3>
              <p className="m-0 max-w-[260px] text-[15px] text-muted-2">{v.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BÁN CHẠY */}
      <section className="mx-auto flex max-w-[1200px] flex-col gap-3 px-5 pb-20 pt-14 md:gap-10 md:px-6 md:pb-[152px] md:pt-6">
        <RuledHeading className={`${h2Cls} max-md:text-[32px]`}>Bán chạy</RuledHeading>
        <ol className="m-0 flex list-none flex-col p-0 md:hidden">
          {best.map((p, i) => (
            <li key={p.id} className="flex items-center gap-3.5 border-b border-accent/20 py-4">
              <div className="relative w-24 flex-none">
                <Link href={`/san-pham/${p.slug}`} aria-label={`Xem ${p.name}`} className="relative block h-28 w-24 overflow-hidden rounded-[18px] bg-[#E9C9A0]">
                  <Image src={productImages[p.image]} alt={p.name} fill sizes="96px" className="object-cover" style={{ objectPosition: p.imagePosition ?? "center" }} />
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
                  <Image src={productImages[p.image]} alt={p.name} fill sizes="(min-width: 1024px) 280px, (min-width: 640px) 45vw, 90vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" style={{ objectPosition: p.imagePosition ?? "center" }} />
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

      {/* TỪ LÒ NƯỚNG ĐẾN HỘP QUÀ */}
      <section className="relative bg-maroon text-cream">
        <TornWave fill="#3B0F12" mirror className="absolute -top-[47px] left-0" />
        <div className="mx-auto flex max-w-[1200px] flex-col gap-[30px] px-5 pb-24 pt-[60px] md:gap-14 md:px-6 md:pb-36 md:pt-[104px]">
          <h2 className={`${h2Cls} max-md:text-[32px] md:text-center`}>Từ lò nướng đến hộp quà</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {[
              { img: productImages.tartRack, pos: "center 40%", alt: "Khay tart nhiều vị vừa hoàn thiện", n: "01", title: "Làm mới mỗi ngày", text: "Tart, croissant và bánh ngọt được hoàn thiện theo từng mẻ trong ngày." },
              { img: productImages.redBoxCake, pos: "center 55%", alt: "Bánh kem trái cây đặt trong hộp quà màu đỏ", n: "02", title: "Gói hộp để mang tặng", text: "Đặt trước bánh kem, hộp tart mix vị cho sinh nhật và những dịp đặc biệt." },
            ].map((f) => (
              <figure key={f.n} className="m-0 flex flex-col gap-5">
                <div className="relative h-[230px] overflow-hidden rounded-[22px] md:h-auto md:aspect-[4/3] md:rounded-[28px]">
                  <Image src={f.img} alt={f.alt} fill sizes="(min-width: 768px) 580px, 100vw" className="object-cover" style={{ objectPosition: f.pos }} />
                </div>
                <figcaption className="flex items-start gap-[18px]">
                  <span className="flex-none font-display text-[28px] font-semibold leading-[1.1] text-butter">{f.n}</span>
                  <span className="flex flex-col gap-0.5">
                    <strong className="text-[19px] font-semibold">{f.title}</strong>
                    <span className="text-[15px] text-cream/80">{f.text}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
        <TornWave fill="#FBF3E3" className="absolute -bottom-px left-0" />
      </section>

      {/* QUẦY NƯỚC */}
      <section id="do-uong" className="mx-auto flex max-w-[1200px] flex-col gap-5 px-4 pb-14 pt-10 md:gap-16 md:px-6 md:pb-10 md:pt-32">
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
        <div className="md:hidden"><DrinkBoard drinks={drinks} variant="light" /></div>

        <div className="hidden flex-wrap items-end justify-between gap-x-16 gap-y-6 md:flex">
          <h2 className={`${h2Cls} min-w-0 flex-[1_1_460px]`}>Thơm bơ, đậm vị cà phê</h2>
          <p className="m-0 min-w-0 flex-[1_1_340px] text-[17px] text-muted-2">Bánh ngon cần một ly nước hợp vị. Quầy nước của The Yub có cà phê, trà trái cây và đồ uống không cà phê — pha khi bạn tới, uống tại tiệm hoặc mang đi.</p>
        </div>
        <div className="hidden flex-wrap items-stretch gap-10 md:flex">
          <div className="relative min-h-[420px] min-w-0 flex-[1_1_360px] overflow-hidden rounded-[240px_240px_28px_28px] md:min-h-[580px]">
            <Image src={productImages.croissantCoffee} alt="Ly cà phê bên khay croissant nhiều vị" fill sizes="(min-width: 1024px) 480px, 100vw" className="object-cover" style={{ objectPosition: "center 20%" }} />
          </div>
          <DrinkBoard drinks={drinks} />
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
                  <Image src={productImages[pr.image]} alt={pr.description} fill sizes="(min-width: 1024px) 380px, (min-width: 768px) 50vw, 100vw" className="object-cover" style={{ objectPosition: pr.imagePosition ?? "center" }} />
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

      {/* ĐẶT BÁNH THEO GIỜ HẸN */}
      <section id="dat-banh" className="mx-auto flex max-w-[1200px] scroll-mt-16 flex-col items-center gap-5 px-4 pb-14 pt-10 md:gap-12 md:px-6 md:py-[120px]">
        <h2 className={`${h2Cls} text-center max-md:text-[32px]`}>Đặt bánh theo giờ hẹn</h2>
        <div className="w-full md:hidden"><PickupPlanner variant="sheet" /></div>
        <div className="hidden w-full md:block"><PickupPlanner /></div>
      </section>

      {/* NHẬN TIN */}
      <section className="bg-beige">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-12 px-6 pb-[136px] pt-[88px]">
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
      <SiteFooter />
    </>
  );
}
