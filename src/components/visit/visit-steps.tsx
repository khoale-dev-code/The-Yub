"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, useRef } from "react";
import { animationsReduced } from "../motion/motion-config";

gsap.registerPlugin(ScrollTrigger);

/**
 * 4 buoc dat & nhan banh: duong tien do "ve" theo cuon (Lenis + ScrollTrigger),
 * moi buoc sang len khi duong chay toi. May tinh: ngang; dien thoai: doc.
 */
export function VisitSteps({ steps }: { steps: { n: string; title: string; text: string }[] }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const items = gsap.utils.toArray<HTMLElement>("[data-step]", el);
    const light = (p: number) => items.forEach((it, i) => it.classList.toggle("is-on", p >= i / items.length - 0.001));
    if (animationsReduced()) return void light(1);
    const mm = gsap.matchMedia();
    mm.add({ desk: "(min-width: 768px)", mob: "(max-width: 767.98px)" }, (ctx) => {
      const desk = Boolean(ctx.conditions?.desk);
      const fill = el.querySelector(desk ? "[data-line-x]" : "[data-line-y]");
      gsap.fromTo(
        fill,
        desk ? { scaleX: 0 } : { scaleY: 0 },
        {
          ...(desk ? { scaleX: 1 } : { scaleY: 1 }),
          ease: "none",
          scrollTrigger: { trigger: el, start: "top 75%", end: desk ? "bottom 55%" : "bottom 70%", scrub: 0.5, onUpdate: (st) => light(st.progress) },
        },
      );
      gsap.from(items, { y: 40, opacity: 0, duration: 0.9, ease: "expo.out", stagger: 0.1, scrollTrigger: { trigger: el, start: "top 85%", once: true } });
    });
    return () => mm.revert();
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Duong tien do */}
      <span aria-hidden="true" className="absolute left-[27px] top-2 bottom-2 w-[2px] bg-maroon/12 md:left-0 md:right-0 md:top-[27px] md:bottom-auto md:h-[2px] md:w-auto" />
      <span aria-hidden="true" data-line-y className="absolute bottom-2 left-[27px] top-2 w-[2px] origin-top bg-butter md:hidden" />
      <span aria-hidden="true" data-line-x className="absolute left-0 right-0 top-[27px] hidden h-[2px] origin-left bg-butter md:block" />
      <ol className="relative m-0 grid list-none gap-8 p-0 md:grid-cols-4 md:gap-6">
        {steps.map((s) => (
          <li key={s.n} data-step className="group flex gap-4 md:flex-col">
            <span className="flex h-14 w-14 flex-none items-center justify-center rounded-full border-2 border-maroon/15 bg-page font-display text-xl font-semibold text-muted transition-[background-color,border-color,color,transform] duration-500 group-[.is-on]:scale-105 group-[.is-on]:border-butter group-[.is-on]:bg-butter group-[.is-on]:text-maroon">
              {s.n}
            </span>
            <span className="flex flex-col gap-1.5 pt-1 md:pt-0">
              <strong className="text-lg">{s.title}</strong>
              <span className="text-[15px] text-muted">{s.text}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
