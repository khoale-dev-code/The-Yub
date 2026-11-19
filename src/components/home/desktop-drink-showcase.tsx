"use client";

// TheYub-Desktop-Drink-Hover-V3-Sharp-Fast
// Desktop homepage only. The existing DrinkBoard remains on mobile/tablets.
import gsap from "gsap";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useStoreInfo } from "@/components/brand/store-info-context";
import { animationsReduced } from "@/components/motion/motion-config";
import { formatVnd } from "@/lib/format";
import type { Category } from "@/modules/categories/types";
import type { Drink } from "@/modules/products/types";

const photos = {
  black: "/images/drinks/coffee-black-hq.webp",
  milk: "/images/drinks/coffee-milk-hq.webp",
  bacXiu: "/images/drinks/bac-xiu-hq.webp",
  salt: "/images/drinks/coffee-salt-hq.webp",
  coconut: "/images/drinks/coffee-coconut-hq.webp",
  americano: "/images/drinks/americano-hq.webp",
  latte: "/images/drinks/latte-hq.webp",
  cappuccino: "/images/drinks/cappuccino-hq.webp",
  general: "/images/hero/drinks-desktop.jpg",
} as const;

function plainName(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").toLowerCase();
}

/** Illustrative photos supplied by the shop, not database-backed product photography. */
function photoOf(drink: Drink): string {
  const name = plainName(drink.name);
  const id = plainName(drink.id);
  if (name.includes("matcha") || name.includes("tra ") || name.includes("sinh to")) return photos.general;
  if (name.includes("bac xiu") || id.includes("bac-xiu")) return photos.bacXiu;
  if (name.includes("cot dua") || id.includes("cot-dua")) return photos.coconut;
  if (name.includes("ca phe muoi") || name.includes("cafe muoi") || id.includes("cafe-muoi")) return photos.salt;
  if (name.includes("cappuccino")) return photos.cappuccino;
  if (name.includes("americano")) return photos.americano;
  if (name.includes("latte")) return photos.latte;
  if (name.includes("ca phe den") || name.includes("cafe den") || id.includes("cafe-den")) return photos.black;
  if (name.includes("ca phe sua") || name.includes("cafe sua") || id.includes("cafe-sua")) return photos.milk;
  return photos.general;
}

