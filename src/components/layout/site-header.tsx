"use client";

import gsap from "gsap";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { brandImages } from "@/lib/images";
import { useStoreInfo } from "@/components/brand/store-info-context";
import { useCart } from "@/modules/cart/cart-context";
import { SHOW_HEADER_EVENT } from "@/modules/cart/cart-fx";
import { animationsReduced } from "../motion/motion-config";
import { bounceUp, heartBurst, pop, ripple, squash, wiggle } from "../motion/press-fx";
import { CartDrawer, type CartCatalog } from "./cart-drawer";
import { freezeScroll } from "../motion/scroll-lock";
import { useLenis } from "../motion/smooth-scroll";
import { SearchPanel, type SearchItem } from "./search-panel";
import { AnnouncementBar } from "./announcement-bar";
import { mainNav } from "./nav-links";
import { useCustomer } from "@/modules/customers/customer-context";
import { ArrowRightIcon, BagIcon, CloseIcon, HeartIcon, MenuIcon, SearchIcon, UserIcon } from "../ui/icons";

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** Cuon xuong qua moc nay thi thanh menu an di, cuon len la hien lai */
const HIDE_AFTER_PX = 220;

export function SiteHeader({ searchItems = [], cartCatalog = {} }: { searchItems?: SearchItem[]; cartCatalog?: CartCatalog }) {
  const store = useStoreInfo();
  const { count } = useCart();
  const customer = useCustomer();
  const favCount = customer.favorites.length;
  const pathname = usePathname();
  const accountHref = customer.loggedIn ? "/tai-khoan" : `/dang-nhap?next=${encodeURIComponent(pathname || "/")}`;
  const lenis = useLenis();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartAnchor, setCartAnchor] = useState<HTMLElement | null>(null);
  const [pillReady, setPillReady] = useState(false);
  const hoverTimer = useRef(0);

  const desktopRef = useRef<HTMLElement | null>(null);
  const mobileRef = useRef<HTMLElement | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const pillRef = useRef<HTMLSpanElement | null>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const hiddenRef = useRef(false);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href) || (href === "/thuc-don" && pathname.startsWith("/san-pham")));
  const activeIdx = mainNav.findIndex((l) => isActive(l.href));
  const homeIdx = activeIdx >= 0 ? activeIdx : null;

  // ---------------------------------------------------------------- vien mau truot theo chuot (GSAP)
  /** Chu doi mau theo vi tri THAT cua vien mau (khong doi ngay khi chuot cham) -> khong nhap nhay */
  const syncColors = useCallback(() => {
    const pill = pillRef.current;
    if (!pill) return;
    const x = Number(gsap.getProperty(pill, "x"));
    const w = Number(gsap.getProperty(pill, "width"));
    const visible = Number(gsap.getProperty(pill, "opacity")) > 0.5;
    const center = x + w / 2;
    for (const el of linkRefs.current) {
      if (!el) continue;
      const on = visible && center >= el.offsetLeft && center <= el.offsetLeft + el.offsetWidth;
      if ((el.dataset.on === "true") !== on) el.dataset.on = on ? "true" : "false";
    }
  }, []);

  const movePill = useCallback(
    (idx: number | null, instant = false) => {
      const pill = pillRef.current;
      const el = idx === null ? null : linkRefs.current[idx];
      if (!pill) return;
      if (!el) {
        gsap.to(pill, { opacity: 0, scale: 0.94, duration: instant ? 0 : 0.3, ease: "power2.out", overwrite: true, onUpdate: syncColors, onComplete: syncColors });
        return;
      }
      const vars = { x: el.offsetLeft, width: el.offsetWidth, opacity: 1, scale: 1 };
      if (instant || animationsReduced()) {
        gsap.set(pill, vars);
        syncColors();
      } else {
        gsap.to(pill, { ...vars, duration: 0.6, ease: "power3.out", overwrite: true, onUpdate: syncColors, onComplete: syncColors });
      }
    },
    [syncColors],
  );

  /** Tre nhe truoc khi di chuyen: luot chuot nhanh qua nhieu muc chi tinh muc dung lai -> khong giat */
  const schedulePill = useCallback(
    (idx: number | null, delay: number) => {
      window.clearTimeout(hoverTimer.current);
      hoverTimer.current = window.setTimeout(() => movePill(idx), delay);
    },
    [movePill],
  );

  useEffect(() => () => window.clearTimeout(hoverTimer.current), []);

  // Dat vien vao muc dang xem (khi tai trang / doi trang / doi kich thuoc)
  useIsoLayoutEffect(() => {
    window.clearTimeout(hoverTimer.current);
    movePill(homeIdx, true);
    setPillReady(true);
    const onResize = () => movePill(homeIdx, true);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [homeIdx, movePill]);

  // ---------------------------------------------------------------- bong khi cuon + chieu cao header cho cac phan sticky
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
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

  // ---------------------------------------------------------------- an khi cuon xuong, hien khi cuon len (Lenis)
  useEffect(() => {
    if (!lenis || animationsReduced()) return;
    const bars = [desktopRef.current, mobileRef.current].filter(Boolean);
    const setHidden = (hide: boolean) => {
      if (hiddenRef.current === hide) return;
      hiddenRef.current = hide;
      // Cac thanh dinh khac (vd: chon nhom do uong) truot len theo header
      document.documentElement.toggleAttribute("data-header-hidden", hide);
      gsap.to(bars, { yPercent: hide ? -130 : 0, duration: hide ? 0.45 : 0.6, ease: hide ? "power3.in" : "expo.out", overwrite: true });
    };
    let holdUntil = 0;
    const onScroll = ({ scroll, direction }: { scroll: number; direction: number }) => {
      if (scroll < HIDE_AFTER_PX) setHidden(false);
      else if (direction === 1 && performance.now() > holdUntil) setHidden(true);
      else if (direction === -1) setHidden(false);
    };
    // Them vao gio: hien header de anh bay vao dung icon gio, giu hien mot luc
    const onShow = (e: Event) => {
      holdUntil = performance.now() + ((e as CustomEvent<{ holdMs?: number }>).detail?.holdMs ?? 1500);
      setHidden(false);
    };
    lenis.on("scroll", onScroll);
    window.addEventListener(SHOW_HEADER_EVENT, onShow);
    return () => {
      lenis.off("scroll", onScroll);
      window.removeEventListener(SHOW_HEADER_EVENT, onShow);
      gsap.set(bars, { yPercent: 0 });
      hiddenRef.current = false;
      document.documentElement.removeAttribute("data-header-hidden");
    };
  }, [lenis]);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setCartOpen(false);
  }, [pathname]);

  // Phim tat: "/" hoac Ctrl/Cmd+K mo tim kiem
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if ((e.key === "/" && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ---------------------------------------------------------------- menu dien thoai
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    const release = freezeScroll(lenis);
    return () => {
      document.removeEventListener("keydown", onKey);
      release();
    };
  }, [menuOpen, lenis]);

  useIsoLayoutEffect(() => {
    const el = overlayRef.current;
    if (!menuOpen || !el || animationsReduced()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(el, { clipPath: "circle(0% at 92% 4%)" }, { clipPath: "circle(150% at 92% 4%)", duration: 0.7, ease: "power3.inOut" });
      gsap.from("[data-menu-item]", { yPercent: 110, opacity: 0, duration: 0.7, ease: "expo.out", stagger: 0.06, delay: 0.25 });
      gsap.from("[data-menu-foot]", { y: 20, opacity: 0, duration: 0.6, ease: "power2.out", delay: 0.5 });
    }, el);
    return () => ctx.revert();
  }, [menuOpen]);

  // Hieu ung bam: nut gio (lac + song), tim (bung tim nho), tim kiem / tai khoan (nay)
  const pressCart = (e: React.PointerEvent<HTMLAnchorElement>) => {
    bounceUp(e.currentTarget);
    ripple(e.currentTarget, e);
    wiggle(e.currentTarget.querySelector("[data-fx-icon]"));
  };
  /** Bam gio: mo gio hang nhanh (khong roi trang). Dang o trang gio hang / Ctrl+click -> giu hanh vi link */
  const openCart = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0 || pathname.startsWith("/gio-hang")) return;
    e.preventDefault();
    setCartAnchor(e.currentTarget);
    setCartOpen(true);
  };
  const pressHeart = (e: React.PointerEvent<HTMLAnchorElement>) => {
    pop(e.currentTarget.querySelector("[data-fx-icon]"), 0.6);
    heartBurst(e.currentTarget);
  };
  const pressIcon = (e: React.PointerEvent<HTMLElement>) => {
    squash(e.currentTarget);
    ripple(e.currentTarget, e, "rgba(59,15,18,0.12)");
  };

  const cartLabel = `Giỏ hàng, ${count} món`;
  const iconBtn = "relative flex h-11 w-11 flex-none items-center justify-center overflow-hidden rounded-full text-maroon transition-colors hover:bg-maroon/8";

  return (
    <>
      <AnnouncementBar />

      {/* ------------------------------------------------ Dien thoai: vien thuoc toi noi */}
      <header ref={mobileRef} className="sticky top-0 z-40 px-3 pt-2 md:hidden">
        <div className={`flex items-center justify-between rounded-full bg-dark py-1 pl-4 pr-1 transition-shadow duration-300 ${scrolled ? "shadow-[0_12px_28px_-10px_rgba(36,18,13,0.55)]" : ""}`}>
          <Link href="/" data-transition data-transition-label="Trang chủ" aria-label="The Yub – Trang chủ" className="block">
            <Image src={brandImages.logoCream} alt="The Yub – Bakes & More" width={brandImages.logoWidth} height={brandImages.logoHeight} className="h-[38px] w-auto" priority />
          </Link>
          <div className="flex items-center">
            <button type="button" aria-label="Tìm bánh, đồ uống" onPointerDown={pressIcon} onClick={() => setSearchOpen(true)} className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full text-cream">
              <SearchIcon />
            </button>
            <Link href="/gio-hang" aria-label={cartLabel} data-cart-target aria-haspopup="dialog" onPointerDown={pressCart} onClick={openCart} className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full text-cream hover:text-butter">
              <span data-fx-icon className="flex"><BagIcon /></span>
              <span data-cart-badge className="absolute right-1 top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-butter px-1 text-[11px] font-bold text-maroon">{count}</span>
            </Link>
            <button type="button" aria-label="Mở menu" aria-expanded={menuOpen} aria-controls="yub-mobile-menu" onClick={() => setMenuOpen(true)} className="flex h-12 w-12 items-center justify-center rounded-full bg-cream/10 text-cream">
              <MenuIcon />
            </button>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------ May tinh: vien thuoc noi, vien mau truot theo chuot */}
      <header ref={desktopRef} className="sticky top-0 z-40 hidden px-6 pt-3 md:block">
        <div
          className={`mx-auto grid max-w-[1240px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-full border border-maroon/8 bg-[#FFFCF6] p-2 transition-shadow duration-300 ${
            scrolled ? "shadow-[0_18px_40px_-18px_rgba(59,15,18,0.45)]" : "shadow-[0_8px_24px_-16px_rgba(59,15,18,0.3)]"
          }`}
        >
          <Link href="/" data-transition data-transition-label="Trang chủ" aria-label="The Yub – Trang chủ" className="block justify-self-start pl-4">
            <Image src={brandImages.logoMaroon} alt="The Yub – Bakes & More" width={brandImages.logoWidth} height={brandImages.logoHeight} className="h-11 w-auto" priority />
          </Link>

          <nav ref={navRef} aria-label="Điều hướng chính" onMouseLeave={() => schedulePill(homeIdx, 220)} className="relative flex items-center justify-self-center">
            <span ref={pillRef} aria-hidden="true" className="pointer-events-none absolute left-0 top-0 h-full w-0 rounded-full bg-maroon opacity-0 shadow-[0_8px_20px_-8px_rgba(59,15,18,0.6)]" />
            {mainNav.map((l, i) => {
              const active = i === activeIdx;
              return (
                <Link
                  key={l.href}
                  ref={(el) => {
                    linkRefs.current[i] = el;
                  }}
                  href={l.href}
                  data-transition
                  data-transition-label={l.label}
                  data-on={active ? "true" : "false"}
                  aria-current={active ? "page" : undefined}
                  onMouseEnter={() => schedulePill(i, 70)}
                  onFocus={() => schedulePill(i, 0)}
                  onBlur={() => schedulePill(homeIdx, 120)}
                  className={`relative z-[1] flex h-12 items-center whitespace-nowrap rounded-full px-5 text-[15px] font-semibold text-maroon no-underline transition-colors duration-300 hover:text-maroon data-[on=true]:text-cream data-[on=true]:hover:text-cream lg:px-6 ${
                    !pillReady && active ? "bg-maroon" : ""
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-0.5 justify-self-end">
            <button type="button" aria-label="Tìm bánh, đồ uống (phím /)" aria-expanded={searchOpen} aria-haspopup="dialog" onPointerDown={pressIcon} onClick={() => setSearchOpen(true)} className={iconBtn}>
              <SearchIcon />
            </button>
            <Link href="/yeu-thich" aria-label={`Món yêu thích${favCount ? `, ${favCount} món` : ""}`} onPointerDown={pressHeart} className={`${iconBtn} overflow-visible`}>
              <span data-fx-icon className="flex"><HeartIcon fill={favCount ? "currentColor" : "none"} className={favCount ? "text-accent" : ""} /></span>
              {favCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-cream">{favCount}</span>}
            </Link>
            <Link href={accountHref} aria-label={customer.loggedIn ? `Tài khoản của ${customer.name}` : "Đăng nhập"} title={customer.loggedIn ? customer.name : "Đăng nhập"} onPointerDown={pressIcon} className={iconBtn}>
              {customer.loggedIn && customer.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={customer.avatar} alt="" width={30} height={30} referrerPolicy="no-referrer" className="h-[30px] w-[30px] rounded-full object-cover ring-2 ring-butter" />
              ) : customer.loggedIn ? (
                <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-butter font-display text-[15px] font-semibold text-maroon">{(customer.name.trim()[0] ?? "K").toUpperCase()}</span>
              ) : (
                <UserIcon />
              )}
            </Link>
            <Link href="/gio-hang" aria-label={cartLabel} data-cart-target aria-haspopup="dialog" onPointerDown={pressCart} onClick={openCart} className="relative ml-1 flex h-11 items-center gap-2 overflow-hidden rounded-full bg-maroon pl-4 pr-3 text-[14px] font-semibold text-cream no-underline transition-colors hover:bg-accent hover:text-cream">
              <span data-fx-icon className="relative flex"><BagIcon /></span>
              <span className="hidden lg:inline">Giỏ hàng</span>
              <span data-cart-badge className="flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-butter px-1.5 text-[12px] font-bold text-maroon">{count}</span>
            </Link>
          </div>
        </div>
      </header>

      <SearchPanel open={searchOpen} onClose={() => setSearchOpen(false)} items={searchItems} />
      <CartDrawer
        open={cartOpen}
        onClose={() => {
          setCartOpen(false);
          cartAnchor?.focus({ preventScroll: true });
        }}
        catalog={cartCatalog}
        anchor={cartAnchor}
      />

      {/* ------------------------------------------------ Menu dien thoai (mo dang vong tron lan ra) */}
      {menuOpen && (
        <div ref={overlayRef} id="yub-mobile-menu" data-lenis-prevent role="dialog" aria-modal="true" aria-label="Menu" className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-maroon text-cream md:hidden">
          <div className="flex items-center justify-between py-3 pl-7 pr-4">
            <Link href="/" aria-label="The Yub – Trang chủ" className="block">
              <Image src={brandImages.logoCream} alt="The Yub – Bakes & More" width={brandImages.logoWidth} height={brandImages.logoHeight} className="h-[38px] w-auto" />
            </Link>
            <button type="button" aria-label="Đóng menu" onClick={() => setMenuOpen(false)} className="flex h-12 w-12 items-center justify-center rounded-full bg-cream/10 text-cream">
              <CloseIcon />
            </button>
          </div>
          <nav aria-label="Điều hướng chính" className="px-5 pt-4">
            <ul>
              {mainNav.map((l, i) => (
                <li key={l.href} className="overflow-hidden border-b border-cream/15">
                  <Link data-menu-item data-transition data-transition-label={l.label} href={l.href} onClick={() => pathname === l.href && setMenuOpen(false)} aria-current={isActive(l.href) ? "page" : undefined} className={`flex items-baseline gap-4 py-[14px] no-underline ${isActive(l.href) ? "text-butter" : "text-cream"} hover:text-butter`}>
                    <span className="w-[26px] flex-none text-xs font-semibold tracking-[0.08em] text-butter">{String(i + 1).padStart(2, "0")}</span>
                    <span className="font-display text-[34px] leading-[1.15]">{l.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div data-menu-foot className="mt-auto flex flex-col gap-4 px-5 pb-7 pt-5">
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
            <div className="grid grid-cols-2 gap-2.5">
              <Link href="/yeu-thich" onClick={() => setMenuOpen(false)} className="flex min-h-[52px] items-center justify-center gap-2 rounded-full border border-cream/30 font-semibold text-cream no-underline hover:text-butter">
                <HeartIcon size={19} /> Yêu thích{favCount ? ` (${favCount})` : ""}
              </Link>
              <Link href={accountHref} onClick={() => setMenuOpen(false)} className="flex min-h-[52px] items-center justify-center gap-2 rounded-full border border-cream/30 font-semibold text-cream no-underline hover:text-butter">
                <UserIcon size={19} /> {customer.loggedIn ? "Tài khoản" : "Đăng nhập"}
              </Link>
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
