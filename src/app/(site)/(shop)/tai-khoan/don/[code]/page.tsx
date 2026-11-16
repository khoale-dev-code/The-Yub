import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatusPill } from "@/components/customer/order-status-pill";
import { ReorderButton } from "@/components/customer/reorder-button";
import { ArrowLeftIcon } from "@/components/ui/icons";
import { formatVnd } from "@/lib/format";
import { formatPickupDate, pickupSlotLabel } from "@/lib/pickup";
import { reorderLinesOf } from "@/modules/customers/reorder";
import { requireCustomer } from "@/modules/customers/session";
import { getOrdersRepository } from "@/modules/orders/repository";
import { orderStatusForCustomer, paymentLabels, paymentStatusLabels } from "@/modules/orders/types";
import { productsRepository } from "@/modules/products/repository";

export const metadata: Metadata = { title: "Chi tiết đơn", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AccountOrderPage({ params }: { params: Promise<{ code: string }> }) {
  const { code: raw } = await params;
  const code = decodeURIComponent(raw);
  const me = await requireCustomer(`/tai-khoan/don/${encodeURIComponent(code)}`);
  if (code.length > 40) notFound();
  const repo = getOrdersRepository();
  // Chi chu don moi xem duoc (so huu theo tai khoan, khong theo ma don)
  if ((await repo.customerIdOf(code)) !== me.id) notFound();
  const order = await repo.findByCode(code);
  if (!order) notFound();
  const products = await productsRepository.findManyByIds(order.items.map((i) => i.productId).filter(Boolean));
  const lines = reorderLinesOf(order, products);

  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-5 px-4 pb-20 pt-6 sm:px-6 md:pt-10">
      <Link href="/tai-khoan" className="inline-flex min-h-11 items-center gap-2 self-start text-[14px] font-semibold no-underline"><ArrowLeftIcon /> Tài khoản</Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="m-0 font-display text-[34px] font-semibold leading-tight md:text-[44px]">{order.code}</h1>
          <span className="text-[15px] text-muted">{orderStatusForCustomer[order.status]}</span>
        </div>
        <OrderStatusPill status={order.status} />
      </div>
      {order.statusNote && <p className="m-0 rounded-2xl bg-beige px-4 py-3 text-[14px]">{order.statusNote}</p>}

      <section data-no-reveal className="flex flex-col gap-4 rounded-[24px] border border-maroon/10 bg-card p-5 md:p-7">
        <div className="grid grid-cols-2 gap-4 text-[14px]">
          <div className="flex flex-col"><span className="text-muted">Nhận bánh</span><strong>{formatPickupDate(order.pickupDate)} · {pickupSlotLabel(order.pickupSlotId)}</strong></div>
          <div className="flex flex-col"><span className="text-muted">Thanh toán</span><strong>{paymentLabels[order.payment]} · {paymentStatusLabels[order.paymentStatus]}</strong></div>
        </div>
        <div className="h-px bg-maroon/12" />
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
          {order.items.map((it, i) => (
            <li key={i} className="flex items-start justify-between gap-3 text-[15px]">
              <span>
                {it.qty} × {it.name}
                {!lines[i]?.available && <span className="ml-2 rounded-full bg-sand px-2 py-0.5 text-[11px] font-semibold text-muted">Không còn bán</span>}
              </span>
              <span className="tabular-nums">{formatVnd(it.lineTotalVnd)}</span>
            </li>
          ))}
        </ul>
        <div className="h-px bg-maroon/12" />
        <div className="flex items-baseline justify-between"><strong>Tổng cộng</strong><strong className="font-display text-[28px] font-semibold">{formatVnd(order.totalVnd)}</strong></div>
        {order.note && <p className="m-0 text-[14px] text-muted">Ghi chú: {order.note}</p>}
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <ReorderButton lines={lines} />
        <span className="text-[13px] text-muted">Giá tính theo giá hiện tại của tiệm khi bạn đặt lại.</span>
      </div>
    </div>
  );
}
