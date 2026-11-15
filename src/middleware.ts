import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getVerifiedUser } from "@/lib/supabase/claims";
import { timedFetch } from "@/lib/supabase/timed-fetch";

/**
 * Chi chay cho /admin: lam moi phien Supabase (cookie) va chuyen nguoi chua dang nhap ve trang dang nhap.
 * Day CHI la lop tien loi – layout va moi Server Action Admin deu kiem tra quyen lai o server.
 */
export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const response = NextResponse.next({ request });
  // Cung dieu kien voi isSupabaseConfigured(): thieu 1 bien thi Admin chua chay Supabase -> khong chuyen huong
  // (neu khong, middleware va trang dang nhap se day qua lai vo tan).
  if (!url || !anon || !process.env.SUPABASE_SERVICE_ROLE_KEY) return response;
  // Chi o dev: request bien dich truoc (src/instrumentation.ts) di thang toi trang de Next bien dich.
  // Khong mo quyen gi – trang Admin van tu kiem tra dang nhap (requireAdmin) va chuyen ve trang dang nhap.
  if (process.env.NODE_ENV === "development" && request.headers.get("x-yub-warm") === "1") return response;

  const supabase = createServerClient(url, anon, {
    global: { fetch: timedFetch },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) request.cookies.set(name, value);
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
      },
    },
  });
  // Kiem chu ky JWT tai cho (khong goi Supabase moi lan) + tu lam moi phien khi het han
  const user = await getVerifiedUser(supabase, url, anon);
  const isLogin = request.nextUrl.pathname.startsWith("/admin/dang-nhap");
  if (!user && !isLogin) {
    const to = request.nextUrl.clone();
    to.pathname = "/admin/dang-nhap";
    to.search = "";
    return NextResponse.redirect(to);
  }
  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
