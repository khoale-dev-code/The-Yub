import type { ReactNode } from "react";
import type { OrderStatus, PaymentMethod, PaymentStatus } from "@/modules/orders/types";
import { orderStatusLabels, paymentLabels, paymentStatusLabels } from "@/modules/orders/types";
import type { ProductStatus } from "@/modules/products/types";

/** Lop dung chung cho giao dien Admin – mot noi chinh mau, kich thuoc. */
export const card = "rounded-[22px] border border-maroon/10 bg-card shadow-[0_1px_0_rgba(59,15,18,0.04)]";
export const btn = {
  primary:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-0 bg-maroon px-5 text-[15px] font-semibold text-cream no-underline transition-[background-color,transform] hover:bg-accent hover:text-cream active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
  butter:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-0 bg-butter px-5 text-[15px] font-bold text-maroon no-underline transition-[background-color,transform] hover:bg-[#f0b84f] hover:text-maroon active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
  secondary:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-maroon/25 bg-card px-5 text-[15px] font-semibold text-maroon no-underline transition-[border-color,background-color,transform] hover:border-maroon hover:text-maroon active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
  danger:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-accent/30 bg-transparent px-5 text-[15px] font-semibold text-accent no-underline transition-[border-color,background-color] hover:border-accent hover:bg-rose disabled:cursor-not-allowed disabled:opacity-50",
  ghost:
    "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border-0 bg-transparent px-3 text-[14px] font-semibold text-maroon no-underline hover:bg-maroon/6 hover:text-maroon disabled:opacity-50",
};
export const input =
  "min-h-11 w-full rounded-[14px] border border-maroon/20 bg-white/70 px-3.5 text-[15px] text-maroon placeholder:text-muted-2/70 focus:border-maroon focus:outline-none focus:ring-2 focus:ring-butter/50";
export const label = "flex flex-col gap-1.5 text-[14px] font-semibold text-maroon";

export function PageHeader({ title, description, actions, back }: { title: string; description?: ReactNode; actions?: ReactNode; back?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 md:mb-8">
      {back}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="m-0 font-display text-[30px] font-semibold leading-[1.1] tracking-[-0.015em] md:text-[38px]">{title}</h1>
          {description && <div className="text-[15px] text-muted">{description}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="m-0 font-display text-[21px] font-semibold leading-tight">{children}</h2>
      {aside}
    </div>
  );
}

const statusTone: Record<OrderStatus, string> = {
  pending_confirmation: "bg-butter/25 text-[#7A4A05] ring-butter/50",
  confirmed: "bg-[#E5ECF6] text-[#2C4A72] ring-[#2C4A72]/15",
  preparing: "bg-[#F0E6F4] text-[#5A3470] ring-[#5A3470]/15",
  ready: "bg-[#E3EBD3] text-[#2F4A1E] ring-[#2F4A1E]/15",
  completed: "bg-sand text-muted ring-maroon/10",
  cancelled: "bg-rose text-accent ring-accent/15",
  rejected: "bg-rose text-accent ring-accent/15",
};
const statusDot: Record<OrderStatus, string> = {
  pending_confirmation: "bg-butter",
  confirmed: "bg-[#2C4A72]",
  preparing: "bg-[#5A3470]",
  ready: "bg-[#5B8A3A]",
  completed: "bg-muted-2",
  cancelled: "bg-accent",
  rejected: "bg-accent",
};

export function OrderStatusBadge({ status, size = "md" }: { status: OrderStatus; size?: "sm" | "md" }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-semibold ring-1 ring-inset ${statusTone[status]} ${size === "sm" ? "px-2 py-0.5 text-[12px]" : "px-2.5 py-1 text-[13px]"}`}>
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${statusDot[status]}`} />
      {orderStatusLabels[status]}
    </span>
  );
}

export function StatusDot({ status }: { status: OrderStatus }) {
  return <span aria-hidden="true" className={`inline-block h-2 w-2 flex-none rounded-full ${statusDot[status]}`} />;
}

export function PaymentBadge({ method, status }: { method: PaymentMethod; status: PaymentStatus }) {
  const paid = status === "paid";
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-semibold ${paid ? "bg-[#E3EBD3] text-[#2F4A1E]" : method === "transfer" ? "bg-[#E5ECF6] text-[#2C4A72]" : "bg-beige text-muted"}`}>
      {method === "transfer" ? "CK" : "Tiền mặt"} · {paid ? "Đã nhận" : paymentStatusLabels[status]}
    </span>
  );
}

export const paymentShort = (m: PaymentMethod) => paymentLabels[m];

const productTone: Record<ProductStatus, string> = {
  ready: "bg-[#E3EBD3] text-[#2F4A1E]",
  oven: "bg-butter/30 text-[#7A4A05]",
  pre: "bg-[#E5ECF6] text-[#2C4A72]",
  out: "bg-rose text-accent",
};
export const productStatusTone = productTone;

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className={`${card} flex flex-col items-center gap-2 px-6 py-12 text-center`}>
      <span aria-hidden="true" className="mb-1 flex h-14 w-14 items-center justify-center rounded-full bg-beige font-display text-2xl text-accent">✓</span>
      <strong className="text-[17px]">{title}</strong>
      {text && <p className="m-0 max-w-[380px] text-[15px] text-muted">{text}</p>}
      {action}
    </div>
  );
}

/** "0975 840 157" -> "0975840157" (dung cho tel:/Zalo) */
export const phoneDigits = (p: string) => p.replace(/[^\d+]/g, "");
/** Zalo dung so dang 0xxxxxxxxx */
export const zaloLink = (p: string) => `https://zalo.me/${phoneDigits(p).replace(/^\+84/, "0")}`;
