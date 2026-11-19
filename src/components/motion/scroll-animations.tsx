"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { motionOkQuery } from "./motion-config";

gsap.registerPlugin(ScrollTrigger, SplitText);

const EASE = "expo.out";

/**
 * Hieu ung khi cuon (cam hung lenis.dev), gan bang data-attribute:
 *  - Tu dong: <section> cap 1 trong <main> nam duoi man hinh dau "troi len" khi cuon toi (bo qua: data-no-reveal).
 *  - Tu dong: moi <h2> trong <main> hien tung dong chu truot len tu mat na (bo qua: data-no-split).
 *  - data-split            : ap dung hieu ung tach dong cho phan tu bat ky.
 *  - data-reveal           : fade-up rieng mot phan tu.
 *  - data-reveal-stagger   : cac con truc tiep xuat hien lan luot.
 *  - data-reveal-image     : anh "mo man" tu duoi len + thu nho tu 1.15 ve 1 (anh cuoi cung KHONG bi cat).
 *  - data-parallax="0.15"  : phan tu troi lech so voi trang (dich chuyen ca khung, khong cat anh).
 *  - data-scroll-x="-30"   : chay ngang theo cuon (xPercent), dung cho dai chu lon.
 *  - data-scrub-line(="x") : duong ke "ve" dan theo tien do cuon.
 * Phan tu dang nam trong man hinh luc tai trang KHONG an di (tranh nhay noi dung).
 */
