"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { animationsReduced } from "@/components/motion/motion-config";
import { useLenis } from "@/components/motion/smooth-scroll";
import { formatVnd } from "@/lib/format";
import type { Drink, DrinkGroup } from "@/modules/products/types";

gsap.registerPlugin(ScrollTrigger);

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export interface DrinkMenuGroup {
  id: DrinkGroup;
  label: string;
  items: Drink[];
}

const illus = {
  pour: "/images/illustrations/flat-pour.svg",
};

type Size = "M" | "L";

/**
 * Nut chon size: vet xanh truot giua M va L. Moi the nhom co 1 nut, cung dieu khien 1 size chung
 * cho ca thuc don (doi o the nao cung doi het).
 */
function SizeToggle({ size, onChange, label, compact = false }: { size: Size; onChange: (s: Size) => void; label: string; compact?: boolean }) {
  return (
    <div role="radiogroup" aria-label={`Chọn size – ${label}`} className={`relative grid flex-none grid-cols-2 rounded-full p-1 ${compact ? "bg-card ring-1 ring-maroon/15" : "bg-beige"}`}>
      <span
        aria-hidden="true"
        className={`absolute bottom-1 left-1 top-1 w-[calc(50%-4px)] rounded-full bg-[#4E7A32] shadow-[0_6px_14px_-6px_rgba(46,82,24,0.7)] transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none ${size === "L" ? "translate-x-full" : ""}`}
      />
      {(["M", "L"] as const).map((s) => (
        <button
          key={s}
          type="button"
          role="radio"
          aria-checked={size === s}
          aria-label={`Size ${s}`}
          onClick={() => onChange(s)}
          className={`relative z-[1] flex items-center justify-center rounded-full border-0 bg-transparent text-[15px] font-bold transition-[color,transform] duration-300 active:scale-90 ${compact ? "h-8 w-10" : "h-9 w-11 md:h-10 md:w-12"} ${size === s ? "text-white" : "text-muted hover:text-ink"}`}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

/** Gia theo size dang chon – doi size thi so moi truot len thay so cu */
function DrinkPrice({ d, size }: { d: Drink; size: Size }) {
  const onlyM = size === "L" && d.priceLVnd === null;
  const price = size === "L" && d.priceLVnd !== null ? d.priceLVnd : d.priceMVnd;
  return (
    <span className="flex min-w-[88px] flex-col items-end pt-0.5 text-right">
      <span className="relative overflow-hidden">
        <span key={`${size}-${price}`} className={`block text-[16px] font-bold tabular-nums motion-safe:animate-[yub-price-in_0.45s_cubic-bezier(0.2,0.8,0.2,1)_both] md:text-[17px] ${onlyM ? "text-muted-2" : "text-ink"}`}>
          <span className="sr-only">Size {onlyM ? "M" : size} </span>
          {formatVnd(price)}
        </span>
      </span>
      {onlyM && <span className="text-[11px] font-semibold text-muted-2">chỉ size M</span>}
    </span>
  );
}

/** Cuon toi nhom: chua phan header + thanh chon nhom (dien thoai) */
const GROUP_OFFSET = { scrollMarginTop: "calc(var(--yub-header-h) + 76px)" } as const;

const HotIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 10h12v4a6 6 0 0 1-6 6h0a6 6 0 0 1-6-6z" />
    <path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17" />
    <path d="M9 3.5c-.8 1 .8 1.8 0 3M13 3.5c-.8 1 .8 1.8 0 3" />
  </svg>
);
const IceIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="9" width="8" height="8" rx="1.6" />
    <rect x="11" y="4" width="8" height="8" rx="1.6" />
  </svg>
);

const menuName = (d: Drink) => (d.temps.length === 1 && d.temps[0] === "hot" && !/nóng/i.test(d.name) ? `${d.name} (nóng)` : d.name);

/**
 * Thuc don quay nuoc: cot trai dinh (ten nhom + minh hoa), cot phai la cac the thuc don.
 * Cuon toi nhom nao thi nhom do sang len (ScrollTrigger); bam ten nhom -> cuon muot (Lenis).
 */
export function DrinkMenu({ groups, sizeLExtra }: { groups: DrinkMenuGroup[]; sizeLExtra: number | null }) {
  const lenis = useLenis();
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement | null>(null);
  const navList = useRef<HTMLUListElement | null>(null);
  const indicator = useRef<HTMLSpanElement | null>(null);
  const chips = useRef<HTMLDivElement | null>(null);
  const pour = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<Size>("M");

  const goTo = useCallback(
    (i: number) => {
      const el = document.getElementById(`nuoc-${groups[i]?.id ?? ""}`);
      if (!el) return;
      if (lenis) lenis.scrollTo(el, { duration: 1.2 });
      else el.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [groups, lenis],
  );

  // Hieu ung cuon + nhom dang xem
  useIsoLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      groups.forEach((g, i) => {
        const block = document.getElementById(`nuoc-${g.id}`);
        if (block) ScrollTrigger.create({ trigger: block, start: "top 55%", end: "bottom 55%", onToggle: (self) => self.isActive && setActive(i) });
      });
      if (animationsReduced()) return;

      // Hang mon: hien lan luot (chi nhung hang nam duoi man hinh, dung opacity de van bam/tab duoc)
      const rows = gsap.utils.toArray<HTMLElement>("[data-drink-row]", el).filter((r) => r.getBoundingClientRect().top > window.innerHeight * 0.95);
      gsap.set(rows, { opacity: 0, y: 22 });
      ScrollTrigger.batch(rows, {
        start: "top 94%",
        once: true,
        onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.8, ease: "expo.out", stagger: 0.05, overwrite: true }),
      });

      // The nhom: noi dung truot len (khong dich chuyen chinh the – the la diem cuon toi cua menu)
      gsap.utils.toArray<HTMLElement>("[data-drink-card]", el).forEach((card) => {
        if (card.getBoundingClientRect().top < window.innerHeight * 0.92) return;
        const head = card.querySelector("[data-drink-head]");
        if (head) gsap.from(head, { y: 36, opacity: 0, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: card, start: "top 90%", once: true } });
      });

      // Minh hoa binh rot (chi hien tren may tinh): lo lung nhe + nghieng theo cuon
      if (pour.current && window.matchMedia("(min-width: 1024px)").matches) {
        gsap.to(pour.current, { y: -10, duration: 2.6, ease: "sine.inOut", yoyo: true, repeat: -1 });
        gsap.fromTo(pour.current, { rotation: 6 }, { rotation: -8, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.6 } });
      }
    }, el);
    return () => ctx.revert();
  }, [groups]);

  // Vach chi nhom dang xem (may tinh) truot theo + chip (dien thoai) tu cuon vao giua
  useEffect(() => {
    const list = navList.current;
    const bar = indicator.current;
    const item = list?.querySelectorAll<HTMLElement>("li")[active];
    if (list && bar && item) {
      gsap.to(bar, { y: item.offsetTop, height: item.offsetHeight, duration: animationsReduced() ? 0 : 0.55, ease: "expo.out" });
    }
    const row = chips.current;
    const chip = row?.children[active] as HTMLElement | undefined;
    if (row && chip) row.scrollTo({ left: chip.offsetLeft - row.clientWidth / 2 + chip.clientWidth / 2, behavior: "smooth" });
  }, [active]);

  const hasL = groups.some((g) => g.items.some((d) => d.priceLVnd !== null));

  return (
    <div ref={root} className="relative mx-auto grid max-w-[1200px] gap-8 px-4 pb-16 pt-12 sm:px-6 md:pb-[120px] md:pt-24 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-16">
      {/* Cột trái – dính khi cuộn (máy tính) */}
      <div className="flex flex-col gap-5 lg:sticky lg:top-[calc(var(--yub-header-h)+40px)] lg:self-start">
        <h2 className="m-0 font-display text-[64px] font-semibold leading-[0.9] tracking-[-0.02em] text-ink md:text-[80px]">Thực đơn</h2>
        <div className="flex flex-col gap-3">
          <p className="m-0 max-w-[340px] text-pretty text-[16px] text-muted">Pha khi bạn gọi, ngay cạnh lò bánh.</p>
          {/* Moi y mot vien – khong bi xuong dong giua chung (vd "M / L") */}
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0 text-[13px] font-semibold">
            {hasL && <li className="whitespace-nowrap rounded-full bg-[#4E7A32]/12 px-3 py-1.5 text-[#2F4A1E]">Bấm M/L để xem giá theo size</li>}
            {sizeLExtra ? <li className="whitespace-nowrap rounded-full bg-beige px-3 py-1.5 text-ink">Size L thêm {formatVnd(sizeLExtra)}</li> : null}
            <li className="whitespace-nowrap rounded-full bg-rose px-3 py-1.5 text-accent">{hasL ? "Món nóng chỉ có size M" : "Giá theo size M"}</li>
          </ul>
        </div>

        <nav aria-label="Nhóm đồ uống" className="hidden lg:block">
          <ul ref={navList} className="relative m-0 flex list-none flex-col gap-1 p-0">
            <span ref={indicator} aria-hidden="true" className="absolute inset-x-0 top-0 h-12 rounded-2xl bg-maroon" />
            {groups.map((g, i) => (
              <li key={g.id} className="relative">
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-current={active === i ? "true" : undefined}
                  className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border-0 bg-transparent px-4 text-left text-[17px] font-semibold transition-colors duration-300 ${active === i ? "text-cream" : "text-ink hover:bg-maroon/6"}`}
                >
                  {g.label}
                  <span className={`text-sm font-medium tabular-nums ${active === i ? "text-butter" : "text-muted-2"}`}>{g.items.length}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div ref={pour} aria-hidden="true" className="hidden w-[200px] self-center lg:block">
          <Image src={illus.pour} alt="" width={400} height={420} unoptimized className="h-auto w-full" />
        </div>
      </div>

      {/* Thanh chọn nhóm – điện thoại/máy tính bảng */}
      <div data-follow-header className="sticky top-[var(--yub-header-h)] z-10 -mx-4 flex items-center gap-2 border-y border-maroon/10 bg-cream pr-3 sm:-mx-6 sm:pr-5 lg:hidden">
        <div ref={chips} data-lenis-prevent className="no-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto py-2.5 pl-4 pr-2 [mask-image:linear-gradient(to_right,#000_88%,transparent)] sm:pl-6">
          {groups.map((g, i) => (
            <button
              key={g.id}
              type="button"
              onClick={() => goTo(i)}
              aria-current={active === i ? "true" : undefined}
              className={`inline-flex min-h-10 flex-none items-center gap-1.5 rounded-full border px-4 text-[15px] font-semibold transition-[background-color,border-color,color,transform] duration-200 active:scale-95 ${active === i ? "border-maroon bg-maroon text-cream" : "border-maroon/25 bg-card text-ink"}`}
            >
              {g.label}
            </button>
          ))}
        </div>
        {hasL && <SizeToggle size={size} onChange={setSize} label="cả thực đơn" compact />}
      </div>

      {/* Cột phải – các thẻ thực đơn */}
      <div className="flex min-w-0 flex-col gap-5 md:gap-7">
        {groups.map((g) => (
          <section key={g.id} id={`nuoc-${g.id}`} data-no-reveal data-drink-card aria-labelledby={`nuoc-${g.id}-h`} style={GROUP_OFFSET} className="rounded-[28px] bg-card px-5 py-6 shadow-[0_24px_50px_-36px_rgba(59,15,18,0.45)] md:px-9 md:py-9">
            <div data-drink-head className="flex items-end justify-between gap-4 border-b-[1.5px] border-ink pb-3 md:pb-4">
              <h3 id={`nuoc-${g.id}-h`} className="m-0 font-display text-[32px] font-semibold leading-none tracking-[-0.015em] text-ink md:text-[44px]">{g.label}</h3>
              {g.items.some((d) => d.priceLVnd !== null) ? (
                <>
                  <span className="hidden lg:block">
                    <SizeToggle size={size} onChange={setSize} label={g.label} />
                  </span>
                  <span className="pb-1 text-[13px] font-bold tabular-nums text-muted-2 lg:hidden">Size {size}</span>
                </>
              ) : (
                <span className="pb-1 text-[13px] font-bold text-muted-2">Size M</span>
              )}
            </div>
            <ul className="m-0 flex list-none flex-col p-0">
              {g.items.map((d) => (
                <li key={d.id} data-drink-row className="group grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1 border-b border-dashed border-maroon/20 py-4 last:border-b-0 md:py-5">
                  <div className="flex min-w-0 flex-col gap-1 pr-2">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      <span className={`text-[17px] font-bold leading-[1.3] transition-colors group-hover:text-accent md:text-lg ${d.soldOut ? "text-muted-2" : "text-ink"}`}>{menuName(d)}</span>
                      {d.soldOut && <span className="inline-flex h-6 items-center rounded-full bg-accent px-2 text-[11px] font-semibold text-cream">Tạm hết</span>}
                      <span className="flex gap-1">
                        {d.temps.map((t) => (
                          <span key={t} className={`inline-flex h-6 items-center gap-1 rounded-full px-2 text-[11px] font-semibold ${t === "hot" ? "bg-rose text-accent" : "bg-beige text-ink"}`}>
                            {t === "hot" ? <HotIcon /> : <IceIcon />}
                            {t === "hot" ? "Nóng" : "Đá"}
                          </span>
                        ))}
                      </span>
                    </div>
                    <span className="text-[14px] leading-[1.45] text-muted md:text-[15px]">{d.description}</span>
                  </div>
                  <DrinkPrice d={d} size={size} />
                </li>
              ))}
            </ul>
          </section>
        ))}

        {/* Ghi chú tuỳ chỉnh */}
        <div className="relative overflow-hidden rounded-[28px] bg-butter px-6 py-6 text-maroon md:px-9 md:py-7">
          <div className="flex flex-col gap-1.5">
            <strong className="font-display text-[24px] font-semibold leading-[1.15] md:text-[28px]">Uống theo cách của bạn</strong>
            <p className="m-0 text-[15px] font-medium leading-[1.5]">Ít ngọt, ít đá hay đổi sữa tươi – cứ nói với quầy khi gọi món. Nước được pha khi bạn tới, không pha sẵn.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
