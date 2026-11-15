import type { SupabaseClient } from "@supabase/supabase-js";
import { timedFetch } from "./timed-fetch";

type Jwks = NonNullable<Parameters<SupabaseClient["auth"]["getClaims"]>[1]>;

/** Khoa cong khai (JWKS) cua project – dung chung moi request, lam moi moi 10 phut */
const JWKS_TTL_MS = 10 * 60_000;
let jwksCache: { jwks: Jwks; at: number } | null = null;

async function getJwks(url: string, anon: string): Promise<Jwks> {
  if (jwksCache && Date.now() - jwksCache.at < JWKS_TTL_MS) return jwksCache.jwks;
  try {
    const res = await timedFetch(`${url}/auth/v1/.well-known/jwks.json`, { headers: { apikey: anon }, cache: "no-store" });
    if (res.ok) {
      const body = (await res.json()) as Partial<Jwks>;
      const jwks = { keys: Array.isArray(body.keys) ? body.keys : [] } as Jwks;
      jwksCache = { jwks, at: Date.now() };
      return jwks;
    }
  } catch {
    // Mang loi: de getClaims tu xu ly (tu tai JWKS hoac hoi Supabase)
  }
  return { keys: [] } as Jwks;
}

export interface VerifiedUser {
  id: string;
  email: string;
}

/**
 * Xac thuc nguoi dang nhap tu cookie phien.
 * - Project dung khoa ky JWT bat doi xung (mac dinh voi project moi): kiem chu ky NGAY tren server
 *   bang khoa cong khai da luu -> khong ton 1 lan goi Supabase moi request.
 * - Project dung khoa cu (HS256): getClaims tu hoi Supabase (getUser) – an toan nhu truoc.
 * Token het han -> tu lam moi (cookie moi duoc ghi qua setAll cua client).
 */
export async function getVerifiedUser(client: SupabaseClient, url: string, anon: string): Promise<VerifiedUser | null> {
  const jwks = await getJwks(url, anon);
  const { data, error } = await client.auth.getClaims(undefined, jwks);
  if (error || !data?.claims?.sub) return null;
  const email = typeof data.claims.email === "string" ? data.claims.email : "";
  return { id: data.claims.sub, email };
}
