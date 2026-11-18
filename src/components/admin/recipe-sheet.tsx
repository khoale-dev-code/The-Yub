import { CheckIcon } from "./admin-icons";
import type { RecipeFields } from "@/modules/recipes/types";

const lines = (value: string) => value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

export function RecipeSheet({ recipe }: { recipe: RecipeFields }) {
  return <div className="space-y-6">
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-y border-[#dfd1ba] py-3">
      <span className="text-sm text-muted">Thành phẩm</span><strong className="break-words text-base">{recipe.batch}</strong>
    </div>
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)]">
      <section className="min-w-0 rounded-xl border border-maroon/10 bg-white p-4">
        <h3 className="m-0 font-display text-[23px] font-medium">Nguyên liệu</h3>
        <ul className="m-0 mt-2 list-none divide-y divide-maroon/10 p-0">{lines(recipe.ingredients).map((line, index) => {
          const split = /^(.*?)\s+[—–-]\s+(.+)$/.exec(line);
          return <li key={index} className="flex flex-wrap justify-between gap-x-2 gap-y-0.5 py-2.5 text-sm leading-relaxed">
            <span className="min-w-0 break-words">{split?.[1] ?? line}</span>
            {split && <strong className="tabular-nums">{split[2]}</strong>}
          </li>;
        })}</ul>
      </section>
      <section className="min-w-0">
        <h3 className="m-0 font-display text-[24px] font-medium">Cách làm</h3>
        <ol className="m-0 mt-3 list-none space-y-4 p-0">{lines(recipe.steps).map((line, index) =>
          <li key={index} className="grid grid-cols-[1.7rem_minmax(0,1fr)] gap-2.5">
            <span aria-hidden="true" className="grid h-7 place-items-center rounded-full border border-maroon/15 bg-[#f8f0df] text-xs font-bold tabular-nums">{index + 1}</span>
            <span className="break-words text-[15px] leading-[1.7]">{line}</span>
          </li>)}</ol>
      </section>
    </div>
    {recipe.notes && <aside className="border-l-[3px] border-[#b68a46] pl-4">
      <h3 className="m-0 flex items-center gap-1.5 text-sm font-bold"><CheckIcon size={15} />Ghi chú khi làm</h3>
      <p className="mb-0 mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-muted">{recipe.notes}</p>
    </aside>}
  </div>;
}
