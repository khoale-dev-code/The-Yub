import { z } from "zod";

const phoneRegex = /^(0|\+84)[0-9][0-9 .-]{7,11}$/;

/** Ranh gioi du lieu client -> server: moi input phai qua schema nay. */
export const orderInputSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(2, "Họ tên quá ngắn").max(80, "Họ tên quá dài"),
    phone: z.string().trim().regex(phoneRegex, "Số điện thoại chưa đúng định dạng"),
  }),
  pickupDate: z.string().trim().min(1, "Chưa chọn ngày nhận"),
  slotId: z.string().trim().min(1, "Chưa chọn khung giờ"),
  payment: z.enum(["cod", "transfer"]),
  note: z.string().trim().max(500, "Ghi chú tối đa 500 ký tự").optional(),
  idempotencyKey: z.string().uuid().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().min(1).max(20).optional(),
        qty: z.number().int().min(1).max(20),
      }),
    )
    .min(1, "Giỏ hàng đang trống")
    .max(30, "Đơn quá lớn – vui lòng liên hệ tiệm"),
});

export type OrderInput = z.infer<typeof orderInputSchema>;

/** Dung chung cho kiem tra som o client (server van validate lai toan bo). */
export const customerSchema = orderInputSchema.shape.customer;
