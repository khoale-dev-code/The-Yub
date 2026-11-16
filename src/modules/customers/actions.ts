"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabaseAdmin, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/server";
import { timedFetch } from "@/lib/supabase/timed-fetch";
import { productsRepository } from "@/modules/products/repository";
import { CONSENT_COOKIE, CONSENT_VERSION, encodeConsent, safeNext } from "./consent";
import { CustomersNotReadyError, customersRepository } from "./repository";
import { createCustomerClient, DEMO_CUSTOMER_COOKIE, DEMO_CUSTOMER_ID, demoCustomerToken, getCustomer, getCustomerMode } from "./session";

export type CustomerActionResult = { ok: true } | { ok: false; error: string };

const isProd = process.env.NODE_ENV === "production";

// ---------------------------------------------------------------- dang nhap
const loginSchema = z.object({
  // Moi o dong y bat buoc phai duoc khach TU TICK (khong tick san) – z.literal(true)
  policy: z.literal(true, { errorMap: () => ({ message: "Vui lòng đọc và đồng ý Chính sách bảo mật." }) }),
  processing: z.literal(true, { errorMap: () => ({ message: "Vui lòng đồng ý cho tiệm xử lý dữ liệu để dùng tài khoản." }) }),
  age: z.literal(true, { errorMap: () => ({ message: "Vui lòng xác nhận độ tuổi / sự đồng ý của cha mẹ." }) }),
  marketing: z.boolean(),
  next: z.string().max(300),
});

async function siteOrigin(): Promise<string> {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (env && /^https?:\/\/[^\s/]+$/.test(env.replace(/\/$/, ""))) return env.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}

/** Supabase da bat nha cung cap Google chua? (hoi /auth/v1/settings – cong khai; luu 1 phut) */
let googleCheck: { ok: boolean; at: number } | null = null;
async function googleEnabled(): Promise<boolean> {
  if (googleCheck && Date.now() - googleCheck.at < 60_000) return googleCheck.ok;
  const url = supabaseUrl();
  const anon = supabaseAnonKey();
  if (!url || !anon) return false;
  try {
    const res = await timedFetch(`${url}/auth/v1/settings`, { headers: { apikey: anon }, cache: "no-store" });
    if (!res.ok) return true; // khong kiem tra duoc -> de Supabase tu bao
    const body = (await res.json()) as { external?: Record<string, boolean> };
    googleCheck = { ok: body.external?.google === true, at: Date.now() };
    return googleCheck.ok;
  } catch {
    return true;
  }
}

/**
 * Bam "Tiếp tục với Google": kiem tra cac o dong y o SERVER, luu lua chon vao cookie ky so ngan han,
 * roi chuyen sang Google. Ho so khach chi duoc tao o /auth/callback khi cookie dong y hop le.
 */
