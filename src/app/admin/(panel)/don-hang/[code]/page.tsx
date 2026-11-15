import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChatIcon, ChevronLeftIcon, PhoneIcon } from "@/components/admin/admin-icons";
import { CopyButton } from "@/components/admin/copy-button";
import { DeleteButton } from "@/components/admin/delete-button";
import { OrderActions, PaymentActions } from "@/components/admin/order-actions";
import { FreshnessGuard } from "@/components/admin/freshness-guard";
import { OrderStatusBadge, PageHeader, PaymentBadge, SectionTitle, btn, card, phoneDigits, zaloLink } from "@/components/admin/ui";
import { relativeDateLabel, timeAndDate, todayVN } from "@/lib/dates";
import { formatVnd } from "@/lib/format";
import { formatPickupDate, pickupSlotLabel } from "@/lib/pickup";
import { listAudit } from "@/modules/admin/audit";
import { EDITABLE } from "@/modules/admin/orders";
import { requireAdmin } from "@/modules/admin/session";
import { getOrdersRepository } from "@/modules/orders/repository";
import { orderStatusLabels, paymentLabels, paymentStatusLabels, type OrderStatus } from "@/modules/orders/types";
import { settingsRepository } from "@/modules/settings/repository";

export const metadata: Metadata = { title: "Chi tiết đơn" };

interface PageProps {
  params: Promise<{ code: string }>;
}

