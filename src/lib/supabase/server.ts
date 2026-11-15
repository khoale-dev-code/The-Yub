import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { timedFetch } from "./timed-fetch";

/**
 * Supabase – CHI dung trong code server (service layer, server actions, route handlers).
 *
 * Bien moi truong (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL       – URL project (cong khai)
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY  – anon key (cong khai, chi dung cho dang nhap Admin)
 *   SUPABASE_SERVICE_ROLE_KEY      – BI MAT, chi doc o server, KHONG dat ten NEXT_PUBLIC_*
 * (SUPABASE_URL van duoc chap nhan de tuong thich ban cu.)
 *
 * Chua cau hinh -> toan bo web chay bang du lieu local (demo).
 */
export function supabaseUrl(): string | null {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || null;
}

export function supabaseAnonKey(): string | null {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || null;
}

/** Du 3 bien de chay that (du lieu + dang nhap Admin) */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl() && supabaseAnonKey() && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Ten cac bien Supabase con thieu KHI da dien mot phan (chi tra ve TEN bien, khong bao gio tra gia tri).
 * Mang rong = chua dien gi hoac da du.
 */
export function missingSupabaseEnv(): string[] {
  const has = { url: Boolean(supabaseUrl()), anon: Boolean(supabaseAnonKey()), service: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) };
  if (!has.url && !has.anon && !has.service) return [];
  const missing: string[] = [];
  if (!has.url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!has.anon) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!has.service) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  return missing;
}

let adminClient: SupabaseClient | null = null;

/** Client service role (bo qua RLS) – moi thao tac Admin phai kiem tra quyen TRUOC khi goi. */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  adminClient ??= createClient(supabaseUrl() as string, process.env.SUPABASE_SERVICE_ROLE_KEY as string, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: timedFetch },
  });
  return adminClient;
}

/** Nhu getSupabaseAdmin nhung bao loi ro rang khi thieu cau hinh */
export function requireSupabaseAdmin(): SupabaseClient {
  const client = getSupabaseAdmin();
  if (!client) throw new Error("Supabase chưa được cấu hình.");
  return client;
}
