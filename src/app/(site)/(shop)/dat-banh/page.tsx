import type { Metadata } from "next";
import Link from "next/link";
import { BookingHero } from "@/components/booking/booking-hero";
import { BookingPlanner } from "@/components/booking/booking-planner";
import { ArrowRightIcon } from "@/components/ui/icons";
import { storeConfig } from "@/lib/store-config";
import { productsRepository } from "@/modules/products/repository";
import { settingsRepository } from "@/modules/settings/repository";

export const metadata: Metadata = {
  title: "Đặt bánh online",
  description: `Chọn bánh, hẹn ngày và khung giờ ghé lấy tại The Yub. Mẻ bánh chiều ra lò ${storeConfig.freshBatchTime}; bánh kem và hộp quà đặt trước 1 ngày.`,
};

const after = [
  { n: "1", title: "Điền thông tin nhận", text: "Họ tên, số điện thoại và ghi chú (ví dụ chữ viết trên bánh kem)." },
  { n: "2", title: "Tiệm gọi xác nhận", text: "Trong giờ mở cửa, tiệm gọi lại xác nhận đơn rồi mới chuẩn bị bánh." },
  { n: "3", title: "Ghé tiệm nhận bánh", text: "Đọc mã đơn ở quầy, thanh toán khi nhận hoặc chuyển khoản theo hướng dẫn của tiệm." },
];

export default async function DatBanhPage() {
  const [products, settings] = await Promise.all([productsRepository.list(), settingsRepository.get()]);
  const pausedMessage = settings.orderingEnabled ? null : settings.orderingPausedMessage || "Tiệm đang tạm ngưng nhận đơn online – vui lòng gọi tiệm để đặt bánh.";

  return (
    <>
      <BookingHero />
      <BookingPlanner products={products} pausedMessage={pausedMessage} />

      {/* Sau khi gửi đơn */}
      <section className="bg-beige">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-4 pb-20 pt-14 sm:px-6 md:gap-10 md:pb-28 md:pt-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="m-0 max-w-[620px] font-display text-[32px] font-semibold leading-[1.1] tracking-[-0.015em] md:text-[44px]">Sau khi bạn gửi đơn</h2>
            <Link href="/ghe-tiem" className="inline-flex min-h-11 items-center gap-1.5 font-semibold no-underline hover:text-accent">
              Giờ mở cửa & câu hỏi thường gặp <ArrowRightIcon size={16} />
            </Link>
          </div>
          <ol data-reveal-stagger className="m-0 grid list-none gap-4 p-0 md:grid-cols-3 md:gap-5">
            {after.map((s) => (
              <li key={s.n} className="flex flex-col gap-3 rounded-[24px] bg-card p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-maroon font-display text-lg font-semibold text-butter">{s.n}</span>
                <h3 className="m-0 font-display text-[22px] font-semibold">{s.title}</h3>
                <p className="m-0 text-[15px] leading-[1.55] text-muted">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
