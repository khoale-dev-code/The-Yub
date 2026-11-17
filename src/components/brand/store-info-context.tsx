"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { defaultStoreInfo, type StoreInfo } from "@/modules/settings/store-info";

const StoreInfoContext = createContext<StoreInfo>(defaultStoreInfo);

const KEYS = ["name", "phone", "openTime", "closeTime", "freshBatchTime"] as const;
const sameInfo = (a: StoreInfo, b: StoreInfo) => KEYS.every((k) => a[k] === b[k]);

const isStoreInfo = (v: unknown): v is StoreInfo => {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return KEYS.every((k) => typeof o[k] === "string") && /^\d{1,2}:\d{2}$/.test(String(o.openTime)) && /^\d{1,2}:\d{2}$/.test(String(o.closeTime));
};

/** Khoang cach toi thieu giua 2 lan kiem tra (quay lai tab nhieu lan khong goi lien tuc) */
const MIN_GAP_MS = 60_000;

/**
 * Dat o layout: dua thong tin tiem (ten, SDT, gio mo cua, me banh) xuong moi Client Component.
 * live = true (trang khach): sau khi trang tai xong va moi lan quay lai tab, hoi nhanh
 * /api/cua-hang – neu chu tiem vua doi gio trong Admin thi cap nhat ngay moi cho hien gio,
 * va lam moi phan noi dung tu may chu mot lan.
 */
export function StoreInfoProvider({ value, live = false, children }: { value: StoreInfo; live?: boolean; children: ReactNode }) {
  const [info, setInfo] = useState(value);
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  useEffect(() => setInfo(value), [value]);

  useEffect(() => {
    if (!live) return;
    let last = 0;
    let refreshed = false;
    let ctrl: AbortController | null = null;
    const check = async () => {
      if (document.visibilityState !== "visible" || Date.now() - last < MIN_GAP_MS) return;
      last = Date.now();
      ctrl?.abort();
      ctrl = new AbortController();
      try {
        const res = await fetch("/api/cua-hang", { cache: "no-store", signal: ctrl.signal });
        if (!res.ok) return;
        const next: unknown = await res.json();
        if (!isStoreInfo(next)) return;
        setInfo((cur) => {
          if (sameInfo(cur, next)) return cur;
          if (!refreshed) {
            refreshed = true;
            // Noi dung do may chu ve (vd tieu de co gio ra lo) cung lay ban moi
            window.setTimeout(() => routerRef.current.refresh(), 0);
          }
          return next;
        });
      } catch {
        // mat mang / huy: giu thong tin dang co
      }
    };
    // Doi trang ranh roi moi hoi, khong tranh tai voi luc tai trang
    const ric = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1200));
    const cancelRic = window.cancelIdleCallback ?? window.clearTimeout;
    const idle = ric(() => void check(), { timeout: 3000 });
    const onVisible = () => void check();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onVisible);
    return () => {
      cancelRic(idle);
      ctrl?.abort();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onVisible);
    };
  }, [live]);

  return <StoreInfoContext.Provider value={info}>{children}</StoreInfoContext.Provider>;
}

export const useStoreInfo = () => useContext(StoreInfoContext);
