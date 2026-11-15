"use client";

import { createContext, useContext, type ReactNode } from "react";
import { defaultStoreInfo, type StoreInfo } from "@/modules/settings/store-info";

const StoreInfoContext = createContext<StoreInfo>(defaultStoreInfo);

/** Dat o layout: dua thong tin tiem (ten, SDT, gio mo cua, me banh) xuong moi Client Component */
export function StoreInfoProvider({ value, children }: { value: StoreInfo; children: ReactNode }) {
  return <StoreInfoContext.Provider value={value}>{children}</StoreInfoContext.Provider>;
}

export const useStoreInfo = () => useContext(StoreInfoContext);
