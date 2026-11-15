import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getSupabaseAdmin, isSupabaseConfigured, missingSupabaseEnv } from "@/lib/supabase/server";
import { createSupabaseSessionClient } from "@/lib/supabase/ssr";

export type AdminRole = "owner" | "staff";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  /** Che do xem thu (npm run dev, chua co Supabase) */
  demo: boolean;
}

/**
 * Che do dang nhap Admin:
 *  - "supabase": Supabase Auth + bang admin_users (chay that).
 *  - "demo": CHI khi chay `npm run dev`, chua cau hinh Supabase va co ADMIN_DEMO_PASSWORD (>= 12 ky tu) –
 *    de xem thu giao dien. Ban build production KHONG bao gio bat che do nay.
 *  - "off": chua cau hinh -> trang dang nhap hien huong dan.
 */
export type AdminMode = "supabase" | "demo" | "off";

export function getAdminMode(): AdminMode {
  if (isSupabaseConfigured()) return "supabase";
  // Da dien Supabase mot phan -> KHONG roi ve che do xem thu (tranh lech voi middleware), bao thieu bien
  if (missingSupabaseEnv().length > 0) return "off";
  const pw = process.env.ADMIN_DEMO_PASSWORD ?? "";
  if (process.env.NODE_ENV !== "production" && pw.length >= 12) return "demo";
  return "off";
}

export const DEMO_COOKIE = "yub_admin_demo";

export function demoToken(): string {
  return createHmac("sha256", process.env.ADMIN_DEMO_PASSWORD ?? "").update("yub-admin-demo-v1").digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/**
 * Nguoi dang dang nhap co quyen Admin? (null neu khong)
 * cache(): layout + page + action trong CUNG 1 request chi hoi Supabase 1 lan.
 */
export const getAdminUser = cache(async function getAdminUser(): Promise<AdminUser | null> {
  const mode = getAdminMode();
  if (mode === "demo") {
    const value = (await cookies()).get(DEMO_COOKIE)?.value ?? "";
    return value && safeEqual(value, demoToken()) ? { id: "demo", email: "demo@local", name: "Chủ tiệm (xem thử)", role: "owner", demo: true } : null;
  }
  if (mode !== "supabase") return null;

  const auth = await createSupabaseSessionClient();
  const db = getSupabaseAdmin();
  if (!auth || !db) return null;
  // getUser() xac thuc lai JWT voi Supabase (khong tin cookie mot cach mu quang)
  const { data, error } = await auth.auth.getUser();
  if (error || !data.user) return null;
  const { data: row } = await db.from("admin_users").select("display_name, role").eq("user_id", data.user.id).maybeSingle();
  if (!row) return null;
  const r = row as { display_name: string; role: AdminRole };
  return { id: data.user.id, email: data.user.email ?? "", name: r.display_name || data.user.email || "Quản lý", role: r.role, demo: false };
});

/** Dung trong layout/page Admin: chua dang nhap -> ve trang dang nhap */
export async function requireAdmin(): Promise<AdminUser> {
  const user = await getAdminUser();
  if (!user) redirect("/admin/dang-nhap");
  return user;
}

/** Dung trong Server Action: KHONG tin middleware, luon kiem tra lai quyen */
export async function assertAdmin(role?: AdminRole): Promise<AdminUser> {
  const user = await getAdminUser();
  if (!user) throw new AdminAuthError("Phiên đăng nhập đã hết – vui lòng đăng nhập lại.");
  if (role === "owner" && user.role !== "owner") throw new AdminAuthError("Chỉ chủ tiệm mới làm được thao tác này.");
  return user;
}

export class AdminAuthError extends Error {}
