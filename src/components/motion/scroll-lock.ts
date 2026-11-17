"use client";

import type Lenis from "lenis";

const coarse = () => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

/**
 * Khoa cuon trang nen khi mo popup / menu / man chuyen trang.
 *
 * May tinh: dung Lenis (lenis.stop()).
 * Dien thoai: KHONG doi overflow cua <html> (lenis.stop() them overflow:clip) – tren iPhone
 * viec doi overflow lam thanh dia chi / thanh cong cu cua trinh duyet nhay ra-vao, khung nhin
 * doi chieu cao giua chung -> giat va de lai khoang trang o day man hinh. Thay vao do chan
 * cu vuot (touchmove) ngoai cac vung duoc phep cuon ([data-lenis-prevent] / [data-scroll-ok]).
 *
 * Tra ve ham mo khoa.
 */
export function freezeScroll(lenis: Lenis | null): () => void {
  if (!coarse()) {
    lenis?.stop();
    return () => lenis?.start();
  }
  const block = (e: TouchEvent) => {
    const target = e.target instanceof Element ? e.target : null;
    const area = target?.closest<HTMLElement>("[data-lenis-prevent], [data-scroll-ok]");
    if (area && (area.scrollHeight > area.clientHeight + 1 || area.scrollWidth > area.clientWidth + 1)) return;
    if (e.cancelable) e.preventDefault();
  };
  document.addEventListener("touchmove", block, { passive: false });
  return () => document.removeEventListener("touchmove", block);
}
