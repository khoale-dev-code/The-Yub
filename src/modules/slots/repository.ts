import { pickupSlots, type PickupSlot } from "@/lib/pickup";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/** Khung gio + cau hinh van hanh (bat/tat, suc chua) do Admin chinh. */
export interface SlotConfig extends PickupSlot {
  isActive: boolean;
  /** So don toi da moi ngay cho khung nay; null = khong gioi han */
  capacity: number | null;
}

export interface SlotPatch {
  isActive: boolean;
  capacity: number | null;
}

function localStore(): Record<string, SlotPatch> {
  const g = globalThis as typeof globalThis & { __yubSlots?: Record<string, SlotPatch> };
  g.__yubSlots ??= Object.fromEntries(pickupSlots.map((s) => [s.id, { isActive: true, capacity: null }]));
  return g.__yubSlots;
}

export const slotsRepository = {
  async list(): Promise<SlotConfig[]> {
    const db = getSupabaseAdmin();
    let conf: Record<string, SlotPatch> = localStore();
    if (db) {
      const { data, error } = await db.from("pickup_slots").select("id, is_active, capacity");
      if (error) throw new Error(`Không đọc được khung giờ (${error.code}).`);
      conf = Object.fromEntries((data ?? []).map((r: { id: string; is_active: boolean; capacity: number | null }) => [r.id, { isActive: r.is_active, capacity: r.capacity }]));
    }
    return pickupSlots.map((s) => ({ ...s, isActive: conf[s.id]?.isActive ?? true, capacity: conf[s.id]?.capacity ?? null }));
  },

  async update(id: string, patch: SlotPatch): Promise<void> {
    if (!pickupSlots.some((s) => s.id === id)) throw new Error("Khung giờ không hợp lệ.");
    const db = getSupabaseAdmin();
    if (db) {
      const slot = pickupSlots.find((s) => s.id === id);
      const { error } = await db
        .from("pickup_slots")
        .upsert({ id, label: slot?.label ?? id, is_active: patch.isActive, capacity: patch.capacity }, { onConflict: "id" });
      if (error) throw new Error(`Không lưu được khung giờ (${error.code}).`);
      return;
    }
    localStore()[id] = patch;
  },
};
