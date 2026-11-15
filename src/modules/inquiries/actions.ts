"use server";

import { inquiriesRepository } from "./repository";
import { inquirySchema } from "./schema";

export type InquiryResult = { ok: true } | { ok: false; error: string };

/** Nhan cau hoi tu khach (trang Do uong). Khong log noi dung/so dien thoai. */
export async function sendInquiryAction(raw: unknown): Promise<InquiryResult> {
  const parsed = inquirySchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Thông tin chưa hợp lệ." };
  }
  try {
    await inquiriesRepository.save(parsed.data);
  } catch {
    return { ok: false, error: "Chưa gửi được, vui lòng thử lại hoặc gọi tiệm." };
  }
  return { ok: true };
}
