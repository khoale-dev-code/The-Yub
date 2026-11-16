"use client";

import "lenis/dist/lenis.css";
import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const AdminLenisContext = createContext<Lenis | null>(null);

/** Lenis cua trang quan ly (dung de dung cuon khi mo menu). */
export const useAdminLenis = () => useContext(AdminLenisContext);

/**
 * Cuon muot cho Admin – CHI tren may co chuot/touchpad (pointer: fine).
 * Dien thoai giu cuon native cua he dieu hanh (nhanh va on dinh nhat).
 * lerp cao hon trang khach mot chut: muot nhung van "an tay" khi thao tac nhieu.
 * Vung cuon rieng (bang, danh sach, menu) tu duoc nhan dien (allowNestedScroll)
 * hoac danh dau data-lenis-prevent.
 */
export function AdminSmoothScroll({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const instance = new Lenis({ autoRaf: true, lerp: 0.14, smoothWheel: true, anchors: true, allowNestedScroll: true });
    setLenis(instance);
    return () => {
      instance.destroy();
      setLenis(null);
    };
  }, []);

  // Doi trang -> ve dau trang ngay
  useEffect(() => {
    lenis?.scrollTo(0, { immediate: true, force: true });
  }, [pathname, lenis]);

  return <AdminLenisContext.Provider value={lenis}>{children}</AdminLenisContext.Provider>;
}
