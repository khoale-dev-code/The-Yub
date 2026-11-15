import type { Metadata } from "next";
import Link from "next/link";
import { ChatIcon, PhoneIcon } from "@/components/admin/admin-icons";
import { InquiryActions } from "@/components/admin/inquiry-actions";
import { EmptyState, PageHeader, btn, card, phoneDigits, zaloLink } from "@/components/admin/ui";
import { timeAgo } from "@/lib/dates";
import { requireAdmin } from "@/modules/admin/session";
import { inquiriesRepository, type InquiryStatus } from "@/modules/inquiries/repository";

export const metadata: Metadata = { title: "Hộp thư" };

const TABS: { id: string; status: InquiryStatus; label: string }[] = [
  { id: "moi", status: "new", label: "Mới" },
  { id: "da-tra-loi", status: "answered", label: "Đã trả lời" },
  { id: "luu-tru", status: "archived", label: "Lưu trữ" },
];

export default async function AdminInboxPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireAdmin();
  const { tab: tabParam } = await searchParams;
  const tab = TABS.find((t) => t.id === tabParam) ?? TABS[0]!;
  const all = await inquiriesRepository.list();
  const items = all.filter((i) => i.status === tab.status);

  return (
    <>
      <PageHeader title="Hộp thư" description="Câu hỏi khách gửi từ trang Đồ uống – gọi hoặc nhắn Zalo để trả lời." />
      <nav aria-label="Lọc hộp thư" className="mb-5 flex gap-1.5">
        {TABS.map((t) => {
          const active = t.id === tab.id;
          const n = all.filter((i) => i.status === t.status).length;
          return (
            <Link key={t.id} href={t.id === "moi" ? "/admin/hop-thu" : `/admin/hop-thu?tab=${t.id}`} aria-current={active ? "page" : undefined} className={`inline-flex min-h-10 items-center gap-2 rounded-full px-3.5 text-[14px] font-semibold no-underline ${active ? "bg-dark text-cream hover:text-cream" : "text-muted hover:bg-maroon/5"}`}>
              {t.label}
              <span className={`rounded-full px-1.5 text-[12px] tabular-nums ${active ? "bg-cream/15" : "bg-maroon/8"}`}>{n}</span>
            </Link>
          );
        })}
      </nav>

      {items.length === 0 ? (
        <EmptyState title={tab.status === "new" ? "Không có câu hỏi mới" : "Chưa có gì ở đây"} text="Khách gửi câu hỏi qua biểu mẫu “Còn câu hỏi?” ở trang Đồ uống." />
      ) : (
        <ul className="m-0 grid list-none gap-3 p-0 md:grid-cols-2">
          {items.map((i) => (
            <li key={i.id} className={`${card} flex flex-col gap-3 p-4`}>
              <div className="flex items-start justify-between gap-3">
                <span className="flex min-w-0 flex-col">
                  <strong className="truncate text-[16px]">{i.name}</strong>
                  <span className="text-[14px] tabular-nums text-muted">{i.phone}</span>
                </span>
                <span className="flex-none text-[13px] text-muted-2">{timeAgo(i.createdAt)}</span>
              </div>
              <p className="m-0 whitespace-pre-line rounded-2xl bg-beige/70 px-3.5 py-3 text-[15px]">{i.message}</p>
              <div className="flex flex-wrap items-center gap-2">
                <a href={`tel:${phoneDigits(i.phone)}`} className={`${btn.primary} min-h-10 px-4 text-[14px]`}><PhoneIcon size={16} /> Gọi</a>
                <a href={zaloLink(i.phone)} target="_blank" rel="noopener noreferrer" className={`${btn.secondary} min-h-10 px-4 text-[14px]`}><ChatIcon size={16} /> Zalo</a>
                <span className="ml-auto"><InquiryActions id={i.id} status={i.status} name={i.name} /></span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
