import { CakeIcon, CupIcon } from "./admin-icons";
import type { RecipeKind } from "@/modules/recipes/types";

export function RecipeNav({ kind, change }: { kind: RecipeKind; change: (kind: RecipeKind) => void }) {
  return (
    <nav aria-label="Loại công thức" className="relative isolate grid w-full grid-cols-2 rounded-xl border border-maroon/10 bg-[#eadfce] p-1">
      <span aria-hidden="true" className={`pointer-events-none absolute inset-y-1 left-1 -z-10 w-[calc(50%-0.25rem)] rounded-lg bg-maroon shadow-sm motion-safe:transition-transform motion-safe:duration-150 ${kind === "banh" ? "" : "translate-x-full"}`} />
      {(["banh", "do-uong"] as const).map((value) => {
        const Icon = value === "banh" ? CakeIcon : CupIcon;
        return <button type="button" key={value} aria-pressed={value === kind} onClick={() => change(value)}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg text-sm font-semibold ${value === kind ? "text-cream" : "text-muted"}`}>
          <Icon size={17} />{value === "banh" ? "Bánh" : "Đồ uống"}
        </button>;
      })}
    </nav>
  );
}