export function ScrollAnimations() {
  const pathname = usePathname();

  useEffect(() => {
    const mm = gsap.matchMedia();

    mm.add(motionOkQuery, (ctx) => {
      const inView = (el: Element) =>
        el.getBoundingClientRect().top < window.innerHeight * 0.92;
      const splits: SplitText[] = [];

      // 1) Section tu dong
      gsap.utils
        .toArray<HTMLElement>("main section")
        .filter(
          (s) =>
            !s.hasAttribute("data-no-reveal") &&
            !s.parentElement?.closest("section") &&
            !inView(s),
        )
        .forEach((section) => {
          const target =
            section.children.length === 1
              ? (section.children[0] as HTMLElement)
              : section;
          gsap.from(target, {
            y: 60,
            opacity: 0,
            duration: 1.2,
            ease: EASE,
            scrollTrigger: { trigger: section, start: "top 88%", once: true },
          });
        });

      // 2) Headings: keep the same line-reveal animation, but defer expensive
      // SplitText DOM measurements until each heading is near the viewport.
      // This is homepage-only; other routes retain their existing setup.
      let alive = true;
      let headingObserver: IntersectionObserver | null = null;
      const splitOne = (el: HTMLElement) => {
        if (!alive || !el.isConnected || el.offsetParent === null) return;
        ctx.add(() => {
          if (!alive || !el.isConnected) return;
          const split = SplitText.create(el, {
            type: "lines",
            mask: "lines",
            linesClass: "yub-line",
          });
          splits.push(split);
          gsap.from(split.lines, {
            yPercent: 110,
            duration: 1.15,
            ease: EASE,
            stagger: 0.09,
            scrollTrigger: { trigger: el, start: "top 90%", once: true },
            onComplete: () => split.revert(),
          });
        });
      };
      const splitHeadings = () => {
        if (!alive) return;
        const pending = gsap.utils
          .toArray<HTMLElement>("main h2, [data-split]")
          .filter((el) => !el.closest("[data-no-split]") && !inView(el) && el.offsetParent !== null);
        if (pathname === "/" && typeof IntersectionObserver !== "undefined") {
          // Prepare ~500px ahead: no initial offscreen DOM split / extra layout.
          headingObserver = new IntersectionObserver(
            (entries) => {
              for (const entry of entries) {
                if (!entry.isIntersecting) continue;
                headingObserver?.unobserve(entry.target);
                splitOne(entry.target as HTMLElement);
              }
            },
            { rootMargin: "500px 0px 500px 0px", threshold: 0 },
          );
          pending.forEach((el) => headingObserver?.observe(el));
        } else {
          pending.forEach(splitOne);
        }
      };
      if (document.fonts?.status === "loaded") splitHeadings();
      else void document.fonts.ready.then(() => splitHeadings());

      // 3) Phan tu le
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        if (inView(el)) return;
        gsap.from(el, {
          y: 48,
          opacity: 0,
          duration: 1.1,
          ease: EASE,
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
        });
      });

      // 4) Lan luot
      gsap.utils
        .toArray<HTMLElement>("[data-reveal-stagger]")
        .forEach((group) => {
          const items = Array.from(group.children);
          if (items.length === 0 || inView(group)) return;
          gsap.from(items, {
            y: 44,
            opacity: 0,
            duration: 1,
            ease: EASE,
            stagger: 0.1,
            scrollTrigger: { trigger: group, start: "top 88%", once: true },
          });
        });

      // 5) Anh mo man
      // Dien thoai: clip-path bat ve lai ca anh moi khung hinh -> dung truot + mo dan (chay tren GPU)
      const lite = window.matchMedia(
        "(max-width: 767.98px), (pointer: coarse)",
      ).matches;
      gsap.utils.toArray<HTMLElement>("[data-reveal-image]").forEach((wrap) => {
        if (inView(wrap)) return;
        const img = wrap.querySelector("img");
        const tl = gsap.timeline({
          scrollTrigger: { trigger: wrap, start: "top 92%", once: true },
        });
        if (lite)
          tl.fromTo(
            wrap,
            { y: 48, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 1,
              ease: EASE,
              clearProps: "transform,opacity",
            },
          );
        else
          tl.fromTo(
            wrap,
            { clipPath: "inset(100% 0% 0% 0%)" },
            {
              clipPath: "inset(0% 0% 0% 0%)",
              duration: 1.3,
              ease: "expo.inOut",
              clearProps: "clipPath",
            },
          );
        if (img)
          tl.fromTo(
            img,
            { scale: 1.15 },
            { scale: 1, duration: 1.6, ease: EASE, clearProps: "transform" },
            0,
          );
      });

      // 6) Parallax (dich chuyen ca khung)
      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
        const amount = Number(el.dataset.parallax) || 0.12;
        gsap.fromTo(
          el,
          { yPercent: -amount * 50 },
          {
            yPercent: amount * 50,
            ease: "none",
            scrollTrigger: {
              trigger: el.parentElement ?? el,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      });

      // 7) Chu chay ngang theo cuon
      gsap.utils.toArray<HTMLElement>("[data-scroll-x]").forEach((el) => {
        const to = Number(el.dataset.scrollX) || -25;
        gsap.fromTo(
          el,
          { xPercent: to > 0 ? -to : 0 },
          {
            xPercent: to > 0 ? 0 : to,
            ease: "none",
            scrollTrigger: {
              trigger: el.parentElement ?? el,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.4,
            },
          },
        );
      });

      // 8) Duong ke ve theo cuon
      gsap.utils.toArray<HTMLElement>("[data-scrub-line]").forEach((el) => {
        const horizontal = el.dataset.scrubLine === "x";
        gsap.fromTo(el, horizontal ? { scaleX: 0 } : { scaleY: 0 }, {
          ...(horizontal ? { scaleX: 1 } : { scaleY: 1 }),
          ease: "none",
          transformOrigin: horizontal ? "0% 50%" : "50% 0%",
          scrollTrigger: {
            trigger: el.parentElement ?? el,
            start: "top 70%",
            end: "bottom 60%",
            scrub: 0.6,
          },
        });
      });

      return () => {
        alive = false;
        headingObserver?.disconnect();
        splits.forEach((s) => s.revert());
      };
    });

    // Batch refreshes after *real* document-size changes (images/fonts/products).
    // ScrollTrigger already handles native resize/scroll; avoid redundant refreshes
    // for the initial ResizeObserver delivery or sub-pixel layout noise.
    let t: ReturnType<typeof setTimeout> | undefined;
    let lastWidth = document.documentElement.clientWidth;
    let lastHeight = Math.round(document.body.scrollHeight);
    const scheduleRefresh = () => {
      const width = document.documentElement.clientWidth;
      const height = Math.round(document.body.scrollHeight);
      if (Math.abs(height - lastHeight) < 2 && width === lastWidth) return;
      lastWidth = width;
      lastHeight = height;
      clearTimeout(t);
      if (!document.hidden) {
        t = setTimeout(() => ScrollTrigger.refresh(true), 240);
      }
    };
    const ro = new ResizeObserver(scheduleRefresh);
    ro.observe(document.body);
    const onVisible = () => {
      if (!document.hidden) scheduleRefresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearTimeout(t);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisible);
      mm.revert();
    };
  }, [pathname]);

  return null;
}
