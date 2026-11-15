"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { brandImages } from "@/lib/images";
import { signOutAction } from "@/modules/admin/auth-actions";
import { CakeIcon, ChartIcon, ClockIcon, CupIcon, ExternalIcon, GearIcon, HomeIcon, InboxIcon, LogoutIcon, MoreIcon, ReceiptIcon, TagIcon, XIcon } from "./admin-icons";
import { NavPending, NavPendingBar } from "./nav-pending";
import { AdminToaster } from "./toast";

interface ShellUser {
  name: string;
  email: string;
  role: "owner" | "staff";
  demo: boolean;
}

interface NavItem {
  href: string;
  label: string;
  icon: (p: { size?: number }) => ReactNode;
  badge?: number;
}

const roleLabel = { owner: "Chủ tiệm", staff: "Nhân viên" } as const;

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export function AdminShell({ user, counts, children }: { user: ShellUser; counts: { pending: number; inbox: number }; children: ReactNode }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const daily: NavItem[] = [
    { href: "/admin", label: "Tổng quan", icon: HomeIcon },
    { href: "/admin/don-hang", label: "Đơn hàng", icon: ReceiptIcon, badge: counts.pending },
    { href: "/admin/hop-thu", label: "Hộp thư", icon: InboxIcon, badge: counts.inbox },
  ];
  const store: NavItem[] = [
    { href: "/admin/mon", label: "Món bánh", icon: CakeIcon },
    { href: "/admin/do-uong", label: "Đồ uống", icon: CupIcon },
    { href: "/admin/danh-muc", label: "Danh mục", icon: TagIcon },
    { href: "/admin/khung-gio", label: "Khung giờ", icon: ClockIcon },
    // Bao cao co doanh thu -> chi chu tiem
    ...(user.role === "owner" ? [{ href: "/admin/bao-cao", label: "Báo cáo", icon: ChartIcon }] : []),
    { href: "/admin/cai-dat", label: "Cài đặt", icon: GearIcon },
  ];
  const tabs: NavItem[] = [daily[0]!, daily[1]!, store[0]!, daily[2]!];
  const more = store.slice(1);
  const moreActive = more.some((i) => pathname.startsWith(i.href));

  useEffect(() => setMoreOpen(false), [pathname]);
  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMoreOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moreOpen]);

  const initial = (user.name.trim()[0] ?? "Q").toUpperCase();

  return (
    <div className="min-h-dvh bg-[#F7F0E3]">
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-full focus:bg-maroon focus:px-4 focus:py-2 focus:text-cream">Bỏ qua menu</a>

      {/* Sidebar – máy tính */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col bg-dark text-cream lg:flex">
        <div className="flex items-center gap-3 px-6 pb-6 pt-7">
          <Image src={brandImages.logoCream} alt="The Yub" width={brandImages.logoWidth} height={brandImages.logoHeight} className="h-10 w-auto" />
          <span className="rounded-full bg-cream/10 px-2.5 py-1 text-[12px] font-semibold text-cream/80">Quản lý</span>
        </div>
        <nav aria-label="Quản lý" className="flex flex-1 flex-col gap-6 overflow-y-auto px-3">
          {[{ title: "Hằng ngày", items: daily }, { title: "Cửa hàng", items: store }].map((g) => (
            <div key={g.title} className="flex flex-col gap-1">
              <span className="px-3 pb-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-cream/45">{g.title}</span>
              {g.items.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch
                    aria-current={active ? "page" : undefined}
                    className={`group flex min-h-11 items-center gap-3 rounded-[14px] px-3 text-[15px] font-semibold no-underline transition-colors ${active ? "bg-cream text-maroon" : "text-cream/80 hover:bg-cream/8 hover:text-cream"}`}
                  >
                    <Icon size={20} />
                    <span className="flex-1">{item.label}</span>
                    <NavPending tone={active ? "dark" : "light"} />
                    {item.badge ? (
                      <span className={`min-w-6 rounded-full px-1.5 py-0.5 text-center text-[12px] font-bold tabular-nums ${active ? "bg-maroon text-cream" : "bg-butter text-maroon"}`}>{item.badge}</span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="flex flex-col gap-2 border-t border-cream/10 p-3">
          <Link href="/" prefetch={false} target="_blank" className="flex min-h-10 items-center gap-3 rounded-[12px] px-3 text-[14px] font-semibold text-cream/75 no-underline hover:bg-cream/8 hover:text-cream">
            <ExternalIcon size={18} /> Xem trang web
          </Link>
          <div className="flex items-center gap-3 rounded-[16px] bg-cream/6 p-3">
            <span aria-hidden="true" className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-butter font-display text-lg font-semibold text-maroon">{initial}</span>
            <span className="flex min-w-0 flex-1 flex-col leading-[1.3]">
              <strong className="truncate text-[14px]">{user.name}</strong>
              <span className="truncate text-[12px] text-cream/60">{roleLabel[user.role]}</span>
            </span>
            <form action={signOutAction}>
              <button type="submit" aria-label="Đăng xuất" title="Đăng xuất" className="flex h-10 w-10 items-center justify-center rounded-full border-0 bg-transparent text-cream/70 hover:bg-cream/10 hover:text-cream">
                <LogoutIcon size={19} />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Thanh trên – điện thoại / máy tính bảng */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 bg-dark px-4 py-2.5 text-cream lg:hidden">
        <Link href="/admin" className="flex items-center gap-2.5 no-underline">
          <Image src={brandImages.logoCream} alt="The Yub" width={brandImages.logoWidth} height={brandImages.logoHeight} className="h-8 w-auto" />
          <span className="rounded-full bg-cream/10 px-2 py-0.5 text-[12px] font-semibold text-cream/80">Quản lý</span>
        </Link>
        <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full bg-butter font-display text-base font-semibold text-maroon">{initial}</span>
      </header>

      {user.demo && (
        <div className="bg-butter px-4 py-2 text-center text-[13px] font-semibold text-maroon lg:pl-[264px]">
          Chế độ xem thử – dữ liệu chỉ lưu tạm trong máy (mất khi tắt npm run dev). Kết nối Supabase để dùng thật.
        </div>
      )}

      <main id="admin-main" className="lg:pl-[264px]">
        <div className="mx-auto w-full max-w-[1180px] px-4 pb-32 pt-5 sm:px-6 md:pt-7 lg:px-10 lg:pb-14 lg:pt-9">{children}</div>
      </main>

      {/* Thanh tab dưới – điện thoại / máy tính bảng */}
      <nav aria-label="Quản lý" className="fixed inset-x-0 bottom-0 z-40 border-t border-maroon/10 bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
        <ul className="m-0 mx-auto grid max-w-[640px] list-none grid-cols-5 p-0">
          {tabs.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link href={item.href} prefetch aria-current={active ? "page" : undefined} className={`relative flex min-h-[62px] flex-col items-center justify-center gap-1 text-[11px] font-semibold no-underline ${active ? "text-maroon" : "text-muted-2"}`}>
                  <span className={`flex h-8 w-14 items-center justify-center rounded-full transition-colors ${active ? "bg-butter/35" : ""}`}><Icon size={21} /></span>
                  {item.label}
                  <NavPendingBar />
                  {item.badge ? <span className="absolute right-[calc(50%-24px)] top-1.5 min-w-5 rounded-full bg-accent px-1 text-center text-[11px] font-bold leading-5 text-cream">{item.badge}</span> : null}
                </Link>
              </li>
            );
          })}
          <li>
            <button type="button" onClick={() => setMoreOpen(true)} aria-expanded={moreOpen} aria-controls="admin-more" className={`flex min-h-[62px] w-full flex-col items-center justify-center gap-1 border-0 bg-transparent text-[11px] font-semibold ${moreActive ? "text-maroon" : "text-muted-2"}`}>
              <span className={`flex h-8 w-14 items-center justify-center rounded-full ${moreActive ? "bg-butter/35" : ""}`}><MoreIcon size={21} /></span>
              Thêm
            </button>
          </li>
        </ul>
      </nav>

      {/* Bảng "Thêm" */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Thêm" id="admin-more">
          <button type="button" aria-label="Đóng" onClick={() => setMoreOpen(false)} className="absolute inset-0 border-0 bg-dark/45" />
          <div className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-card px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3 shadow-[0_-20px_40px_-20px_rgba(36,18,13,0.5)] animate-[yub-toast-in_.3s_cubic-bezier(.16,1,.3,1)]">
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-maroon/15" />
            <div className="mb-3 flex items-center gap-3 rounded-[18px] bg-beige p-3">
              <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-full bg-butter font-display text-lg font-semibold text-maroon">{initial}</span>
              <span className="flex min-w-0 flex-1 flex-col leading-[1.3]">
                <strong className="truncate">{user.name}</strong>
                <span className="truncate text-[13px] text-muted">{roleLabel[user.role]}{user.email && !user.demo ? ` · ${user.email}` : ""}</span>
              </span>
              <button type="button" onClick={() => setMoreOpen(false)} aria-label="Đóng" className="flex h-10 w-10 items-center justify-center rounded-full border-0 bg-transparent text-maroon"><XIcon /></button>
            </div>
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {more.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link href={item.href} prefetch className="flex min-h-[52px] items-center gap-3 rounded-[16px] px-3 text-[16px] font-semibold text-maroon no-underline hover:bg-maroon/5">
                      <Icon size={21} /> <span className="flex-1">{item.label}</span>
                      <NavPending tone="dark" />
                    </Link>
                  </li>
                );
              })}
              <li>
                <Link href="/" prefetch={false} target="_blank" className="flex min-h-[52px] items-center gap-3 rounded-[16px] px-3 text-[16px] font-semibold text-maroon no-underline hover:bg-maroon/5">
                  <ExternalIcon size={21} /> Xem trang web
                </Link>
              </li>
              <li>
                <form action={signOutAction}>
                  <button type="submit" className="flex min-h-[52px] w-full items-center gap-3 rounded-[16px] border-0 bg-transparent px-3 text-left text-[16px] font-semibold text-accent hover:bg-rose">
                    <LogoutIcon size={21} /> Đăng xuất
                  </button>
                </form>
              </li>
            </ul>
          </div>
        </div>
      )}

      <AdminToaster />
    </div>
  );
}
