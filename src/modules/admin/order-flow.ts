import type { OrderStatus } from "@/modules/orders/types";

/** Buoc tiep theo hop le cho moi trang thai (dung chung client + server; server van kiem tra lai) */
export const nextStatuses: Record<OrderStatus, OrderStatus[]> = {
  pending_confirmation: ["confirmed", "rejected"],
  confirmed: ["preparing", "ready", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
  rejected: [],
};

/** Trang thai can ghi ly do (hien cho khach) */
export const needsReason = (s: OrderStatus) => s === "rejected" || s === "cancelled";

export const statusActionLabels: Partial<Record<OrderStatus, string>> = {
  confirmed: "Xác nhận đơn",
  preparing: "Bắt đầu làm",
  ready: "Báo bánh sẵn sàng",
  completed: "Khách đã nhận bánh",
  rejected: "Từ chối đơn",
  cancelled: "Huỷ đơn",
};

export const OPEN_STATUSES: OrderStatus[] = ["pending_confirmation", "confirmed", "preparing", "ready"];

export const quickReasons: Record<"rejected" | "cancelled", string[]> = {
  rejected: ["Hết bánh cho ngày này", "Khung giờ đã kín", "Không liên lạc được khách"],
  cancelled: ["Khách đổi ý", "Khách không đến nhận", "Hết nguyên liệu"],
};
