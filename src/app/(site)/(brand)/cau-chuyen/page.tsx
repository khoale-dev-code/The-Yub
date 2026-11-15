import type { Metadata } from "next";
import Link from "next/link";
import { Photo } from "@/components/brand/photo";
import { ProcessScroller, type ProcessStep } from "@/components/brand/process-scroller";
import { ArrowRightIcon } from "@/components/ui/icons";
import { TornWave } from "@/components/ui/torn-wave";
import { storyPhotos as P, type StoryPhoto } from "@/lib/story-images";
import { storeConfig } from "@/lib/store-config";

export const metadata: Metadata = {
  title: "Câu chuyện",
  description: "Câu chuyện của The Yub – Bakes & More: bánh nướng theo mẻ nhỏ, ra lò 14:30 mỗi chiều, nơi giòn rụm gặp thơm bơ.",
};

/*
 * Noi dung chi dua tren thong tin da co (gio mo cua, me 14:30, dat truoc, nhan tai tiem).
 * Chua co: nguoi sang lap, nam mo cua, dia chi -> KHONG tu viet.
 * Moi anh hien DUNG TI LE GOC (component Photo) – khong cat.
 */

const open = storeConfig.openTime.replace(/^0/, "");

const facts = [
  { value: open, label: "Mở cửa mỗi ngày" },
  { value: storeConfig.freshBatchTime, label: "Mẻ bánh chiều ra lò" },
  { value: "1 ngày", label: "Đặt trước bánh kem & hộp quà" },
  { value: storeConfig.closeTime, label: "Quầy nước đóng cửa" },
];

const day: { time: string; title: string; text: string; photo: StoryPhoto }[] = [
  { time: "Tối hôm trước", title: "Ủ bột qua đêm", text: "Những chiếc bánh đã cuộn nghỉ lạnh qua đêm – để sáng mai có vị thơm và ruột mềm dai nhẹ.", photo: P.rawCroissants },
  { time: open, title: "Mở cửa, bật quầy nước", text: "Khay bánh mẻ sáng lên kệ, cà phê pha khi bạn tới.", photo: P.croissantTray },
  { time: "Buổi sáng", title: "Cán, gấp bơ, tạo hình", text: "Bột được cán mỏng, gấp cùng bơ lạnh rồi cuộn bằng tay – đó là nơi những lớp giòn bắt đầu.", photo: P.shapingHands },
  { time: storeConfig.freshBatchTime, title: "Mẻ chiều ra lò", text: "Khoảnh khắc thơm nhất trong ngày. Đơn đặt trước được để riêng phần ngay lúc này.", photo: P.eggTartsOven },
  { time: storeConfig.closeTime, title: "Chiếc bánh cuối ngày", text: "Những chiếc bánh cuối cùng rời quầy, bột cho ngày mai đã vào tủ lạnh – và vòng lặp lại bắt đầu.", photo: P.painChocolat },
];

const process: ProcessStep[] = [
  { n: "01", title: "Cán & gấp bơ", text: "Bột và bơ lạnh được cán, gấp nhiều lần để tạo hàng chục lớp mỏng.", photo: P.cubeStack },
  { n: "02", title: "Tạo hình theo mẻ nhỏ", text: "Mỗi mẻ vừa đủ cho một buổi – không làm sẵn hàng loạt.", photo: P.crossSection },
  { n: "03", title: "Nướng đến vàng giòn", text: `Mẻ chiều ra lò lúc ${storeConfig.freshBatchTime}: vỏ giòn rụm, ruột rỗng nhẹ và thơm bơ.`, photo: P.choco },
  { n: "04", title: "Gói hộp mang tặng", text: "Bánh kem, hộp tart nhiều vị được gói sẵn cho những dịp đặc biệt.", photo: P.redBoxCake },
];

/** 3 cot anh, moi cot troi voi toc do khac nhau (parallax ca khung – anh khong bi cat) */
const gallery: { speed: string; offset: string; items: { photo: StoryPhoto; caption: string }[] }[] = [
  { speed: "0.10", offset: "", items: [{ photo: P.rollLatte, caption: "Bánh cuộn kem & latte đá" }, { photo: P.bagelBlueberry, caption: "Kem phô mai & việt quất" }] },
  { speed: "-0.14", offset: "md:pt-24", items: [{ photo: P.matchaBagel, caption: "Matcha & cà phê đen" }, { photo: P.canele, caption: "Hai chiếc bánh nhỏ cho buổi chiều" }] },
  { speed: "0.18", offset: "md:pt-10", items: [{ photo: P.peachToast, caption: "Trái cây mùa trên lát bánh" }, { photo: P.swirlBreakfast, caption: "Bữa sáng chậm" }] },
];

