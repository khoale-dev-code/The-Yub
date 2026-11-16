import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { StoreMap } from "@/components/brand/store-map";
import { StoreStatus } from "@/components/brand/store-status";
import { ArrowRightIcon, ClockIcon, PhoneIcon } from "@/components/ui/icons";
import { FaqAccordion } from "@/components/visit/faq-accordion";
import { VisitHeroMotion } from "@/components/visit/visit-hero-motion";
import { VisitSteps } from "@/components/visit/visit-steps";
import { WaveEdge } from "@/components/ui/wave-edge";
import { productImages } from "@/lib/images";
import { pickupSlots } from "@/lib/pickup";
import { getStoreInfo } from "@/modules/settings/store-info-server";
import type { StoreInfo } from "@/modules/settings/store-info";
import { directionsUrlOf } from "@/modules/settings/map";
import { settingsRepository } from "@/modules/settings/repository";
import { paymentHints, paymentLabels } from "@/modules/orders/types";
import { isFreshSlot } from "@/lib/pickup";

export async function generateMetadata(): Promise<Metadata> {
  const store = await getStoreInfo();
  return {
    title: "Ghé tiệm",
    description: `Giờ mở cửa ${store.openHours}, mẻ bánh chiều ra lò ${store.freshBatchTime}. Đặt trước online, hẹn khung giờ và ghé tiệm nhận bánh.`,
  };
}

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

const faqsOf = (store: StoreInfo) => [
  { q: "Tôi có cần đặt trước không?", a: `Không bắt buộc với bánh có sẵn trong ngày. Nhưng nếu muốn chắc có phần ở mẻ ${store.freshBatchTime}, bạn nên đặt trước và chọn khung giờ nhận.` },
  { q: "Bánh kem và hộp quà đặt trước bao lâu?", a: "Ít nhất 1 ngày. Khi đặt, bạn chọn ngày nhận từ ngày mai trở đi; tiệm sẽ gọi để xác nhận chi tiết (ví dụ chữ viết trên bánh)." },
  { q: "Tiệm có giao hàng không?", a: "Hiện tiệm nhận bánh tại tiệm theo giờ hẹn. Nếu cần hỗ trợ khác, bạn gọi tiệm trước nhé." },
  { q: "Thanh toán thế nào?", a: "Trả khi nhận bánh (tiền mặt hoặc thẻ tại quầy), hoặc chuyển khoản theo thông tin tiệm gửi khi gọi xác nhận. Đơn chuyển khoản chỉ được tính đã thanh toán sau khi tiệm đối soát." },
  { q: "Tôi muốn đổi giờ nhận hoặc huỷ đơn?", a: `Gọi tiệm qua số ${store.phone} trong giờ mở cửa, tiệm sẽ đổi giúp bạn.` },
];

