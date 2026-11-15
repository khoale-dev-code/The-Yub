import type { ReactNode } from "react";

/** Mot kieu tieu de duy nhat: Fraunces 600 (khong 2 mau, khong eyebrow). */
export const h2Cls = "m-0 font-display text-[clamp(36px,4.4vw,56px)] font-semibold leading-[1.12] tracking-[-0.01em] text-balance";
export const h2SmCls = "m-0 font-display text-[clamp(32px,3.6vw,44px)] font-semibold leading-[1.15] tracking-[-0.01em] text-balance";

/** Tieu de + duong ke accent keo dai (vd "Bán chạy", "Cặp đôi ăn ý") */
export function RuledHeading({ children, as: Tag = "h2", className = h2Cls }: { children: ReactNode; as?: "h2" | "h3"; className?: string }) {
  return (
    <div className="flex items-center gap-7">
      <Tag className={`flex-none ${className}`}>{children}</Tag>
      <span aria-hidden="true" className="h-[1.5px] grow bg-accent" />
    </div>
  );
}
