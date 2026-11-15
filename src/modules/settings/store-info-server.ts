import { cache } from "react";
import { settingsRepository } from "./repository";
import { defaultStoreInfo, toStoreInfo, type StoreInfo } from "./store-info";

/**
 * Thong tin tiem cho Server Component (co cache – Admin luu cai dat la xoa cache ngay).
 * Loi doc DB -> dung mac dinh, khong lam sap trang.
 */
export const getStoreInfo = cache(async (): Promise<StoreInfo> => {
  try {
    return toStoreInfo(await settingsRepository.get());
  } catch {
    return defaultStoreInfo;
  }
});
