"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { StoryPhoto } from "@/lib/story-images";
import { Photo } from "./photo";

gsap.registerPlugin(ScrollTrigger);

export interface ProcessStep {
  n: string;
  title: string;
  text: string;
  photo: StoryPhoto;
}

/**
 * "Từ bột đến hộp quà" – kieu sticky storytelling:
 *  - May tinh (>=1024px): cot anh dinh (sticky) ben trai, anh doi theo buoc dang doc ben phai.
 *    Anh hien DUNG TI LE (khong cat), chuyen canh bang fade + zoom nhe.
 *  - Dien thoai: moi buoc kem anh cua no, xep doc.
 * Dung CSS sticky (khong pin cua GSAP) nen khong vo layout khi doi kich thuoc / chup man hinh.
 */
export function ProcessScroller({ steps }: { steps: ProcessStep[] }) {
  const [active, setActive] = useState(0);
  const list = useRef<HTMLOListElement | null>(null);

  useEffect(() => {
    const items = list.current ? Array.from(list.current.querySelectorAll<HTMLElement>("[data-step]")) : [];
    const triggers = items.map((el, i) =>
      ScrollTrigger.create({
        trigger: el,
        start: "top 55%",
        end: "bottom 55%",
        onToggle: (self) => self.isActive && setActive(i),
      }),
    );
    return () => triggers.forEach((t) => t.kill());
  }, [steps.length]);

  return (
    <div className="mx-auto max-w-[1200px] px-5 md:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4 pb-10 md:pb-14">
        <h2 className="m-0 max-w-[620px] text-balance font-display text-[36px] font-semibold leading-[1.06] tracking-[-0.015em] md:text-[clamp(44px,5vw,68px)]">Từ bột đến hộp quà</h2>
        <p className="m-0 max-w-[340px] text-[15px] text-cream/75">Mỗi chiếc bánh đi qua bốn chặng – cuộn xuống để theo từng chặng.</p>
      </div>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-20">
        {/* Cột ảnh dính – chỉ máy tính */}
        <div className="hidden lg:block">
          <div className="sticky top-[calc(var(--yub-header-h)+4vh)] flex h-[calc(92vh-var(--yub-header-h))] items-center justify-center">
            {steps.map((s, i) => (
              <div
                key={s.n}
                aria-hidden={i !== active}
                className={`absolute inset-0 flex items-center justify-center transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${i === active ? "scale-100 opacity-100" : "pointer-events-none scale-[0.96] opacity-0"}`}
              >
                <Image
                  src={s.photo.src}
                  width={s.photo.width}
                  height={s.photo.height}
                  alt={s.photo.alt}
                  sizes="(min-width: 1024px) 560px, 1px"
                  className="h-auto max-h-full w-auto max-w-full rounded-[26px] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.55)]"
                />
              </div>
            ))}
            <span className="absolute -left-3 top-6 z-10 flex h-16 w-16 items-center justify-center rounded-full bg-butter font-display text-2xl font-semibold text-maroon shadow-[0_12px_24px_rgba(0,0,0,0.3)]">
              {steps[active]?.n}
            </span>
          </div>
        </div>

        {/* Các bước */}
        <ol ref={list} className="relative m-0 list-none p-0">
          <span aria-hidden="true" className="absolute bottom-0 left-0 top-0 hidden w-[2px] bg-cream/12 lg:block" />
          <span aria-hidden="true" data-scrub-line className="absolute bottom-0 left-0 top-0 hidden w-[2px] bg-butter lg:block" />
          {steps.map((s, i) => (
            <li
              key={s.n}
              data-step
              className={`flex flex-col gap-5 pb-16 last:pb-0 lg:min-h-[calc(92vh-var(--yub-header-h))] lg:justify-center lg:pb-0 lg:pl-12 lg:transition-opacity lg:duration-500 ${i === active ? "lg:opacity-100" : "lg:opacity-35"}`}
            >
              <Photo photo={s.photo} sizes="100vw" className="lg:hidden" rounded="rounded-[22px]" />
              <span className="font-display text-[56px] font-semibold leading-none text-butter md:text-[72px]">{s.n}</span>
              <h3 className="m-0 font-display text-[30px] font-semibold leading-[1.1] md:text-[40px]">{s.title}</h3>
              <p className="m-0 max-w-[440px] text-base text-cream/80 md:text-lg">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
