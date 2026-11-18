import { supabaseAnonKey, supabaseUrl } from "./server";
import { timedFetch } from "./timed-fetch";

/** Supabase da bat nha cung cap Google chua? (hoi /auth/v1/settings – cong khai; luu 1 phut) */
let googleCheck: { ok: boolean; at: number } | null = null;
export async function googleEnabled(): Promise<boolean> {
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
