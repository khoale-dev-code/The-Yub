"use client";

import { samples } from "@/modules/recipes/samples";
import { toast } from "./toast";
import { useState, useTransition, type FormEvent } from "react";
import { changeRecipe } from "@/modules/recipes/actions";
import { recipeLimits, type RecipeFields, type Recipe, type RecipeKind } from "@/modules/recipes/types";
import { btn, input, label } from "./ui";

export function RecipeEditor({ kind, id, recipe, preset, close }: {
  kind: RecipeKind; id: string; recipe: Recipe | null; preset?: RecipeFields; close: (changed: boolean) => void;
}) {
  // Giữ phiên bản đã mở cùng với bản nháp, kể cả khi router làm mới dữ liệu nền.
  const [draft, setDraft] = useState<RecipeFields>(() => recipe ?? preset ?? { batch: "", ingredients: "", steps: "", notes: "" });
  const [initial] = useState(recipe);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, start] = useTransition();

  function submit(intent: "save" | "delete", data: FormData) {
    setError("");
    start(async () => {
      try {
        const message = await changeRecipe({ kind, id, revision: initial?.revision ?? null, intent }, data);
        if (message) {
          setError(message);
          return;
        }
        toast(intent === "save" ? "Đã lưu công thức." : "Đã xóa công thức.");
        close(true);
      } catch {
        setError("Mất kết nối. Hãy mở lại món để kiểm tra kết quả.");
      }
    });
  }
  function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submit("save", new FormData(event.currentTarget));
  }
  const field = `${input} !text-base font-normal`;
  return (
    <form onSubmit={onSave} className="grid gap-5">
      <fieldset disabled={pending} className="m-0 grid min-w-0 gap-5 border-0 p-0">
        <legend className="mb-4 font-display text-2xl font-semibold">{initial ? "Chỉnh sửa công thức" : "Thêm công thức"}</legend>
        {!initial && <label className={label}>Điền từ công thức mẫu
          <select className={field} defaultValue="" onChange={(e) => {
            const sample = samples.find((s) => s.kind === kind && s.id === e.target.value);
            if (sample) setDraft(sample);
            e.target.value = "";
          }}>
            <option value="">Chọn mẫu để điền vào biểu mẫu…</option>
            {samples.filter((s) => s.kind === kind).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>}
        <label className={label}>Thành phẩm mỗi lần làm
          <input name="batch" className={field} maxLength={recipeLimits.batch} value={draft.batch} onChange={(event) => setDraft({ ...draft, batch: event.target.value })} required
            placeholder={kind === "banh" ? "Ví dụ: 12 bánh, mỗi bánh 60 g" : "Ví dụ: 1 ly size M, 350 ml"} />
        </label>
        <div className="grid items-start gap-5 lg:grid-cols-2">
          <label className={label}>Nguyên liệu và định lượng
            <span className="font-normal text-muted">Mỗi dòng một nguyên liệu kèm số lượng và đơn vị.</span>
            <textarea data-lenis-prevent name="ingredients" className={`${field} resize-y py-3`} rows={7} maxLength={recipeLimits.ingredients}
              value={draft.ingredients} onChange={(event) => setDraft({ ...draft, ingredients: event.target.value })} required placeholder={kind === "banh" ? "Bột mì — 250 g" : "Cà phê — 30 ml"} />
          </label>
          <label className={label}>Các bước thực hiện
            <span className="font-normal text-muted">Mỗi dòng một bước, theo thứ tự thực hiện.</span>
            <textarea data-lenis-prevent name="steps" className={`${field} resize-y py-3`} rows={7} maxLength={recipeLimits.steps} value={draft.steps} onChange={(event) => setDraft({ ...draft, steps: event.target.value })} required />
          </label>
        </div>
        <label className={label}>Ghi chú <span className="sr-only">(tùy chọn)</span>
          <textarea data-lenis-prevent name="notes" className={`${field} resize-y py-3`} rows={2} maxLength={recipeLimits.notes}
            value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} placeholder="Lưu ý khi làm hoặc bảo quản (tùy chọn)" />
        </label>
      </fieldset>
      {error && <p role="alert" className="m-0 rounded-xl bg-rose p-3 text-accent">{error}</p>}
      <div className="flex flex-wrap items-center gap-2 border-t border-maroon/10 pt-4">
        <button className={btn.primary} disabled={pending || confirmDelete} type="submit">{pending ? "Đang xử lý…" : "Lưu công thức"}</button>
        {!pending && <button type="button" className={btn.secondary} onClick={() => close(false)}>Hủy</button>}
        {initial && !confirmDelete && <button type="button" disabled={pending} className={`${btn.ghost} sm:ml-auto`} onClick={() => setConfirmDelete(true)}>Xóa công thức</button>}
      </div>
      {confirmDelete && (
        <div className="rounded-2xl bg-rose p-4" role="group" aria-label="Xác nhận xóa">
          <p className="mb-3 mt-0">Xóa công thức của món này? Món vẫn có trong thực đơn.</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={pending} className={btn.secondary} onClick={() => setConfirmDelete(false)}>Giữ công thức</button>
            <button type="button" disabled={pending} className={btn.danger} onClick={() => submit("delete", new FormData())}>Xác nhận xóa</button>
          </div>
        </div>
      )}
    </form>
  );
}
