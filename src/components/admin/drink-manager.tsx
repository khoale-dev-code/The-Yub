"use client";

import { useMemo, useState, useTransition } from "react";
import { saveDrinkAction } from "@/modules/admin/actions";
import { drinkGroupLabels, drinkGroups, type Drink, type DrinkGroup } from "@/modules/products/types";
import { PlusIcon } from "./admin-icons";
import { DeleteButton } from "./delete-button";
import { Switch } from "./switch";
import { toast } from "./toast";
import { btn, card, input, label } from "./ui";

type Temp = "hot" | "ice";
const parsePrice = (s: string) => Number(s.replace(/\D/g, "") || "0");
const showPrice = (n: number | null) => (n ? n.toLocaleString("vi-VN") : "");

interface Draft {
  id: string | null;
  name: string;
  description: string;
  group: DrinkGroup;
  temps: Temp[];
  priceMVnd: number;
  priceLVnd: number | null;
  isActive: boolean;
  soldOut: boolean;
}

const toDraft = (d: Drink): Draft => ({
  id: d.id,
  name: d.name,
  description: d.description,
  group: d.group,
  temps: d.temps,
  priceMVnd: d.priceMVnd,
  priceLVnd: d.priceLVnd,
  isActive: d.isActive !== false,
  soldOut: d.soldOut === true,
});

const same = (a: Draft, b: Draft) => JSON.stringify(a) === JSON.stringify(b);

function useSave() {
  const [pending, start] = useTransition();
  const save = (draft: Draft, msg: string, after?: (id: string) => void) =>
    start(async () => {
      const res = await saveDrinkAction(draft);
      if (res.ok) {
        toast(msg);
        if (res.id) after?.(res.id);
      } else toast(res.error, "error");
    });
  return { pending, save };
}

function TempPicker({ value, onChange, disabled }: { value: Temp[]; onChange: (v: Temp[]) => void; disabled?: boolean }) {
  return (
    <div role="group" aria-label="Nóng / đá" className="flex gap-1.5">
      {(["hot", "ice"] as const).map((t) => {
        const on = value.includes(t);
        return (
          <button
            key={t}
            type="button"
            aria-pressed={on}
            disabled={disabled}
            onClick={() => onChange(on ? value.filter((x) => x !== t) : [...value, t])}
            className={`min-h-9 rounded-full border px-3 text-[13px] font-semibold ${on ? (t === "hot" ? "border-accent bg-rose text-accent" : "border-maroon bg-beige text-maroon") : "border-maroon/15 bg-card text-muted"}`}
          >
            {t === "hot" ? "Nóng" : "Đá"}
          </button>
        );
      })}
    </div>
  );
}

function PriceInputs({ d, set }: { d: Draft; set: (p: Partial<Draft>) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <label className="flex flex-col gap-1 text-[12px] font-semibold text-muted">
        Size M
        <input inputMode="numeric" value={showPrice(d.priceMVnd)} onChange={(e) => set({ priceMVnd: parsePrice(e.target.value) })} className={`${input} min-h-10 tabular-nums`} />
      </label>
      <label className="flex flex-col gap-1 text-[12px] font-semibold text-muted">
        Size L
        <input inputMode="numeric" value={showPrice(d.priceLVnd)} onChange={(e) => set({ priceLVnd: e.target.value.trim() ? parsePrice(e.target.value) : null })} placeholder="Không có" className={`${input} min-h-10 tabular-nums`} />
      </label>
    </div>
  );
}

