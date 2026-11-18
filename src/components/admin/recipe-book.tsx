"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type MouseEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { samples, foldName } from "@/modules/recipes/samples";
import { recipeHome, type RecipeKind } from "@/modules/recipes/types";
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from "./admin-icons";
import { RecipeNav } from "./recipe-nav";
import { RecipeContent, type BookItem, type Memory } from "./recipe-content";
import { btn } from "./ui";
import styles from "./recipe-book.module.css";

type Group = { items: BookItem[]; error: string | null };
function subscribeDesktop(update: () => void) {
  const media = window.matchMedia("(min-width: 900px)");
  media.addEventListener("change", update);
  return () => media.removeEventListener("change", update);
}
const isDesktop = () => window.matchMedia("(min-width: 900px)").matches;
const serverDesktop = () => false;

function urlFor(kind: RecipeKind, item?: BookItem, edit = false, showSamples = false) {
  const p = new URLSearchParams();
  if (kind === "do-uong") p.set("loai", kind);
  if (item) p.set(item.example ? "mau" : "mon", item.id);
  if (!item && showSamples) p.set("nguon", "mau");
  if (edit) p.set("sua", "1");
  return p.size ? `${recipeHome}?${p}` : recipeHome;
}

export function RecipeBook({ groups, owner }: { groups: Record<RecipeKind, Group>; owner: boolean }) {
  const params = useSearchParams();
  const router = useRouter();
  const kind = params.get("loai") === "do-uong" ? "do-uong" : "banh";
  const requested = params.get("mon") ?? params.get("mau");
  const example = !params.has("mon") && params.has("mau");
  const group = groups[kind];
  const memory = useRef<Memory>(new Map());
  const [query, setQuery] = useState("");
  const desktop = useSyncExternalStore(subscribeDesktop, isDesktop, serverDesktop);
  const focusTarget = useRef<"detail" | "list" | null>(null);
  const lastLink = useRef<string>("");
  const sampleList: BookItem[] = useMemo(() => samples.filter((s) => s.kind === kind).map((s) =>
    ({ id: s.id, name: s.name, revision: null, sampleId: s.id, example: true })), [kind]);
  const dishes = useMemo(() => {
    const byName = new Map(sampleList.map((s) => [foldName(s.name), s.sampleId]));
    const rank = (x: BookItem) => x.revision ? 0 : x.sampleId ? 1 : 2;
    return group.items.map((dish) => ({ ...dish, sampleId: byName.get(foldName(dish.name)) }))
      .sort((a, b) => rank(a) - rank(b));
  }, [group.items, sampleList]);
  const viewingSamples = requested ? example : params.has("nguon") ? params.get("nguon") === "mau" : !dishes.length;
  const source = viewingSamples ? sampleList : dishes;
  const needle = foldName(query);
  const visible = source.filter((item) => foldName(item.name).includes(needle));
  const selected = requested ? (example ? sampleList : dishes).find((item) => item.id === requested) : visible[0];
  const linkedDish = selected?.example ? dishes.find((dish) => dish.sampleId === selected.sampleId) : undefined;
  const editing = owner && !!selected && !selected.example && params.get("sua") === "1";
  const listRoot = useRef<HTMLDivElement>(null);

  // Both panes stay in this route. Browser history records the selection without fetching a new page.
  function navigate(kind: RecipeKind, item?: BookItem, edit = false, replace = false, showSamples = false) {
    const url = urlFor(kind, item, edit, showSamples);
    if (url === location.pathname + location.search) return;
    if (replace) history.replaceState(null, "", url);
    else history.pushState(null, "", url);
  }
  function openItem(e: MouseEvent<HTMLAnchorElement>, item: BookItem) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    lastLink.current = item.id;
    if (window.matchMedia("(max-width: 899px)").matches) {
      focusTarget.current = "detail";
      window.scrollTo({ top: 0, behavior: "instant" });
    }
    navigate(kind, item);
  }
  function backToList() {
    focusTarget.current = "list";
    navigate(kind, undefined, false, false, example);
  }
  useEffect(() => {
    if (focusTarget.current === "detail") document.getElementById("recipe-heading")?.focus({ preventScroll: true });
    if (focusTarget.current === "list") {
      listRoot.current?.querySelector<HTMLElement>(`[data-dish="${CSS.escape(lastLink.current)}"]`)?.focus();
    }
    focusTarget.current = null;
  }, [requested, kind, example]);

  return <div className="recipe-book">
    <header className={`${requested ? "hidden min-[900px]:block" : ""} relative isolate mb-4 overflow-hidden rounded-[22px] bg-[#442126] px-5 py-5 text-[#fff4de] sm:mb-5 sm:px-8 sm:py-6`}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-[31%] bg-[#e8b968] [clip-path:ellipse(95%_160%_at_100%_20%)] sm:w-[27%]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-1 right-1 -z-10 w-[24%] bg-[url('/images/illustrations/flat-pour.svg')] bg-contain bg-center bg-no-repeat sm:right-[3%] sm:w-[19%]" />
      <h1 className="m-0 max-w-[72%] font-display text-[clamp(1.75rem,4vw,3rem)] font-medium leading-tight tracking-[-0.035em]">Sổ công thức</h1>
      <p className="mb-0 mt-2 max-w-[70%] text-xs text-[#efdcc8] sm:text-sm">{groups.banh.items.length} món bánh <span aria-hidden="true">·</span> {groups["do-uong"].items.length} đồ uống</p>
    </header>
    <div className="grid items-start gap-4 min-[900px]:grid-cols-[minmax(245px,0.42fr)_minmax(0,1fr)] sm:gap-5">
      <aside ref={listRoot} aria-label="Danh sách công thức" className={`min-w-0 space-y-3 min-[900px]:sticky min-[900px]:top-20 ${requested ? "hidden min-[900px]:block" : ""}`}>
        <RecipeNav kind={kind} change={(next) => { setQuery(""); navigate(next, undefined, false, false, viewingSamples); }} />
        <div className="overflow-hidden rounded-[18px] border border-[#deceb7] bg-white">
          <div className="space-y-3 border-b border-maroon/10 p-3">
            <div className="flex items-center gap-1 border-b border-maroon/10">
              {[false, true].map((isSample) => <button type="button" key={String(isSample)} aria-pressed={viewingSamples === isSample}
                onClick={() => { setQuery(""); navigate(kind, undefined, false, false, isSample); }}
                className={`min-h-11 border-b-2 px-2 text-[13px] font-semibold ${viewingSamples === isSample ? "border-maroon text-maroon" : "border-transparent text-muted"}`}>
                {isSample ? `Mẫu tham khảo (${sampleList.length})` : `Thực đơn (${dishes.length})`}
              </button>)}
            </div>
            <label className="flex min-h-11 items-center gap-2 rounded-lg border border-maroon/15 bg-white/60 px-3 text-muted focus-within:border-maroon">
              <SearchIcon size={16} /><input aria-label="Tìm món" type="search" placeholder="Tìm tên món…" value={query}
                className="min-w-0 flex-1 border-0 bg-transparent py-2 text-base text-maroon outline-none" onChange={(e) => setQuery(e.target.value)} />
            </label>
          </div>
          <div data-lenis-prevent className="min-[900px]:max-h-[max(15rem,calc(100dvh-19rem))] min-[900px]:overflow-y-auto min-[900px]:overscroll-contain">
            <ul className="m-0 list-none divide-y divide-maroon/8 p-0">{visible.map((item) => {
              const active = selected?.id === item.id && !!selected?.example === !!item.example;
              return <li key={item.id}><a href={urlFor(kind, item)} data-dish={item.id} onClick={(e) => openItem(e, item)}
                aria-current={active ? "true" : undefined}
                className={`group flex min-h-[60px] items-center gap-3 border-l-[3px] py-2.5 pl-3 pr-3 no-underline focus-visible:outline-offset-[-3px] ${active ? "border-[#a65e30] bg-[#f2e7d4]" : "border-transparent hover:bg-[#f8efe0]"}`}>
                <span className="min-w-0 flex-1"><strong className="block break-words text-[15px] font-semibold">{item.name}</strong>
                  <span className="text-xs text-muted">{item.revision ? "Đã lưu" : item.sampleId ? "Mẫu tham khảo" : "Chưa có công thức"}</span></span>
                <ChevronRightIcon size={15} className="shrink-0 text-muted" />
              </a></li>;
            })}</ul>
            {!visible.length && <p className="m-0 p-4 text-sm text-muted">{query ? "Không tìm thấy món phù hợp." : "Nhóm này chưa có món."}</p>}
          </div>
        </div>
        {group.error && <p role="alert" className="rounded-xl bg-rose p-3 text-sm">{group.error} <button className="underline" onClick={() => router.refresh()}>Tải lại</button></p>}
      </aside>
      <div className={`min-w-0 ${requested ? "" : "hidden min-[900px]:block"}`}>
        {requested && <button type="button" onClick={backToList} className={`${btn.ghost} mb-2 min-[900px]:hidden`}><ChevronLeftIcon />Danh sách {kind === "banh" ? "bánh" : "đồ uống"}</button>}
        {selected && (requested || desktop || !selected.revision) ? <div key={kind + "/" + !!selected.example + "/" + selected.id} data-recipe-paper className={styles.paper}>
          <RecipeContent kind={kind} item={selected} owner={owner} editing={editing} memory={memory}
            linkedAction={linkedDish && (owner || linkedDish.revision) ? {
              label: linkedDish.revision ? "Xem bản đã lưu" : "Dùng mẫu cho món này",
              open: () => navigate(kind, linkedDish, !linkedDish.revision),
            } : undefined}
            setEdit={(edit, replace) => navigate(kind, selected, edit, replace)} />
        </div> : <div className="rounded-2xl border border-maroon/10 bg-card p-5 text-muted">
          {requested ? "Món này không còn trong danh sách." : "Chọn một món để xem công thức."}
        </div>}
      </div>
    </div>
  </div>;
}
