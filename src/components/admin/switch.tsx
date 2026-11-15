"use client";

/** Cong tac bat/tat (role="switch") – vung bam toi thieu 44px */
export function Switch({ checked, onChange, label, disabled = false, showLabel = false }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean; showLabel?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={showLabel ? undefined : label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="inline-flex min-h-11 items-center gap-2.5 border-0 bg-transparent p-0 text-[14px] font-semibold text-maroon disabled:opacity-50"
    >
      <span className={`relative inline-flex h-7 w-12 flex-none items-center rounded-full transition-colors duration-200 ${checked ? "bg-[#5B8A3A]" : "bg-maroon/20"}`}>
        <span className={`absolute left-1 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${checked ? "translate-x-5" : ""}`} />
      </span>
      {showLabel && label}
    </button>
  );
}
