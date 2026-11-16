import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { CONSENT_COOKIE, CONSENT_VERSION, decodeConsent } from "@/modules/customers/consent";
import { CustomersNotReadyError, customersRepository } from "@/modules/customers/repository";
import { createCustomerClient, getCustomerMode } from "@/modules/customers/session";

export const dynamic = "force-dynamic";

/**
 * Google -> Supabase -> day: doi ma lay phien, roi tao / cap nhat ho so khach.
 * Ho so MOI chi duoc tao khi co cookie dong y hop le (khach da tick cac o dong y o trang /dang-nhap).
 * Khong log email / ten khach.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const back = (reason: string) => NextResponse.redirect(new URL(`/dang-nhap?loi=${reason}`, url.origin));
  if (getCustomerMode() !== "supabase") return back("chua-cau-hinh");

  const code = url.searchParams.get("code");
  if (!code) return back(url.searchParams.get("error") === "access_denied" ? "huy" : "google");

  const store = await cookies();
  const consent = decodeConsent(store.get(CONSENT_COOKIE)?.value);
  const client = await createCustomerClient();
  if (!client) return back("chua-cau-hinh");

  const { data, error } = await client.auth.exchangeCodeForSession(code);
  if (error || !data.user) return back("phien");

  const meta = (data.user.user_metadata ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const avatar = str(meta.avatar_url) || str(meta.picture);
  try {
    const customer = await customersRepository().login(
      {
        id: data.user.id,
        email: data.user.email ?? "",
        fullName: (str(meta.full_name) || str(meta.name) || (data.user.email ?? "").split("@")[0] || "Khách").slice(0, 80),
        avatarUrl: avatar.startsWith("https://") ? avatar.slice(0, 500) : null,
      },
      consent ? { version: consent.version, marketing: consent.marketing, at: new Date(consent.at).toISOString() } : null,
    );
    store.delete(CONSENT_COOKIE);
    if (!customer || customer.consentVersion !== CONSENT_VERSION) {
      // Chua dong y (hoac chinh sach da doi): dang xuat, yeu cau tick dong y truoc
      await client.auth.signOut({ scope: "local" });
      return back("dong-y");
    }
  } catch (err) {
    await client.auth.signOut({ scope: "local" });
    return back(err instanceof CustomersNotReadyError ? "chua-san-sang" : "luu");
  }
  return NextResponse.redirect(new URL(consent?.next ?? "/tai-khoan", url.origin));
}