function DrinkRow({ drink, canDelete }: { drink: Drink; canDelete: boolean }) {
  const saved = useMemo(() => toDraft(drink), [drink]);
  const [d, setD] = useState<Draft>(saved);
  const [open, setOpen] = useState(false);
  const { pending, save } = useSave();
  const set = (p: Partial<Draft>) => setD((x) => ({ ...x, ...p }));
  const dirty = !same(d, saved);

  const toggle = (p: Partial<Draft>, msg: string) => {
    const next = { ...d, ...p };
    setD(next);
    save(next, msg);
  };

  return (
    <li className={`${card} flex flex-col gap-3 p-3.5 md:p-4 ${d.isActive ? "" : "opacity-70"}`}>
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_240px_auto] md:items-center md:gap-5">
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <strong className={`text-[16px] ${d.soldOut ? "text-muted line-through decoration-1" : ""}`}>{drink.name}</strong>
            {drink.temps.map((t) => (
              <span key={t} className={`rounded-full px-2 py-px text-[11px] font-semibold ${t === "hot" ? "bg-rose text-accent" : "bg-beige text-ink"}`}>{t === "hot" ? "Nóng" : "Đá"}</span>
            ))}
            {d.soldOut && <span className="rounded-full bg-accent px-2 py-px text-[11px] font-semibold text-cream">Hết</span>}
            {!d.isActive && <span className="rounded-full bg-maroon/10 px-2 py-px text-[11px] font-semibold">Đang ẩn</span>}
          </div>
          <span className="truncate text-[13px] text-muted">{drink.description || "—"}</span>
          <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="mt-0.5 min-h-8 self-start border-0 bg-transparent p-0 text-[13px] font-semibold text-muted underline underline-offset-4 hover:text-maroon">
            {open ? "Thu gọn" : canDelete ? "Sửa / xoá" : "Sửa tên, mô tả, nhóm"}
          </button>
        </div>
        <PriceInputs d={d} set={set} />
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 md:justify-end">
          <Switch checked={!d.soldOut} onChange={(v) => toggle({ soldOut: !v }, v ? `${drink.name}: còn hàng` : `${drink.name}: tạm hết`)} label="Còn hàng" showLabel disabled={pending} />
          <Switch checked={d.isActive} onChange={(v) => toggle({ isActive: v }, v ? `Đã hiện ${drink.name}` : `Đã ẩn ${drink.name}`)} label="Hiện" showLabel disabled={pending} />
        </div>
      </div>

      {open && (
        <div className="grid gap-3 border-t border-maroon/8 pt-3 md:grid-cols-2">
          <label className={label}>
            Tên
            <input value={d.name} onChange={(e) => set({ name: e.target.value })} maxLength={80} className={input} />
          </label>
          <label className={label}>
            Nhóm
            <select value={d.group} onChange={(e) => set({ group: e.target.value as DrinkGroup })} className={input}>
              {drinkGroups.map((g) => <option key={g} value={g}>{drinkGroupLabels[g]}</option>)}
            </select>
          </label>
          <label className={`${label} md:col-span-2`}>
            Mô tả ngắn
            <input value={d.description} onChange={(e) => set({ description: e.target.value })} maxLength={160} className={input} />
          </label>
          <div className="flex flex-col gap-1.5 text-[14px] font-semibold">
            Phục vụ
            <TempPicker value={d.temps} onChange={(temps) => set({ temps })} />
          </div>
          {canDelete && (
            <div className="md:col-span-2 md:max-w-[360px]">
              <DeleteButton kind="drink" id={drink.id} name={drink.name} note="Chỉ muốn tạm ngừng bán thì tắt “Hiện” hoặc “Còn hàng”." />
            </div>
          )}
        </div>
      )}

      {dirty && (
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-maroon/8 pt-3">
          <div className="flex gap-2">
            <button type="button" onClick={() => setD(saved)} className={`${btn.ghost} text-muted`}>Hoàn tác</button>
            <button type="button" disabled={pending} onClick={() => save(d, `Đã lưu ${d.name}`)} className={`${btn.primary} min-h-10 px-5 text-[14px]`}>
              {pending ? "Đang lưu…" : "Lưu"}
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

const EMPTY: Draft = { id: null, name: "", description: "", group: "coffee", temps: ["ice"], priceMVnd: 0, priceLVnd: null, isActive: true, soldOut: false };

function NewDrink({ onDone }: { onDone: () => void }) {
  const [d, setD] = useState<Draft>(EMPTY);
  const { pending, save } = useSave();
  const set = (p: Partial<Draft>) => setD((x) => ({ ...x, ...p }));
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save(d, `Đã thêm ${d.name}`, () => {
          setD(EMPTY);
          onDone();
        });
      }}
      className={`${card} grid gap-4 p-4 ring-2 ring-butter md:grid-cols-2 md:p-6`}
    >
      <h2 className="m-0 font-display text-[20px] font-semibold md:col-span-2">Thêm đồ uống</h2>
      <label className={label}>
        Tên
        <input value={d.name} onChange={(e) => set({ name: e.target.value })} required maxLength={80} placeholder="VD: Matcha đá xay" className={input} autoFocus />
      </label>
      <label className={label}>
        Nhóm
        <select value={d.group} onChange={(e) => set({ group: e.target.value as DrinkGroup })} className={input}>
          {drinkGroups.map((g) => <option key={g} value={g}>{drinkGroupLabels[g]}</option>)}
        </select>
      </label>
      <label className={`${label} md:col-span-2`}>
        Mô tả ngắn
        <input value={d.description} onChange={(e) => set({ description: e.target.value })} maxLength={160} placeholder="VD: Matcha Nhật, sữa tươi, ít ngọt." className={input} />
      </label>
      <div className="flex flex-col gap-1.5 text-[14px] font-semibold">
        Phục vụ
        <TempPicker value={d.temps} onChange={(temps) => set({ temps })} />
      </div>
      <PriceInputs d={d} set={set} />
      <div className="flex gap-2 md:col-span-2">
        <button type="submit" disabled={pending} className={btn.primary}>{pending ? "Đang lưu…" : "Thêm đồ uống"}</button>
        <button type="button" onClick={onDone} className={btn.secondary}>Huỷ</button>
      </div>
    </form>
  );
}

/** Quan ly do uong: gia M/L, con/het, an/hien – web cap nhat ngay sau khi luu */
export function DrinkManager({ drinks, canDelete = false }: { drinks: Drink[]; canDelete?: boolean }) {
  const [group, setGroup] = useState<DrinkGroup | "all">("all");
  const [adding, setAdding] = useState(false);
  const visible = drinks.filter((d) => group === "all" || d.group === group);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {(["all", ...drinkGroups] as const).map((g) => (
            <button key={g} type="button" onClick={() => setGroup(g)} aria-pressed={group === g} className={`min-h-10 flex-none rounded-full border-0 px-3.5 text-[14px] font-semibold ${group === g ? "bg-dark text-cream" : "bg-transparent text-muted hover:bg-maroon/5"}`}>
              {g === "all" ? "Tất cả" : drinkGroupLabels[g]}
            </button>
          ))}
        </div>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className={btn.primary}>
            <PlusIcon size={17} /> Thêm đồ uống
          </button>
        )}
      </div>
      {adding && <NewDrink onDone={() => setAdding(false)} />}
      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
        {visible.map((d) => (
          <DrinkRow key={`${d.id}-${d.priceMVnd}-${d.priceLVnd}-${d.soldOut}-${d.isActive}-${d.name}`} drink={d} canDelete={canDelete} />
        ))}
      </ul>
      <p className="m-0 text-[13px] text-muted">Giá hiện trên thực đơn trang Đồ uống. Đồ uống “Hết” vẫn hiện nhưng mờ đi; “Ẩn” thì không hiện trên web.</p>
    </div>
  );
}
