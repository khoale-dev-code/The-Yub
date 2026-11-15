import type { ProductStatus } from "@/modules/products/types";

export const statusMeta: Record<ProductStatus, { label: string; className: string }> = {
  ready: { label: "Có sẵn", className: "bg-[#e3ebd3] text-[#2f4a1e]" },
  oven: { label: "Ra lò 14:30", className: "bg-[#f6d58e] text-maroon" },
  pre: { label: "Đặt trước 1 ngày", className: "bg-[#f1dccb] text-[#5a1d20]" },
  out: { label: "Hết hôm nay", className: "bg-[#e8ddd0] text-[#6b5a50]" },
};

export function StatusBadge({ status, className = "" }: { status: ProductStatus; className?: string }) {
  const meta = statusMeta[status];
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${meta.className} ${className}`}>
      {meta.label}
    </span>
  );
}
