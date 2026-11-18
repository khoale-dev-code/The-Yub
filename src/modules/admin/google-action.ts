"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { googleEnabled } from "@/lib/supabase/google-provider";
import { createSupabaseSessionClient } from "@/lib/supabase/ssr";
import { getAdminMode } from "./session";

// Dùng đúng origin đang mở trang để cookie PKCE quay về cùng trình duyệt và tên miền.
// Next.js kiểm tra Origin của POST Server Action. Supabase kiểm tra allowlist redirect.
export async function startAdminGoogle(): Promise<{ error: string | null }> {
  if (getAdminMode() !== "supabase") return { error: "Cần kết nối Supabase để đăng nhập bằng Google." };
  let target: string;
  try {
    const h = await headers();
    const host = h.get("host") ?? "";
    const localOrigin = /^(localhost|127\.0\.0\.1|\[::1\])(:[0-9]+)?$/.test(host) ? `http://${host}` : undefined;
    const browserOrigin = h.get("origin");
    const origin = (browserOrigin !== "null" && browserOrigin) || process.env.NEXT_PUBLIC_SITE_URL || localOrigin;
    if (!origin) return { error: "Chưa xác định được địa chỉ web. Hãy cấu hình NEXT_PUBLIC_SITE_URL." };
    const url = new URL(origin);
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (url.protocol !== "https:" && !(local && url.protocol === "http:")) {
      return { error: "Hãy mở trang qua HTTPS hoặc localhost để tiếp tục." };
    }
    if (!(await googleEnabled())) return { error: "Google chưa được bật trong Supabase Authentication của tiệm." };
    const client = await createSupabaseSessionClient();
    if (!client) return { error: "Chưa kết nối được Supabase." };
    const { data, error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: new URL("/admin/dang-nhap/callback", url.origin).href,
        skipBrowserRedirect: true,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error || !data.url) return { error: "Chưa thể mở Google. Hãy thử lại." };
    target = data.url;
  } catch {
    return { error: "Kết nối đăng nhập bị gián đoạn. Hãy thử lại." };
  }
  redirect(target);
}
