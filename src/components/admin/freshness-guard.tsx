"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";

/** Moi trang tu lam moi toi da 1 lan / 20 giay (chong lap vo tan neu dong ho may khach lech) */
const lastAuto = new Map<string, number>();
const MIN_GAP_MS = 20_000;

/**
 * Trang mo tu bo nho tam (tai truoc qua menu / vua xem) hien NGAY, sau do neu du lieu da cu hon
 * maxAgeMs thi tu tai ban moi o nen – nguoi dung khong phai cho, ma van thay don / tin nhan moi.
 */
export function FreshnessGuard({ renderedAt, maxAgeMs = 15_000 }: { renderedAt: number; maxAgeMs?: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const [, start] = useTransition();

  useEffect(() => {
    const now = Date.now();
    if (now - renderedAt < maxAgeMs) return;
    if (now - (lastAuto.get(pathname) ?? 0) < MIN_GAP_MS) return;
    lastAuto.set(pathname, now);
    start(() => router.refresh());
  }, [renderedAt, maxAgeMs, pathname, router]);

  return null;
}
