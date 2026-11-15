import { createHmac, timingSafeEqual } from "node:crypto";
import { unstable_cache } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getVerifiedUser } from "@/lib/supabase/claims";
import { getSupabaseAdmin, isSupabaseConfigured, missingSupabaseEnv, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/server";
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

/** Tag xoa cache quyen quan ly – goi revalidateTag(ADMIN_USERS_TAG) sau khi them / doi / thu hoi tai khoan */
export const ADMIN_USERS_TAG = "admin-users";

interface AdminRow {
  display_name: string;
  role: AdminRole;
}

async function fetchAdminRow(userId: string): Promise<AdminRow | null> {
  const db = getSupabaseAdmin();
  if (!db) return null;
  const { data } = await db.from("admin_users").select("display_name, role").eq("user_id", userId).maybeSingle();
  return (data as AdminRow | null) ?? null;
}

/**
 * Quyen quan ly theo user id – luu 2 phut (bot 1 lan goi Supabase moi trang).
 * Thao tac trong Admin > Cai dat xoa cache ngay; sua truc tiep bang SQL thi toi da 2 phut moi co hieu luc.
 */
const cachedAdminRow = unstable_cache(fetchAdminRow, ["admin-user-row-v1"], { tags: [ADMIN_USERS_TAG], revalidate: 120 });

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
  const url = supabaseUrl();
  const anon = supabaseAnonKey();
  if (!auth || !url || !anon) return null;
  // Kiem chu ky JWT (khong tin cookie mot cach mu quang) – xem src/lib/supabase/claims.ts
  const user = await getVerifiedUser(auth, url, anon);
  if (!user) return null;
  // Chi dung cache khi DA la quan ly; chua co quyen thi hoi lai ngay (vua cap quyen bang SQL la vao duoc luon)
  const row = (await cachedAdminRow(user.id)) ?? (await fetchAdminRow(user.id));
  if (!row) return null;
  return { id: user.id, email: user.email, name: row.display_name || user.email || "Quản lý", role: row.role, demo: false };
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
