"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_SLOT_ID } from "@/lib/pickup";

export interface CartLine {
  productId: string;
  /** Quy cach (vd "box4"). Khong co = san pham ban le 1 phan */
  variantId?: string;
  qty: number;
}

export interface PickupChoice {
  /** yyyy-mm-dd, "" = chua chon */
  date: string;
  slotId: string;
}

interface CartState {
  lines: CartLine[];
  pickup: PickupChoice;
}

type CartAction =
  | { type: "hydrate"; state: CartState }
  | { type: "add"; productId: string; variantId?: string; qty: number }
  | { type: "setQty"; key: string; qty: number }
  | { type: "remove"; key: string }
  | { type: "setPickup"; pickup: Partial<PickupChoice> }
  | { type: "clear" }
  | { type: "prune"; valid: (line: CartLine) => boolean };

const STORAGE_KEY = "yub.cart.v2";
const MAX_QTY = 20;

const clampQty = (qty: number) => Math.max(1, Math.min(MAX_QTY, Math.round(qty)));

export const lineKey = (line: Pick<CartLine, "productId" | "variantId">) =>
  line.variantId ? `${line.productId}::${line.variantId}` : line.productId;

const emptyState: CartState = { lines: [], pickup: { date: "", slotId: DEFAULT_SLOT_ID } };

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "hydrate":
      return action.state;
    case "add": {
      const key = lineKey(action);
      const existing = state.lines.find((l) => lineKey(l) === key);
      if (existing) {
        return {
          ...state,
          lines: state.lines.map((l) =>
            lineKey(l) === key ? { ...l, qty: clampQty(l.qty + action.qty) } : l,
          ),
        };
      }
      const line: CartLine = { productId: action.productId, qty: clampQty(action.qty) };
      if (action.variantId) line.variantId = action.variantId;
      return { ...state, lines: [...state.lines, line] };
    }
    case "setQty":
      return {
        ...state,
        lines: state.lines.map((l) => (lineKey(l) === action.key ? { ...l, qty: clampQty(action.qty) } : l)),
      };
    case "remove":
      return { ...state, lines: state.lines.filter((l) => lineKey(l) !== action.key) };
    case "setPickup":
      return { ...state, pickup: { ...state.pickup, ...action.pickup } };
    case "clear":
      return { ...state, lines: [] };
    case "prune": {
      const lines = state.lines.filter(action.valid);
      return lines.length === state.lines.length ? state : { ...state, lines };
    }
  }
}

interface CartContextValue {
  /** true khi da doc xong gio hang tu localStorage (tranh nhay UI luc tai trang) */
  ready: boolean;
  lines: CartLine[];
  count: number;
  pickup: PickupChoice;
  add: (productId: string, qty?: number, variantId?: string) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  setPickup: (pickup: Partial<PickupChoice>) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function isCartLine(value: unknown): value is CartLine {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.productId === "string" &&
    typeof v.qty === "number" &&
    v.qty > 0 &&
    (v.variantId === undefined || typeof v.variantId === "string")
  );
}

function parseStored(raw: string): CartState | null {
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== "object" || parsed === null) return null;
  const p = parsed as Record<string, unknown>;
  const lines = Array.isArray(p.lines) ? p.lines.filter(isCartLine).slice(0, 50) : [];
  const pk = (typeof p.pickup === "object" && p.pickup !== null ? p.pickup : {}) as Record<string, unknown>;
  return {
    lines,
    pickup: {
      date: typeof pk.date === "string" ? pk.date : "",
      slotId: typeof pk.slotId === "string" ? pk.slotId : DEFAULT_SLOT_ID,
    },
  };
}

/** Mon dang ban (va quy cach hop le) – de bo cac dong gio hang cu khong con ton tai */
export type CartCatalogIds = Record<string, { variants?: Record<string, number> }>;

/**
 * Gio hang = client state + localStorage (tien ich per-device).
 * Gia KHONG luu o day – server tinh lai gia tu repository khi tao don.
 * `catalog`: danh sach mon hien co. Dong nao tro toi mon da xoa / an / doi ma (vd du lieu cu
 * luc chay thu, truoc khi chuyen sang Supabase) se tu bi bo -> so tren icon gio luon khop trang gio hang.
 */
export function CartProvider({ children, catalog }: { children: ReactNode; catalog?: CartCatalogIds }) {
  const [state, dispatch] = useReducer(reducer, emptyState);
  const hydrated = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const restored = raw ? parseStored(raw) : null;
      if (restored) dispatch({ type: "hydrate", state: restored });
    } catch {
      // storage khong kha dung – bo qua
    }
    hydrated.current = true;
    setReady(true);
  }, []);

  useEffect(() => {
    // Danh muc rong (loi tai du lieu) -> khong xoa gi, tranh mat gio hang cua khach
    if (!ready || !catalog || Object.keys(catalog).length === 0) return;
    dispatch({
      type: "prune",
      valid: (l) => {
        const p = catalog[l.productId];
        if (!p) return false;
        return !l.variantId || Boolean(p.variants && l.variantId in p.variants);
      },
    });
  }, [ready, catalog, state.lines.length]);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // bo qua
    }
  }, [state]);

  const value = useMemo<CartContextValue>(
    () => ({
      ready,
      lines: state.lines,
      pickup: state.pickup,
      count: state.lines.reduce((sum, l) => sum + l.qty, 0),
      add: (productId, qty = 1, variantId) => dispatch({ type: "add", productId, qty, variantId }),
      setQty: (key, qty) => dispatch({ type: "setQty", key, qty }),
      remove: (key) => dispatch({ type: "remove", key }),
      setPickup: (pickup) => dispatch({ type: "setPickup", pickup }),
      clear: () => dispatch({ type: "clear" }),
    }),
    [state, ready],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart phải dùng bên trong <CartProvider>.");
  return ctx;
}
