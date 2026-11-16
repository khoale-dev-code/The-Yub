import type { Metadata } from "next";
import Link from "next/link";
import { AlertIcon, ChevronRightIcon, InboxIcon, PlusIcon } from "@/components/admin/admin-icons";
import { LiveRefresh } from "@/components/admin/live-refresh";
import { OrderActions } from "@/components/admin/order-actions";
import { EmptyState, PageHeader, PaymentBadge, SectionTitle, StatusDot, btn, card } from "@/components/admin/ui";
import { relativeDateLabel, timeAgo } from "@/lib/dates";
import { formatVnd } from "@/lib/format";
import { pickupSlotLabel } from "@/lib/pickup";
import { getDashboard } from "@/modules/admin/orders";
import { requireAdmin } from "@/modules/admin/session";
import { orderStatusLabels } from "@/modules/orders/types";
import { settingsRepository } from "@/modules/settings/repository";

export const metadata: Metadata = { title: "Tổng quan" };

const longDate = (date: string) =>
  new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));

export default async function AdminDashboardPage() {
  const user = await requireAdmin();
  const [d, settings] = await Promise.all([getDashboard(), settingsRepository.getFresh()]);
  const s = d.stats;
  const renderedAt = Date.now();

  const stats = [
    { label: "Chờ xác nhận", value: String(s.pendingCount), hint: s.pendingCount ? "Gọi khách rồi xác nhận" : "Không có đơn chờ", href: "/admin/don-hang?trang-thai=cho-xac-nhan", hot: s.pendingCount > 0 },
    { label: "Nhận hôm nay", value: String(s.todayPickups), hint: `Ngày mai: ${s.tomorrowPickups} đơn`, href: "/admin/don-hang?ngay=hom-nay&trang-thai=tat-ca" },
    { label: "Doanh thu dự kiến", value: formatVnd(s.todayRevenue), hint: "Đơn đã xác nhận, nhận hôm nay", href: "/admin/don-hang?ngay=hom-nay&trang-thai=tat-ca" },
    { label: "Chờ đối soát CK", value: String(s.transferToVerify), hint: "Đơn chuyển khoản chưa ghi nhận", href: "/admin/don-hang?thanh-toan=chua-nhan" },
  ];

  return (
    <>
      <PageHeader
        title="Tổng quan"
        description={<span>Chào {user.name} · <span className="capitalize">{longDate(d.today)}</span></span>}
        actions={
          <>
            <LiveRefresh renderedAt={renderedAt} />
            <Link href="/admin/don-hang/moi" className={btn.primary}><PlusIcon size={17} /> Tạo đơn</Link>
          </>
        }
      />

      {!settings.orderingEnabled && (
        <Link href="/admin/cai-dat" className="mb-5 flex items-center gap-3 rounded-[18px] bg-butter/25 px-4 py-3 text-[15px] font-semibold text-maroon no-underline ring-1 ring-inset ring-butter">
          <AlertIcon className="flex-none" /> Đang tạm ngưng nhận đơn online – bấm để bật lại
          <ChevronRightIcon className="ml-auto flex-none" />
        </Link>
      )}

      {/* Số liệu */}
      <div data-admin-stagger className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {stats.map((st) => (
          <Link
            key={st.label}
            href={st.href}
            className={`group flex flex-col gap-1 rounded-[22px] p-4 no-underline transition-transform hover:-translate-y-0.5 md:p-5 ${st.hot ? "bg-maroon text-cream hover:text-cream" : `${card} text-maroon hover:text-maroon`}`}
          >
            <span className={`text-[13px] font-semibold md:text-[14px] ${st.hot ? "text-cream/80" : "text-muted"}`}>{st.label}</span>
            <strong className={`font-display text-[28px] font-semibold leading-[1.1] tabular-nums md:text-[34px] ${st.hot ? "text-butter" : ""}`}>{st.value}</strong>
            <span className={`text-[12px] md:text-[13px] ${st.hot ? "text-cream/70" : "text-muted-2"}`}>{st.hint}</span>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        {/* Đơn chờ xác nhận */}
        <section aria-labelledby="dash-pending">
          <SectionTitle aside={<Link href="/admin/don-hang?trang-thai=cho-xac-nhan" className="text-[14px] font-semibold">Xem tất cả</Link>}>
            <span id="dash-pending">Cần xác nhận</span>
          </SectionTitle>
          {d.pending.length === 0 ? (
            <EmptyState title="Không có đơn chờ" text="Đơn mới từ web sẽ hiện ở đây – trang tự cập nhật mỗi 30 giây." />
          ) : (
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {d.pending.slice(0, 6).map((o) => (
                <li key={o.code} className={`${card} flex flex-col gap-3 p-4`}>
                  <Link href={`/admin/don-hang/${o.code}`} className="flex items-start justify-between gap-3 no-underline">
                    <span className="flex min-w-0 flex-col">
                      <strong className="text-[16px]">{o.customerName}</strong>
                      <span className="text-[13px] text-muted">
                        {o.code} · đặt {timeAgo(o.createdAt)}
                      </span>
                    </span>
                    <span className="flex flex-col items-end">
                      <strong className="tabular-nums">{formatVnd(o.totalVnd)}</strong>
                      <span className="text-[13px] text-muted">{o.items.reduce((n, i) => n + i.qty, 0)} món</span>
                    </span>
                  </Link>
                  <div className="flex flex-wrap items-center gap-2 text-[13px]">
                    <span className="rounded-full bg-beige px-2.5 py-1 font-semibold">{relativeDateLabel(o.pickupDate, d.today)} · {pickupSlotLabel(o.pickupSlotId)}</span>
                    <PaymentBadge method={o.payment} status={o.paymentStatus} />
                    <a href={`tel:${o.customerPhone.replace(/[^\d+]/g, "")}`} className="ml-auto font-semibold">{o.customerPhone}</a>
                  </div>
                  <OrderActions code={o.code} status={o.status} compact />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Lịch nhận hôm nay */}
        <section aria-labelledby="dash-today" className="flex flex-col gap-6">
          <div>
            <SectionTitle aside={<Link href="/admin/khung-gio" className="text-[14px] font-semibold">Khung giờ</Link>}>
              <span id="dash-today">Lịch nhận hôm nay</span>
            </SectionTitle>
            <ol className={`${card} m-0 flex list-none flex-col divide-y divide-maroon/8 p-0`}>
              {d.todaySlots.map(({ slot, orders }) => {
                const pct = slot.capacity ? Math.min(100, Math.round((orders.length / slot.capacity) * 100)) : null;
                return (
                  <li key={slot.id} className={`flex flex-col gap-2 px-4 py-3.5 ${slot.isActive ? "" : "opacity-60"}`}>
                    <div className="flex items-center gap-3">
                      <strong className="w-[118px] flex-none tabular-nums">{slot.label}</strong>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-beige" aria-hidden="true">
                        <span className={`block h-full rounded-full ${pct !== null && pct >= 100 ? "bg-accent" : "bg-butter"}`} style={{ width: `${pct ?? Math.min(100, orders.length * 12)}%` }} />
                      </div>
                      <span className="w-[64px] flex-none text-right text-[13px] font-semibold tabular-nums text-muted">
                        {slot.isActive ? `${orders.length}${slot.capacity !== null ? `/${slot.capacity}` : ""} đơn` : "Tạm nghỉ"}
                      </span>
                    </div>
                    {orders.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {orders.map((o) => (
                          <Link key={o.code} href={`/admin/don-hang/${o.code}`} title={orderStatusLabels[o.status]} className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-beige px-2.5 text-[13px] font-semibold no-underline hover:bg-sand">
                            <StatusDot status={o.status} /> {o.customerName}
                          </Link>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>

          <Link href="/admin/hop-thu" className={`${card} flex items-center gap-4 p-4 no-underline hover:border-maroon/30`}>
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-beige text-maroon"><InboxIcon /></span>
            <span className="flex flex-1 flex-col">
              <strong>Hộp thư</strong>
              <span className="text-[14px] text-muted">{s.newInquiries ? `${s.newInquiries} câu hỏi mới chưa trả lời` : "Không có câu hỏi mới"}</span>
            </span>
            <ChevronRightIcon />
          </Link>
        </section>
      </div>
    </>
  );
}