export async function startLoginAction(raw: unknown): Promise<CustomerActionResult> {
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Vui lòng tick đủ các ô đồng ý." };
  const next = safeNext(parsed.data.next);
  const mode = getCustomerMode();
  let target: string;

  if (mode === "demo") {
    await customersRepository().login(
      { id: DEMO_CUSTOMER_ID, email: "khach.xemthu@example.com", fullName: "Khách xem thử", avatarUrl: null },
      { version: CONSENT_VERSION, marketing: parsed.data.marketing, at: new Date().toISOString() },
    );
    (await cookies()).set(DEMO_CUSTOMER_COOKIE, demoCustomerToken(), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 8 });
    target = next;
  } else if (mode === "supabase") {
    if (!(await googleEnabled())) {
      console.warn("[dang-nhap] Supabase chua bat Google: Authentication > Sign In / Providers > Google");
      return { ok: false, error: "Đăng nhập Google chưa được tiệm bật – bạn vẫn đặt bánh được mà không cần đăng nhập. (Chủ tiệm: bật Google trong Supabase › Authentication › Sign In / Providers.)" };
    }
    (await cookies()).set(CONSENT_COOKIE, encodeConsent({ version: CONSENT_VERSION, marketing: parsed.data.marketing, next, at: Date.now() }), {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      path: "/",
      maxAge: 15 * 60,
    });
    const client = await createCustomerClient();
    if (!client) return { ok: false, error: "Đăng nhập chưa sẵn sàng – vui lòng thử lại sau." };
    const { data, error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${await siteOrigin()}/auth/callback`, skipBrowserRedirect: true, queryParams: { prompt: "select_account" } },
    });
    if (error || !data?.url) return { ok: false, error: "Đăng nhập Google chưa được bật cho tiệm – vui lòng thử lại sau hoặc gọi tiệm." };
    target = data.url;
  } else {
    return { ok: false, error: "Đăng nhập chưa được cấu hình." };
  }
  redirect(target);
}

export async function signOutCustomerAction(): Promise<void> {
  if (getCustomerMode() === "supabase") {
    const client = await createCustomerClient();
    await client?.auth.signOut({ scope: "local" });
  }
  (await cookies()).delete(DEMO_CUSTOMER_COOKIE);
  redirect("/");
}

// ---------------------------------------------------------------- ho so
const phoneSchema = z
  .string()
  .trim()
  .max(20)
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .refine((v) => v === null || (/^[0-9+ .()-]+$/.test(v) && /^(\+?84|0)\d{8,10}$/.test(v.replace(/[^\d+]/g, ""))), "Số điện thoại chưa đúng (VD: 0901 234 567)");

const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Họ tên quá ngắn").max(80, "Họ tên tối đa 80 ký tự"),
  phone: phoneSchema,
  address: z
    .string()
    .trim()
    .max(200, "Địa chỉ tối đa 200 ký tự")
    .transform((v) => (v === "" ? null : v))
    .nullable(),
});

export async function updateProfileAction(raw: unknown): Promise<CustomerActionResult> {
  const me = await getCustomer();
  if (!me) return { ok: false, error: "Phiên đăng nhập đã hết – vui lòng đăng nhập lại." };
  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Thông tin chưa hợp lệ." };
  try {
    await customersRepository().updateProfile(me.id, parsed.data);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Không lưu được, vui lòng thử lại." };
  }
  revalidatePath("/tai-khoan");
  return { ok: true };
}

export async function setMarketingAction(on: boolean): Promise<CustomerActionResult> {
  const me = await getCustomer();
  if (!me) return { ok: false, error: "Phiên đăng nhập đã hết – vui lòng đăng nhập lại." };
  await customersRepository().setMarketing(me.id, on === true);
  revalidatePath("/tai-khoan");
  return { ok: true };
}

/**
 * Rut lai dong y + xoa tai khoan: xoa ho so, mon yeu thich, nhat ky dong y va tai khoan dang nhap.
 * Don hang van luu cho so sach cua tiem nhung khong con gan voi tai khoan.
 */
export async function deleteAccountAction(confirmText: string): Promise<CustomerActionResult> {
  const me = await getCustomer();
  if (!me) return { ok: false, error: "Phiên đăng nhập đã hết – vui lòng đăng nhập lại." };
  if (confirmText.trim().toUpperCase() !== "XOÁ" && confirmText.trim().toUpperCase() !== "XOA") return { ok: false, error: "Gõ chữ XOÁ để xác nhận." };
  const db = getSupabaseAdmin();
  if (db) {
    // Tai khoan dong thoi la quan ly -> khong xoa o day (tranh mat quyen quan ly)
    const { data } = await db.from("admin_users").select("user_id").eq("user_id", me.id).maybeSingle();
    if (data) return { ok: false, error: "Tài khoản này cũng là tài khoản quản lý – vui lòng liên hệ chủ tiệm để xoá." };
  }
  try {
    await customersRepository().remove(me.id);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Không xoá được, vui lòng thử lại." };
  }
  if (getCustomerMode() === "supabase") {
    const client = await createCustomerClient();
    await client?.auth.signOut({ scope: "local" }).catch(() => undefined);
  }
  (await cookies()).delete(DEMO_CUSTOMER_COOKIE);
  redirect("/?tai-khoan=da-xoa");
}

// ---------------------------------------------------------------- yeu thich
const productIdSchema = z.string().regex(/^[\w-]{1,64}$/);

async function existingIds(ids: string[]): Promise<string[]> {
  const found = await productsRepository.findManyByIds(ids);
  return ids.filter((id) => found.has(id));
}

export async function toggleFavoriteAction(productId: string, on: boolean): Promise<CustomerActionResult> {
  const me = await getCustomer();
  if (!me) return { ok: false, error: "Phiên đăng nhập đã hết – vui lòng đăng nhập lại." };
  if (!productIdSchema.safeParse(productId).success) return { ok: false, error: "Món không hợp lệ." };
  if (on && (await existingIds([productId])).length === 0) return { ok: false, error: "Món này không còn trong thực đơn." };
  try {
    await customersRepository().setFavorite(me.id, productId, on === true);
  } catch (err) {
    return { ok: false, error: err instanceof CustomersNotReadyError ? err.message : "Không lưu được món yêu thích." };
  }
  return { ok: true };
}

/** Sau khi dang nhap: gop cac mon da tim luc chua dang nhap vao ho so */
export async function mergeFavoritesAction(ids: unknown): Promise<{ ok: true; ids: string[] } | { ok: false; error: string }> {
  const me = await getCustomer();
  if (!me) return { ok: false, error: "Chưa đăng nhập." };
  const list = z.array(productIdSchema).max(100).safeParse(ids);
  if (!list.success) return { ok: false, error: "Danh sách không hợp lệ." };
  const valid = await existingIds([...new Set(list.data)]);
  await customersRepository().addFavorites(me.id, valid);
  return { ok: true, ids: await customersRepository().favorites(me.id) };
}
