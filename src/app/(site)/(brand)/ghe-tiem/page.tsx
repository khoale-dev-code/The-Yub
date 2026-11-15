import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { StoreStatus } from "@/components/brand/store-status";
import { ArrowRightIcon, ClockIcon, PhoneIcon } from "@/components/ui/icons";
import { TornWave } from "@/components/ui/torn-wave";
import { productImages } from "@/lib/images";
import { pickupSlots } from "@/lib/pickup";
import { storeConfig } from "@/lib/store-config";
import { settingsRepository } from "@/modules/settings/repository";
import { paymentHints, paymentLabels } from "@/modules/orders/types";

export const metadata: Metadata = {
  title: "Ghé tiệm",
  description: `Giờ mở cửa ${storeConfig.openHours}, mẻ bánh chiều ra lò ${storeConfig.freshBatchTime}. Đặt trước online, hẹn khung giờ và ghé tiệm nhận bánh.`,
};

const PinIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
    <circle cx="12" cy="10" r="2.4" />
  </svg>
);

const steps = [
  { n: "01", title: "Chọn bánh online", text: "Xem thực đơn, thêm bánh vào giỏ – chọn quy cách nếu có." },
  { n: "02", title: "Hẹn ngày & khung giờ", text: "Chọn ngày nhận và khung giờ. Bánh kem, hộp quà cần đặt trước 1 ngày." },
  { n: "03", title: "Tiệm gọi xác nhận", text: "Tiệm gọi lại trong giờ mở cửa, xác nhận đơn rồi mới chuẩn bị bánh." },
  { n: "04", title: "Ghé tiệm nhận bánh", text: "Đọc mã đơn ở quầy. Phần bánh của bạn đã được để riêng." },
];

const faqs = [
  { q: "Tôi có cần đặt trước không?", a: `Không bắt buộc với bánh có sẵn trong ngày. Nhưng nếu muốn chắc có phần ở mẻ ${storeConfig.freshBatchTime}, bạn nên đặt trước và chọn khung giờ nhận.` },
  { q: "Bánh kem và hộp quà đặt trước bao lâu?", a: "Ít nhất 1 ngày. Khi đặt, bạn chọn ngày nhận từ ngày mai trở đi; tiệm sẽ gọi để xác nhận chi tiết (ví dụ chữ viết trên bánh)." },
  { q: "Tiệm có giao hàng không?", a: "Hiện tiệm nhận bánh tại tiệm theo giờ hẹn. Nếu cần hỗ trợ khác, bạn gọi tiệm trước nhé." },
  { q: "Thanh toán thế nào?", a: "Trả khi nhận bánh (tiền mặt hoặc thẻ tại quầy), hoặc chuyển khoản theo thông tin tiệm gửi khi gọi xác nhận. Đơn chuyển khoản chỉ được tính đã thanh toán sau khi tiệm đối soát." },
  { q: "Tôi muốn đổi giờ nhận hoặc huỷ đơn?", a: `Gọi tiệm qua số ${storeConfig.phone} trong giờ mở cửa, tiệm sẽ đổi giúp bạn.` },
];

