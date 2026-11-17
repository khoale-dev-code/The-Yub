"use client";

import gsap from "gsap";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { formatVnd } from "@/lib/format";
import { animationsReduced } from "../motion/motion-config";
import { freezeScroll } from "../motion/scroll-lock";
import { useLenis } from "../motion/smooth-scroll";
import { ArrowRightIcon, CloseIcon, SearchIcon } from "../ui/icons";

export interface SearchItem {
  kind: "banh" | "nuoc";
  id: string;
  name: string;
  sub: string;
  priceVnd: number;
  href: string;
  img: string | null;
}

/** Bo dau tieng Viet de go "banh kem" van ra "Bánh kem" */
const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();

const QUICK = ["Croissant", "Tart", "Bánh kem", "Cookie", "Cà phê", "Matcha"];
const MAX = 8;

/**
 * Tim kiem dang khung tha xuong (may tinh) / toan man hinh (dien thoai):
 * ket qua hien ngay khi go (khong can tai trang), di chuyen bang phim len/xuong, Enter de mo.
 * Mo / dong bang GSAP; Lenis dung cuon trang trong luc mo.
 */
export function SearchPanel({ open, onClose, items }: { open: boolean; onClose: () => void; items: SearchItem[] }) {
  const router = useRouter();
  const lenis = useLenis();
  const releaseRef = useRef<(() => void) | null>(null);
  useEffect(() => () => releaseRef.current?.(), []);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  const index = useMemo(() => items.map((it) => ({ it, key: fold(`${it.name} ${it.sub}`) })), [items]);
  const results = useMemo(() => {
    const term = fold(q);
    if (!term) return [];
    const words = term.split(/\s+/);
    return index
      .filter((x) => words.every((w) => x.key.includes(w)))
      .sort((a, b) => Number(fold(b.it.name).startsWith(term)) - Number(fold(a.it.name).startsWith(term)))
      .slice(0, MAX)
      .map((x) => x.it);
  }, [q, index]);

  // Mo: gan vao DOM roi chay hieu ung; Dong: chay hieu ung roi go khoi DOM
  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const panel = panelRef.current;
    if (!mounted || !root || !panel) return;
    if (open) {
      releaseRef.current?.();
      releaseRef.current = freezeScroll(lenis);
      // Hien ngay (visibility) de o nhap nhan focus duoc tuc thi; hieu ung chi doi opacity/transform
      gsap.set([root, panel], { visibility: "visible" });
      if (animationsReduced()) {
        gsap.set([root, panel], { opacity: 1 });
      } else {
        gsap.fromTo(root, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power1.out" });
        gsap.fromTo(panel, { y: -24, scale: 0.97, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.55, ease: "expo.out" });
        gsap.fromTo(panel.querySelectorAll("[data-search-in]"), { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power3.out", stagger: 0.04, delay: 0.08 });
      }
      inputRef.current?.focus({ preventScroll: true });
      const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeRef.current();
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
    releaseRef.current?.();
    releaseRef.current = null;
    const done = () => {
      setMounted(false);
      setQ("");
      setActive(0);
    };
    if (animationsReduced()) return done();
    gsap.to(panel, { y: -16, scale: 0.98, autoAlpha: 0, duration: 0.25, ease: "power2.in" });
    gsap.to(root, { autoAlpha: 0, duration: 0.25, ease: "power1.in", onComplete: done });
  }, [open, mounted, lenis]);

  // Ket qua moi: truot nhe vao
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel || !results.length || animationsReduced()) return;
    gsap.fromTo(panel.querySelectorAll("[data-result]"), { y: 8, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.3, ease: "power2.out", stagger: 0.025, overwrite: true });
  }, [results]);

  useEffect(() => setActive(0), [q]);

  if (!mounted) return null;

  const go = (href: string) => {
    onClose();
    router.push(href);
  };
  const submit = () => {
    const pick = results[active];
    if (pick) return go(pick.href);
    const term = q.trim();
    go(term ? `/thuc-don?q=${encodeURIComponent(term)}#tat-ca` : "/thuc-don#tat-ca");
  };

  // Gan vao <body> (portal): thoat khoi lop xep chong cua header / trang -> luon phu tren cung
  return createPortal(
    <div ref={rootRef} className="invisible fixed inset-0 z-[70] opacity-0" role="dialog" aria-modal="true" aria-label="Tìm kiếm">
      <button type="button" tabIndex={-1} aria-hidden="true" onClick={onClose} className="absolute inset-0 border-0 bg-dark/45 md:backdrop-blur-[2px]" />
      <div
        ref={panelRef}
        data-lenis-prevent
        className="invisible absolute inset-0 flex origin-top flex-col overflow-y-auto bg-page opacity-0 md:inset-x-6 md:bottom-auto md:top-[calc(var(--yub-header-h,80px)+10px)] md:mx-auto md:max-h-[min(640px,calc(100dvh-140px))] md:max-w-[760px] md:rounded-[28px] md:shadow-[0_40px_80px_-30px_rgba(36,18,13,0.55)]"
      >
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="sticky top-0 z-[1] flex items-center gap-2 border-b border-maroon/10 bg-page px-3 py-3 md:px-5 md:py-4"
        >
          <span data-search-in className="flex h-11 w-11 flex-none items-center justify-center text-accent"><SearchIcon size={22} /></span>
          <label htmlFor="yub-search-panel" className="sr-only">Tìm bánh, đồ uống</label>
          <input
            ref={inputRef}
            id="yub-search-panel"
            data-search-in
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, Math.max(results.length - 1, 0)));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              }
            }}
            placeholder="Tìm bánh, đồ uống…"
            autoComplete="off"
            enterKeyHint="search"
            aria-controls="yub-search-results"
            aria-activedescendant={results[active] ? `kq-${results[active]?.kind}-${results[active]?.id}` : undefined}
            className="min-w-0 flex-1 border-0 bg-transparent font-display text-[22px] [&::-webkit-search-cancel-button]:hidden font-semibold text-maroon outline-none placeholder:font-sans placeholder:text-[17px] placeholder:font-normal placeholder:text-muted-2 md:text-[26px]"
          />
          <button type="button" onClick={onClose} aria-label="Đóng tìm kiếm" className="flex h-11 w-11 flex-none items-center justify-center rounded-full border-0 bg-maroon/6 text-maroon hover:bg-maroon/12">
            <CloseIcon size={20} />
          </button>
        </form>

        <div className="flex flex-col gap-4 px-4 pb-6 pt-4 md:px-6">
          {!q.trim() ? (
            <div data-search-in className="flex flex-col gap-3">
              <span className="text-[13px] font-semibold text-muted">Gợi ý tìm nhanh</span>
              <div className="flex flex-wrap gap-2">
                {QUICK.map((t) => (
                  <button key={t} type="button" onClick={() => setQ(t)} className="min-h-10 rounded-full border border-maroon/20 bg-card px-4 text-[14px] font-semibold text-maroon transition-colors hover:border-maroon hover:bg-maroon hover:text-cream">
                    {t}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-start gap-3 py-6">
              <p className="m-0 font-display text-[22px] font-semibold">Chưa thấy món “{q.trim()}”</p>
              <p className="m-0 text-[15px] text-muted">Thử từ khoá ngắn hơn, hoặc xem cả thực đơn.</p>
              <button type="button" onClick={() => go("/thuc-don#tat-ca")} className="inline-flex min-h-11 items-center gap-2 rounded-full border-0 bg-maroon px-5 text-[14px] font-semibold text-cream hover:bg-accent">Xem thực đơn <ArrowRightIcon /></button>
            </div>
          ) : (
            <ul id="yub-search-results" role="listbox" aria-label="Kết quả" className="m-0 flex list-none flex-col gap-1 p-0">
              {results.map((r, i) => (
                <li key={`${r.kind}-${r.id}`} data-result id={`kq-${r.kind}-${r.id}`} role="option" aria-selected={i === active}>
                  <Link
                    href={r.href}
                    onClick={(e) => {
                      e.preventDefault();
                      go(r.href);
                    }}
                    onMouseEnter={() => setActive(i)}
                    className={`flex items-center gap-3 rounded-[18px] p-2 pr-3 no-underline transition-colors ${i === active ? "bg-butter/25" : "hover:bg-maroon/5"}`}
                  >
                    <span className="relative h-14 w-14 flex-none overflow-hidden rounded-[14px] bg-beige">
                      {r.img ? <Image src={r.img} alt="" fill sizes="56px" className="object-cover" /> : <span className="flex h-full w-full items-center justify-center text-[22px]" aria-hidden="true">☕</span>}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col leading-tight">
                      <strong className="truncate text-[16px] text-maroon">{r.name}</strong>
                      <span className="truncate text-[13px] text-muted">{r.kind === "nuoc" ? "Đồ uống" : "Bánh"} · {r.sub}</span>
                    </span>
                    <span className="flex-none font-display text-[17px] font-semibold text-maroon">{formatVnd(r.priceVnd)}</span>
                  </Link>
                </li>
              ))}
              <li data-result className="mt-2">
                <button type="button" onClick={() => go(`/thuc-don?q=${encodeURIComponent(q.trim())}#tat-ca`)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-maroon/20 bg-transparent px-5 text-[14px] font-semibold text-maroon hover:border-maroon">
                  Xem tất cả kết quả trong thực đơn <ArrowRightIcon />
                </button>
              </li>
            </ul>
          )}
          <p className="m-0 hidden text-[12px] text-muted-2 md:block">↑ ↓ để chọn · Enter để mở · Esc để đóng</p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
