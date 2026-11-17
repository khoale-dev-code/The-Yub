import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { DrinkMenu, type DrinkMenuGroup } from "@/components/drinks/drink-menu";
import { InquiryForm } from "@/components/drinks/inquiry-form";
import { formatVnd } from "@/lib/format";
import { productImages } from "@/lib/images";
import { getStoreInfo } from "@/modules/settings/store-info-server";
import { settingsRepository } from "@/modules/settings/repository";
import { ADDRESS_PLACEHOLDER } from "@/modules/settings/types";
import { drinksRepository, productsRepository } from "@/modules/products/repository";
import type { Product } from "@/modules/products/types";
import { shortTime } from "@/modules/settings/store-info";
import { categoriesRepository } from "@/modules/categories/repository";

export const metadata: Metadata = {
  title: "Đồ uống",
  description: "Quầy nước cạnh lò bánh – cà phê, trà trái cây, đồ uống không cà phê và nước ép. Pha khi bạn tới.",
};

const point = (n: string, title: string, text: string, last = false) => (
  <li key={n} className={`grid grid-cols-[40px_minmax(0,1fr)] gap-2.5 border-t border-maroon/20 py-3.5 md:grid-cols-[48px_minmax(0,1fr)] md:gap-3 md:py-4 ${last ? "border-b" : ""}`}>
    <span className="font-display text-xl font-semibold text-accent md:text-[22px]">{n}</span>
    <span className="flex flex-col"><strong>{title}</strong><span className="text-sm text-muted">{text}</span></span>
  </li>
);