export function DesktopDrinkShowcase({ drinks, groups }: { drinks: Drink[]; groups: Category[] }) {
  const store = useStoreInfo();
  const seenGroups = groups.filter((group) => drinks.some((drink) => drink.group === group.slug));
  const unlisted = Array.from(new Set(drinks.map((drink) => drink.group)))
    .filter((id) => !seenGroups.some((group) => group.slug === id))
    .map((id) => ({ slug: id, name: id }));
  const tabs = [...seenGroups, ...unlisted];

  const [chosenGroup, setChosenGroup] = useState<string | null>(null);
  const currentGroup = tabs.some((tab) => tab.slug === chosenGroup) ? chosenGroup : tabs[0]?.slug;
  const inGroup = drinks.filter((drink) => drink.group === currentGroup);
  const shown = inGroup.slice(0, 8); // Homepage teaser, complete list lives at /do-uong.
  const [chosenDrinkId, setChosenDrinkId] = useState<string | null>(null);
  const highlighted = shown.find((drink) => drink.id === chosenDrinkId) ?? shown.find((drink) => photoOf(drink) === photos.milk) ?? shown[0] ?? null;
  const [size, setSize] = useState<"M" | "L">("M");
  const hasLarge = inGroup.some((drink) => drink.priceLVnd !== null);
  const visibleSize = hasLarge ? size : "M";
  const photo = highlighted ? photoOf(highlighted) : photos.general;
  // Keep the previous image visible until the new on-demand photo has fully loaded.
  const [displayedPhoto, setDisplayedPhoto] = useState<string>(photo);
  const photoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = photoRef.current;
    if (!element || animationsReduced()) return;
    // Opacity only: no scaling or blur applied to the sharp photograph.
    const tween = gsap.fromTo(
      element,
      { opacity: 0.82 },
      { opacity: 1, duration: 0.28, ease: "power2.out", overwrite: true },
    );
    return () => { tween.kill(); };
  }, [displayedPhoto]);

  const changeGroup = (id: string) => {
    setChosenGroup(id);
    setChosenDrinkId(null);
  };

  if (!drinks.length || !tabs.length) {
    return (
      <div className="hidden rounded-[28px] bg-dark px-8 py-12 text-cream lg:block">
        <p className="m-0 text-lg">Quầy nước đang cập nhật thực đơn.</p>
        <Link href="/do-uong" className="mt-4 inline-flex text-butter">Xem thông tin đồ uống</Link>
      </div>
    );
  }

  return (
    <div data-no-reveal className="hidden min-w-0 grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] items-stretch gap-5 lg:grid xl:grid-cols-[minmax(0,0.84fr)_minmax(0,1.16fr)] xl:gap-7">
      {/* Crisp single-photo viewer: CSS ambience, no second blurred image decode. */}
      <figure className="relative m-0 flex min-h-[556px] min-w-0 flex-col overflow-hidden rounded-[26px] bg-[#ecdcc8] ring-1 ring-maroon/10 shadow-[0_18px_42px_rgba(69,34,25,0.12)] xl:min-h-[590px]">
        <div className="relative isolate flex min-h-[420px] flex-1 items-stretch justify-stretch overflow-hidden bg-[#e2cdb7] p-0 xl:min-h-[450px]">
          <span className="pointer-events-none absolute left-5 top-5 z-20 rounded-full border border-white/60 bg-[#fbf3e3]/90 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.17em] text-maroon shadow-sm xl:left-7 xl:top-7">
            The Yub · Coffee bar
          </span>
          <div ref={photoRef} className="absolute inset-0 z-10" aria-busy={displayedPhoto !== photo}>
            <Image
              key={`visible-${displayedPhoto}`}
              src={displayedPhoto}
              alt={highlighted ? `Ảnh minh hoạ cho ${highlighted.name}` : "Ảnh minh hoạ quầy đồ uống"}
              fill
              sizes="(min-width: 1280px) 540px, (min-width: 1024px) 48vw, 1px"
              quality={86}
              unoptimized={displayedPhoto !== photos.general}
              loading="lazy"
              decoding="async"
              className="object-cover object-center"
            />
            {photo !== displayedPhoto ? (
              <Image
                key={`incoming-${photo}`}
                src={photo}
                alt=""
                aria-hidden="true"
                fill
                sizes="(min-width: 1280px) 540px, (min-width: 1024px) 48vw, 1px"
                quality={86}
                unoptimized={photo !== photos.general}
                loading="lazy"
                decoding="async"
                className="pointer-events-none object-cover object-center opacity-0"
                onLoad={() => setDisplayedPhoto(photo)}
                onError={() => setDisplayedPhoto(photos.general)}
              />
            ) : null}
          </div>
        </div>
        <figcaption className="relative z-10 flex min-h-[126px] flex-col justify-center gap-1.5 border-t border-maroon/10 bg-[#f7ecdc] px-6 py-4 text-maroon xl:px-7" aria-live="polite" aria-atomic="true">
          <span className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#875b3e]">Pha theo từng ly · Ảnh minh hoạ</span>
          <strong className="font-display text-[clamp(27px,2.7vw,38px)] font-semibold leading-[1.12]">
            {highlighted?.name ?? "Một chút cà phê"}
          </strong>
          <p className="m-0 line-clamp-2 text-[13px] leading-relaxed text-maroon/75 xl:text-[14px]">{highlighted?.description ?? "Pha khi bạn ghé tiệm."}</p>
          <span className="mt-1 inline-flex items-center gap-2 text-[11px] font-semibold text-maroon/65">
            <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#b87934]" />
            Rê chuột hoặc chọn tên món để đổi ảnh
          </span>
        </figcaption>
      </figure>

      <div className="relative flex min-w-0 flex-col overflow-hidden rounded-[30px] bg-dark p-6 text-cream xl:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[url('/images/brand/grain.png')] bg-[length:160px_160px] opacity-40" />
        <div className="relative flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="m-0 mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-butter">Menu của quầy</p>
            <h3 className="m-0 font-display text-[28px] font-semibold leading-tight xl:text-[32px]">Thực đơn đồ uống</h3>
          </div>
          <span className="mb-1 whitespace-nowrap text-[11px] text-cream/70">{store.openHours}</span>
        </div>

        <div className="relative mt-5 flex min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-3 border-b border-cream/15 pb-4">
          <div role="tablist" aria-label="Nhóm đồ uống" className="no-scrollbar flex min-w-0 max-w-full flex-1 gap-1.5 overflow-x-auto pr-1">
            {tabs.map((tab) => (
              <button
                key={tab.slug}
                id={`yub-preview-tab-${tab.slug}`}
                type="button"
                role="tab"
                aria-selected={currentGroup === tab.slug}
                aria-controls="yub-preview-drinks"
                onClick={() => changeGroup(tab.slug)}
                className={`min-h-9 shrink-0 rounded-full border px-3 text-[11px] font-semibold leading-tight transition-[background-color,border-color,color] duration-200 focus-visible:outline-butter xl:px-3.5 ${currentGroup === tab.slug ? "border-butter bg-butter text-maroon" : "border-cream/30 bg-transparent text-cream/85 hover:border-butter hover:text-butter"}`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        <div className="relative mt-3 flex items-center justify-between gap-3">
          <p className="m-0 text-[11px] text-cream/60">Giá theo kích thước</p>
          {hasLarge ? (
            <div role="group" aria-label="Chọn size xem giá đồ uống" className="flex rounded-full border border-cream/20 bg-cream/[0.06] p-1">
              {(["M", "L"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={visibleSize === option}
                  aria-label={`Xem giá size ${option}`}
                  onClick={() => setSize(option)}
                  className={`min-h-8 min-w-11 rounded-full px-2 text-[12px] font-bold transition-colors duration-200 focus-visible:outline-butter ${visibleSize === option ? "bg-butter text-maroon" : "bg-transparent text-cream/80 hover:text-white"}`}
                >
                  {option}
                </button>
              ))}
            </div>
          ) : (
            <span className="text-[11px] font-semibold text-cream/70">Chỉ size M</span>
          )}
        </div>

        <ul id="yub-preview-drinks" role="tabpanel" aria-labelledby={currentGroup ? `yub-preview-tab-${currentGroup}` : undefined} className="relative m-0 mt-2 flex list-none flex-col p-0">
          {shown.map((drink, index) => {
            const active = highlighted?.id === drink.id;
            const hasThisLarge = drink.priceLVnd !== null;
            const price = visibleSize === "L" && hasThisLarge ? drink.priceLVnd! : drink.priceMVnd;
            return (
              <li key={drink.id} className="border-b border-cream/10 last:border-0">
                <button
                  type="button"
                  aria-pressed={active}
                  aria-label={`Xem ảnh minh hoạ ${drink.name}, ${formatVnd(price)}${drink.soldOut ? ", tạm hết" : ""}`}
                  onPointerEnter={(event) => {
                    if (event.pointerType === "mouse" || event.pointerType === "pen") setChosenDrinkId(drink.id);
                  }}
                  onFocus={() => setChosenDrinkId(drink.id)}
                  onClick={() => setChosenDrinkId(drink.id)}
                  className={`group -mx-2 grid min-h-[57px] w-[calc(100%+16px)] grid-cols-[23px_minmax(0,1fr)_auto] items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors duration-200 focus-visible:outline-butter ${active ? "bg-cream/[0.085]" : "hover:bg-cream/[0.05]"}`}
                >
                  <span className={`self-start pt-1 text-[10px] font-semibold tabular-nums ${active ? "text-butter" : "text-cream/40"}`}>{String(index + 1).padStart(2, "0")}</span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className={`font-display text-[17px] font-semibold leading-tight transition-colors xl:text-[18px] ${drink.soldOut ? "text-cream/50" : active ? "text-butter" : "text-cream group-hover:text-butter"}`}>
                      {drink.name}
                    </span>
                    <span className="line-clamp-1 text-[11px] leading-snug text-cream/65">{drink.description}</span>
                    <span className="flex flex-wrap items-center gap-1.5 text-[10px] font-medium text-cream/65">
                      {drink.soldOut ? <span className="text-butter">Tạm hết</span> : drink.temps.map((temp) => (
                        <span key={temp}>{temp === "hot" ? "Nóng" : "Đá"}</span>
                      ))}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-0.5 pl-1 text-right">
                    <span key={`${drink.id}-${visibleSize}`} className="whitespace-nowrap text-[14px] font-bold tabular-nums text-butter xl:text-[15px]">{formatVnd(price)}</span>
                    {visibleSize === "L" && !hasThisLarge && <span className="text-[10px] text-cream/55">Chỉ M</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="relative mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-cream/15 pt-4">
          <p className="m-0 max-w-[240px] text-[11px] leading-relaxed text-cream/65">
            {inGroup.length > shown.length ? `Đang xem ${shown.length}/${inGroup.length} món. ` : ""}
            Ít ngọt, ít đá, đổi sữa: ghi chú khi đặt hoặc nói với quầy.
          </p>
          <Link href="/do-uong" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-butter px-4 text-[12px] font-bold text-maroon no-underline transition-transform hover:-translate-y-0.5 hover:bg-cream hover:text-maroon focus-visible:outline-butter">
            Xem menu đầy đủ <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
