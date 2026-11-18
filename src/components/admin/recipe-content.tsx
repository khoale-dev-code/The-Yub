"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type RefObject } from "react";
import { PencilIcon } from "./admin-icons";
import { btn } from "./ui";
import { RecipeSheet } from "./recipe-sheet";
import { samples } from "@/modules/recipes/samples";
import type { Recipe, RecipeKind } from "@/modules/recipes/types";

const Editor = dynamic(() => import("./recipe-editor").then((module) => module.RecipeEditor), {
  loading: () => <p role="status">Đang mở trình soạn công thức…</p>,
});

export type BookItem = { id: string; name: string; revision: string | null; sampleId?: string; example?: boolean };
export type Memory = Map<string, { recipe: Recipe; at: number }>;
type Loaded = { key: string; recipe: Recipe | null; error?: string };
export function RecipeContent({ item, kind, owner, editing, setEdit, memory, linkedAction }: {
  item: BookItem; kind: RecipeKind; owner: boolean; editing: boolean; setEdit: (edit: boolean, replace?: boolean) => void;
  memory: RefObject<Memory>; linkedAction?: { label: string; open: () => void };
}) {
  const sample = samples.find((s) => s.id === item.sampleId);
  const key = `${kind}/${item.id}/${item.revision ?? "-"}`;
  const [response, setResponse] = useState<Loaded | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!item.revision) return;
    const cached = memory.current.get(key);
    if (!attempt && cached && Date.now() - cached.at < 60000) {
      setResponse({ key, recipe: cached.recipe });
      return;
    }
    const controller = new AbortController();
    async function load() {
      try {
        const res = await fetch(`/admin/cong-thuc-data/${kind}/${encodeURIComponent(item.id)}`, {
          cache: "no-store", signal: controller.signal, headers: { Accept: "application/json" },
        });
        if (!res.headers.get("content-type")?.includes("application/json")) throw new Error("Phiên quản lý đã hết. Hãy đăng nhập lại.");
        const data = await res.json() as { recipe?: Recipe | null; error?: string };
        if (!res.ok) throw new Error(data.error ?? "Chưa tải được công thức.");
        if (controller.signal.aborted) return;
        if (data.recipe) {
          const cache = memory.current;
          if (cache.size >= 20) { const oldest = cache.keys().next().value; if (oldest) cache.delete(oldest); }
          cache.set(`${kind}/${item.id}/${data.recipe.revision}`, { recipe: data.recipe, at: Date.now() });
        }
        setResponse({ key, recipe: data.recipe ?? null });
      } catch (error) {
        if (!controller.signal.aborted) setResponse({ key, recipe: null, error: error instanceof Error ? error.message : "Chưa tải được công thức." });
      }
    }
    void load();
    return () => controller.abort();
  }, [key, item.id, item.revision, kind, memory, attempt]);

  const cached = memory.current.get(key);
  const current: Omit<Loaded, "key"> | null = !item.revision ? { recipe: null } : response?.key === key ? response :
    cached && Date.now() - cached.at < 60000 ? { recipe: cached.recipe } : null;
  const saved = current?.recipe ?? null;
  const fields = saved ?? sample;
  const canEdit = owner && !item.example;
  const status = !current ? "Đang tải" : current.error ? "Chưa tải được" : saved ? "Đã lưu" : sample ? "Mẫu tham khảo" : "Chưa có công thức";

  return <article className="min-w-0 min-[900px]:min-h-[26rem] overflow-hidden rounded-[22px] border border-[#deceb7] bg-white shadow-[0_7px_25px_-22px_#633826]">
    <header className="border-b border-[#e6d9c7] px-5 py-5 sm:px-7">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted">
        <span className="font-semibold">{kind === "banh" ? "Bếp bánh" : "Quầy pha chế"}</span><span aria-hidden="true">/</span>
        <span>{status}</span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="recipe-heading" tabIndex={-1} className="m-0 min-w-0 break-words font-display text-[clamp(1.65rem,3vw,2.35rem)] font-medium leading-tight">{item.name}</h2>
        {linkedAction && <button className={btn.secondary} type="button" onClick={linkedAction.open}>{linkedAction.label}</button>}
        {canEdit && current && !current.error && !editing && <button type="button" className={btn.secondary} onClick={() => setEdit(true)}>
          <PencilIcon size={15} />{saved ? "Sửa công thức" : sample ? "Dùng mẫu này" : "Thêm công thức"}
        </button>}
      </div>
    </header>
    <div className="p-5 sm:p-7">
      {!current ? <p role="status" className="m-0 min-h-24 text-muted">Đang tải công thức…</p> :
        current.error ? <div role="alert"><p>{current.error}</p><button className={btn.secondary} onClick={() => { setResponse(null); setAttempt((x) => x + 1); }}>Thử lại</button></div> :
        editing && canEdit ? <Editor kind={kind} id={item.id} recipe={saved} preset={sample} close={(changed) => {
          if (changed) memory.current.clear();
          setEdit(false, true);
        }} /> :
        fields ? <RecipeSheet recipe={fields} /> :
        <p className="m-0 text-muted">Món này chưa có công thức.{canEdit ? " Chọn “Thêm công thức” để nhập hoặc dùng một mẫu có sẵn." : ""}</p>}
    </div>
  </article>;
}
