import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRightIcon, PlusIcon, SearchIcon, XIcon } from "@/components/admin/admin-icons";
import { OrderActions } from "@/components/admin/order-actions";
import { LiveRefresh } from "@/components/admin/live-refresh";
import { EmptyState, OrderStatusBadge, PageHeader, PaymentBadge, btn, card, input } from "@/components/admin/ui";
import { addDays, relativeDateLabel, timeAgo, todayVN } from "@/lib/dates";
import { formatVnd } from "@/lib/format";
import { pickupSlotLabel, pickupSlots } from "@/lib/pickup";
import { OPEN_STATUSES } from "@/modules/admin/order-flow";
import { requireAdmin } from "@/modules/admin/session";
import { getOrdersRepository, sanitizeQuery } from "@/modules/orders/repository";
import type { Order, OrderStatus } from "@/modules/orders/types";

export const metadata: Metadata = { title: "Đơn hàng" };

const TABS: { id: string; label: string; statuses: OrderStatus[] | null }[] = [
  { id: "can-xu-ly", label: "Cần xử lý", statuses: OPEN_STATUSES },
  { id: "cho-xac-nhan", label: "Chờ xác nhận", statuses: ["pending_confirmation"] },
  { id: "dang-lam", label: "Đã xác nhận / đang làm", statuses: ["confirmed", "preparing"] },
  { id: "san-sang", label: "Sẵn sàng", statuses: ["ready"] },
  { id: "da-giao", label: "Đã giao", statuses: ["completed"] },
  { id: "da-huy", label: "Huỷ / từ chối", statuses: ["cancelled", "rejected"] },
  { id: "tat-ca", label: "Tất cả", statuses: null },
];

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");
const slotIndex = (id: string) => pickupSlots.findIndex((s) => s.id === id);

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  await requireAdmin();
  const sp = await searchParams;
  const today = todayVN();
  const tab = TABS.find((t) => t.id === one(sp["trang-thai"])) ?? TABS[0]!;
  const dayParam = one(sp.ngay) || "tat-ca";
  const pickupDate = dayParam === "hom-nay" ? today : dayParam === "ngay-mai" ? addDays(today, 1) : /^\d{4}-\d{2}-\d{2}$/.test(dayParam) ? dayParam : undefined;
  const q = sanitizeQuery(one(sp.q));
  const unpaidOnly = one(sp["thanh-toan"]) === "chua-nhan";

  const all = await getOrdersRepository().list({ pickupDate, q: q || undefined, limit: 300 });
  const scoped = unpaidOnly ? all.filter((o) => o.payment === "transfer" && o.paymentStatus !== "paid" && OPEN_STATUSES.includes(o.status)) : all;
  const countFor = (statuses: OrderStatus[] | null) => scoped.filter((o) => !statuses || statuses.includes(o.status)).length;
  const orders = scoped.filter((o) => !tab.statuses || tab.statuses.includes(o.status));
  const isOpenTab = tab.statuses !== null && tab.statuses.every((s) => OPEN_STATUSES.includes(s));
  if (isOpenTab) orders.sort((a, b) => a.pickupDate.localeCompare(b.pickupDate) || slotIndex(a.pickupSlotId) - slotIndex(b.pickupSlotId));

  const href = (patch: Record<string, string | null>) => {
    const params = new URLSearchParams();
    const base: Record<string, string> = { "trang-thai": tab.id, ngay: dayParam, q, "thanh-toan": unpaidOnly ? "chua-nhan" : "" };
    for (const [k, v] of Object.entries({ ...base, ...patch })) if (v && !(k === "ngay" && v === "tat-ca") && !(k === "trang-thai" && v === "can-xu-ly")) params.set(k, v);
    const s = params.toString();
    return `/admin/don-hang${s ? `?${s}` : ""}`;
  };

  const days = [
    { id: "tat-ca", label: "Mọi ngày" },
    { id: "hom-nay", label: "Hôm nay" },
    { id: "ngay-mai", label: "Ngày mai" },
  ];

  return (
    <>
      <PageHeader
        title="Đơn hàng"
        description="Gọi khách xác nhận, theo dõi bánh và ghi nhận thanh toán."
        actions={
          <>
            <LiveRefresh />
            <Link href="/admin/don-hang/moi" className={btn.primary}><PlusIcon size={17} /> Tạo đơn</Link>
          </>
        }
      />

      {/* Bộ lọc */}
      <div className="mb-5 flex flex-col gap-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <form action="/admin/don-hang" className="relative flex-1 md:max-w-[360px]" role="search">
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-2" />
            <input name="q" defaultValue={q} placeholder="Tìm mã đơn hoặc số điện thoại" aria-label="Tìm đơn" className={`${input} pl-10`} />
            {tab.id !== "can-xu-ly" && <input type="hidden" name="trang-thai" value={tab.id} />}
            {dayParam !== "tat-ca" && <input type="hidden" name="ngay" value={dayParam} />}
          </form>
          <div className="flex flex-wrap items-center gap-2">
            {days.map((d) => (
              <Link key={d.id} href={href({ ngay: d.id })} aria-current={dayParam === d.id ? "true" : undefined} className={`inline-flex min-h-10 items-center rounded-full px-4 text-[14px] font-semibold no-underline ${dayParam === d.id ? "bg-maroon text-cream hover:text-cream" : "border border-maroon/15 bg-card text-maroon"}`}>
                {d.label}
              </Link>
            ))}
            <form action="/admin/don-hang" className="flex items-center">
              {tab.id !== "can-xu-ly" && <input type="hidden" name="trang-thai" value={tab.id} />}
              <label className="sr-only" htmlFor="loc-ngay">Chọn ngày nhận</label>
              <input id="loc-ngay" type="date" name="ngay" defaultValue={pickupDate && !["hom-nay", "ngay-mai"].includes(dayParam) ? pickupDate : ""} className={`${input} min-h-10 w-[150px] py-0 text-[14px]`} />
              <button type="submit" className="ml-1.5 min-h-10 rounded-full border-0 bg-beige px-3 text-[14px] font-semibold text-maroon">Lọc</button>
            </form>
          </div>
        </div>
        {(q || unpaidOnly) && (
          <div className="flex flex-wrap gap-2">
            {q && <Link href={href({ q: null })} className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-butter/30 px-3 text-[13px] font-semibold no-underline">Tìm: {q} <XIcon size={14} /></Link>}
            {unpaidOnly && <Link href={href({ "thanh-toan": null })} className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-butter/30 px-3 text-[13px] font-semibold no-underline">Chuyển khoản chưa nhận tiền <XIcon size={14} /></Link>}
          </div>
        )}
        <nav aria-label="Trạng thái đơn" className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {TABS.map((t) => {
            const active = t.id === tab.id;
            return (
              <Link key={t.id} href={href({ "trang-thai": t.id })} aria-current={active ? "page" : undefined} className={`inline-flex min-h-10 flex-none items-center gap-2 rounded-full px-3.5 text-[14px] font-semibold no-underline ${active ? "bg-dark text-cream hover:text-cream" : "text-muted hover:bg-maroon/5 hover:text-maroon"}`}>
                {t.label}
                <span className={`rounded-full px-1.5 text-[12px] tabular-nums ${active ? "bg-cream/15" : "bg-maroon/8"}`}>{countFor(t.statuses)}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {orders.length === 0 ? (
        <EmptyState title="Không có đơn nào" text={q ? "Không tìm thấy đơn khớp – thử mã đơn (YUB-…) hoặc số điện thoại khác." : "Chưa có đơn trong mục này."} />
      ) : (
        <>
          {/* Bảng – máy tính */}
          <div className={`${card} hidden overflow-hidden md:block`}>
            <table className="w-full border-collapse text-left text-[14px]">
              <thead className="bg-beige/60 text-[13px] text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Đơn</th>
                  <th className="px-4 py-3 font-semibold">Khách</th>
                  <th className="px-4 py-3 font-semibold">Nhận bánh</th>
                  <th className="px-4 py-3 text-right font-semibold">Tổng</th>
                  <th className="px-4 py-3 font-semibold">Thanh toán</th>
                  <th className="px-4 py-3 font-semibold">Trạng thái</th>
                  <th className="px-3 py-3"><span className="sr-only">Bước tiếp theo</span></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <OrderRow key={o.code} o={o} today={today} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Thẻ – điện thoại */}
          <ul className="m-0 flex list-none flex-col gap-2.5 p-0 md:hidden">
            {orders.map((o) => (
              <li key={o.code}>
                <Link href={`/admin/don-hang/${o.code}`} className={`${card} flex flex-col gap-2.5 p-4 no-underline active:scale-[0.99]`}>
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex min-w-0 flex-col">
                      <strong className="truncate text-[16px]">{o.customerName}</strong>
                      <span className="text-[13px] text-muted">{o.code} · {timeAgo(o.createdAt)}</span>
                    </span>
                    <OrderStatusBadge status={o.status} size="sm" />
                  </div>
                  <div className="flex items-center justify-between gap-2 text-[14px]">
                    <span className="font-semibold">{relativeDateLabel(o.pickupDate, today)} · {pickupSlotLabel(o.pickupSlotId)}</span>
                    <strong className="tabular-nums">{formatVnd(o.totalVnd)}</strong>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[13px] text-muted">{o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}</span>
                    <PaymentBadge method={o.payment} status={o.paymentStatus} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

function OrderRow({ o, today }: { o: Order; today: string }) {
  const link = `/admin/don-hang/${o.code}`;
  return (
    <tr className="group relative border-t border-maroon/8 hover:bg-beige/40">
      <td className="px-4 py-3.5 align-top">
        <Link href={link} className="font-semibold no-underline after:absolute after:inset-0">{o.code}</Link>
        <div className="text-[12px] text-muted-2">{timeAgo(o.createdAt)}</div>
      </td>
      <td className="px-4 py-3.5 align-top">
        <div className="font-semibold">{o.customerName}</div>
        <div className="text-[13px] text-muted">{o.customerPhone}</div>
      </td>
      <td className="px-4 py-3.5 align-top">
        <div className="font-semibold">{relativeDateLabel(o.pickupDate, today)}</div>
        <div className="text-[13px] text-muted">{pickupSlotLabel(o.pickupSlotId)}</div>
      </td>
      <td className="px-4 py-3.5 text-right align-top">
        <div className="font-semibold tabular-nums">{formatVnd(o.totalVnd)}</div>
        <div className="text-[12px] text-muted-2">{o.items.reduce((n, i) => n + i.qty, 0)} món</div>
      </td>
      <td className="px-4 py-3.5 align-top"><PaymentBadge method={o.payment} status={o.paymentStatus} /></td>
      <td className="px-4 py-3.5 align-top"><OrderStatusBadge status={o.status} /></td>
      <td className="px-3 py-3 text-right align-top">
        <span className="inline-flex items-center gap-1">
          <OrderActions code={o.code} status={o.status} only="next" unpaidTransfer={o.payment === "transfer" && o.paymentStatus !== "paid"} />
          <ChevronRightIcon className="text-muted-2 group-hover:text-maroon" />
        </span>
      </td>
    </tr>
  );
}
