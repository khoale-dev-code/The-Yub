import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { AdminRole, AdminUser } from "./session";

/** Tai khoan quan ly (bang admin_users + Supabase Auth). */
export interface StaffMember {
  userId: string;
  email: string;
  name: string;
  role: AdminRole;
  createdAt: string;
}

export interface NewStaff {
  email: string;
  name: string;
  role: AdminRole;
  password: string;
}

function demoStore(): StaffMember[] {
  const g = globalThis as typeof globalThis & { __yubStaff?: StaffMember[] };
  g.__yubStaff ??= [{ userId: "demo", email: "demo@local", name: "Chủ tiệm (xem thử)", role: "owner", createdAt: new Date().toISOString() }];
  return g.__yubStaff;
}

export async function listStaff(): Promise<StaffMember[]> {
  const db = getSupabaseAdmin();
  if (!db) return [...demoStore()];
  const { data, error } = await db.from("admin_users").select("user_id, display_name, role, created_at").order("created_at");
  if (error) throw new Error(`Không đọc được danh sách tài khoản (${error.code}).`);
  const rows = data as { user_id: string; display_name: string; role: AdminRole; created_at: string }[];
  const emails = await Promise.all(rows.map(async (r) => (await db.auth.admin.getUserById(r.user_id)).data.user?.email ?? ""));
  return rows.map((r, i) => ({ userId: r.user_id, email: emails[i] ?? "", name: r.display_name, role: r.role, createdAt: r.created_at }));
}

const ownersLeft = (list: StaffMember[], exceptId: string) => list.filter((s) => s.role === "owner" && s.userId !== exceptId).length;

export async function addStaff(input: NewStaff): Promise<void> {
  const db = getSupabaseAdmin();
  if (!db) {
    const store = demoStore();
    if (store.some((s) => s.email === input.email)) throw new Error("Email này đã có trong danh sách.");
    store.push({ userId: crypto.randomUUID(), email: input.email, name: input.name, role: input.role, createdAt: new Date().toISOString() });
    return;
  }
  // Tao tai khoan dang nhap (da xac nhan email). Neu email da ton tai thi chi cap quyen.
  let userId: string | null = null;
  const created = await db.auth.admin.createUser({ email: input.email, password: input.password, email_confirm: true });
  if (created.data.user) userId = created.data.user.id;
  else {
    const { data: page } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
    userId = page?.users.find((u) => u.email?.toLowerCase() === input.email.toLowerCase())?.id ?? null;
    if (!userId) throw new Error("Không tạo được tài khoản – kiểm tra email và mật khẩu (tối thiểu 8 ký tự).");
  }
  const { error } = await db.from("admin_users").insert({ user_id: userId, display_name: input.name, role: input.role });
  if (error) throw new Error(error.code === "23505" ? "Tài khoản này đã có quyền quản lý." : `Không cấp quyền được (${error.code}).`);
}

export async function updateStaff(actor: AdminUser, userId: string, patch: { name: string; role: AdminRole }): Promise<void> {
  const list = await listStaff();
  const target = list.find((s) => s.userId === userId);
  if (!target) throw new Error("Không tìm thấy tài khoản.");
  if (target.role === "owner" && patch.role !== "owner" && ownersLeft(list, userId) === 0) throw new Error("Phải còn ít nhất 1 chủ tiệm.");
  if (userId === actor.id && patch.role !== actor.role) throw new Error("Không tự đổi vai trò của chính mình.");
  const db = getSupabaseAdmin();
  if (!db) {
    Object.assign(target, patch);
    const s = demoStore().find((x) => x.userId === userId);
    if (s) Object.assign(s, patch);
    return;
  }
  const { error } = await db.from("admin_users").update({ display_name: patch.name, role: patch.role }).eq("user_id", userId);
  if (error) throw new Error(`Không lưu được (${error.code}).`);
}

/** Thu hoi quyen quan ly (tai khoan dang nhap van con nhung khong vao Admin duoc nua) */
export async function removeStaff(actor: AdminUser, userId: string): Promise<void> {
  if (userId === actor.id) throw new Error("Không tự xoá quyền của chính mình.");
  const list = await listStaff();
  const target = list.find((s) => s.userId === userId);
  if (!target) throw new Error("Không tìm thấy tài khoản.");
  if (target.role === "owner" && ownersLeft(list, userId) === 0) throw new Error("Phải còn ít nhất 1 chủ tiệm.");
  const db = getSupabaseAdmin();
  if (!db) {
    const store = demoStore();
    store.splice(store.findIndex((s) => s.userId === userId), 1);
    return;
  }
  const { error } = await db.from("admin_users").delete().eq("user_id", userId);
  // Lan tai trang tiep theo cua nguoi nay se bi chuyen ve trang dang nhap (khong con trong admin_users)
  if (error) throw new Error(`Không thu hồi được quyền (${error.code}).`);
}
