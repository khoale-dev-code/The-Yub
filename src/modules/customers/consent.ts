import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Van ban dong y (Chinh sach bao mat) – doi noi dung chinh sach thi tang phien ban:
 * khach dang nhap lan sau se dong y lai theo ban moi.
 */
export const CONSENT_VERSION = "2026-11-16";

/** Muc dich xu ly bat buoc de dung tai khoan (khach tick tung o, khong tick san) */
export const REQUIRED_PURPOSES = ["account", "orders", "favorites"] as const;
export type ConsentPurpose = (typeof REQUIRED_PURPOSES)[number] | "marketing";

export interface ConsentChoice {
  version: string;
  marketing: boolean;
  /** Trang quay lai sau khi dang nhap (chi duong dan noi bo) */
  next: string;
  /** Thoi diem tick dong y (ms) */
  at: number;
}

/** Chi chap nhan duong dan noi bo "/..." (chong chuyen huong ra trang la) */
export function safeNext(raw: unknown, fallback = "/tai-khoan"): string {
  const v = typeof raw === "string" ? raw : "";
  return /^\/(?!\/)[\w\-./?=&#%]*$/.test(v) && !v.startsWith("/admin") && !v.startsWith("/auth") ? v : fallback;
}

export const CONSENT_COOKIE = "yub_khach_consent";
const MAX_AGE_MS = 15 * 60_000;

function key(): string {
  // Khoa ky lay tu bien bi mat phia server (khong bao gio gui xuong trinh duyet)
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.ADMIN_DEMO_PASSWORD || "";
  return createHmac("sha256", secret).update("yub-customer-consent-v1").digest("hex");
}

const sign = (body: string) => createHmac("sha256", key()).update(body).digest("base64url");

/** Cookie ngan han (15 phut) mang lua chon dong y qua buoc dang nhap Google */
export function encodeConsent(c: ConsentChoice): string {
  const body = Buffer.from(JSON.stringify(c)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function decodeConsent(raw: string | undefined): ConsentChoice | null {
  if (!raw || raw.length > 2000) return null;
  const [body, sig] = raw.split(".");
  if (!body || !sig) return null;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(body));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const c = JSON.parse(Buffer.from(body, "base64url").toString()) as Partial<ConsentChoice>;
    if (c.version !== CONSENT_VERSION || typeof c.at !== "number" || Date.now() - c.at > MAX_AGE_MS) return null;
    return { version: c.version, marketing: c.marketing === true, next: safeNext(c.next), at: c.at };
  } catch {
    return null;
  }
}
