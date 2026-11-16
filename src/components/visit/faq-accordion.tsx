"use client";

import gsap from "gsap";
import { useRef, useState } from "react";
import { animationsReduced } from "../motion/motion-config";

/** Hoi dap: mo / dong muot bang GSAP (chieu cao + do mo), dau "+" xoay thanh "×". */
export function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const panels = useRef<(HTMLDivElement | null)[]>([]);

  const toggle = (i: number) => {
    const next = open === i ? null : i;
    const animate = (idx: number, show: boolean) => {
      const el = panels.current[idx];
      if (!el) return;
      if (animationsReduced()) return void gsap.set(el, { height: show ? "auto" : 0, opacity: show ? 1 : 0 });
      gsap.to(el, { height: show ? "auto" : 0, opacity: show ? 1 : 0, duration: show ? 0.5 : 0.35, ease: show ? "expo.out" : "power2.inOut", overwrite: true, onComplete: () => window.dispatchEvent(new Event("resize")) });
    };
    if (open !== null) animate(open, false);
    if (next !== null) animate(next, true);
    setOpen(next);
  };

  return (
    <div data-reveal-stagger className="flex flex-col gap-2.5">
      {items.map((f, i) => {
        const on = open === i;
        return (
          <div key={f.q} className={`overflow-hidden rounded-[22px] border transition-colors duration-300 ${on ? "border-maroon/20 bg-card shadow-[0_18px_40px_-28px_rgba(59,15,18,0.5)]" : "border-maroon/10 bg-card/60 hover:bg-card"}`}>
            <h3 className="m-0">
              <button
                type="button"
                aria-expanded={on}
                aria-controls={`faq-${i}`}
                onClick={() => toggle(i)}
                className="flex min-h-[68px] w-full items-center justify-between gap-4 border-0 bg-transparent px-5 py-4 text-left text-[17px] font-semibold text-maroon md:px-6 md:text-lg"
              >
                {f.q}
                <span aria-hidden="true" className={`flex h-9 w-9 flex-none items-center justify-center rounded-full text-xl transition-[transform,background-color,color] duration-300 ${on ? "rotate-45 bg-maroon text-cream" : "bg-beige text-maroon"}`}>+</span>
              </button>
            </h3>
            <div
              id={`faq-${i}`}
              ref={(el) => {
                panels.current[i] = el;
              }}
              role="region"
              style={on ? undefined : { height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <p className="m-0 max-w-[720px] px-5 pb-5 text-[15px] leading-relaxed text-muted md:px-6 md:text-base">{f.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
