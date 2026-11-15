import { unstable_cache } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { StoreSettings } from "./types";

export const SETTINGS_TAG = "store-settings";

const safeUrl = (v: string | undefined, prefix = "https://") => {
  const s = v?.trim();
  return s && s.startsWith(prefix) && !/[\s"'<>]/.test(s) ? s : null;
};

/** Gia tri ban dau: lay tu .env.local neu co (tuong thich ban cu), khong tu bia */
function envDefaults(): StoreSettings {
  return {
    storeName: null,
    phone: null,
    openTime: null,
    closeTime: null,
    freshBatchTime: null,
    address: process.env.NEXT_PUBLIC_STORE_ADDRESS?.trim() || null,
    mapUrl: safeUrl(process.env.NEXT_PUBLIC_STORE_MAP_URL),
    mapEmbedUrl: safeUrl(process.env.NEXT_PUBLIC_STORE_MAP_EMBED_URL, "https://www.google.com/maps/embed"),
    bankName: null,
    bankAccountNo: null,
    bankAccountName: null,
    orderingEnabled: true,
    orderingPausedMessage: null,
  };
}

interface Row {
  store_name?: string | null;
  phone?: string | null;
  open_time?: string | null;
  close_time?: string | null;
  fresh_batch_time?: string | null;
  address?: string | null;
  map_url?: string | null;
  map_embed_url?: string | null;
  bank_name?: string | null;
  bank_account_no?: string | null;
  bank_account_name?: string | null;
  ordering_enabled?: boolean | null;
  ordering_paused_message?: string | null;
}

function merge(base: StoreSettings, r: Row): StoreSettings {
  return {
    storeName: r.store_name ?? null,
    phone: r.phone ?? null,
    openTime: r.open_time ?? null,
    closeTime: r.close_time ?? null,
    freshBatchTime: r.fresh_batch_time ?? null,
    address: r.address ?? base.address,
    mapUrl: r.map_url ?? base.mapUrl,
    mapEmbedUrl: r.map_embed_url ?? base.mapEmbedUrl,
    bankName: r.bank_name ?? null,
    bankAccountNo: r.bank_account_no ?? null,
    bankAccountName: r.bank_account_name ?? null,
    orderingEnabled: r.ordering_enabled ?? true,
    orderingPausedMessage: r.ordering_paused_message ?? null,
  };
}

function localStore(): { value: StoreSettings } {
  const g = globalThis as typeof globalThis & { __yubSettings?: { value: StoreSettings } };
  g.__yubSettings ??= { value: envDefaults() };
  return g.__yubSettings;
}

async function read(): Promise<StoreSettings> {
  const db = getSupabaseAdmin();
  if (!db) return { ...localStore().value };
  const { data, error } = await db.from("store_settings").select("value").eq("key", "store_info").maybeSingle();
  if (error) throw new Error(`Không đọc được cài đặt (${error.code}).`);
  return merge(envDefaults(), ((data?.value ?? {}) as Row));
}

const supabaseReadCached = unstable_cache(read, ["yub-store-settings"], { tags: [SETTINGS_TAG], revalidate: 600 });
const readCached = () => (getSupabaseAdmin() ? supabaseReadCached() : read());

export const settingsRepository = {
  /** Cho trang cong khai (co cache) */
  get: readCached,
  /** Cho Admin (doc moi) */
  getFresh: read,
  async save(s: StoreSettings): Promise<void> {
    const db = getSupabaseAdmin();
    if (!db) {
      localStore().value = { ...s };
      return;
    }
    const value: Row = {
      store_name: s.storeName,
      phone: s.phone,
      open_time: s.openTime,
      close_time: s.closeTime,
      fresh_batch_time: s.freshBatchTime,
      address: s.address,
      map_url: s.mapUrl,
      map_embed_url: s.mapEmbedUrl,
      bank_name: s.bankName,
      bank_account_no: s.bankAccountNo,
      bank_account_name: s.bankAccountName,
      ordering_enabled: s.orderingEnabled,
      ordering_paused_message: s.orderingPausedMessage,
    };
    const { error } = await db.from("store_settings").upsert({ key: "store_info", value, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) throw new Error(`Không lưu được cài đặt (${error.code}).`);
  },
};
