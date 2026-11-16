import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { ConsentPurpose } from "./consent";
import type { Customer, CustomerSummary } from "./types";

/**
 * Du lieu khach hang. Chi goi tu server SAU KHI da xac thuc phien (khach) hoac quyen (Admin).
 * Supabase: bang customer_accounts / customer_favorites / customer_consents (RLS bat, khong co policy cong khai
 * -> chi service role o server doc ghi duoc). Chua co Supabase: luu tam trong bo nho (npm run dev).
 */

export interface LoginProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
}

export interface ConsentRecord {
  version: string;
  marketing: boolean;
  /** ISO time luc khach tick dong y */
  at: string;
}

export interface ProfilePatch {
  fullName: string;
  phone: string | null;
  address: string | null;
}

export class CustomersNotReadyError extends Error {
  constructor() {
    super("Chưa tạo bảng khách hàng trên Supabase – chạy file supabase/migrations/0008_customers.sql.");
  }
}

interface CustomersRepository {
  get(id: string): Promise<Customer | null>;
  /** Dang nhap: co consent -> tao/cap nhat ho so + ghi nhat ky dong y; khong co -> chi cap nhat neu da ton tai */
  login(p: LoginProfile, consent: ConsentRecord | null): Promise<Customer | null>;
  updateProfile(id: string, patch: ProfilePatch): Promise<void>;
  /** Chi dien SDT neu ho so dang trong (lay tu don dau tien) */
  fillPhoneIfEmpty(id: string, phone: string): Promise<void>;
  setMarketing(id: string, on: boolean): Promise<void>;
  /** Xoa ho so + yeu thich + nhat ky dong y; don hang giu lai nhung bo lien ket */
  remove(id: string): Promise<void>;
  favorites(id: string): Promise<string[]>;
  setFavorite(id: string, productId: string, on: boolean): Promise<void>;
  addFavorites(id: string, productIds: string[]): Promise<void>;
  list(q: string, limit?: number): Promise<CustomerSummary[]>;
}

// ---------------------------------------------------------------- local (npm run dev, chua co Supabase)
interface LocalDb {
  customers: Map<string, Customer>;
  favorites: Map<string, string[]>;
}
function local(): LocalDb {
  const g = globalThis as typeof globalThis & { __yubCustomers?: LocalDb };
  g.__yubCustomers ??= { customers: new Map(), favorites: new Map() };
  return g.__yubCustomers;
}

const localRepository: CustomersRepository = {
  async get(id) {
    const c = local().customers.get(id);
    return c ? { ...c } : null;
  },
  async login(p, consent) {
    const db = local();
    const now = new Date().toISOString();
    const cur = db.customers.get(p.id);
    if (!cur && !consent) return null;
    const next: Customer = {
      id: p.id,
      email: p.email,
      fullName: cur?.fullName || p.fullName,
      avatarUrl: p.avatarUrl,
      phone: cur?.phone ?? null,
      address: cur?.address ?? null,
      consentVersion: consent?.version ?? cur?.consentVersion ?? "",
      consentedAt: consent?.at ?? cur?.consentedAt ?? now,
      marketingOptIn: consent ? consent.marketing : (cur?.marketingOptIn ?? false),
      createdAt: cur?.createdAt ?? now,
      lastLoginAt: now,
    };
    db.customers.set(p.id, next);
    return { ...next };
  },
  async updateProfile(id, patch) {
    const c = local().customers.get(id);
    if (c) local().customers.set(id, { ...c, ...patch });
  },
  async fillPhoneIfEmpty(id, phone) {
    const c = local().customers.get(id);
    if (c && !c.phone) local().customers.set(id, { ...c, phone });
  },
  async setMarketing(id, on) {
    const c = local().customers.get(id);
    if (c) local().customers.set(id, { ...c, marketingOptIn: on });
  },
  async remove(id) {
    local().customers.delete(id);
    local().favorites.delete(id);
    // Giong FK "on delete set null" ben Supabase: don con nhung bo lien ket
    const orders = (globalThis as typeof globalThis & { __yubOrders?: Map<string, { customerId?: string | null }> }).__yubOrders;
    for (const o of orders?.values() ?? []) if (o.customerId === id) o.customerId = null;
  },
  async favorites(id) {
    return [...(local().favorites.get(id) ?? [])];
  },
  async setFavorite(id, productId, on) {
    const list = (local().favorites.get(id) ?? []).filter((x) => x !== productId);
    local().favorites.set(id, on ? [productId, ...list] : list);
  },
  async addFavorites(id, ids) {
    const list = local().favorites.get(id) ?? [];
    local().favorites.set(id, [...ids.filter((x) => !list.includes(x)), ...list]);
  },
  async list() {
    // So don: tinh o service (orders repository local) – xem customersService.list
    return [...local().customers.values()].map((c) => ({ ...c, orderCount: 0, totalVnd: 0, lastOrderAt: null }));
  },
};

// ---------------------------------------------------------------- Supabase
interface Row {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  address: string | null;
  consent_version: string;
  consented_at: string;
  marketing_opt_in: boolean;
  created_at: string;
  last_login_at: string;
}
const COLS = "id, email, full_name, avatar_url, phone, address, consent_version, consented_at, marketing_opt_in, created_at, last_login_at";

const fromRow = (r: Row): Customer => ({
  id: r.id,
  email: r.email,
  fullName: r.full_name,
  avatarUrl: r.avatar_url,
  phone: r.phone,
  address: r.address,
  consentVersion: r.consent_version,
  consentedAt: r.consented_at,
  marketingOptIn: r.marketing_opt_in,
  createdAt: r.created_at,
  lastLoginAt: r.last_login_at,
});

