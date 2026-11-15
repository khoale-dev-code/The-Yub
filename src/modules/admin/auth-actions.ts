"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { createSupabaseSessionClient } from "@/lib/supabase/ssr";
import { DEMO_COOKIE, demoToken, getAdminMode } from "./session";

export interface SignInState {
  error: string | null;
}

const credentialsSchema = z.object({
  email: z.string().trim().email("Email chưa đúng").max(120),
  password: z.string().min(1, "Nhập mật khẩu").max(200),
});

/** Gioi han thu sai (best-effort, theo IP, trong bo nho server) */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;
function attempts(): Map<string, { n: number; since: number }> {
  const g = globalThis as typeof globalThis & { __yubLoginAttempts?: Map<string, { n: number; since: number }> };
  g.__yubLoginAttempts ??= new Map();
  return g.__yubLoginAttempts;
}
async function clientKey(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "local").trim();
}
function tooMany(key: string): boolean {
  const a = attempts().get(key);
  if (!a) return false;
  if (Date.now() - a.since > WINDOW_MS) {
    attempts().delete(key);
    return false;
  }
  return a.n >= MAX_ATTEMPTS;
}
function recordFail(key: string) {
  const a = attempts().get(key);
  if (!a || Date.now() - a.since > WINDOW_MS) attempts().set(key, { n: 1, since: Date.now() });
  else a.n += 1;
}

const GENERIC = "Email hoặc mật khẩu chưa đúng.";

export async function signInAction(_prev: SignInState, form: FormData): Promise<SignInState> {
  const mode = getAdminMode();
  const key = await clientKey();
  if (tooMany(key)) return { error: "Thử sai quá nhiều lần – vui lòng đợi 10 phút rồi thử lại." };

  if (mode === "demo") {
    const digest = (v: string) => createHash("sha256").update(v).digest();
    const pw = String(form.get("password") ?? "");
    if (!pw || !timingSafeEqual(digest(pw), digest(process.env.ADMIN_DEMO_PASSWORD ?? ""))) {
      recordFail(key);
      return { error: "Mật khẩu xem thử chưa đúng." };
    }
    (await cookies()).set(DEMO_COOKIE, demoToken(), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 8 });
    redirect("/admin");
  }

  if (mode !== "supabase") return { error: "Admin chưa được cấu hình – xem hướng dẫn bên dưới." };

  const parsed = credentialsSchema.safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? GENERIC };

  const auth = await createSupabaseSessionClient();
  const db = getSupabaseAdmin();
  if (!auth || !db) return { error: "Admin chưa được cấu hình." };

  const { data, error } = await auth.auth.signInWithPassword(parsed.data);
  if (error || !data.user) {
    recordFail(key);
    return { error: GENERIC };
  }
  const { data: row } = await db.from("admin_users").select("user_id").eq("user_id", data.user.id).maybeSingle();
  if (!row) {
    await auth.auth.signOut();
    recordFail(key);
    return { error: "Tài khoản này chưa được cấp quyền quản lý." };
  }
  attempts().delete(key);
  redirect("/admin");
}

export async function signOutAction(): Promise<void> {
  const store = await cookies();
  store.delete(DEMO_COOKIE);
  const auth = await createSupabaseSessionClient();
  if (auth) await auth.auth.signOut();
  redirect("/admin/dang-nhap");
}
