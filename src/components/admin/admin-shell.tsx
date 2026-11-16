"use client";

import gsap from "gsap";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { brandImages } from "@/lib/images";
import { signOutAction } from "@/modules/admin/auth-actions";
import { CakeIcon, ChartIcon, ClockIcon, CupIcon, ExternalIcon, GearIcon, HomeIcon, InboxIcon, LogoutIcon, PlusIcon, ReceiptIcon, TagIcon, UsersIcon, XIcon } from "./admin-icons";
import { AdminSmoothScroll, useAdminLenis } from "./admin-smooth-scroll";
import { NavPending } from "./nav-pending";
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
  hint: string;
  icon: (p: { size?: number }) => ReactNode;
  badge?: number;
}

const roleLabel = { owner: "Chủ tiệm", staff: "Nhân viên" } as const;

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export function AdminShell(props: { user: ShellUser; counts: { pending: number; inbox: number }; children: ReactNode }) {
  return (
    <AdminSmoothScroll>
      <Shell {...props} />
    </AdminSmoothScroll>
  );
}

function Shell({ user, counts, children }: { user: ShellUser; counts: { pending: number; inbox: number }; children: ReactNode }) {
  const pathname = usePathname();
  const lenis = useAdminLenis();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const backdropRef = useRef<HTMLButtonElement | null>(null);
  const menuBtnRef = useRef<HTMLButtonElement | null>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  const groups: { title: string; items: NavItem[] }[] = [
    {
      title: "Hằng ngày",
      items: [
        { href: "/admin", label: "Tổng quan", hint: "Việc cần làm hôm nay", icon: HomeIcon },
        { href: "/admin/don-hang", label: "Đơn hàng", hint: "Xác nhận, chuẩn bị, giao", icon: ReceiptIcon, badge: counts.pending },
        { href: "/admin/hop-thu", label: "Hộp thư", hint: "Tin nhắn của khách", icon: InboxIcon, badge: counts.inbox },
        { href: "/admin/khach-hang", label: "Khách hàng", hint: "Liên hệ, lịch sử đơn", icon: UsersIcon },
      ],
    },
    {
      title: "Cửa hàng",
      items: [
        { href: "/admin/mon", label: "Món bánh", hint: "Giá, ảnh, còn / hết", icon: CakeIcon },
        { href: "/admin/do-uong", label: "Đồ uống", hint: "Size M / L, nóng / đá", icon: CupIcon },
        { href: "/admin/danh-muc", label: "Danh mục", hint: "Nhóm bánh & nước", icon: TagIcon },
        { href: "/admin/khung-gio", label: "Khung giờ", hint: "Giờ khách hẹn nhận", icon: ClockIcon },
        // Bao cao co doanh thu -> chi chu tiem
        ...(user.role === "owner" ? [{ href: "/admin/bao-cao", label: "Báo cáo", hint: "Doanh thu, món bán chạy", icon: ChartIcon }] : []),
        { href: "/admin/cai-dat", label: "Cài đặt", hint: "Giờ mở cửa, bản đồ…", icon: GearIcon },
      ],
    },
  ];
  const all = groups.flatMap((g) => g.items);
  const current = [...all].sort((a, b) => b.href.length - a.href.length).find((i) => isActive(pathname, i.href));
  const initial = (user.name.trim()[0] ?? "Q").toUpperCase();

  // ---------------------------------------------------------------- hieu ung mo / dong menu (GSAP)
  useIsoLayoutEffect(() => {
    const panel = panelRef.current;
    const backdrop = backdropRef.current;
    if (!panel || !backdrop) return;
    const ctx = gsap.context(() => {
      gsap.set([panel, backdrop], { autoAlpha: 0 });
      tlRef.current = gsap
        .timeline({ paused: true, defaults: { overwrite: "auto" } })
        .to(backdrop, { autoAlpha: 1, duration: 0.3, ease: "power2.out" })
        .fromTo(panel, { autoAlpha: 0, xPercent: -8, scale: 0.98 }, { autoAlpha: 1, xPercent: 0, scale: 1, duration: 0.5, ease: "expo.out" }, 0)
        .fromTo("[data-menu-tile]", { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.45, ease: "power3.out", stagger: 0.03 }, 0.08);
    }, panel);
    return () => {
      ctx.revert();
      tlRef.current = null;
    };
  }, []);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const tl = tlRef.current;
    if (!tl) return;
    if (open) {
      tl.timeScale(1).play();
      lenis?.stop();
      document.documentElement.style.overflow = "hidden";
      // Dua focus vao muc dang xem de dung ban phim ngay
      const t = window.setTimeout(() => {
        const panel = panelRef.current;
        (panel?.querySelector<HTMLElement>("a[aria-current=page]") ?? panel?.querySelector<HTMLElement>("a"))?.focus({ preventScroll: true });
      }, 80);
      return () => window.clearTimeout(t);
    } else {
      tl.timeScale(1.8).reverse();
      lenis?.start();
      document.documentElement.style.overflow = "";
    }
  }, [open, lenis]);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        menuBtnRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="min-h-dvh bg-[#F7F0E3]">
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:fixed focus:left-1/2 focus:top-20 focus:z-[100] focus:-translate-x-1/2 focus:rounded-full focus:bg-maroon focus:px-4 focus:py-2 focus:text-cream">Bỏ qua menu</a>

      {/* ------------------------------------------------ Thanh tren (moi thiet bi) */}
      <header className="sticky top-0 z-40 px-2 pt-2 sm:px-4 sm:pt-3">
        <div className="mx-auto flex max-w-[1320px] items-center gap-1.5 rounded-[22px] bg-dark py-1.5 pl-1.5 pr-1.5 text-cream shadow-[0_14px_30px_-16px_rgba(36,18,13,0.6)] sm:gap-3 sm:pr-2">
          <button
            ref={menuBtnRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="admin-menu"
            aria-label={open ? "Đóng menu" : "Mở menu"}
            className="group relative flex h-11 w-11 flex-none items-center justify-center rounded-[16px] border-0 bg-cream/10 text-cream transition-colors hover:bg-cream/15"
          >
            <span aria-hidden="true" className="relative block h-3.5 w-[18px]">
              <span className={`absolute left-0 top-0 h-[2px] w-full rounded-full bg-current transition-transform duration-300 ${open ? "translate-y-[6px] rotate-45" : ""}`} />
              <span className={`absolute left-0 top-[6px] h-[2px] w-full rounded-full bg-current transition-opacity duration-200 ${open ? "opacity-0" : ""}`} />
              <span className={`absolute left-0 top-[12px] h-[2px] rounded-full bg-current transition-[transform,width] duration-300 ${open ? "w-full -translate-y-[6px] -rotate-45" : "w-[12px] group-hover:w-full"}`} />
            </span>
            {counts.pending > 0 && !open && <span aria-hidden="true" className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-butter ring-2 ring-dark" />}
          </button>

          <Link href="/admin" className="flex flex-none items-center gap-2 px-1 no-underline">
            <Image src={brandImages.logoCream} alt="The Yub – Quản lý" width={brandImages.logoWidth} height={brandImages.logoHeight} className="h-8 w-auto sm:h-9" priority />
          </Link>

          {current && (
            <span className="hidden min-w-0 items-center gap-2 border-l border-cream/15 pl-3 text-[15px] font-semibold text-cream/85 md:flex">
              <current.icon size={18} />
              <span className="truncate">{current.label}</span>
            </span>
          )}

          <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
            <Link href="/admin/don-hang/moi" className="flex h-11 items-center gap-1.5 rounded-[16px] bg-butter px-3 text-[14px] font-bold text-maroon no-underline transition-colors hover:bg-cream hover:text-maroon sm:px-4" aria-label="Tạo đơn mới">
              <PlusIcon size={18} />
              <span className="hidden sm:inline">Tạo đơn</span>
            </Link>
            <Link href="/admin/don-hang" aria-label={`Đơn hàng${counts.pending ? `, ${counts.pending} đơn chờ xác nhận` : ""}`} className="relative flex h-11 w-11 items-center justify-center rounded-[16px] text-cream no-underline hover:bg-cream/10 hover:text-cream">
              <ReceiptIcon size={20} />
              {counts.pending > 0 && <span className="absolute right-0.5 top-0.5 min-w-5 rounded-full bg-butter px-1 text-center text-[11px] font-bold leading-5 text-maroon">{counts.pending}</span>}
            </Link>
            <Link href="/admin/hop-thu" aria-label={`Hộp thư${counts.inbox ? `, ${counts.inbox} tin mới` : ""}`} className="relative hidden h-11 w-11 items-center justify-center rounded-[16px] text-cream no-underline hover:bg-cream/10 hover:text-cream min-[380px]:flex">
              <InboxIcon size={20} />
              {counts.inbox > 0 && <span className="absolute right-0.5 top-0.5 min-w-5 rounded-full bg-butter px-1 text-center text-[11px] font-bold leading-5 text-maroon">{counts.inbox}</span>}
            </Link>
            <span aria-hidden="true" title={`${user.name} · ${roleLabel[user.role]}`} className="ml-0.5 hidden h-10 w-10 items-center justify-center rounded-full bg-cream/12 font-display text-base font-semibold text-butter sm:flex">{initial}</span>
          </div>
        </div>
      </header>

      {user.demo && (
        <div className="mx-auto mt-2 max-w-[1320px] px-2 sm:px-4">
          <p className="m-0 rounded-[16px] bg-butter px-4 py-2 text-center text-[13px] font-semibold text-maroon">Chế độ xem thử – dữ liệu chỉ lưu tạm trong máy (mất khi tắt npm run dev). Kết nối Supabase để dùng thật.</p>
        </div>
      )}

      <main id="admin-main">
        <div className="mx-auto w-full max-w-[1240px] px-4 pb-16 pt-6 sm:px-6 md:pt-8 lg:px-10 lg:pt-10">{children}</div>
      </main>

      {/* ------------------------------------------------ Menu 3 soc */}
      <button ref={backdropRef} type="button" tabIndex={-1} aria-hidden="true" onClick={close} className="invisible fixed inset-0 z-50 border-0 bg-dark/45 opacity-0 backdrop-blur-[2px]" />
      <div
        ref={panelRef}
        id="admin-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu quản lý"
        aria-hidden={!open}
        inert={!open}
        data-lenis-prevent
        className="invisible fixed inset-0 z-[60] flex origin-top-left flex-col overflow-y-auto overscroll-contain bg-dark text-cream opacity-0 sm:inset-auto sm:bottom-3 sm:left-3 sm:top-3 sm:w-[440px] sm:rounded-[28px] sm:shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)]"
      >
        <div className="sticky top-0 z-[1] flex items-center justify-between gap-3 bg-dark px-4 pb-3 pt-3 sm:px-5 sm:pt-5">
          <Image src={brandImages.logoCream} alt="The Yub" width={brandImages.logoWidth} height={brandImages.logoHeight} className="h-9 w-auto" />
          <button type="button" onClick={() => (close(), menuBtnRef.current?.focus())} aria-label="Đóng menu" className="flex h-11 w-11 items-center justify-center rounded-[16px] border-0 bg-cream/10 text-cream hover:bg-cream/15">
            <XIcon size={20} />
          </button>
        </div>

        <div data-menu-tile className="mx-4 mb-4 flex items-center gap-3 rounded-[20px] bg-cream/6 p-3 sm:mx-5">
          <span aria-hidden="true" className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-butter font-display text-lg font-semibold text-maroon">{initial}</span>
          <span className="flex min-w-0 flex-1 flex-col leading-[1.3]">
            <strong className="truncate text-[15px]">{user.name}</strong>
            <span className="truncate text-[13px] text-cream/60">{roleLabel[user.role]}{user.email && !user.demo ? ` · ${user.email}` : ""}</span>
          </span>
        </div>

        <nav aria-label="Quản lý" className="flex flex-col gap-5 px-4 pb-4 sm:px-5">
          {groups.map((g) => (
            <div key={g.title} className="flex flex-col gap-2">
              <span data-menu-tile className="px-1 text-[12px] font-semibold uppercase tracking-[0.1em] text-cream/45">{g.title}</span>
              <ul className="m-0 grid list-none grid-cols-2 gap-2 p-0">
                {g.items.map((item) => {
                  const active = isActive(pathname, item.href) && item === current;
                  const Icon = item.icon;
                  return (
                    <li key={item.href} data-menu-tile>
                      <Link
                        href={item.href}
                        prefetch
                        onClick={close}
                        aria-current={active ? "page" : undefined}
                        className={`group relative flex min-h-[104px] flex-col justify-between gap-3 rounded-[20px] p-3.5 no-underline outline-none transition-colors focus-visible:ring-2 focus-visible:ring-butter ${
                          active ? "bg-butter text-maroon hover:text-maroon" : "bg-cream/6 text-cream hover:bg-cream/12 hover:text-cream"
                        }`}
                      >
                        <span className="flex items-start justify-between">
                          <span className={`flex h-10 w-10 items-center justify-center rounded-full ${active ? "bg-maroon text-butter" : "bg-cream/10 text-butter"}`}>
                            <Icon size={20} />
                          </span>
                          {item.badge ? (
                            <span className={`min-w-6 rounded-full px-1.5 py-0.5 text-center text-[12px] font-bold tabular-nums ${active ? "bg-maroon text-cream" : "bg-butter text-maroon"}`}>{item.badge}</span>
                          ) : (
                            <NavPending tone={active ? "dark" : "light"} />
                          )}
                        </span>
                        <span className="flex flex-col leading-tight">
                          <strong className="text-[16px]">{item.label}</strong>
                          <span className={`mt-0.5 text-[12px] ${active ? "text-maroon/75" : "text-cream/55"}`}>{item.hint}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div data-menu-tile className="mt-auto flex flex-col gap-1 border-t border-cream/10 px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3 sm:px-5">
          <Link href="/" prefetch={false} target="_blank" className="flex min-h-12 items-center gap-3 rounded-[14px] px-3 text-[15px] font-semibold text-cream/80 no-underline hover:bg-cream/8 hover:text-cream">
            <ExternalIcon size={19} /> Xem trang web
          </Link>
          <form action={signOutAction}>
            <button type="submit" className="flex min-h-12 w-full items-center gap-3 rounded-[14px] border-0 bg-transparent px-3 text-left text-[15px] font-semibold text-[#F3A8A0] hover:bg-cream/8">
              <LogoutIcon size={19} /> Đăng xuất
            </button>
          </form>
        </div>
      </div>

      <AdminToaster />
    </div>
  );
}