const values = [
  { title: "Ra lò mỗi chiều", text: `Mẻ bánh mới lúc ${storeConfig.freshBatchTime}. Đặt trước để giữ phần cho mình.`, icon: <><path d="M10 46c0-10 10-16 22-16s22 6 22 16c0 3-2 5-5 5H15c-3 0-5-2-5-5z" /><path d="M24 30c2 4 2 8 0 12M32 30c2 4 2 8 0 12M40 30c2 4 2 8 0 12" /><path d="M26 22c-2-3 2-5 0-9M33 22c-2-3 2-5 0-9M40 22c-2-3 2-5 0-9" /></> },
  { title: "Mẻ nhỏ, làm tay", text: "Từng mẻ bột được cán, gấp và tạo hình trong bếp của tiệm.", icon: <><path d="M32 58V12" /><path d="M32 20c-6-2-9-7-8-12 6 1 9 6 8 12zM32 20c6-2 9-7 8-12-6 1-9 6-8 12zM32 32c-6-2-9-7-8-12 6 1 9 6 8 12zM32 32c6-2 9-7 8-12-6 1-9 6-8 12zM32 44c-6-2-9-7-8-12 6 1 9 6 8 12zM32 44c6-2 9-7 8-12-6 1-9 6-8 12z" /></> },
  { title: "Hẹn giờ, ghé lấy", text: "Chọn khung giờ nhận online, tiệm gọi xác nhận rồi mới chuẩn bị.", icon: <><circle cx="32" cy="34" r="22" /><path d="M32 20v14l9 6" /><path d="M26 6h12M32 6v6" /></> },
];


