import type { Metadata } from "next";
import Link from "next/link";
import { SlotRow } from "@/components/admin/slot-row";
import { PageHeader, card } from "@/components/admin/ui";
import { addDays, relativeDateLabel, todayVN } from "@/lib/dates";
import { requireAdmin } from "@/modules/admin/session";
import { getOrdersRepository } from "@/modules/orders/repository";
import { slotsRepository } from "@/modules/slots/repository";

export const metadata: Metadata = { title: "Khung giờ" };

export default async function AdminSlotsPage({ searchParams }: { searchParams: Promise<{ ngay?: string }> }) {
  await requireAdmin();
  const today = todayVN();
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  const { ngay } = await searchParams;
  const date = ngay && days.includes(ngay) ? ngay : today;
  const [slots, usage] = await Promise.all([slotsRepository.list(), getOrdersRepository().slotUsage(date)]);

  return (
    <>
      <PageHeader title="Khung giờ nhận bánh" description="Bật/tắt khung giờ và giới hạn số đơn mỗi khung. Khung đã kín sẽ hiện “Đã kín” cho khách." />

      <nav aria-label="Chọn ngày xem số đơn" className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {days.map((d) => (
          <Link key={d} href={d === today ? "/admin/khung-gio" : `/admin/khung-gio?ngay=${d}`} aria-current={d === date ? "true" : undefined} className={`inline-flex min-h-10 flex-none items-center rounded-full px-4 text-[14px] font-semibold no-underline ${d === date ? "bg-dark text-cream hover:text-cream" : "border border-maroon/15 bg-card text-maroon"}`}>
            {relativeDateLabel(d, today)}
          </Link>
        ))}
      </nav>

      <ul className={`${card} m-0 flex list-none flex-col divide-y divide-maroon/8 p-0`}>
        {slots.map((s) => (
          <SlotRow key={s.id} slot={s} used={usage[s.id] ?? 0} />
        ))}
      </ul>
      <p className="mt-4 text-[13px] text-muted">Sức chứa áp dụng cho mọi ngày. Số đơn đếm cả đơn chờ xác nhận, không tính đơn đã huỷ/từ chối.</p>
    </>
  );
}