const actionText = (action: string): string => {
  const [kind, value] = action.split(".");
  if (kind === "order" && value) return orderStatusLabels[value as OrderStatus] ?? action;
  if (action === "payment.paid") return "Ghi nhận đã nhận tiền";
  if (action === "payment.unpaid") return "Bỏ đánh dấu đã nhận tiền";
  return action;
};

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const user = await requireAdmin();
  const { code } = await params;
  const decoded = decodeURIComponent(code);
  if (!/^YUB-\d{4}-\d{4}$/.test(decoded)) notFound();
  const [order, settings, audit] = await Promise.all([getOrdersRepository().findByCode(decoded), settingsRepository.getFresh(), listAudit("order", decoded)]);
  if (!order) notFound();

  const today = todayVN();
  const renderedAt = Date.now();
  const closed = order.status === "cancelled" || order.status === "rejected";
  const itemCount = order.items.reduce((n, i) => n + i.qty, 0);
  const bank =
    order.payment === "transfer" && settings.bankAccountNo
      ? `${settings.bankName ?? "Ngân hàng"} · ${settings.bankAccountNo}${settings.bankAccountName ? ` · ${settings.bankAccountName}` : ""}\nSố tiền: ${formatVnd(order.totalVnd)}\nNội dung: ${order.code}`
      : null;

  return (
    <>
      <FreshnessGuard renderedAt={renderedAt} />
      <PageHeader
        back={
          <Link href="/admin/don-hang" className="inline-flex min-h-9 items-center gap-1 self-start text-[14px] font-semibold text-muted no-underline hover:text-maroon">
            <ChevronLeftIcon size={16} /> Đơn hàng
          </Link>
        }
        title={order.code}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <OrderStatusBadge status={order.status} />
            <PaymentBadge method={order.payment} status={order.paymentStatus} />
            <span className="text-[14px] text-muted">Đặt lúc {timeAndDate(order.createdAt)}</span>
          </span>
        }
      />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
        {/* Cột phải trước trên điện thoại: thao tác nhanh */}
        <div className="flex flex-col gap-4 lg:order-2 lg:sticky lg:top-6">
          <section aria-label="Thao tác" className={`${card} flex flex-col gap-3 p-4`}>
            <strong className="text-[15px]">Bước tiếp theo</strong>
            <OrderActions code={order.code} status={order.status} unpaidTransfer={order.payment === "transfer" && order.paymentStatus !== "paid"} />
            {order.status === "ready" && order.payment === "cod" && <p className="m-0 text-[12px] text-muted">Bấm “Khách đã nhận bánh” sẽ tự ghi nhận đã thu tiền mặt.</p>}
            {closed && order.statusNote && <p className="m-0 rounded-2xl bg-rose px-3.5 py-2.5 text-[14px] text-accent">Lý do: {order.statusNote}</p>}
            {EDITABLE.includes(order.status) && (
              <Link href={`/admin/don-hang/${order.code}/sua`} className={`${btn.secondary} w-full`}>Sửa đơn (món, ngày giờ, khách)</Link>
            )}
            {closed && user.role === "owner" && <DeleteButton kind="order" id={order.code} name={order.code} redirectTo="/admin/don-hang?trang-thai=da-huy" note="Chỉ xoá được đơn đã huỷ / từ chối. Không khôi phục được." />}
          </section>

          <section aria-label="Khách hàng" className={`${card} flex flex-col gap-3 p-4`}>
            <div className="flex items-start justify-between gap-3">
              <span className="flex flex-col">
                <span className="text-[13px] text-muted">Khách hàng</span>
                <strong className="text-[17px]">{order.customerName}</strong>
                <span className="text-[15px] tabular-nums">{order.customerPhone}</span>
              </span>
              <CopyButton text={phoneDigits(order.customerPhone)} label="Chép số điện thoại" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <a href={`tel:${phoneDigits(order.customerPhone)}`} className={`${btn.primary} min-h-11`}><PhoneIcon size={17} /> Gọi</a>
              <a href={zaloLink(order.customerPhone)} target="_blank" rel="noopener noreferrer" className={`${btn.secondary} min-h-11`}><ChatIcon size={17} /> Zalo</a>
            </div>
          </section>

          <section aria-label="Nhận bánh" className={`${card} grid grid-cols-2 gap-3 p-4`}>
            <span className="flex flex-col">
              <span className="text-[13px] text-muted">Ngày nhận</span>
              <strong>{relativeDateLabel(order.pickupDate, today)}</strong>
              <span className="text-[13px] text-muted">{formatPickupDate(order.pickupDate)}</span>
            </span>
            <span className="flex flex-col">
              <span className="text-[13px] text-muted">Khung giờ</span>
              <strong className="tabular-nums">{pickupSlotLabel(order.pickupSlotId)}</strong>
            </span>
          </section>

          <section aria-label="Thanh toán" className={`${card} flex flex-col gap-3 p-4`}>
            <div className="flex items-start justify-between gap-3">
              <span className="flex flex-col">
                <span className="text-[13px] text-muted">Thanh toán</span>
                <strong>{paymentLabels[order.payment]}</strong>
                <span className="text-[13px] text-muted">
                  {paymentStatusLabels[order.paymentStatus]}
                  {order.paidAt ? ` · ${timeAndDate(order.paidAt)}` : ""}
                </span>
              </span>
              <strong className="font-display text-[24px] font-semibold tabular-nums">{formatVnd(order.totalVnd)}</strong>
            </div>
            {order.payment === "transfer" && !settings.bankAccountNo && order.paymentStatus !== "paid" && (
              <Link href="/admin/cai-dat" className="text-[13px] font-semibold">Thêm số tài khoản trong Cài đặt để chép gửi khách →</Link>
            )}
            <PaymentActions code={order.code} paid={order.paymentStatus === "paid"} closed={closed} total={order.totalVnd} canUndo={user.role === "owner"} transferText={bank} />
          </section>
        </div>

        {/* Cột trái: món + nhật ký */}
        <div className="flex flex-col gap-6 lg:order-1">
          <section aria-labelledby="od-items">
            <SectionTitle aside={<span className="text-[14px] text-muted">{itemCount} món</span>}>
              <span id="od-items">Các món</span>
            </SectionTitle>
            <div className={`${card} overflow-hidden`}>
              <ul className="m-0 flex list-none flex-col p-0">
                {order.items.map((it, i) => (
                  <li key={`${it.name}-${i}`} className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 border-b border-maroon/8 px-4 py-3.5 last:border-b-0">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-beige font-display text-[17px] font-semibold tabular-nums">{it.qty}</span>
                    <span className="flex min-w-0 flex-col">
                      <strong className="text-[15px]">{it.name}</strong>
                      <span className="text-[13px] text-muted tabular-nums">{formatVnd(it.unitPriceVnd)} / phần</span>
                    </span>
                    <strong className="tabular-nums">{formatVnd(it.lineTotalVnd)}</strong>
                  </li>
                ))}
              </ul>
              <div className="flex items-baseline justify-between gap-3 bg-beige/60 px-4 py-3.5">
                <span className="font-semibold">Tổng cộng</span>
                <strong className="font-display text-[22px] font-semibold tabular-nums">{formatVnd(order.totalVnd)}</strong>
              </div>
            </div>
          </section>

          {order.note && (
            <section aria-label="Ghi chú của khách" className="rounded-[22px] bg-butter/20 p-4 ring-1 ring-inset ring-butter/60">
              <span className="text-[13px] font-semibold text-[#7A4A05]">Ghi chú của khách</span>
              <p className="m-0 mt-1 whitespace-pre-line text-[16px]">{order.note}</p>
            </section>
          )}

          <section aria-labelledby="od-log">
            <SectionTitle><span id="od-log">Nhật ký</span></SectionTitle>
            <ol className={`${card} m-0 flex list-none flex-col gap-0 p-4`}>
              {audit.map((a) => (
                <li key={a.id} className="relative grid grid-cols-[18px_minmax(0,1fr)] gap-3 pb-4 last:pb-0">
                  <span aria-hidden="true" className="mt-1.5 h-2.5 w-2.5 rounded-full bg-maroon ring-4 ring-beige" />
                  <span className="flex flex-col">
                    <strong className="text-[14px]">{actionText(a.action)}</strong>
                    <span className="text-[13px] text-muted">{a.actorName} · {timeAndDate(a.createdAt)}{a.detail ? ` · ${a.detail}` : ""}</span>
                  </span>
                </li>
              ))}
              <li className="grid grid-cols-[18px_minmax(0,1fr)] gap-3">
                <span aria-hidden="true" className="mt-1.5 h-2.5 w-2.5 rounded-full bg-butter ring-4 ring-beige" />
                <span className="flex flex-col">
                  <strong className="text-[14px]">Khách đặt đơn trên web</strong>
                  <span className="text-[13px] text-muted">{timeAndDate(order.createdAt)}</span>
                </span>
              </li>
            </ol>
          </section>
        </div>
      </div>
    </>
  );
}
