import type { Metadata } from "next";
import Link from "next/link";
import { DeleteAccount, MarketingSwitch } from "@/components/customer/privacy-controls";
import { OrderStatusPill } from "@/components/customer/order-status-pill";
import { ProfileForm } from "@/components/customer/profile-form";
import { ReorderButton } from "@/components/customer/reorder-button";
import { ArrowRightIcon, HeartIcon } from "@/components/ui/icons";
import { formatVnd } from "@/lib/format";
import { formatPickupDate, pickupSlotLabel } from "@/lib/pickup";
import { signOutCustomerAction } from "@/modules/customers/actions";
import { reorderLinesOf } from "@/modules/customers/reorder";
import { customersRepository } from "@/modules/customers/repository";
import { requireCustomer } from "@/modules/customers/session";
import { getOrdersRepository } from "@/modules/orders/repository";
import { productsRepository } from "@/modules/products/repository";

export const metadata: Metadata = { title: "Tài khoản", robots: { index: false } };
export const dynamic = "force-dynamic";

const dateTime = (iso: string) => new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
const date = (iso: string) => new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(iso));

export default async function AccountPage() {
  const me = await requireCustomer("/tai-khoan");
  const [orders, favorites] = await Promise.all([
    getOrdersRepository()
      .listByCustomer(me.id, 50)
      .catch(() => []),
    customersRepository()
      .favorites(me.id)
      .catch(() => [] as string[]),
  ]);
  const products = await productsRepository.findManyByIds([...new Set(orders.flatMap((o) => o.items.map((i) => i.productId)).filter(Boolean))]);
  const initial = (me.fullName.trim()[0] ?? "K").toUpperCase();

  return (
    <div className="mx-auto flex max-w-[1160px] flex-col gap-6 px-4 pb-20 pt-5 sm:px-6 md:gap-8 md:pt-9">
      {/* Chao + thao tac nhanh */}
      <section data-no-reveal className="relative overflow-hidden rounded-[28px] bg-maroon px-5 py-6 text-cream md:rounded-[36px] md:px-10 md:py-9">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-butter/15" />
        <div className="relative flex flex-wrap items-center gap-4 md:gap-6">
          {me.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={me.avatarUrl} alt="" width={72} height={72} referrerPolicy="no-referrer" className="h-16 w-16 rounded-full object-cover ring-4 ring-butter/60 md:h-[72px] md:w-[72px]" />
          ) : (
            <span aria-hidden="true" className="flex h-16 w-16 items-center justify-center rounded-full bg-butter font-display text-3xl font-semibold text-maroon md:h-[72px] md:w-[72px]">{initial}</span>
          )}
          <div className="flex min-w-0 flex-1 flex-col">
            <h1 className="m-0 break-words font-display text-[28px] font-semibold leading-tight md:truncate md:text-[40px]">Xin chào, {me.fullName}</h1>
            <span className="truncate text-[14px] text-cream/75">{me.email} · Thành viên từ {date(me.createdAt)}</span>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <Link href="/yeu-thich" className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-butter px-5 text-[14px] font-bold text-maroon no-underline hover:bg-cream hover:text-maroon sm:flex-none">
              <HeartIcon size={18} /> Yêu thích ({favorites.length})
            </Link>
            <form action={signOutCustomerAction} className="flex-1 sm:flex-none">
              <button type="submit" className="min-h-11 w-full rounded-full border border-cream/40 bg-transparent px-5 text-[14px] font-semibold text-cream hover:border-butter hover:text-butter">Đăng xuất</button>
            </form>
          </div>
        </div>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:gap-8">
        {/* Lich su don */}
        <section data-no-reveal aria-labelledby="don-cua-ban" className="flex flex-col gap-4">
          <div className="flex items-end justify-between gap-3">
            <h2 id="don-cua-ban" data-no-split className="m-0 font-display text-[28px] font-semibold leading-tight">Đơn hàng của bạn</h2>
            {orders.length > 0 && <span className="text-[14px] text-muted">{orders.length} đơn</span>}
          </div>
          {orders.length === 0 ? (
            <div className="flex flex-col items-start gap-3 rounded-[24px] border border-dashed border-maroon/25 bg-card p-6">
              <p className="m-0 font-display text-[22px] font-semibold">Chưa có đơn nào</p>
              <p className="m-0 text-[15px] text-muted">Đơn bạn đặt khi đã đăng nhập sẽ hiện ở đây để xem lại và mua lại nhanh.</p>
              <Link href="/thuc-don" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-maroon px-5 text-[14px] font-semibold text-cream no-underline hover:bg-accent hover:text-cream">Xem thực đơn <ArrowRightIcon /></Link>
            </div>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {orders.map((o) => (
                <li key={o.code} className="rounded-[22px] border border-maroon/10 bg-card p-4 transition-shadow hover:shadow-[0_14px_30px_-18px_rgba(59,15,18,0.45)] md:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <Link href={`/tai-khoan/don/${encodeURIComponent(o.code)}`} className="flex flex-col no-underline">
                      <strong className="font-display text-[20px] font-semibold tracking-[0.01em]">{o.code}</strong>
                      <span className="text-[13px] text-muted">Đặt lúc {dateTime(o.createdAt)}</span>
                    </Link>
                    <OrderStatusPill status={o.status} />
                  </div>
                  <p className="mb-0 mt-3 line-clamp-2 text-[14px] text-maroon/85">{o.items.map((i) => `${i.qty} × ${i.name}`).join(" · ")}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-maroon/10 pt-3">
                    <span className="flex flex-col text-[13px] text-muted">
                      Nhận {formatPickupDate(o.pickupDate)} · {pickupSlotLabel(o.pickupSlotId)}
                      <strong className="font-display text-[20px] font-semibold text-maroon">{formatVnd(o.totalVnd)}</strong>
                    </span>
                    <span className="flex items-center gap-2">
                      <Link href={`/tai-khoan/don/${encodeURIComponent(o.code)}`} className="inline-flex min-h-10 items-center rounded-full border border-maroon/25 px-4 text-[14px] font-semibold no-underline hover:border-maroon">Chi tiết</Link>
                      <ReorderButton lines={reorderLinesOf(o, products)} size="sm" />
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="flex flex-col gap-5">
          <section data-no-reveal className="rounded-[24px] border border-maroon/10 bg-card p-5 md:p-6">
            <h2 data-no-split className="mb-4 mt-0 font-display text-[22px] font-semibold">Thông tin liên hệ</h2>
            <ProfileForm initial={{ fullName: me.fullName, phone: me.phone, address: me.address }} />
          </section>
          <section data-no-reveal className="flex flex-col gap-4 rounded-[24px] border border-maroon/10 bg-card p-5 md:p-6">
            <h2 data-no-split className="m-0 font-display text-[22px] font-semibold">Quyền riêng tư</h2>
            <p className="m-0 text-[14px] text-muted">
              Bạn đã đồng ý <Link href="/chinh-sach-bao-mat">Chính sách bảo mật</Link> (phiên bản {me.consentVersion}) lúc {dateTime(me.consentedAt)}.
            </p>
            <MarketingSwitch initial={me.marketingOptIn} />
            <div className="h-px bg-maroon/10" />
            <DeleteAccount />
          </section>
        </aside>
      </div>
    </div>
  );
}