/** Bang chua co (chua chay migration) -> bao loi ro rang */
function check(error: { code?: string; message?: string } | null) {
  if (!error) return;
  if (error.code === "42P01" || error.code === "PGRST205" || error.code === "42703") throw new CustomersNotReadyError();
  throw new Error(`Lỗi dữ liệu khách hàng (${error.code ?? "?"}).`);
}

function supabaseRepository(): CustomersRepository | null {
  const db = getSupabaseAdmin();
  if (!db) return null;
  const logConsent = async (id: string, version: string, marketing: boolean, action: "grant" | "withdraw" | "marketing_on" | "marketing_off") => {
    const purposes: ConsentPurpose[] = ["account", "orders", "favorites", ...(marketing ? (["marketing"] as const) : [])];
    const { error } = await db.from("customer_consents").insert({ customer_id: id, version, purposes, marketing, action });
    check(error);
  };
  return {
    async get(id) {
      const { data, error } = await db.from("customer_accounts").select(COLS).eq("id", id).maybeSingle();
      check(error);
      return data ? fromRow(data as Row) : null;
    },
    async login(p, consent) {
      const now = new Date().toISOString();
      if (consent) {
        const { data, error } = await db
          .from("customer_accounts")
          .upsert(
            { id: p.id, email: p.email, full_name: p.fullName, avatar_url: p.avatarUrl, consent_version: consent.version, consented_at: consent.at, marketing_opt_in: consent.marketing, last_login_at: now },
            { onConflict: "id", ignoreDuplicates: false },
          )
          .select(COLS)
          .single();
        check(error);
        await logConsent(p.id, consent.version, consent.marketing, "grant");
        return fromRow(data as Row);
      }
      const { data, error } = await db.from("customer_accounts").update({ email: p.email, avatar_url: p.avatarUrl, last_login_at: now }).eq("id", p.id).select(COLS).maybeSingle();
      check(error);
      return data ? fromRow(data as Row) : null;
    },
    async updateProfile(id, patch) {
      const { error } = await db.from("customer_accounts").update({ full_name: patch.fullName, phone: patch.phone, address: patch.address }).eq("id", id);
      check(error);
    },
    async fillPhoneIfEmpty(id, phone) {
      const { error } = await db.from("customer_accounts").update({ phone }).eq("id", id).is("phone", null);
      check(error);
    },
    async setMarketing(id, on) {
      const { data, error } = await db.from("customer_accounts").update({ marketing_opt_in: on }).eq("id", id).select("consent_version").maybeSingle();
      check(error);
      await logConsent(id, (data as { consent_version: string } | null)?.consent_version ?? "", on, on ? "marketing_on" : "marketing_off");
    },
    async remove(id) {
      // FK orders.customer_id ON DELETE SET NULL: don van con cho so sach cua tiem nhung khong gan voi nguoi
      const { error } = await db.from("customer_accounts").delete().eq("id", id);
      check(error);
      const { error: authErr } = await db.auth.admin.deleteUser(id);
      if (authErr) throw new Error("Đã xoá hồ sơ nhưng chưa xoá được tài khoản đăng nhập – vui lòng báo tiệm.");
    },
    async favorites(id) {
      const { data, error } = await db.from("customer_favorites").select("product_id").eq("customer_id", id).order("created_at", { ascending: false }).limit(200);
      check(error);
      return ((data ?? []) as { product_id: string }[]).map((r) => r.product_id);
    },
    async setFavorite(id, productId, on) {
      const { error } = on
        ? await db.from("customer_favorites").upsert({ customer_id: id, product_id: productId }, { onConflict: "customer_id,product_id", ignoreDuplicates: true })
        : await db.from("customer_favorites").delete().eq("customer_id", id).eq("product_id", productId);
      check(error);
    },
    async addFavorites(id, ids) {
      if (!ids.length) return;
      const { error } = await db.from("customer_favorites").upsert(
        ids.map((product_id) => ({ customer_id: id, product_id })),
        { onConflict: "customer_id,product_id", ignoreDuplicates: true },
      );
      check(error);
    },
    async list(q, limit = 200) {
      let query = db.from("customer_accounts").select(COLS).order("last_login_at", { ascending: false }).limit(limit);
      // Chi giu ky tu an toan (tranh chen bo loc PostgREST)
      const term = q.replace(/[^\p{L}\p{N}@.+\- ]/gu, "").trim().slice(0, 60);
      if (term) query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`);
      const { data, error } = await query;
      check(error);
      const customers = ((data ?? []) as Row[]).map(fromRow);
      if (!customers.length) return [];
      const { data: orders, error: oErr } = await db
        .from("orders")
        .select("customer_id, total_vnd, status, created_at")
        .in(
          "customer_id",
          customers.map((c) => c.id),
        )
        .limit(5000);
      check(oErr);
      const stats = new Map<string, { n: number; total: number; last: string | null }>();
      for (const o of (orders ?? []) as { customer_id: string; total_vnd: number; status: string; created_at: string }[]) {
        const s = stats.get(o.customer_id) ?? { n: 0, total: 0, last: null };
        s.n += 1;
        if (o.status !== "cancelled" && o.status !== "rejected") s.total += o.total_vnd;
        if (!s.last || o.created_at > s.last) s.last = o.created_at;
        stats.set(o.customer_id, s);
      }
      return customers.map((c) => {
        const s = stats.get(c.id);
        return { ...c, orderCount: s?.n ?? 0, totalVnd: s?.total ?? 0, lastOrderAt: s?.last ?? null };
      });
    },
  };
}

export function customersRepository(): CustomersRepository {
  return supabaseRepository() ?? localRepository;
}

export const isLocalCustomers = () => supabaseRepository() === null;
