import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChatIcon, ChevronLeftIcon, MailIcon, PhoneIcon } from "@/components/admin/admin-icons";
import { CopyButton } from "@/components/admin/copy-button";
import { EmptyState, OrderStatusBadge, PageHeader, SectionTitle, btn, card, phoneDigits, zaloLink } from "@/components/admin/ui";
import { timeAndDate } from "@/lib/dates";
import { formatVnd } from "@/lib/format";
import { formatPickupDate, pickupSlotLabel } from "@/lib/pickup";
import { requireAdmin } from "@/modules/admin/session";
import { customersRepository } from "@/modules/customers/repository";
import { getOrdersRepository } from "@/modules/orders/repository";

export const metadata: Metadata = { title: "Hồ sơ khách" };

export default async function AdminCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const customer = await customersRepository().get(id);
  if (!customer) notFound();
  const orders = await getOrdersRepository().listByCustomer(id, 200);
  const active = orders.filter((o) => o.status !== "cancelled" && o.status !== "rejected");
  const total = active.reduce((s, o) => s + o.totalVnd, 0);

  return (
    <>
      <PageHeader
        back={
          <Link href="/admin/khach-hang" className="inline-flex min-h-9 items-center gap-1 self-start text-[14px] font-semibold text-muted no-underline hover:text-maroon">
            <ChevronLeftIcon size={16} /> Khách hàng
          </Link>
        }
        title={customer.fullName}
        description={`Tài khoản Google · tạo ${timeAndDate(customer.createdAt)} · đăng nhập gần nhất ${timeAndDate(customer.lastLoginAt)}`}
      />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
        <aside className="flex flex-col gap-4">
          <section className={`${card} flex flex-col gap-4 p-5`}>
            <div className="flex items-center gap-3">
              {customer.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={customer.avatarUrl} alt="" width={64} height={64} referrerPolicy="no-referrer" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <span aria-hidden="true" className="flex h-16 w-16 items-center justify-center rounded-full bg-butter font-display text-2xl font-semibold text-maroon">{(customer.fullName.trim()[0] ?? "K").toUpperCase()}</span>
              )}
              <span className="flex min-w-0 flex-col">
                <strong className="truncate text-[18px]">{customer.fullName}</strong>
                <span className="text-[13px] text-muted">{active.length} đơn · {formatVnd(total)}</span>
              </span>
            </div>
            <dl className="m-0 grid gap-3 text-[15px]">
              {[
                { k: "Email", v: customer.email, copy: customer.email },
                { k: "Số điện thoại", v: customer.phone ?? "Chưa cung cấp", copy: customer.phone ? phoneDigits(customer.phone) : null },
                { k: "Địa chỉ", v: customer.address ?? "Chưa cung cấp", copy: customer.address },
              ].map((r) => (
                <div key={r.k} className="flex items-start justify-between gap-3 rounded-[16px] bg-beige/60 px-3.5 py-2.5">
                  <span className="flex min-w-0 flex-col">
                    <dt className="text-[12px] font-semibold text-muted">{r.k}</dt>
                    <dd className="m-0 break-words">{r.v}</dd>
                  </span>
                  {r.copy && <CopyButton text={r.copy} label={`Chép ${r.k.toLowerCase()}`} />}
                </div>
              ))}
            </dl>
            <div className="grid grid-cols-3 gap-2">
              {customer.phone ? <a href={`tel:${phoneDigits(customer.phone)}`} className={`${btn.primary} min-h-11 px-2`}><PhoneIcon size={16} /> Gọi</a> : <span />}
              {customer.phone ? <a href={zaloLink(customer.phone)} target="_blank" rel="noopener noreferrer" className={`${btn.secondary} min-h-11 px-2`}><ChatIcon size={16} /> Zalo</a> : <span />}
              <a href={`mailto:${customer.email}`} className={`${btn.secondary} min-h-11 px-2`}><MailIcon size={16} /> Email</a>
            </div>
          </section>
          <section className={`${card} flex flex-col gap-1.5 p-5 text-[14px]`}>
            <strong className="text-[15px]">Đồng ý xử lý dữ liệu</strong>
            <span className="text-muted">Chính sách phiên bản {customer.consentVersion} · {timeAndDate(customer.consentedAt)}</span>
            <span className="text-muted">Nhận tin ưu đãi: {customer.marketingOptIn ? "Có" : "Không"}</span>
            <p className="m-0 mt-1 text-[12px] text-muted">Chỉ dùng thông tin này để phục vụ đơn hàng và hỗ trợ khách. {customer.marketingOptIn ? "" : "Không gửi tin quảng cáo cho khách này."}</p>
          </section>
        </aside>

        <section aria-label="Lịch sử đơn">
          <SectionTitle aside={<span className="text-[14px] text-muted">{orders.length} đơn</span>}>Lịch sử đơn</SectionTitle>
          {orders.length === 0 ? (
            <EmptyState title="Khách chưa đặt đơn" />
          ) : (
            <ul data-admin-stagger className="m-0 flex list-none flex-col gap-2.5 p-0">
              {orders.map((o) => (
                <li key={o.code}>
                  <Link href={`/admin/don-hang/${encodeURIComponent(o.code)}`} className={`${card} flex flex-col gap-2 p-4 no-underline transition-shadow hover:shadow-[0_14px_30px_-18px_rgba(59,15,18,0.45)]`}>
                    <span className="flex flex-wrap items-center justify-between gap-2">
                      <strong className="text-[16px] text-maroon">{o.code}</strong>
                      <OrderStatusBadge status={o.status} size="sm" />
                    </span>
                    <span className="line-clamp-2 text-[14px] text-maroon/85">{o.items.map((i) => `${i.qty} × ${i.name}`).join(" · ")}</span>
                    <span className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-muted">
                      <span>Đặt {timeAndDate(o.createdAt)} · nhận {formatPickupDate(o.pickupDate)} {pickupSlotLabel(o.pickupSlotId)}</span>
                      <strong className="font-display text-[18px] font-semibold text-maroon">{formatVnd(o.totalVnd)}</strong>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
