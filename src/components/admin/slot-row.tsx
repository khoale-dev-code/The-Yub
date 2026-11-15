"use client";

import { useState, useTransition } from "react";
import { updateSlotAction } from "@/modules/admin/actions";
import type { SlotConfig } from "@/modules/slots/repository";
import { MinusIcon, PlusIcon } from "@/components/ui/icons";
import { Switch } from "./switch";
import { toast } from "./toast";
import { btn } from "./ui";
import { useStoreInfo } from "@/components/brand/store-info-context";
import { isFreshSlot } from "@/lib/pickup";

export function SlotRow({ slot, used }: { slot: SlotConfig; used: number }) {
  const { freshBatchTime } = useStoreInfo();
  const [pending, start] = useTransition();
  const [active, setActive] = useState(slot.isActive);
  const [limited, setLimited] = useState(slot.capacity !== null);
  const [cap, setCap] = useState(slot.capacity ?? 10);
  const dirty = active !== slot.isActive || limited !== (slot.capacity !== null) || (limited && cap !== slot.capacity);
  const pct = limited ? Math.min(100, Math.round((used / Math.max(cap, 1)) * 100)) : null;

  const save = (next?: { active: boolean }) =>
    start(async () => {
      const isActive = next?.active ?? active;
      const res = await updateSlotAction({ id: slot.id, isActive, capacity: limited ? cap : null });
      if (res.ok) toast(`Đã lưu khung ${slot.label}`);
      else toast(res.error, "error");
    });

  return (
    <li className={`grid gap-3 px-4 py-4 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center md:gap-6 md:px-5 ${active ? "" : "bg-beige/40"}`}>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <strong className="font-display text-[19px] font-semibold tabular-nums">{slot.label}</strong>
          {isFreshSlot(slot, freshBatchTime) && <span className="rounded-full bg-butter px-2 py-px text-[11px] font-bold text-maroon">Bánh ấm</span>}
          {!active && <span className="rounded-full bg-maroon/10 px-2 py-px text-[11px] font-semibold">Tạm nghỉ</span>}
        </div>
        <div className="flex items-center gap-3">
          <div className="h-2 w-full max-w-[220px] overflow-hidden rounded-full bg-beige" aria-hidden="true">
            <span className={`block h-full rounded-full ${pct !== null && pct >= 100 ? "bg-accent" : "bg-butter"}`} style={{ width: `${pct ?? Math.min(100, used * 10)}%` }} />
          </div>
          <span className="text-[13px] font-semibold tabular-nums text-muted">{used}{limited ? ` / ${cap}` : ""} đơn</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Switch checked={limited} onChange={setLimited} label="Giới hạn số đơn" showLabel />
        {limited && (
          <div role="group" aria-label={`Sức chứa ${slot.label}`} className="inline-flex items-center rounded-full border border-maroon/20 bg-card">
            <button type="button" onClick={() => setCap((c) => Math.max(0, c - 1))} aria-label="Giảm" className="flex h-10 w-10 items-center justify-center border-0 bg-transparent text-maroon"><MinusIcon size={16} /></button>
            <input inputMode="numeric" value={cap} onChange={(e) => setCap(Math.min(500, Number(e.target.value.replace(/\D/g, "") || "0")))} aria-label="Số đơn tối đa" className="w-12 border-0 bg-transparent text-center font-bold tabular-nums focus:outline-none" />
            <button type="button" onClick={() => setCap((c) => Math.min(500, c + 1))} aria-label="Tăng" className="flex h-10 w-10 items-center justify-center border-0 bg-transparent text-maroon"><PlusIcon size={16} /></button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 md:justify-end">
        <Switch checked={active} onChange={(v) => { setActive(v); save({ active: v }); }} label="Nhận đơn" showLabel disabled={pending} />
        <button type="button" onClick={() => save()} disabled={!dirty || pending} className={`${btn.primary} min-h-10 px-4 text-[14px]`}>{pending ? "Đang lưu…" : "Lưu"}</button>
      </div>
    </li>
  );
}