export default async function GheTiemPage() {
  const store = await getStoreInfo();
  const settings = await settingsRepository.get();
  const directions = directionsUrlOf(settings);
  const title = "Ghé tiệm";

  const btnPrimary = "inline-flex min-h-[54px] items-center gap-2 rounded-full bg-butter px-6 font-bold text-maroon no-underline transition-transform hover:-translate-y-0.5 hover:bg-cream hover:text-maroon";
  const btnGhost = "inline-flex min-h-[54px] items-center gap-2 rounded-full border-[1.5px] border-cream/50 px-6 font-semibold text-cream no-underline transition-colors hover:border-butter hover:text-butter";

  return (
    <>
      {/* ================= HERO ================= */}
      <VisitHeroMotion className="mx-auto max-w-[1248px] px-3 pt-3 sm:px-6 sm:pt-6">
        <section data-no-reveal className="relative grid overflow-hidden rounded-[28px] bg-maroon text-cream md:min-h-[560px] md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] md:rounded-[36px]">
          <div aria-hidden="true" className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-butter/10" />
          <div className="relative z-10 flex flex-col items-start justify-center gap-5 px-5 pb-8 pt-7 md:gap-6 md:py-16 md:pl-16 md:pr-8">
            <nav data-hero-fade aria-label="Đường dẫn" className="text-[13px] text-cream/70 md:text-sm">
              <Link href="/" className="text-cream/70 hover:text-butter">Trang chủ</Link> <span aria-hidden="true">/</span> Ghé tiệm
            </nav>
            <h1 aria-label={title} className="m-0 flex flex-wrap font-display text-[56px] font-semibold leading-[1] tracking-[-0.03em] md:text-[clamp(72px,8vw,120px)]">
              {title.split(" ").map((w, wi) => (
                <span key={wi} aria-hidden="true" className="-my-[0.12em] mr-[0.22em] inline-flex overflow-hidden py-[0.12em]">
                  {Array.from(w).map((ch, ci) => (
                    <span key={ci} data-hc className="inline-block">{ch}</span>
                  ))}
                </span>
              ))}
            </h1>
            <p data-hero-fade className="m-0 max-w-[440px] text-[17px] text-cream/85 md:text-lg">Bánh ra lò mỗi chiều, cà phê pha khi bạn tới. Đặt trước online, hẹn giờ rồi ghé lấy khi bánh còn ấm.</p>
            <div data-hero-fade><StoreStatus tone="dark" /></div>
            <div data-hero-fade className="mt-1 flex flex-wrap gap-3">
              <a href={store.phoneHref} className={btnPrimary}><PhoneIcon /> Gọi {store.phone}</a>
              {directions ? (
                <a href={directions} target="_blank" rel="noopener noreferrer" className={btnGhost}><PinIcon /> Chỉ đường</a>
              ) : (
                <Link href="/thuc-don" className={btnGhost}>Đặt trước <ArrowRightIcon /></Link>
              )}
            </div>
          </div>
          <div data-hero-media className="relative h-[300px] overflow-hidden md:h-auto">
            <div data-parallax="0.14" className="absolute inset-x-0 -inset-y-[12%]">
              <div data-hero-img className="absolute inset-0">
                <Image src={productImages.tartRack} alt="Khay tart nhiều vị vừa hoàn thiện trong tiệm" fill priority sizes="(min-width: 768px) 600px, 100vw" className="object-cover" style={{ objectPosition: "center 45%" }} />
              </div>
            </div>
            <div data-hero-badge className="absolute right-4 top-4 flex rotate-4 flex-col rounded-2xl bg-butter px-4 py-2.5 leading-[1.2] text-maroon shadow-[0_12px_24px_rgba(36,18,13,0.3)] md:right-8 md:top-8 md:px-5 md:py-3">
              <span className="text-xs font-semibold md:text-[13px]">Mẻ chiều nay</span>
              <strong className="font-display text-[24px] font-semibold md:text-[30px]">{store.freshBatchTime}</strong>
            </div>
          </div>
        </section>
      </VisitHeroMotion>

      {/* ================= TÌM ĐẾN TIỆM: bản đồ lớn + thẻ thông tin nổi ================= */}
      <section className="mx-auto max-w-[1248px] px-3 pt-12 sm:px-6 md:pt-20">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3 px-2 md:mb-8 md:px-0">
          <h2 className="m-0 font-display text-[34px] font-semibold leading-[1.08] tracking-[-0.015em] md:text-[clamp(40px,4.4vw,56px)]">Tìm đến tiệm</h2>
          {directions && <a href={directions} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.08em]">Mở Google Maps <ArrowRightIcon /></a>}
        </div>
        <div className="relative grid gap-3 md:block">
          <div className="relative h-[340px] overflow-hidden rounded-[28px] bg-sand md:h-[580px] md:rounded-[36px]">
            {settings.mapEmbedUrl ? (
              <StoreMap src={settings.mapEmbedUrl} title={`Bản đồ đến ${store.name}`} fill className="md:[&>p]:hidden" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-maroon text-butter shadow-[0_12px_24px_rgba(59,15,18,0.3)]"><PinIcon /></span>
                <p className="m-0 max-w-[300px] font-display text-2xl font-semibold leading-tight">Bản đồ đang được cập nhật</p>
              </div>
            )}
          </div>
          {/* The thong tin: noi tren ban do (may tinh), xep duoi ban do (dien thoai) */}
          <div data-reveal className="flex flex-col gap-5 rounded-[26px] bg-card p-5 shadow-[0_30px_60px_-30px_rgba(36,18,13,0.55)] md:absolute md:bottom-6 md:left-6 md:top-6 md:w-[380px] md:overflow-y-auto md:p-7">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-maroon text-cream"><PinIcon /></span>
              <span className="flex flex-col">
                <span className="text-[13px] font-semibold text-muted">Địa chỉ</span>
                <strong className="text-[17px] leading-snug">{settings.address ?? "Tiệm đang cập nhật địa chỉ – gọi tiệm để được chỉ đường."}</strong>
              </span>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-butter text-maroon"><ClockIcon size={20} /></span>
              <span className="flex flex-col">
                <span className="text-[13px] font-semibold text-muted">Giờ mở cửa</span>
                <strong className="font-display text-[26px] font-semibold leading-tight">{store.openHours}</strong>
                <span className="text-[14px] text-muted">Mẻ chiều ra lò lúc <strong className="text-accent">{store.freshBatchTime}</strong></span>
              </span>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-maroon text-cream"><PhoneIcon size={20} /></span>
              <span className="flex flex-col">
                <span className="text-[13px] font-semibold text-muted">Gọi trước khi đến</span>
                <a href={store.phoneHref} className="font-display text-[24px] font-semibold leading-tight no-underline">{store.phone}</a>
              </span>
            </div>
            <StoreStatus />
            {directions && (
              <a href={directions} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-maroon px-5 font-semibold text-cream no-underline hover:bg-accent hover:text-cream"><PinIcon /> Chỉ đường đến tiệm</a>
            )}
          </div>
        </div>
      </section>

      {/* ================= QUY TRÌNH ================= */}
      <section className="mx-auto max-w-[1200px] px-5 pb-6 pt-24 md:px-6 md:pt-32">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4 md:mb-14">
          <h2 className="m-0 max-w-[560px] text-balance font-display text-[34px] font-semibold leading-[1.08] tracking-[-0.015em] md:text-[clamp(40px,4.4vw,56px)]">Đặt trước, hẹn giờ, ghé lấy</h2>
          <Link href="/thuc-don" className="inline-flex min-h-11 items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.08em]">Bắt đầu chọn bánh <ArrowRightIcon /></Link>
        </div>
        <VisitSteps steps={steps} />
      </section>

      {/* ================= KHUNG GIỜ + THANH TOÁN (bento) ================= */}
      <section className="mx-auto grid max-w-[1200px] gap-4 px-4 pt-16 sm:px-6 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] md:gap-5 md:pt-24">
        <div className="flex flex-col gap-5 rounded-[28px] border border-maroon/12 bg-card p-6 md:p-8">
          <div className="flex items-end justify-between gap-3">
            <h2 className="m-0 font-display text-[28px] font-semibold md:text-[34px]">Khung giờ nhận bánh</h2>
            <span className="hidden items-center gap-2 text-[13px] font-semibold text-muted sm:inline-flex"><span className="h-3 w-3 rounded-full bg-maroon" /> Bánh ấm</span>
          </div>
          <ul data-reveal-stagger className="m-0 grid list-none grid-cols-2 gap-2.5 p-0 sm:grid-cols-3">
            {pickupSlots.map((s) => {
              const fresh = isFreshSlot(s, store.freshBatchTime);
              return (
                <li key={s.id} className={`flex flex-col items-center justify-center rounded-[18px] border px-2 py-4 text-center transition-transform hover:-translate-y-0.5 ${fresh ? "border-maroon bg-maroon text-cream shadow-[0_14px_30px_-16px_rgba(59,15,18,0.7)]" : "border-maroon/15 bg-page"}`}>
                  <span className="text-[16px] font-bold tabular-nums">{s.label}</span>
                  <span className={`text-xs ${fresh ? "text-butter" : "text-muted"}`}>{fresh ? "Bánh ấm" : s.note}</span>
                </li>
              );
            })}
          </ul>
          <p className="m-0 text-sm text-muted">Chọn khung giờ khi đặt bánh ở bước giỏ hàng. Muốn đổi giờ, gọi tiệm nhé.</p>
        </div>
        <div className="flex flex-col gap-4 rounded-[28px] bg-maroon p-6 text-cream md:p-8">
          <h2 className="m-0 font-display text-[28px] font-semibold md:text-[34px]">Thanh toán</h2>
          {(["cod", "transfer"] as const).map((p) => (
            <div key={p} className="flex items-start gap-3 rounded-[20px] bg-cream/8 p-4">
              <span aria-hidden="true" className="mt-1 h-2.5 w-2.5 flex-none rounded-full bg-butter" />
              <span className="flex flex-col gap-0.5">
                <strong>{paymentLabels[p]}</strong>
                <span className="text-sm text-cream/75">{paymentHints[p]}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ================= HỎI ĐÁP ================= */}
      <section className="mx-auto grid max-w-[1200px] gap-8 px-5 pb-28 pt-24 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:gap-14 md:px-6 md:pb-40 md:pt-32">
        <div className="md:sticky md:top-[calc(var(--yub-header-h,80px)+24px)] md:self-start">
          <h2 className="m-0 text-balance font-display text-[34px] font-semibold leading-[1.08] tracking-[-0.015em] md:text-[clamp(40px,4.4vw,52px)]">Câu hỏi thường gặp</h2>
          <p className="mb-0 mt-4 max-w-[340px] text-muted">Chưa thấy câu trả lời? Gọi tiệm qua số <a href={store.phoneHref} className="font-semibold">{store.phone}</a> trong giờ mở cửa.</p>
        </div>
        <FaqAccordion items={faqsOf(store)} />
      </section>

      {/* ================= CTA (sóng lớn như trang chủ) ================= */}
      <section className="relative bg-maroon text-cream">
        <WaveEdge fill="#FBF3E3" edge="top" mirror />
        <div className="mx-auto flex max-w-[1000px] flex-col items-center gap-6 px-5 pb-[120px] pt-[110px] text-center md:pb-[calc(clamp(80px,11vw,170px)+56px)] md:pt-[calc(clamp(80px,11vw,170px)+40px)]">
          <p className="m-0 text-balance font-display text-[38px] font-semibold leading-[1.08] md:text-[clamp(44px,5vw,68px)]">Hẹn gặp bạn ở tiệm chiều nay!</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/thuc-don" className={btnPrimary}>Đặt bánh trước <ArrowRightIcon /></Link>
            <Link href="/do-uong" className={btnGhost}>Xem đồ uống</Link>
          </div>
        </div>
        <WaveEdge fill="#FBF3E3" />
      </section>
    </>
  );
}
