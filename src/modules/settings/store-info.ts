import { storeConfig } from "@/lib/store-config";
import type { StoreSettings } from "./types";

/**
 * Thong tin tiem dung tren toan web: lay tu Admin > Cai dat, thieu thi dung mac dinh (store-config.ts).
 * Thuan tuy (khong doc DB) -> dung duoc o ca server lan client.
 */
export interface StoreInfo {
  name: string;
  slogan: string;
  /** Hien thi, vd "0975 840 157" */
  phone: string;
  /** "tel:0975840157" */
  phoneHref: string;
  /** "0975840157" – dung cho link Zalo */
  phoneDigits: string;
  /** HH:mm */
  openTime: string;
  closeTime: string;
  /** "7:30 – 19:00" */
  openHours: string;
  /** "14:30" */
  freshBatchTime: string;
  timeZone: string;
}

/** "07:30" -> "7:30" */
export const shortTime = (t: string) => t.replace(/^0(\d):/, "$1:");

export const phoneDigitsOf = (phone: string) => phone.replace(/[^\d+]/g, "");

export function toStoreInfo(s: Pick<StoreSettings, "storeName" | "phone" | "openTime" | "closeTime" | "freshBatchTime"> | null): StoreInfo {
  const phone = s?.phone || storeConfig.phone;
  const openTime = s?.openTime || storeConfig.openTime;
  const closeTime = s?.closeTime || storeConfig.closeTime;
  const digits = phoneDigitsOf(phone);
  return {
    name: s?.storeName || storeConfig.name,
    slogan: storeConfig.slogan,
    phone,
    phoneHref: `tel:${digits}`,
    phoneDigits: digits,
    openTime,
    closeTime,
    openHours: `${shortTime(openTime)} – ${shortTime(closeTime)}`,
    freshBatchTime: shortTime(s?.freshBatchTime || storeConfig.freshBatchTime),
    timeZone: storeConfig.timeZone,
  };
}

export const defaultStoreInfo: StoreInfo = toStoreInfo(null);

/** "HH:mm" -> so phut trong ngay */
export const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};
