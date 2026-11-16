import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getVerifiedUser } from "@/lib/supabase/claims";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/server";
import { timedFetch } from "@/lib/supabase/timed-fetch";
import { CONSENT_VERSION } from "./consent";
import { customersRepository } from "./repository";
import type { Customer } from "./types";

/**
 * Dang nhap KHACH (Google) – tach rieng hoan toan voi dang nhap quan ly:
 *  - cookie phien rieng (ten "yub-khach") -> khach dang nhap khong anh huong phien Admin va nguoc lai;
 *  - quyen Admin chi den tu bang admin_users, khach khong bao gio co quyen quan ly.
 * Che do:
 *  - "supabase": Supabase Auth + nha cung cap Google (bat trong Supabase Dashboard).
 *  - "demo": CHI khi `npm run dev` va chua co Supabase – nut "Đăng nhập xem thử" de thu luong khach.
 *  - "off": ban build production chua cau hinh Supabase.
 */
export type CustomerMode = "supabase" | "demo" | "off";

export function getCustomerMode(): CustomerMode {
  if (isSupabaseConfigured()) return "supabase";
  if (process.env.NODE_ENV !== "production") return "demo";
  return "off";
}

/** Ten cookie phien cua khach (khac cookie mac dinh "sb-…" dung cho Admin) */
export const CUSTOMER_COOKIE = "yub-khach";

/** Client Supabase theo phien KHACH. Trong Server Component khong ghi duoc cookie -> middleware lam moi. */
export async function createCustomerClient() {
  const url = supabaseUrl();
  const anon = supabaseAnonKey();
  if (!url || !anon) return null;
  const store = await cookies();
  return createServerClient(url, anon, {
    global: { fetch: timedFetch },
    cookieOptions: { name: CUSTOMER_COOKIE, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" },
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Server Component: bo qua (middleware lam moi phien cho cac trang tai khoan)
        }
      },
    },
  });
}

// ---------------------------------------------------------------- che do xem thu (dev)
export const DEMO_CUSTOMER_COOKIE = "yub_khach_demo";
export const DEMO_CUSTOMER_ID = "00000000-0000-4000-8000-00000000d3e0";

function demoSecret(): string {
  const g = globalThis as typeof globalThis & { __yubDemoCustomerSecret?: string };
  g.__yubDemoCustomerSecret ??= randomBytes(32).toString("hex");
  return g.__yubDemoCustomerSecret;
}
export const demoCustomerToken = () => createHmac("sha256", demoSecret()).update(DEMO_CUSTOMER_ID).digest("hex");

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Phien hop le (da xac thuc chu ky) – chua chac da co ho so / da dong y */
export async function getCustomerIdentity(): Promise<{ id: string; email: string; name: string; avatar: string | null } | null> {
  const mode = getCustomerMode();
  if (mode === "demo") {
    const v = (await cookies()).get(DEMO_CUSTOMER_COOKIE)?.value ?? "";
    return v && safeEqual(v, demoCustomerToken()) ? { id: DEMO_CUSTOMER_ID, email: "khach.xemthu@example.com", name: "Khách xem thử", avatar: null } : null;
  }
  if (mode !== "supabase") return null;
  const client = await createCustomerClient();
  const url = supabaseUrl();
  const anon = supabaseAnonKey();
  if (!client || !url || !anon) return null;
  const user = await getVerifiedUser(client, url, anon);
  if (!user) return null;
  return { id: user.id, email: user.email, name: "", avatar: null };
}

/**
 * Khach dang dang nhap VA da dong y chinh sach phien ban hien tai (null neu khong).
 * cache(): trong 1 request chi xac thuc 1 lan.
 */
export const getCustomer = cache(async function getCustomer(): Promise<Customer | null> {
  const who = await getCustomerIdentity();
  if (!who) return null;
  try {
    const c = await customersRepository().get(who.id);
    return c && c.consentVersion === CONSENT_VERSION ? c : null;
  } catch {
    return null;
  }
});

/** Trang can dang nhap: chua dang nhap -> ve trang dang nhap, quay lai dung trang */
export async function requireCustomer(next: string): Promise<Customer> {
  const c = await getCustomer();
  if (!c) redirect(`/dang-nhap?next=${encodeURIComponent(next)}`);
  return c;
}
