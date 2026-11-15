import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAnonKey, supabaseUrl } from "./server";
import { timedFetch } from "./timed-fetch";

/**
 * Client theo phien dang nhap (cookie) – CHI dung de xac thuc nguoi dung Admin
 * (dang nhap / dang xuat / doc user). Du lieu doc ghi qua service layer.
 */
export async function createSupabaseSessionClient() {
  const url = supabaseUrl();
  const anon = supabaseAnonKey();
  if (!url || !anon) return null;
  const store = await cookies();
  return createServerClient(url, anon, {
    global: { fetch: timedFetch },
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Server Component khong ghi cookie duoc – middleware se lam moi phien
        }
      },
    },
  });
}
