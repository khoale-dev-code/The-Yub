import type { Metadata } from "next";
import Link from "next/link";
import { ChatIcon, MailIcon, PhoneIcon, SearchIcon } from "@/components/admin/admin-icons";
import { EmptyState, PageHeader, btn, card, input, phoneDigits, zaloLink } from "@/components/admin/ui";
import { timeAgo } from "@/lib/dates";
import { formatVnd } from "@/lib/format";
import { requireAdmin } from "@/modules/admin/session";
import { listCustomersForAdmin } from "@/modules/customers/admin-service";
import { CustomersNotReadyError } from "@/modules/customers/repository";
import type { CustomerSummary } from "@/modules/customers/types";

export const metadata: Metadata = { title: "Khách hàng" };

export default async function AdminCustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin();
  const q = ((await searchParams).q ?? "").slice(0, 60);
  let list: CustomerSummary[] = [];
  let notReady: string | null = null;
  try {
    list = await listCustomersForAdmin(q);
  } catch (err) {
    if (err instanceof CustomersNotReadyError) notReady = err.message;
    else throw err;
  }

  return (
    <>
      <PageHeader title="Khách hàng" description="Khách đăng nhập bằng Google trên web – xem liên hệ và lịch sử đơn để hỗ trợ khi có sự cố." />
      <form role="search" className="mb-5 flex gap-2">
        <label className="relative flex-1">
          <span className="sr-only">Tìm khách</span>
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"><SearchIcon /></span>
          <input name="q" defaultValue={q} placeholder="Tìm tên, email hoặc số điện thoại" className={`${input} min-h-12 pl-10`} />
        </label>
        <button type="submit" className={`${btn.primary} min-h-12 px-6`}>Tìm</button>
      </form>

      {notReady ? (
        <EmptyState title="Chưa bật quản lý khách hàng" text={notReady} />
      ) : list.length === 0 ? (
        <EmptyState title={q ? "Không tìm thấy khách phù hợp" : "Chưa có khách đăng nhập"} text={q ? "Thử tìm bằng số điện thoại hoặc email." : "Khách đăng nhập bằng Google trên web sẽ hiện ở đây."} />
      ) : (
        <ul data-admin-stagger className="m-0 grid list-none gap-3 p-0 md:grid-cols-2">
          {list.map((c) => (
            <li key={c.id} className={`${card} flex flex-col gap-3 p-4 transition-shadow hover:shadow-[0_14px_30px_-18px_rgba(59,15,18,0.45)]`}>
              <Link href={`/admin/khach-hang/${c.id}`} className="flex items-center gap-3 no-underline">
                {c.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.avatarUrl} alt="" width={48} height={48} referrerPolicy="no-referrer" className="h-12 w-12 flex-none rounded-full object-cover" />
                ) : (
                  <span aria-hidden="true" className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-butter font-display text-xl font-semibold text-maroon">{(c.fullName.trim()[0] ?? "K").toUpperCase()}</span>
                )}
                <span className="flex min-w-0 flex-1 flex-col leading-tight">
                  <strong className="truncate text-[17px]">{c.fullName}</strong>
                  <span className="truncate text-[13px] text-muted">{c.email}</span>
                  <span className="text-[13px] tabular-nums text-muted">{c.phone ?? "Chưa có số điện thoại"}</span>
                </span>
                <span className="flex flex-none flex-col items-end leading-tight">
                  <strong className="font-display text-[20px] font-semibold">{c.orderCount} đơn</strong>
                  <span className="text-[12px] text-muted">{formatVnd(c.totalVnd)}</span>
                </span>
              </Link>
              <div className="flex flex-wrap items-center gap-2 border-t border-maroon/10 pt-3">
                {c.phone && <a href={`tel:${phoneDigits(c.phone)}`} className={`${btn.secondary} min-h-10 px-3.5 text-[13px]`}><PhoneIcon size={15} /> Gọi</a>}
                {c.phone && <a href={zaloLink(c.phone)} target="_blank" rel="noopener noreferrer" className={`${btn.secondary} min-h-10 px-3.5 text-[13px]`}><ChatIcon size={15} /> Zalo</a>}
                <a href={`mailto:${c.email}`} className={`${btn.secondary} min-h-10 px-3.5 text-[13px]`}><MailIcon size={15} /> Email</a>
                <span className="ml-auto text-[12px] text-muted">{c.lastOrderAt ? `Đơn gần nhất ${timeAgo(c.lastOrderAt)}` : "Chưa đặt đơn"}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
