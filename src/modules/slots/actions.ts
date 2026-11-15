"use server";

import { isValidPickupDate } from "@/lib/pickup";
import { getOrdersRepository } from "@/modules/orders/repository";
import { slotsRepository } from "./repository";

export type SlotAvailability = Record<string, "ok" | "full" | "off">;

/** Khung gio nao con nhan don cho ngay khach chon (chi tra trang thai, khong tra so don). */
export async function slotAvailabilityAction(date: string): Promise<SlotAvailability> {
  if (typeof date !== "string" || !isValidPickupDate(date)) return {};
  try {
    const [slots, usage] = await Promise.all([slotsRepository.list(), getOrdersRepository().slotUsage(date)]);
    return Object.fromEntries(
      slots.map((s) => [s.id, !s.isActive ? "off" : s.capacity !== null && (usage[s.id] ?? 0) >= s.capacity ? "full" : "ok"]),
    );
  } catch {
    return {};
  }
}
