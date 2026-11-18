import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/server";
import { timedFetch } from "@/lib/supabase/timed-fetch";

export const dynamic = "force-dynamic";

function go(path: string) {
  return new NextResponse(null, { status: 303, headers: {
    Location: path, "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer",
  } });
}
const login = (reason: string) => go(`/admin/dang-nhap?loi=${reason}`);

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!isSupabaseConfigured()) return login("cau-hinh");
  if (request.nextUrl.searchParams.get("error") === "access_denied") return login("huy");
  if (!code || request.nextUrl.searchParams.has("error")) return login("phien");

  const url = supabaseUrl();
  const key = supabaseAnonKey();
  if (!url || !key) return login("cau-hinh");
  // Chỉ gửi response chứa cookie phiên nếu UID vừa xác thực có quyền quản lý.
  const approved = go("/admin");
  const client = createServerClient(url, key, {
    global: { fetch: timedFetch },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value, options } of list) {
          request.cookies.set(name, value);
          approved.cookies.set(name, value, options);
        }
      },
    },
  });
  try {
    const { data, error } = await client.auth.exchangeCodeForSession(code);
    if (error || !data.user) return login("phien");
    const { data: row, error: lookup } = await client.from("admin_users")
      .select("role").eq("user_id", data.user.id).maybeSingle();
    if (lookup) return login("kiem-tra");
    if (row?.role !== "owner" && row?.role !== "staff") return login("chua-cap-quyen");
    return approved;
  } catch {
    return login("kiem-tra");
  }
}
