"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { mergeFavoritesAction, toggleFavoriteAction } from "./actions";

/**
 * Trang thai khach + mon yeu thich phia trinh duyet.
 *  - Da dang nhap: danh sach lay tu ho so (server), bam tim -> luu vao ho so.
 *  - Chua dang nhap: luu sessionStorage -> con trong luc dang luot web, TAT trinh duyet la mat.
 *    Khi dang nhap, cac mon da tim duoc gop vao ho so roi xoa ban tam.
 */
const GUEST_KEY = "yub_fav_guest_v1";
const MAX_GUEST = 100;

interface CustomerState {
  ready: boolean;
  loggedIn: boolean;
  name: string;
  avatar: string | null;
  phone: string | null;
  favorites: string[];
}

interface CustomerContextValue extends CustomerState {
  isFavorite: (productId: string) => boolean;
  /** Tra ve trang thai moi (true = vua them) */
  toggleFavorite: (productId: string) => boolean;
  refresh: () => void;
}

const CustomerContext = createContext<CustomerContextValue | null>(null);

function readGuest(): string[] {
  try {
    const raw = window.sessionStorage.getItem(GUEST_KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === "string" && /^[\w-]{1,64}$/.test(x)).slice(0, MAX_GUEST) : [];
  } catch {
    return [];
  }
}
function writeGuest(ids: string[]) {
  try {
    if (ids.length) window.sessionStorage.setItem(GUEST_KEY, JSON.stringify(ids.slice(0, MAX_GUEST)));
    else window.sessionStorage.removeItem(GUEST_KEY);
  } catch {
    // Trinh duyet chan bo nho tam (che do rieng tu): van dung duoc trong trang hien tai
  }
}

/** Sau cac trang nay can hoi lai trang thai (vua dang nhap / dang xuat / xoa tai khoan) */
const REFRESH_ON = ["/", "/tai-khoan", "/yeu-thich"];

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CustomerState>({ ready: false, loggedIn: false, name: "", avatar: null, phone: null, favorites: [] });
  const pathname = usePathname();
  const loggedInRef = useRef(false);
  const seq = useRef(0);

  const load = useCallback(async () => {
    const my = ++seq.current;
    const guest = readGuest();
    try {
      const res = await fetch("/api/khach/trang-thai", { cache: "no-store", credentials: "same-origin" });
      const data = (await res.json()) as { loggedIn: boolean; name?: string; avatar?: string | null; phone?: string | null; favorites?: string[] };
      if (my !== seq.current) return;
      if (data.loggedIn) {
        let favorites = data.favorites ?? [];
        if (guest.length) {
          const merged = await mergeFavoritesAction(guest);
          if (merged.ok) {
            favorites = merged.ids;
            writeGuest([]);
          }
        }
        loggedInRef.current = true;
        setState({ ready: true, loggedIn: true, name: data.name ?? "", avatar: data.avatar ?? null, phone: data.phone ?? null, favorites });
      } else {
        loggedInRef.current = false;
        setState({ ready: true, loggedIn: false, name: "", avatar: null, phone: null, favorites: guest });
      }
    } catch {
      if (my === seq.current) setState((s) => ({ ...s, ready: true, favorites: s.loggedIn ? s.favorites : guest }));
    }
  }, []);

  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      void load();
      return;
    }
    if (REFRESH_ON.includes(pathname)) void load();
  }, [pathname, load]);

  const favRef = useRef<string[]>([]);
  favRef.current = state.favorites;

  const toggleFavorite = useCallback((productId: string) => {
    const cur = favRef.current;
    const on = !cur.includes(productId);
    const favorites = on ? [productId, ...cur] : cur.filter((x) => x !== productId);
    favRef.current = favorites;
    if (!loggedInRef.current) writeGuest(favorites);
    setState((s) => ({ ...s, favorites }));
    if (loggedInRef.current) {
      void toggleFavoriteAction(productId, on).then((r) => {
        if (!r.ok) {
          // Hoan tac neu luu that bai
          setState((s) => ({ ...s, favorites: on ? s.favorites.filter((x) => x !== productId) : [productId, ...s.favorites] }));
        }
      });
    }
    return on;
  }, []);

  const value = useMemo<CustomerContextValue>(
    () => ({ ...state, isFavorite: (id) => state.favorites.includes(id), toggleFavorite, refresh: () => void load() }),
    [state, toggleFavorite, load],
  );
  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>;
}

export function useCustomer(): CustomerContextValue {
  const v = useContext(CustomerContext);
  if (!v) throw new Error("useCustomer phải nằm trong CustomerProvider");
  return v;
}
