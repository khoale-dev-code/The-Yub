import type { Metadata } from "next";
import Link from "next/link";
import { CheckIcon } from "@/components/ui/icons";
import { formatVnd } from "@/lib/format";
import { formatPickupDate, pickupSlotLabel } from "@/lib/pickup";
import { getStoreInfo } from "@/modules/settings/store-info-server";
import { findOrderForCustomer } from "@/modules/orders/service";
import { orderStatusForCustomer, paymentLabels, paymentStatusLabels } from "@/modules/orders/types";
import { settingsRepository } from "@/modules/settings/repository";
import { ADDRESS_PLACEHOLDER } from "@/modules/settings/types";

export const metadata: Metadata = { title: "Đơn đặt bánh", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ t?: string | string[] }>;
}

/** An bot so dien thoai khi hien thi lai: 0975 840 157 -> 0975 *** 157 */
const maskPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  return digits.length < 7 ? "***" : `${digits.slice(0, 4)} *** ${digits.slice(-3)}`;
};

export default async function DonHangPage({ params, searchParams }: PageProps) {
  const store = await getStoreInfo();
  const [{ code }, { t }] = await Promise.all([params, searchParams]);
  const token = typeof t === "string" ? t : "";
  const [order, settings] = await Promise.all([findOrderForCustomer(decodeURIComponent(code), token), settingsRepository.get()]);

  if (!order) {
    return (
      <div className="mx-auto flex max-w-[680px] flex-col items-start gap-4 px-4 py-20">
        <h1 className="m-0 font-display text-4xl font-semibold">Không tìm thấy đơn</h1>
        <p className="m-0 text-muted">
          Link tra cứu chưa đúng hoặc đã hết hạn – cần hỗ trợ, gọi tiệm{" "}
          <a href={store.phoneHref} className="font-semibold text-maroon">{store.phone}</a>.
        </p>
        <Link href="/thuc-don" className="inline-flex min-h-12 items-center rounded-full bg-maroon px-6 font-semibold text-cream no-underline hover:bg-accent hover:text-cream">Về thực đơn</Link>
      </div>
    );
  }

  const closed = order.status === "cancelled" || order.status === "rejected";

  return (
    <div className="w-full px-4 pb-28 pt-14 sm:px-6 md:pt-[72px]">
      <div role="status" className="mx-auto flex max-w-[680px] flex-col items-center gap-[18px] text-center">
        {closed ? (
          <span aria-hidden="true" className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-rose font-display text-4xl font-semibold text-accent">!</span>
        ) : (
          <span aria-hidden="true" className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-[#E3EBD3] text-[#2F4A1E]"><CheckIcon size={42} /></span>
        )}
        <h1 className="m-0 text-balance font-display text-[38px] font-semibold leading-[1.08] tracking-[-0.015em] md:text-[52px]">Đơn {order.code}</h1>
        <p className="m-0 text-lg text-muted">Trạng thái: <strong className="text-maroon">{orderStatusForCustomer[order.status]}</strong> · số liên hệ {maskPhone(order.customerPhone)}</p>
        {closed && order.statusNote && <p className="m-0 rounded-2xl bg-rose px-4 py-3 text-[15px] text-ink">Lý do: {order.statusNote}</p>}
      </div>
      <div className="mx-auto mt-10 flex max-w-[680px] flex-col gap-4 rounded-[26px] border border-maroon/12 bg-card px-6 py-7 sm:px-8">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col"><span className="text-[13px] text-muted">Giờ nhận</span><strong>{formatPickupDate(order.pickupDate)} · {pickupSlotLabel(order.pickupSlotId)}</strong></div>
          <div className="flex flex-col"><span className="text-[13px] text-muted">Thanh toán</span><strong>{paymentLabels[order.payment]}</strong><span className="text-[13px] text-muted">{paymentStatusLabels[order.paymentStatus]}</span></div>
        </div>
        <div className="h-px bg-maroon/15" />
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {order.items.map((item, i) => (
            <li key={i} className="flex justify-between gap-3"><span>{item.qty} × {item.name}</span><span>{formatVnd(item.lineTotalVnd)}</span></li>
          ))}
        </ul>
        <div className="h-px bg-maroon/15" />
        <div className="flex items-baseline justify-between"><strong>Tổng cộng</strong><strong className="font-display text-[28px] font-semibold">{formatVnd(order.totalVnd)}</strong></div>
        <p className="m-0 text-sm text-muted">Nhận tại tiệm: {settings.address ?? ADDRESS_PLACEHOLDER} · Mở cửa {store.openHours}</p>
      </div>
    </div>
  );
}
