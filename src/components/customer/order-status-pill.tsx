import { orderStatusLabels, type OrderStatus } from "@/modules/orders/types";

const tone: Record<OrderStatus, string> = {
  pending_confirmation: "bg-butter/30 text-[#7A4A05]",
  confirmed: "bg-[#E5ECF6] text-[#2C4A72]",
  preparing: "bg-[#F0E6F4] text-[#5A3470]",
  ready: "bg-[#E3EBD3] text-[#2F4A1E]",
  completed: "bg-sand text-muted",
  cancelled: "bg-rose text-accent",
  rejected: "bg-rose text-accent",
};

export function OrderStatusPill({ status }: { status: OrderStatus }) {
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-bold ${tone[status]}`}>{orderStatusLabels[status]}</span>;
}
