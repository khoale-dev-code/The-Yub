"use client";

import Link from "next/link";
import { useState } from "react";
import { formatVnd } from "@/lib/format";
import { storeConfig } from "@/lib/store-config";
import type { Drink } from "@/modules/products/types";
import { ArrowRightIcon } from "../ui/icons";

const tabs = [
  { id: "coffee", label: "Cà phê" },
  { id: "tea", label: "Trà & trái cây" },
  { id: "other", label: "Không cà phê" },
] as const;

type TabId = (typeof tabs)[number]["id"];

const inTab = (d: Drink, tab: TabId) => (tab === "other" ? d.group === "other" || d.group === "juice" : d.group === tab);

const tempLabel = { hot: "Nóng", ice: "Đá" } as const;

/** Bang menu toi (Home) – tab nhom do uong, ten Fraunces, dot leader, gia butter. */
export function DrinkBoard({ drinks, variant = "dark" }: { drinks: Drink[]; variant?: "dark" | "light" }) {
  const [tab, setTab] = useState<TabId>("coffee");
  const list = drinks.filter((d) => inTab(d, tab)).slice(0, variant === "light" ? 5 : 8);
  const idPrefix = `drink-${variant}`;

  if (variant === "light") {
    return (
      <div className="flex flex-col gap-4 rounded-3xl border border-maroon/12 bg-card px-[18px] py-5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="m-0 font-display text-[22px] font-semibold leading-[1.2]">Thực đơn đồ uống</h3>
          <span className="flex-none text-xs text-muted-2">{storeConfig.openHours}</span>
        </div>
        <div role="tablist" aria-label="Nhóm đồ uống" className="grid grid-cols-3 gap-1 rounded-full bg-beige p-1">
          {tabs.map((t) => (
            <button key={t.id} id={`${idPrefix}-tab-${t.id}`} type="button" role="tab" aria-selected={tab === t.id} aria-controls={`${idPrefix}-panel`} onClick={() => setTab(t.id)} className={`min-h-11 rounded-full border-0 px-1.5 text-[13px] font-semibold leading-[1.2] ${tab === t.id ? "bg-maroon text-cream" : "bg-transparent text-maroon"}`}>
              {t.label}
            </button>
          ))}
        </div>
        <ul id={`${idPrefix}-panel`} role="tabpanel" aria-labelledby={`${idPrefix}-tab-${tab}`} className="m-0 flex list-none flex-col p-0">
          {list.map((d) => (
            <li key={d.id} className="flex items-start justify-between gap-3.5 border-b border-dashed border-maroon/20 py-3.5">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="font-display text-lg font-semibold leading-[1.3]">{d.name}</span>
                <span className="text-[13px] leading-[1.45] text-muted-2">{d.description}</span>
                <span className="text-xs font-semibold text-accent">{d.temps.map((t) => tempLabel[t]).join(" · ")}</span>
              </div>
              <span className="flex-none font-display text-[17px] font-semibold leading-[1.3]">{formatVnd(d.priceMVnd)}</span>
            </li>
          ))}
        </ul>
        <p className="m-0 text-[13px] text-muted-2">Ít ngọt, ít đá, đổi sữa — ghi chú khi đặt.</p>
        <Link href="/do-uong" className="flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-maroon text-[15px] font-semibold text-cream no-underline hover:text-cream">
          Xem menu đầy đủ · {drinks.length} món <ArrowRightIcon />
        </Link>
      </div>
    );
  }

  return (
    <div className="relative flex min-w-0 flex-[1_1_520px] flex-col gap-7 overflow-hidden rounded-[28px] bg-dark px-6 pb-9 pt-9 text-cream sm:px-11 sm:pt-11">
      <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full opacity-20 mix-blend-overlay">
        <filter id="yub-grain-d"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves={2} stitchTiles="stitch" /></filter>
        <rect width="100%" height="100%" filter="url(#yub-grain-d)" />
      </svg>
      <div className="relative flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h3 className="m-0 font-display text-[32px] font-semibold leading-[1.2]">Thực đơn đồ uống</h3>
        <span className="text-[13px] text-cream/75">Mở cửa {storeConfig.openHours}</span>
      </div>
      <div role="tablist" aria-label="Nhóm đồ uống" className="relative flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            id={`${idPrefix}-tab-${t.id}`}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={`${idPrefix}-panel`}
            onClick={() => setTab(t.id)}
            className={`min-h-11 rounded-full border border-cream/40 px-[18px] text-sm font-semibold ${tab === t.id ? "bg-butter text-maroon" : "bg-transparent text-cream hover:border-butter"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <ul id={`${idPrefix}-panel`} role="tabpanel" aria-labelledby={`${idPrefix}-tab-${tab}`} className="relative m-0 flex list-none flex-col gap-[18px] p-0">
        {list.map((d) => (
          <li key={d.id} className="flex flex-col gap-1">
            <div className="flex items-baseline gap-3">
              <span className="font-display text-[22px] font-semibold leading-[1.25]">{d.name}</span>
              <span aria-hidden="true" className="min-w-6 min-w-0 flex-[1_1_24px] -translate-y-[5px] border-b-2 border-dotted border-cream/35" />
              <span className="whitespace-nowrap text-base font-bold text-butter">{formatVnd(d.priceMVnd)}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span className="text-sm text-cream/75">{d.description}</span>
              <span className="inline-flex gap-1.5">
                {d.temps.map((t) => (
                  <span key={t} className="rounded-full border border-butter/60 px-2.5 py-px text-xs text-butter">{tempLabel[t]}</span>
                ))}
              </span>
            </div>
          </li>
        ))}
      </ul>
      <div className="relative mt-auto flex flex-wrap items-center justify-between gap-x-5 gap-y-3.5 border-t border-cream/15 pt-5">
        <p className="m-0 min-w-0 flex-[1_1_220px] text-sm text-cream/75">Ít ngọt, ít đá, đổi sữa — ghi chú khi đặt hoặc nói với quầy.</p>
        <Link href="/do-uong" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-butter px-[22px] text-sm font-bold text-maroon no-underline hover:bg-cream hover:text-maroon">
          Xem menu đầy đủ <ArrowRightIcon />
        </Link>
      </div>
    </div>
  );
}