export default async function DoUongPage() {
  const store = await getStoreInfo();
  const [drinks, products, settings, drinkCats] = await Promise.all([drinksRepository.list(), productsRepository.list(), settingsRepository.get(), categoriesRepository.list("drink")]);
  const groups: DrinkMenuGroup[] = drinkCats
    .map((g) => ({ id: g.slug, label: g.name, items: drinks.filter((d) => d.group === g.slug) }))
    .filter((g) => g.items.length > 0);
  // Chenh lech size L so voi M lay tu du lieu (khong ghi cung)
  const withL = drinks.find((d) => d.priceLVnd !== null);
  const sizeLExtra = withL && withL.priceLVnd !== null ? withL.priceLVnd - withL.priceMVnd : null;
  const pairs = ["combo-croissant-cacao", "combo-banh-cuon-latte", "combo-pancake-americano"]
    .map((s) => products.find((p) => p.slug === s))
    .filter((p): p is Product => Boolean(p));

  return (
    <>
      <main>
        {/* HERO */}
        <section className="grid items-center md:grid-cols-2 md:gap-16">
          <div className="relative aspect-square overflow-hidden rounded-br-[110px] md:rounded-br-[180px]">
            <Image src={productImages.croissantCocoa} alt="Croissant bơ và ly cacao nóng trên khay gỗ" fill priority sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
          </div>
          <div className="flex flex-col items-start gap-[18px] px-5 pb-2 pt-[26px] md:gap-[26px] md:py-10 md:pl-0 md:pr-12">
            <nav aria-label="Đường dẫn" className="text-[13px] text-muted md:text-sm">
              <Link href="/" className="text-muted">Trang chủ</Link> <span aria-hidden="true">/</span> Đồ uống
            </nav>
            <h1 className="m-0 font-display text-[60px] font-semibold leading-[0.92] tracking-[-0.03em] md:text-[clamp(72px,8.4vw,132px)]">Quầy nước &amp; bánh ấm</h1>
            <a href="#thuc-don-nuoc" className="order-last inline-flex min-h-[54px] w-full items-center justify-center rounded-full bg-maroon px-7 font-semibold text-cream no-underline hover:bg-accent hover:text-cream md:order-none md:min-h-14 md:w-auto md:min-w-[260px]">Xem thực đơn nước</a>
            <p className="m-0 max-w-[380px] text-[17px] font-bold leading-[1.35] md:text-xl">Góc cà phê ấm áp ngay cạnh lò nướng của tiệm</p>
          </div>
        </section>

        {/* Vì sao ghé quầy */}
        <section className="mx-auto max-w-[1200px] px-5 pb-[52px] pt-14 md:px-6 md:py-[120px]">
          {/* mobile: 2 ảnh cùng kích thước (3:4) + 3 điểm dạng thẻ */}
          <div className="flex flex-col gap-5 md:hidden">
            <h2 className="m-0 text-balance font-display text-[32px] font-semibold leading-[1.12]">Pha khi bạn tới, để bạn muốn quay lại</h2>
            <p className="m-0 text-pretty text-muted">Quầy nước ngay cạnh lò nướng – cà phê còn thơm, trà còn tươi khi đặt xuống bàn cùng chiếc bánh vừa ra lò.</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { src: "/images/story/roll-latte.jpg", alt: "Latte đá bên bánh cuộn kem và dâu tươi", cap: "Latte đá & bánh cuộn", amt: "-0.08" },
                { src: "/images/story/peach-toast.jpg", alt: "Ly cà phê sữa đá bên lát bánh mì trái cây", cap: "Cà phê sữa đá & bánh mì", amt: "0.08" },
              ].map((f) => (
                <figure key={f.src} className="m-0 flex flex-col gap-2">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-[20px] bg-beige">
                    <div data-parallax={f.amt} className="absolute inset-x-0 -inset-y-[6%]">
                      <Image src={f.src} alt={f.alt} fill sizes="50vw" className="object-cover" />
                    </div>
                  </div>
                  <figcaption className="text-[13px] leading-snug text-muted-2">{f.cap}</figcaption>
                </figure>
              ))}
            </div>
            <ol data-reveal-stagger className="m-0 mt-1 grid list-none gap-2.5 p-0">
              {[
                ["01", "Pha khi bạn gọi", "Không pha sẵn, không để lâu."],
                ["02", "Tuỳ chỉnh theo bạn", "Ít ngọt, ít đá, đổi sữa – ghi chú khi đặt."],
                ["03", "Ngồi lại cùng bánh ấm", `Bánh ra lò ${store.freshBatchTime}, mở cửa đến ${shortTime(store.closeTime)}.`],
              ].map(([n, t, d]) => (
                <li key={n} className="flex items-start gap-3.5 rounded-[20px] bg-card px-4 py-3.5 shadow-[0_14px_30px_-26px_rgba(59,15,18,0.5)]">
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-butter font-display text-[17px] font-semibold text-maroon">{n}</span>
                  <span className="flex min-w-0 flex-col pt-0.5">
                    <strong className="text-[16px]">{t}</strong>
                    <span className="text-pretty text-sm text-muted">{d}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
          {/* desktop: 3 cột */}
          <div className="hidden grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,0.72fr)] items-start gap-14 md:grid">
            <figure className="m-0 flex flex-col gap-2.5">
              <div className="relative aspect-[735/839] overflow-hidden rounded-[28px]"><Image src={productImages.pancake} alt="Pancake việt quất và ly americano" fill sizes="420px" className="object-cover" /></div>
              <figcaption className="text-[13px] text-muted-2">Pancake &amp; americano – cặp đôi buổi sáng</figcaption>
            </figure>
            <div className="flex flex-col gap-[22px] pt-10">
              <h2 className="m-0 text-balance font-display text-[clamp(34px,3.4vw,46px)] font-semibold leading-[1.1] tracking-[-0.015em]">Pha khi bạn tới, để bạn muốn quay lại</h2>
              <p className="m-0 text-[17px] text-muted">Quầy nước nằm ngay cạnh lò nướng – cà phê còn thơm, trà còn tươi khi đặt xuống bàn cùng chiếc bánh vừa ra lò.</p>
              <ol className="m-0 mt-2 flex list-none flex-col p-0">
                {point("01", "Pha khi bạn gọi", "Không pha sẵn, không để lâu.")}
                {point("02", "Tuỳ chỉnh theo bạn", "Ít ngọt, ít đá, đổi sữa – ghi chú khi đặt.")}
                {point("03", "Ngồi lại cùng bánh ấm", `Bánh ra lò ${store.freshBatchTime}, mở cửa đến ${shortTime(store.closeTime)}.`, true)}
              </ol>
            </div>
            <figure className="m-0 mt-[120px] flex flex-col gap-2.5">
              <div className="relative aspect-[731/1300] overflow-hidden rounded-[28px]"><Image src={productImages.croissantCoffee} alt="Khay croissant nhiều vị bên ly cà phê" fill sizes="280px" className="object-cover" /></div>
              <figcaption className="text-[13px] text-muted-2">Croissant nhiều vị &amp; cà phê sữa</figcaption>
            </figure>
          </div>
        </section>

        {/* THỰC ĐƠN */}
        <section id="thuc-don-nuoc" data-no-reveal className="relative bg-cream text-ink">
          <DrinkMenu groups={groups} sizeLExtra={sizeLExtra} />
        </section>

        {/* Cặp đôi ấm lòng */}
        <section className="mx-auto flex max-w-[1200px] flex-col gap-[18px] pb-10 pt-12 md:gap-10 md:px-6 md:pb-[88px] md:pt-[104px]">
          <h2 className="m-0 px-5 font-display text-[30px] font-semibold leading-[1.15] md:px-0 md:text-[clamp(32px,3.2vw,42px)]">Cặp đôi ấm lòng nên thử</h2>
          <div className="no-scrollbar relative flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-1 md:grid md:grid-cols-3 md:gap-12 md:overflow-visible md:px-0">
            {pairs.map((p) => (
              <article key={p.id} className="flex w-[78%] flex-none snap-start flex-col gap-3.5 md:w-auto">
                <h3 className="m-0 text-base font-bold"><Link href={`/san-pham/${p.slug}`} className="no-underline">{p.name}</Link></h3>
                <Link href={`/san-pham/${p.slug}`} aria-label={`Xem ${p.name}`} className="group relative block aspect-[4/5] overflow-hidden rounded-tr-[56px]">
                  <Image src={p.cover} alt={p.name} fill sizes="(min-width: 768px) 360px, 78vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                </Link>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[13px] text-muted-2">1 bánh + 1 ly</span>
                  <strong className="font-display text-xl font-semibold">{formatVnd(p.priceVnd)}</strong>
                </div>
              </article>
            ))}
          </div>
          <Link href="/thuc-don?loai=combo#tat-ca" className="mx-5 mt-1.5 flex min-h-[54px] items-center justify-center rounded-full bg-maroon px-7 font-semibold text-cream no-underline hover:bg-accent hover:text-cream md:mx-0 md:min-h-14 md:min-w-[260px] md:self-center">Đặt cặp đôi</Link>
        </section>
      </main>

      {/* Chân trang kiểu liên hệ */}
      <footer id="ghe-tiem">
        <div className="mx-auto grid max-w-[1200px] items-start gap-12 px-5 pt-4 md:grid-cols-[minmax(0,1fr)_420px] md:gap-16 md:px-6 md:pt-6">
          <div className="order-2 flex min-h-full flex-col gap-7 md:order-1">
            <nav aria-label="Liên kết chân trang" className="flex flex-col gap-1.5 text-sm">
              <Link href="/thuc-don" className="inline-flex min-h-8 items-center no-underline">Thực đơn bánh</Link>
              <Link href="/do-uong" className="inline-flex min-h-8 items-center no-underline">Đồ uống</Link>
              <Link href="/thuc-don" className="inline-flex min-h-8 items-center no-underline">Đặt bánh</Link>
            </nav>
            <div className="flex gap-3">
              <a href={store.phoneHref} aria-label="Gọi tiệm" className="flex h-12 w-12 items-center justify-center rounded-full bg-maroon text-cream hover:bg-accent hover:text-cream">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" aria-hidden="true"><path d="M4 18.5V6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H8.5z" /></svg>
              </a>
            </div>
            <div className="mt-auto flex flex-col gap-1.5">
              <p className="m-0 font-display text-[26px] font-semibold leading-[1.15] md:text-[30px]">Hẹn gặp bạn ở tiệm<br />chiều nay!</p>
              <span className="text-sm text-muted">{settings.address ?? ADDRESS_PLACEHOLDER} · Mở cửa {store.openHours} · {store.phone}</span>
            </div>
          </div>
          <div className="order-1 flex flex-col gap-4 md:order-2 md:gap-[18px]">
            <h2 className="m-0 text-xl font-bold md:text-[22px]">Còn câu hỏi?</h2>
            <p className="m-0 text-sm text-muted">Tiệm sẵn lòng trả lời – đặt nước cho nhóm, buổi họp hay hỏi về món.</p>
            <InquiryForm />
          </div>
        </div>
        <div aria-hidden="true" className="mt-12 overflow-hidden whitespace-nowrap text-center font-display text-[clamp(110px,21vw,320px)] font-semibold leading-[0.8] tracking-[-0.03em] text-beige">The Yub</div>
        <p className="m-0 px-6 pb-28 pt-[18px] text-center text-[13px] text-muted md:pb-6">© 2026 {store.name}</p>
      </footer>
    </>
  );
}
