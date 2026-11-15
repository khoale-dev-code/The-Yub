"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { brandImages } from "@/lib/images";
import { useStoreInfo } from "@/components/brand/store-info-context";
import { useCart } from "@/modules/cart/cart-context";
import { useLenis } from "../motion/smooth-scroll";
import { AnnouncementBar } from "./announcement-bar";
import { mainNav } from "./nav-links";
import { ArrowRightIcon, BagIcon, CloseIcon, HeartIcon, MenuIcon, SearchIcon, UserIcon } from "../ui/icons";

export function SiteHeader() {
  const store = useStoreInfo();
  const { count } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const lenis = useLenis();
  const [scrolled, setScrolled] = useState(false);
  const mobileRef = useRef<HTMLElement | null>(null);
  const desktopRef = useRef<HTMLElement | null>(null);

  // Header thu gon khi cuon + ghi chieu cao header dang hien vao --yub-header-h (sticky/anchor dung)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const publish = () => {
      const el = [desktopRef.current, mobileRef.current].find((h) => h && h.offsetHeight > 0);
      if (el) document.documentElement.style.setProperty("--yub-header-h", `${el.offsetHeight}px`);
    };
    publish();
    const ro = new ResizeObserver(publish);
    if (desktopRef.current) ro.observe(desktopRef.current);
    if (mobileRef.current) ro.observe(mobileRef.current);
    return () => {
      window.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, []);

  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    lenis?.stop();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      lenis?.start();
    };
  }, [menuOpen, lenis]);

  const onSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q");
    const term = typeof q === "string" ? q.trim() : "";
    router.push(term ? `/thuc-don?q=${encodeURIComponent(term)}#tat-ca` : "/thuc-don#tat-ca");
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : href === "/dat-banh" ? pathname.startsWith("/dat-banh") || pathname.startsWith("/gio-hang") || pathname.startsWith("/don-hang") : href.startsWith("/") && !href.includes("#") && (pathname.startsWith(href) || (href === "/thuc-don" && pathname.startsWith("/san-pham")));

  const cartLabel = `Giỏ hàng, ${count} món`;


  return (
    <>
      <AnnouncementBar />

      {/* Mobile header – nen toi, logo kem */}
      <header ref={mobileRef} className={`sticky top-0 z-40 flex items-center justify-between gap-2 bg-dark py-2 pl-4 pr-2 transition-shadow duration-300 md:hidden ${scrolled ? "shadow-[0_8px_24px_rgba(36,18,13,0.35)]" : ""}`}>
        <Link href="/" aria-label="The Yub – Trang chủ" className="block">
          <Image src={brandImages.logoCream} alt="The Yub – Bakes & More" width={brandImages.logoWidth} height={brandImages.logoHeight} className="h-[42px] w-auto" priority />
        </Link>
        <div className="flex items-center">
          <Link href="/gio-hang" aria-label={cartLabel} data-cart-target className="relative flex h-12 w-12 items-center justify-center text-cream hover:text-butter">
            <BagIcon />
            <span data-cart-badge className="absolute right-1 top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-butter px-1 text-[11px] font-bold text-maroon">{count}</span>
          </Link>
          <button type="button" aria-label="Mở menu" aria-expanded={menuOpen} aria-controls="yub-mobile-menu" onClick={() => setMenuOpen(true)} className="flex h-12 w-12 items-center justify-center text-cream">
            <MenuIcon />
          </button>
        </div>
      </header>

      {/* Desktop header */}
      <header
        ref={desktopRef}
        className={`sticky top-0 z-40 hidden transition-[background-color,box-shadow] duration-300 md:block ${scrolled ? "bg-page/92 shadow-[0_10px_30px_-12px_rgba(59,15,18,0.25)] backdrop-blur-md" : "bg-page"}`}
      >
        <div className={`mx-auto grid max-w-[1280px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 px-8 transition-[padding] duration-300 ${scrolled ? "py-1.5" : "py-[14px]"}`}>
          <form role="search" onSubmit={onSearch} className="flex min-h-11 max-w-[260px] items-center gap-2.5 text-muted-2">
            <SearchIcon />
            <label htmlFor="yub-search" className="sr-only">Tìm bánh</label>
            <input id="yub-search" name="q" type="search" placeholder="Tìm bánh, đồ uống…" className="min-w-0 flex-1 border-none bg-transparent py-2 text-sm text-maroon outline-offset-4 placeholder:text-muted-2" />
          </form>
          <Link href="/" aria-label="The Yub – Trang chủ" className="block">
            <Image src={brandImages.logoMaroon} alt="The Yub – Bakes & More" width={brandImages.logoWidth} height={brandImages.logoHeight} className={`w-auto transition-[height] duration-300 ${scrolled ? "h-11" : "h-16"}`} priority />
          </Link>
          <div className="flex justify-end gap-1">
            <Link href="/thuc-don" aria-label="Danh sách yêu thích" className="flex h-11 w-11 items-center justify-center"><HeartIcon /></Link>
            <a href={store.phoneHref} aria-label="Gọi tiệm" className="flex h-11 w-11 items-center justify-center"><UserIcon /></a>
            <Link href="/gio-hang" aria-label={cartLabel} data-cart-target className="relative flex h-11 w-11 items-center justify-center">
              <BagIcon />
              <span data-cart-badge className="absolute right-0.5 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-maroon px-1 text-[11px] font-bold text-cream">{count}</span>
            </Link>
          </div>
        </div>
        <nav aria-label="Điều hướng chính" className="border-y border-maroon/15">
          <div className="mx-auto flex max-w-[1100px] flex-wrap justify-around gap-x-6 px-8 text-[13px] font-semibold uppercase tracking-[0.14em]">
            {mainNav.map((l) => (
              <Link key={l.href} href={l.href} aria-current={isActive(l.href) ? "page" : undefined} className={`border-b-2 border-transparent px-1 no-underline transition-[padding] duration-300 aria-[current=page]:border-maroon ${scrolled ? "pb-2 pt-2.5" : "pb-3 pt-[14px]"}`}>
                {l.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div id="yub-mobile-menu" data-lenis-prevent role="dialog" aria-modal="true" aria-label="Menu" className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-maroon text-cream md:hidden">
          <div className="flex items-center justify-between border-b border-cream/15 py-2 pl-4 pr-2">
            <Link href="/" aria-label="The Yub – Trang chủ" className="block">
              <Image src={brandImages.logoCream} alt="The Yub – Bakes & More" width={brandImages.logoWidth} height={brandImages.logoHeight} className="h-[42px] w-auto" />
            </Link>
            <button type="button" aria-label="Đóng menu" onClick={() => setMenuOpen(false)} className="flex h-12 w-12 items-center justify-center text-cream">
              <CloseIcon />
            </button>
          </div>
          <nav aria-label="Điều hướng chính" className="px-5 pt-3">
            <ul>
              {mainNav.map((l, i) => (
                <li key={l.href} className="border-b border-cream/15">
                  <Link href={l.href} onClick={() => setMenuOpen(false)} className={`flex items-baseline gap-4 py-[13px] no-underline ${isActive(l.href) ? "text-butter" : "text-cream"} hover:text-butter`}>
                    <span className="w-[26px] flex-none text-xs font-semibold tracking-[0.08em] text-butter">{String(i + 1).padStart(2, "0")}</span>
                    <span className="font-display text-[32px] leading-[1.15]">{l.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-auto flex flex-col gap-4 px-5 pb-7 pt-5">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex flex-col rounded-[18px] border border-cream/20 px-3.5 py-3">
                <span className="text-xs text-cream/75">Mở cửa</span>
                <span className="font-display text-[19px] font-semibold">{store.openHours}</span>
              </div>
              <div className="flex flex-col rounded-[18px] border border-cream/20 px-3.5 py-3">
                <span className="text-xs text-cream/75">Bánh ra lò</span>
                <span className="font-display text-[19px] font-semibold text-butter">{store.freshBatchTime}</span>
              </div>
            </div>
            <Link href="/thuc-don" onClick={() => setMenuOpen(false)} className="flex min-h-[54px] items-center justify-center gap-2 rounded-full bg-butter font-bold text-maroon no-underline hover:text-maroon">
              Đặt bánh ngay <ArrowRightIcon />
            </Link>
            <a href={store.phoneHref} className="flex min-h-11 items-center self-center text-sm text-cream/85 hover:text-butter">
              Gọi tiệm: {store.phone}
            </a>
          </div>
        </div>
      )}
    </>
  );
}