export default function CauChuyenPage() {
  return (
    <>
      {/* HERO – 2 ảnh dạng "ảnh in", hiển thị đủ khung */}
      <section className="mx-auto grid max-w-[1200px] items-center gap-12 px-5 pb-16 pt-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-16 md:px-6 md:pb-28 md:pt-16">
        <div className="flex flex-col items-start gap-6">
          <nav aria-label="Đường dẫn" className="text-[13px] text-muted md:text-sm">
            <Link href="/" className="text-muted">Trang chủ</Link> <span aria-hidden="true">/</span> Câu chuyện
          </nav>
          <h1 className="m-0 text-balance font-display text-[46px] font-semibold leading-[0.98] tracking-[-0.025em] md:text-[clamp(60px,6.6vw,104px)]">Một mẻ bánh nhỏ, mỗi chiều.</h1>
          <p className="m-0 max-w-[520px] text-[17px] text-muted md:text-lg">
            The Yub là tiệm bánh và quầy nước nhỏ. Chúng mình nướng theo mẻ, để mỗi chiếc bánh đến tay bạn còn giòn, còn thơm bơ – đúng như câu chúng mình vẫn nói:{" "}
            <em className="font-display not-italic text-accent">{storeConfig.slogan.toLowerCase()}</em>.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/thuc-don" className="inline-flex min-h-[52px] items-center gap-2 rounded-full bg-maroon px-6 font-semibold text-cream no-underline hover:bg-accent hover:text-cream">Xem bánh hôm nay <ArrowRightIcon /></Link>
            <Link href="/ghe-tiem" className="inline-flex min-h-[52px] items-center rounded-full border-[1.5px] border-maroon px-6 font-semibold text-maroon no-underline hover:bg-maroon hover:text-cream">Ghé tiệm</Link>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-[520px] pb-16 pl-10 md:pb-24 md:pl-16">
          <div data-parallax="0.06" className="relative">
            <Photo photo={P.peachToast} sizes="(min-width: 768px) 460px, 85vw" priority reveal={false} rounded="rounded-[28px]" className="rotate-[1.5deg] rounded-[30px] bg-card p-2.5 shadow-[0_30px_60px_-24px_rgba(59,15,18,0.45)]" />
            <span className="absolute -right-3 top-8 flex rotate-4 flex-col rounded-2xl bg-card px-4 py-3 leading-tight text-maroon shadow-[0_14px_30px_rgba(36,18,13,0.18)] md:-right-6">
              <span className="text-xs font-semibold text-muted">Mẻ chiều nay</span>
              <strong className="font-display text-2xl font-semibold">{storeConfig.freshBatchTime}</strong>
            </span>
          </div>
          <div data-parallax="0.3" className="absolute bottom-0 left-0 w-[46%]">
            <Photo photo={P.canele} sizes="(min-width: 768px) 220px, 40vw" priority reveal={false} rounded="rounded-[20px]" className="-rotate-[4deg] rounded-[24px] bg-card p-2 shadow-[0_24px_48px_-18px_rgba(59,15,18,0.5)]" />
            <span className="absolute -bottom-4 right-[-18px] -rotate-6 rounded-2xl bg-butter px-4 py-2 font-display text-xl font-semibold text-maroon shadow-[0_14px_30px_rgba(36,18,13,0.25)] md:text-2xl">Giòn rụm</span>
          </div>
        </div>
      </section>

      {/* Con số thật */}
      <section className="mx-auto max-w-[1200px] px-5 pb-24 md:px-6 md:pb-32">
        <dl data-reveal-stagger className="m-0 grid grid-cols-2 gap-px overflow-hidden rounded-[26px] border border-maroon/12 bg-maroon/12 md:grid-cols-4">
          {facts.map((f) => (
            <div key={f.label} className="flex flex-col gap-1 bg-card px-5 py-6 md:px-7 md:py-8">
              <dt className="order-2 text-sm text-muted">{f.label}</dt>
              <dd className="order-1 m-0 font-display text-[34px] font-semibold leading-none md:text-[44px]">{f.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Khẩu hiệu */}
      <section data-no-reveal className="relative bg-maroon text-cream">
        <TornWave fill="#3B0F12" mirror className="absolute -top-[47px] left-0" />
        <div className="mx-auto flex max-w-[980px] flex-col items-center gap-6 px-5 py-28 text-center md:px-6 md:py-36">
          <p data-split className="m-0 text-balance font-display text-[40px] font-semibold leading-[1.08] tracking-[-0.02em] md:text-[clamp(52px,6vw,88px)]">“{storeConfig.slogan}.”</p>
          <p data-reveal className="m-0 max-w-[620px] text-[17px] text-cream/80">Giòn rụm là lớp vỏ vàng nứt nhẹ khi bạn bẻ đôi. Thơm bơ là mùi hương lan ra khi khay bánh vừa rời lò. Mọi thứ ở tiệm – từ giờ ra lò đến cách đặt trước – đều để hai điều đó gặp nhau đúng lúc bạn tới.</p>
        </div>
        <TornWave fill="#FBF3E3" className="absolute -bottom-px left-0" />
      </section>

      {/* Một ngày ở tiệm – ảnh đúng tỉ lệ */}
      <section className="mx-auto max-w-[1100px] px-5 pb-24 pt-24 md:px-6 md:pb-32 md:pt-32">
        <h2 className="m-0 mb-14 text-balance font-display text-[36px] font-semibold leading-[1.06] tracking-[-0.015em] md:mb-20 md:text-center md:text-[clamp(44px,5vw,68px)]">Một ngày ở tiệm</h2>
        <ol className="relative m-0 list-none p-0">
          <span aria-hidden="true" className="absolute bottom-6 left-[19px] top-6 w-[2px] bg-maroon/12 md:left-1/2 md:-translate-x-1/2" />
          <span aria-hidden="true" data-scrub-line className="absolute bottom-6 left-[19px] top-6 w-[2px] bg-butter md:left-1/2 md:-translate-x-1/2" />
          {day.map((d, i) => {
            const left = i % 2 === 0;
            return (
              <li key={d.title} className="relative grid grid-cols-[40px_minmax(0,1fr)] gap-x-5 gap-y-5 pb-16 last:pb-0 md:grid-cols-[minmax(0,1fr)_40px_minmax(0,1fr)] md:items-center md:gap-x-12 md:pb-24">
                <span aria-hidden="true" className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-butter bg-page md:col-start-2 md:row-start-1">
                  <span className="h-3 w-3 rounded-full bg-maroon" />
                </span>
                <div data-reveal className={`flex flex-col gap-2 md:row-start-1 ${left ? "md:col-start-1 md:items-end md:text-right" : "md:col-start-3"}`}>
                  <span className="font-display text-[30px] font-semibold leading-none text-accent md:text-[40px]">{d.time}</span>
                  <h3 className="m-0 text-lg font-bold md:text-xl">{d.title}</h3>
                  <p className="m-0 max-w-[380px] text-[15px] text-muted md:text-base">{d.text}</p>
                </div>
                <div className={`group relative col-start-2 w-full max-w-[340px] md:row-start-1 md:max-w-[400px] ${left ? "md:col-start-3" : "md:col-start-1 md:justify-self-end"}`}>
                  <Photo
                    photo={d.photo}
                    sizes="(min-width: 768px) 400px, 80vw"
                    rounded="rounded-[26px]"
                    className={`rounded-[30px] bg-card p-2 shadow-[0_24px_50px_-24px_rgba(59,15,18,0.45)] transition-transform duration-700 ease-out group-hover:rotate-0 ${left ? "md:rotate-[1.5deg]" : "md:-rotate-[1.5deg]"}`}
                  />
                  <span className={`absolute -top-3 rounded-full bg-maroon px-4 py-2 font-display text-base font-semibold text-butter shadow-[0_8px_18px_rgba(36,18,13,0.3)] ${left ? "-left-3 md:-left-4" : "-left-3 md:-right-4 md:left-auto"}`}>
                    {d.time}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Từ bột đến hộp quà – sticky storytelling */}
      <section data-no-reveal className="relative bg-maroon pb-28 pt-24 text-cream md:pb-36 md:pt-32">
        <TornWave fill="#3B0F12" mirror className="absolute -top-[47px] left-0" />
        <ProcessScroller steps={process} />
        <TornWave fill="#FBF3E3" className="absolute -bottom-px left-0" />
      </section>

      {/* Bộ sưu tập – 3 cột trôi lệch tốc độ */}
      <section className="mx-auto max-w-[1200px] px-5 pb-16 pt-24 md:px-6 md:pt-32">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-4 md:mb-16">
          <h2 className="m-0 max-w-[640px] text-balance font-display text-[36px] font-semibold leading-[1.06] tracking-[-0.015em] md:text-[clamp(44px,5vw,68px)]">Một tách cà phê, một lát bánh</h2>
          <p className="m-0 max-w-[340px] text-[15px] text-muted">Những buổi sáng chậm và buổi chiều có mẻ bánh mới – nhịp quen thuộc ở quầy nước của tiệm.</p>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-8">
          {gallery.map((col, ci) => (
            <div key={ci} data-parallax={col.speed} className={`${ci === 2 ? "col-span-2 grid grid-cols-2 gap-4 md:col-span-1 md:flex md:flex-col md:gap-8" : "flex flex-col gap-4 md:gap-8"} ${col.offset}`}>
              {col.items.map((it) => (
                <Photo key={it.photo.src} photo={it.photo} caption={it.caption} sizes="(min-width: 768px) 360px, 46vw" />
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Giá trị */}
      <section className="mx-auto flex max-w-[1100px] flex-col items-center gap-12 px-5 py-24 text-center md:gap-14 md:px-6 md:py-32">
        <h2 className="m-0 text-balance font-display text-[34px] font-semibold leading-[1.12] tracking-[-0.01em] md:text-[clamp(40px,4.4vw,56px)]">Đơn giản. Tử tế. Mỗi ngày.</h2>
        <div data-reveal-stagger className="grid w-full grid-cols-1 gap-6 md:grid-cols-3">
          {values.map((v) => (
            <div key={v.title} className="flex flex-col items-center gap-3 rounded-[26px] bg-beige px-6 py-10">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="#3B0F12" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{v.icon}</svg>
              <h3 className="m-0 text-lg font-bold">{v.title}</h3>
              <p className="m-0 max-w-[280px] text-[15px] text-muted-2">{v.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Lời mời – ảnh đủ khung trong thẻ */}
      <section className="mx-auto max-w-[1200px] px-5 pb-28 md:px-6 md:pb-36">
        <div data-reveal-stagger className="grid items-stretch gap-5 md:grid-cols-2 md:gap-6">
          <Link href="/thuc-don" className="group grid grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] items-center gap-5 rounded-[28px] bg-maroon p-4 text-cream no-underline hover:text-cream md:gap-7 md:p-5">
            <Photo photo={P.rollLatte} sizes="(min-width: 768px) 260px, 40vw" reveal={false} rounded="rounded-[20px]" className="transition-transform duration-700 group-hover:-rotate-2" />
            <span className="flex flex-col gap-2 pr-2">
              <span className="font-display text-[30px] font-semibold leading-[1.1] md:text-[38px]">Bánh hôm nay</span>
              <span className="text-[15px] text-cream/75">Croissant, tart, bánh kem – và những cặp đôi với đồ uống.</span>
              <span className="mt-2 inline-flex items-center gap-2 font-semibold text-butter">Xem thực đơn <ArrowRightIcon /></span>
            </span>
          </Link>
          <Link href="/ghe-tiem" className="group grid grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] items-center gap-5 rounded-[28px] bg-butter p-4 text-maroon no-underline hover:text-maroon md:gap-7 md:p-5">
            <Photo photo={P.bagelBlueberry} sizes="(min-width: 768px) 260px, 40vw" reveal={false} rounded="rounded-[20px]" className="transition-transform duration-700 group-hover:rotate-2" />
            <span className="flex flex-col gap-2 pr-2">
              <span className="font-display text-[30px] font-semibold leading-[1.1] md:text-[38px]">Ghé tiệm chiều nay</span>
              <span className="text-[15px] text-ink">Giờ mở cửa, khung giờ nhận bánh và cách đặt trước.</span>
              <span className="mt-2 inline-flex items-center gap-2 font-semibold">Xem thông tin tiệm <ArrowRightIcon /></span>
            </span>
          </Link>
        </div>
      </section>
    </>
  );
}
