import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { InquiryInput } from "./schema";

export type InquiryStatus = "new" | "answered" | "archived";

export interface Inquiry extends InquiryInput {
  id: string;
  status: InquiryStatus;
  createdAt: string;
}

export const inquiryStatusLabels: Record<InquiryStatus, string> = {
  new: "Mới",
  answered: "Đã trả lời",
  archived: "Lưu trữ",
};

/** Chua cau hinh Supabase: luu tam trong bo nho server (mat khi khoi dong lai). */
function store(): Inquiry[] {
  const g = globalThis as typeof globalThis & { __yubInquiries?: Inquiry[] };
  g.__yubInquiries ??= [];
  return g.__yubInquiries;
}

interface Row {
  id: string;
  name: string;
  phone: string;
  message: string;
  status: InquiryStatus;
  created_at: string;
}
const fromRow = (r: Row): Inquiry => ({ id: r.id, name: r.name, phone: r.phone, message: r.message, status: r.status, createdAt: r.created_at });

export const inquiriesRepository = {
  async save(input: InquiryInput): Promise<void> {
    const db = getSupabaseAdmin();
    if (db) {
      const { error } = await db.from("inquiries").insert({ name: input.name, phone: input.phone, message: input.message });
      if (error) throw new Error("Không gửi được, vui lòng thử lại.");
      return;
    }
    const s = store();
    s.push({ ...input, id: crypto.randomUUID(), status: "new", createdAt: new Date().toISOString() });
    if (s.length > 500) s.shift();
  },

  async list(status?: InquiryStatus): Promise<Inquiry[]> {
    const db = getSupabaseAdmin();
    if (db) {
      let q = db.from("inquiries").select("id, name, phone, message, status, created_at").order("created_at", { ascending: false }).limit(200);
      if (status) q = q.eq("status", status);
      const { data, error } = await q;
      if (error) throw new Error(`Không đọc được hộp thư (${error.code}).`);
      return (data as Row[]).map(fromRow);
    }
    return [...store()].reverse().filter((i) => !status || i.status === status);
  },

  async countNew(): Promise<number> {
    const db = getSupabaseAdmin();
    if (db) {
      const { count, error } = await db.from("inquiries").select("id", { count: "exact", head: true }).eq("status", "new");
      if (error) return 0;
      return count ?? 0;
    }
    return store().filter((i) => i.status === "new").length;
  },

  async remove(id: string): Promise<void> {
    const db = getSupabaseAdmin();
    if (db) {
      const { error } = await db.from("inquiries").delete().eq("id", id);
      if (error) throw new Error(`Không xoá được (${error.code}).`);
      return;
    }
    const s = store();
    const idx = s.findIndex((i) => i.id === id);
    if (idx >= 0) s.splice(idx, 1);
  },

  async setStatus(id: string, status: InquiryStatus): Promise<void> {
    const db = getSupabaseAdmin();
    if (db) {
      const { error } = await db.from("inquiries").update({ status }).eq("id", id);
      if (error) throw new Error(`Không cập nhật được (${error.code}).`);
      return;
    }
    const item = store().find((i) => i.id === id);
    if (item) item.status = status;
  },
};
