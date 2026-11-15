export type PaymentMethod = "cod" | "transfer";

/**
 * Vong doi don: pending_confirmation -> confirmed -> preparing -> ready -> completed
 * (nhanh phu: rejected khi chua xac nhan, cancelled sau khi da xac nhan).
 * Trang thai thanh toan DOC LAP voi trang thai don.
 */
export type OrderStatus = "pending_confirmation" | "confirmed" | "preparing" | "ready" | "completed" | "cancelled" | "rejected";

export type PaymentStatus = "unpaid" | "pending_verification" | "paid" | "refunded";

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending_confirmation: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  preparing: "Đang làm",
  ready: "Sẵn sàng nhận",
  completed: "Đã giao",
  cancelled: "Đã huỷ",
  rejected: "Từ chối",
};

/** Cach noi voi khach (trang tra cuu don) */
export const orderStatusForCustomer: Record<OrderStatus, string> = {
  pending_confirmation: "Chờ tiệm gọi xác nhận",
  confirmed: "Tiệm đã xác nhận đơn",
  preparing: "Tiệm đang chuẩn bị bánh",
  ready: "Bánh đã sẵn sàng – mời bạn ghé lấy",
  completed: "Đã nhận bánh – cảm ơn bạn!",
  cancelled: "Đơn đã huỷ",
  rejected: "Tiệm chưa nhận được đơn này",
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  unpaid: "Chưa thanh toán",
  pending_verification: "Chờ đối soát",
  paid: "Đã nhận tiền",
  refunded: "Đã hoàn tiền",
};

export interface OrderItemSnapshot {
  productId: string;
  /** Snapshot ten + gia tai thoi diem dat – khong truy nguoc gia hien tai */
  name: string;
  unitPriceVnd: number;
  qty: number;
  lineTotalVnd: number;
  /** Quy cach da chon (de Admin sua don) */
  variantId?: string;
}

export interface Order {
  code: string;
  /** Token bi mat di kem ma don – bat buoc khi tra cuu don (ma don khong du de xac thuc) */
  accessToken: string;
  /** Chong gui trung don khi khach bam nhieu lan / mang cham */
  idempotencyKey: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  /** Ly do tu choi / huy (hien cho khach) */
  statusNote: string | null;
  customerName: string;
  customerPhone: string;
  /** yyyy-mm-dd */
  pickupDate: string;
  pickupSlotId: string;
  payment: PaymentMethod;
  note: string;
  items: OrderItemSnapshot[];
  totalVnd: number;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
}

export const paymentLabels: Record<PaymentMethod, string> = {
  cod: "Trả khi nhận bánh",
  transfer: "Chuyển khoản",
};

export const paymentHints: Record<PaymentMethod, string> = {
  cod: "Tiền mặt hoặc quẹt thẻ tại quầy",
  transfer: "Tiệm gửi thông tin chuyển khoản khi gọi xác nhận đơn – tiệm tự đối soát, không tự động xác nhận",
};

/** Thong tin tra ve cho khach ngay sau khi dat – lay tu snapshot server, khong tu client. */
export interface OrderReceipt {
  code: string;
  accessToken: string;
  pickupDate: string;
  pickupSlotId: string;
  payment: PaymentMethod;
  items: { name: string; qty: number; lineTotalVnd: number }[];
  totalVnd: number;
}

export function toReceipt(order: Order): OrderReceipt {
  return {
    code: order.code,
    accessToken: order.accessToken,
    pickupDate: order.pickupDate,
    pickupSlotId: order.pickupSlotId,
    payment: order.payment,
    items: order.items.map((i) => ({ name: i.name, qty: i.qty, lineTotalVnd: i.lineTotalVnd })),
    totalVnd: order.totalVnd,
  };
}
