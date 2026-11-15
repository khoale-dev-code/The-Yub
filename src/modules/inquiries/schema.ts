import { z } from "zod";

const phoneRegex = /^(0|\+84)[0-9][0-9 .-]{7,11}$/;

export const inquirySchema = z.object({
  name: z.string().trim().min(2, "Tên quá ngắn").max(80, "Tên quá dài"),
  phone: z.string().trim().regex(phoneRegex, "Số điện thoại chưa đúng định dạng"),
  message: z.string().trim().min(3, "Lời nhắn quá ngắn").max(600, "Lời nhắn tối đa 600 ký tự"),
});

export type InquiryInput = z.infer<typeof inquirySchema>;