export default async function GheTiemPage() {
  const settings = await settingsRepository.get();
  const hasAddress = Boolean(settings.address);

  return (
    <>
      {/* HERO */}
      <section className="mx-auto max-w-[1248px] px-3 pt-3 sm:px-6 sm:pt-7">
        <div className="relative grid overflow-hidden rounded-[26px] bg-maroon text-cream md:min-h-[520px] md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:rounded-[32px]">
          <div className="relative z-10 flex flex-col items-start justify-center gap-5 px-5 pb-8 pt-7 md:gap-6 md:py-14 md:pl-16 md:pr-10">
            <nav aria-label="Đường dẫn" className="text-[13px] text-cream/70 md:text-sm">
              <Link href="/" className="text-cream/70 hover:text-butter">Trang chủ</Link> <span aria-hidden="true">/</span> Ghé tiệm
            </nav>
            <h1 className="m-0 font-display text-[52px] font-semibold leading-[0.95] tracking-[-0.025em] md:text-[clamp(64px,7vw,108px)]">Ghé tiệm</h1>
            <p className="m-0 max-w-[440px] text-[17px] text-cream/85 md:text-lg">Bánh ra lò mỗi chiều, cà phê pha khi bạn tới. Đặt trước online, hẹn giờ rồi ghé lấy khi bánh còn ấm.</p>
            <StoreStatus tone="dark" />
            <div className="mt-1 flex flex-wrap gap-3">
              <a href={storeConfig.phoneHref} className="inline-flex min-h-[52px] items-center gap-2 rounded-full bg-butter px-6 font-bold text-maroon no-underline hover:bg-cream hover:text-maroon"><PhoneIcon /> Gọi {storeConfig.phone}</a>
              {settings.mapUrl ? (
                <a href={settings.mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[52px] items-center gap-2 rounded-full border-[1.5px] border-cream/60 px-6 font-semibold text-cream no-underline hover:border-butter hover:text-butter"><PinIcon /> Chỉ đường</a>
              ) : (
                <Link href="/dat-banh" className="inline-flex min-h-[52px] items-center gap-2 rounded-full border-[1.5px] border-cream/60 px-6 font-semibold text-cream no-underline hover:border-butter hover:text-butter">Đặt trước <ArrowRightIcon /></Link>
              )}
            </div>
          </div>
          <div className="relative h-[280px] overflow-hidden md:h-auto">
            <div data-parallax="0.14" className="absolute inset-x-0 -inset-y-[12%]">
              <Image src={productImages.tartRack} alt="Khay tart nhiều vị vừa hoàn thiện trong tiệm" fill priority sizes="(min-width: 768px) 600px, 100vw" className="object-cover" style={{ objectPosition: "center 45%" }} />
            </div>
            <div className="absolute right-4 top-4 flex rotate-4 flex-col rounded-2xl bg-butter px-4 py-2.5 leading-[1.2] text-maroon shadow-[0_12px_24px_rgba(36,18,13,0.3)] md:right-8 md:top-8 md:px-5 md:py-3">
              <span className="text-xs font-semibold md:text-[13px]">Mẻ chiều nay</span>
              <strong className="font-display text-[22px] font-semibold md:text-[28px]">{storeConfig.freshBatchTime}</strong>
            </div>
          </div>
        </div>
      </section>

      {/* Thông tin chính */}
      <section className="mx-auto max-w-[1200px] px-4 pt-10 sm:px-6 md:pt-14">
        <div data-reveal-stagger className="grid gap-4 md:grid-cols-3 md:gap-5">
          <div className="flex flex-col gap-3 rounded-[24px] border border-maroon/12 bg-card p-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-maroon text-cream"><PinIcon /></span>
            <h2 className="m-0 font-display text-2xl font-semibold">Địa chỉ</h2>
            <p className="m-0 text-muted">{hasAddress ? settings.address : "Tiệm đang cập nhật địa chỉ trên website – gọi tiệm để được chỉ đường."}</p>
            {settings.mapUrl && <a href={settings.mapUrl} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex min-h-11 items-center gap-1.5 font-semibold">Mở Google Maps <ArrowRightIcon /></a>}
          </div>
          <div className="flex flex-col gap-3 rounded-[24px] bg-maroon p-6 text-cream">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-butter text-maroon"><ClockIcon size={22} /></span>
            <h2 className="m-0 font-display text-2xl font-semibold">Giờ mở cửa</h2>
            <p className="m-0 font-display text-[34px] font-semibold leading-none text-butter">{storeConfig.openHours}</p>
            <p className="m-0 text-cream/80">Bánh mới ra lò lúc <strong className="text-butter">{storeConfig.freshBatchTime}</strong> mỗi chiều.</p>
          </div>
          <div className="flex flex-col gap-3 rounded-[24px] border border-maroon/12 bg-card p-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-maroon text-cream"><PhoneIcon size={22} /></span>
            <h2 className="m-0 font-display text-2xl font-semibold">Gọi trước khi đến</h2>
            <a href={storeConfig.phoneHref} className="font-display text-[30px] font-semibold leading-none no-underline">{storeConfig.phone}</a>
            <p className="m-0 text-muted">Hỏi bánh còn hay hết, đặt bánh kem, đổi giờ nhận – tiệm trả lời trong giờ mở cửa.</p>
          </div>
        </div>
      </section>

      {/* Hôm nay + bản đồ */}
      <section className="mx-auto grid max-w-[1200px] items-stretch gap-5 px-4 pt-5 sm:px-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="flex flex-col justify-between gap-6 rounded-[24px] bg-beige p-6 md:p-8">
          <div className="flex flex-col gap-2">
            <h2 className="m-0 font-display text-[28px] font-semibold leading-[1.15] md:text-[32px]">Hôm nay ở tiệm</h2>
            <p className="m-0 text-muted">Thanh bên dưới cập nhật theo giờ Việt Nam.</p>
          </div>
          <StoreStatus withTimeline />
        </div>
        <div className="relative min-h-[300px] overflow-hidden rounded-[24px] bg-sand md:min-h-[360px]">
          {settings.mapEmbedUrl ? (
            <iframe title={`Bản đồ đến ${storeConfig.name}`} src={settings.mapEmbedUrl} className="absolute inset-0 h-full w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center">
              <svg aria-hidden="true" className="absolute inset-0 h-full w-full opacity-40" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
                <g fill="none" stroke="#C9B79C" strokeWidth="10" strokeLinecap="round">
                  <path d="M-20 80 C 80 60, 160 130, 420 90" />
                  <path d="M60 -20 C 90 100, 40 200, 120 320" />
                  <path d="M-20 230 C 120 210, 260 260, 420 200" />
                  <path d="M280 -20 C 250 90, 330 180, 300 320" />
                </g>
              </svg>
              <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-maroon text-butter shadow-[0_12px_24px_rgba(59,15,18,0.3)]"><PinIcon /></span>
              <p className="relative m-0 max-w-[300px] font-display text-2xl font-semibold leading-tight">Bản đồ đang được cập nhật</p>
              <a href={storeConfig.phoneHref} className="relative inline-flex min-h-11 items-center gap-2 rounded-full bg-maroon px-5 font-semibold text-cream no-underline hover:bg-accent hover:text-cream">Gọi để được chỉ đường</a>
            </div>
          )}
        </div>
      </section>

      {/* Nhận bánh đã đặt */}
      <section className="mx-auto max-w-[1200px] px-5 pb-6 pt-24 md:px-6 md:pt-32">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4 md:mb-14">
          <h2 className="m-0 max-w-[560px] text-balance font-display text-[34px] font-semibold leading-[1.08] tracking-[-0.015em] md:text-[clamp(40px,4.4vw,56px)]">Đặt trước, hẹn giờ, ghé lấy</h2>
          <Link href="/thuc-don" className="inline-flex min-h-11 items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.08em]">Bắt đầu chọn bánh <ArrowRightIcon /></Link>
        </div>
        <div className="relative">
          <span aria-hidden="true" className="absolute left-0 right-0 top-[27px] hidden h-[2px] bg-maroon/12 md:block" />
          <span aria-hidden="true" data-scrub-line="x" className="absolute left-0 right-0 top-[27px] hidden h-[2px] bg-butter md:block" />
          <ol data-reveal-stagger className="relative m-0 grid list-none gap-8 p-0 md:grid-cols-4 md:gap-6">
            {steps.map((s) => (
              <li key={s.n} className="flex gap-4 md:flex-col">
                <span className="flex h-14 w-14 flex-none items-center justify-center rounded-full border-2 border-butter bg-page font-display text-xl font-semibold text-accent">{s.n}</span>
                <span className="flex flex-col gap-1.5">
                  <strong className="text-lg">{s.title}</strong>
                  <span className="text-[15px] text-muted">{s.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Khung giờ + thanh toán */}
      <section className="mx-auto grid max-w-[1200px] gap-5 px-4 pt-14 sm:px-6 md:grid-cols-2 md:pt-20">
        <div className="flex flex-col gap-5 rounded-[26px] border border-maroon/12 bg-card p-6 md:p-8">
          <h2 className="m-0 font-display text-[28px] font-semibold md:text-[32px]">Khung giờ nhận bánh</h2>
          <ul className="m-0 grid list-none grid-cols-2 gap-2.5 p-0 sm:grid-cols-3">
            {pickupSlots.map((s) => (
              <li key={s.id} className={`flex flex-col items-center justify-center rounded-2xl border px-2 py-3 text-center ${s.hot ? "border-maroon bg-maroon text-cream" : "border-maroon/20"}`}>
                <span className="text-[15px] font-bold">{s.label}</span>
                <span className={`text-xs ${s.hot ? "text-butter" : "text-muted"}`}>{s.hot ? "Bánh ấm" : s.note}</span>
              </li>
            ))}
          </ul>
          <p className="m-0 text-sm text-muted">Chọn khung giờ khi đặt bánh ở bước giỏ hàng. Muốn đổi giờ, gọi tiệm nhé.</p>
        </div>
        <div className="flex flex-col gap-5 rounded-[26px] bg-rose p-6 md:p-8">
          <h2 className="m-0 font-display text-[28px] font-semibold md:text-[32px]">Thanh toán</h2>
          {(["cod", "transfer"] as const).map((p) => (
            <div key={p} className="flex items-start gap-3 rounded-2xl bg-card/70 p-4">
              <span aria-hidden="true" className="mt-1 h-2.5 w-2.5 flex-none rounded-full bg-maroon" />
              <span className="flex flex-col gap-0.5">
                <strong>{paymentLabels[p]}</strong>
                <span className="text-sm text-ink">{paymentHints[p]}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Câu hỏi thường gặp */}
      <section className="mx-auto max-w-[880px] px-5 pb-28 pt-24 md:px-6 md:pb-32 md:pt-32">
        <h2 className="m-0 mb-8 text-balance font-display text-[34px] font-semibold leading-[1.08] tracking-[-0.015em] md:text-center md:text-[clamp(40px,4.4vw,52px)]">Câu hỏi thường gặp</h2>
        <div data-reveal-stagger className="flex flex-col border-t border-maroon/15">
          {faqs.map((f) => (
            <details key={f.q} className="group border-b border-maroon/15">
              <summary className="flex min-h-[64px] cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-lg font-semibold [&::-webkit-details-marker]:hidden">
                {f.q}
                <span aria-hidden="true" className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-maroon/25 text-xl transition-transform duration-300 group-open:rotate-45">+</span>
              </summary>
              <p className="m-0 max-w-[720px] pb-5 text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative bg-maroon text-cream">
        <TornWave fill="#3B0F12" mirror className="absolute -top-[47px] left-0" />
        <div className="mx-auto flex max-w-[1000px] flex-col items-center gap-6 px-5 pb-36 pt-20 text-center md:pt-24">
          <p className="m-0 text-balance font-display text-[38px] font-semibold leading-[1.08] md:text-[clamp(44px,5vw,68px)]">Hẹn gặp bạn ở tiệm chiều nay!</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/thuc-don" className="inline-flex min-h-[54px] items-center gap-2 rounded-full bg-butter px-7 font-bold text-maroon no-underline hover:bg-cream hover:text-maroon">Đặt bánh trước <ArrowRightIcon /></Link>
            <Link href="/cau-chuyen" className="inline-flex min-h-[54px] items-center rounded-full border-[1.5px] border-cream/60 px-7 font-semibold text-cream no-underline hover:border-butter hover:text-butter">Đọc câu chuyện của tiệm</Link>
          </div>
        </div>
      </section>
    </>
  );
}
