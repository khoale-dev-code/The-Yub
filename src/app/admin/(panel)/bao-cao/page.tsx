import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DownloadIcon } from "@/components/admin/admin-icons";
import { BarList, ColumnChart } from "@/components/admin/charts";
import { PageHeader, SectionTitle, btn, card } from "@/components/admin/ui";
import { shortDateLabel } from "@/lib/dates";
import { formatVnd } from "@/lib/format";
import { getReport, PERIODS } from "@/modules/admin/reports";
import { requireAdmin } from "@/modules/admin/session";
import { paymentLabels } from "@/modules/orders/types";

export const metadata: Metadata = { title: "Báo cáo" };

const ddmm = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;

export default async function AdminReportsPage({ searchParams }: { searchParams: Promise<{ ky?: string }> }) {
  const user = await requireAdmin();
  if (user.role !== "owner") redirect("/admin");
  const { ky } = await searchParams;
  const r = await getReport(ky ?? "7-ngay");
  const t = r.totals;
  const empty = t.activeOrders === 0 && t.closed === 0;

  const kpis = [
    { label: "Doanh thu", value: formatVnd(t.revenueDone), hint: `${t.completed} đơn đã giao` },
    { label: "Dự kiến thêm", value: formatVnd(t.revenueExpected), hint: "Đơn đã xác nhận, chưa giao" },
    { label: "Giá trị TB / đơn", value: formatVnd(t.avgOrder), hint: "Tính trên đơn đã giao" },
    { label: "Huỷ / từ chối", value: `${Math.round(t.closedRate * 100)}%`, hint: `${t.closed} đơn` },
  ];

  return (
    <>
      <PageHeader
        title="Báo cáo"
        description={`${ddmm(r.from)} – ${ddmm(r.to)} · tính theo ngày nhận bánh`}
        actions={
          <a href={`/admin/bao-cao/csv?ky=${r.period}`} className={btn.secondary} download>
            <DownloadIcon size={17} /> Tải CSV
          </a>
        }
      />

      <nav aria-label="Chọn kỳ báo cáo" className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {PERIODS.map((p) => (
          <Link key={p.id} href={p.id === "7-ngay" ? "/admin/bao-cao" : `/admin/bao-cao?ky=${p.id}`} aria-current={p.id === r.period ? "page" : undefined} className={`inline-flex min-h-10 flex-none items-center rounded-full px-4 text-[14px] font-semibold no-underline ${p.id === r.period ? "bg-dark text-cream hover:text-cream" : "border border-maroon/15 bg-card text-maroon"}`}>
            {p.label}
          </Link>
        ))}
      </nav>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {kpis.map((k) => (
          <div key={k.label} className={`${card} flex flex-col gap-1 p-4 md:p-5`}>
            <span className="text-[13px] font-semibold text-muted md:text-[14px]">{k.label}</span>
            <strong className="font-display text-[24px] font-semibold leading-[1.15] tabular-nums md:text-[30px]">{k.value}</strong>
            <span className="text-[12px] text-muted-2 md:text-[13px]">{k.hint}</span>
          </div>
        ))}
      </div>

      {empty ? (
        <div className={`${card} mt-6 px-6 py-12 text-center text-muted`}>Chưa có đơn nào có ngày nhận trong kỳ này.</div>
      ) : (
        <>
          <section aria-labelledby="bc-ngay" className={`${card} mt-6 p-4 md:p-6`}>
            <SectionTitle aside={<span className="text-[13px] text-muted">Đơn đã giao</span>}>
              <span id="bc-ngay">Doanh thu theo ngày</span>
            </SectionTitle>
            <ColumnChart
              label="Doanh thu theo ngày"
              data={r.days.map((d) => ({ key: d.date, label: r.days.length > 10 ? ddmm(d.date) : shortDateLabel(d.date), value: d.revenue, detail: `${d.orders} đơn nhận` }))}
            />
            <details className="mt-4 text-[14px]">
              <summary className="cursor-pointer font-semibold text-muted">Xem dạng bảng</summary>
              <div className="mt-3 max-h-[320px] overflow-auto">
                <table className="w-full border-collapse text-left">
                  <thead className="text-[13px] text-muted">
                    <tr><th className="py-2 font-semibold">Ngày</th><th className="py-2 text-right font-semibold">Đơn nhận</th><th className="py-2 text-right font-semibold">Doanh thu</th></tr>
                  </thead>
                  <tbody>
                    {r.days.map((d) => (
                      <tr key={d.date} className="border-t border-maroon/8">
                        <td className="py-2">{shortDateLabel(d.date)}</td>
                        <td className="py-2 text-right tabular-nums">{d.orders}</td>
                        <td className="py-2 text-right tabular-nums">{formatVnd(d.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </section>

          <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
            <section aria-labelledby="bc-mon" className={`${card} p-4 md:p-6`}>
              <SectionTitle aside={<span className="text-[13px] text-muted">Theo số lượng</span>}>
                <span id="bc-mon">Món bán chạy</span>
              </SectionTitle>
              <BarList label="Món bán chạy" rows={r.topProducts.map((p) => ({ label: p.name, value: p.qty, valueLabel: `${p.qty} phần`, sub: formatVnd(p.revenue) }))} />
            </section>

            <div className="flex flex-col gap-6">
              <section aria-labelledby="bc-gio" className={`${card} p-4 md:p-6`}>
                <SectionTitle><span id="bc-gio">Khung giờ được chọn</span></SectionTitle>
                <BarList label="Số đơn theo khung giờ" rows={r.bySlot.map((s) => ({ label: s.label, value: s.orders, valueLabel: `${s.orders} đơn` }))} />
              </section>
              <section aria-labelledby="bc-tt" className={`${card} p-4 md:p-6`}>
                <SectionTitle><span id="bc-tt">Thanh toán (đơn đã giao)</span></SectionTitle>
                <dl className="m-0 grid grid-cols-2 gap-3">
                  {(["cod", "transfer"] as const).map((m) => (
                    <div key={m} className="flex flex-col gap-0.5 rounded-[16px] bg-beige/70 p-3.5">
                      <dt className="text-[13px] text-muted">{paymentLabels[m]}</dt>
                      <dd className="m-0 font-display text-[22px] font-semibold tabular-nums">{formatVnd(r.byPayment[m].revenue)}</dd>
                      <dd className="m-0 text-[12px] text-muted-2">{r.byPayment[m].orders} đơn</dd>
                    </div>
                  ))}
                </dl>
              </section>
            </div>
          </div>
        </>
      )}
      <p className="mt-6 text-[13px] text-muted">Doanh thu chỉ tính đơn đã giao (bấm “Khách đã nhận bánh”). Đơn huỷ / từ chối không tính. Đồ uống bán tại quầy không nằm trong báo cáo này.</p>
    </>
  );
}
