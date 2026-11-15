import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { AdminUser } from "./session";

/** Nhat ky thao tac Admin (don, thanh toan, mon, cai dat). Khong ghi so dien thoai / noi dung khach. */
export interface AuditEntry {
  id: string;
  actorName: string;
  action: string;
  detail: string | null;
  createdAt: string;
}

type Detail = Record<string, string | number | boolean | null>;

interface LocalEntry extends AuditEntry {
  entity: string;
  entityId: string;
}

function store(): LocalEntry[] {
  const g = globalThis as typeof globalThis & { __yubAudit?: LocalEntry[] };
  g.__yubAudit ??= [];
  return g.__yubAudit;
}

export async function logAudit(user: AdminUser, action: string, entity: string, entityId: string, detail?: Detail & { note?: string | null }): Promise<void> {
  const db = getSupabaseAdmin();
  const payload = { ...(detail ?? {}), actor_name: user.name };
  if (db && !user.demo) {
    const { error } = await db.from("audit_logs").insert({ actor: user.id, action, entity, entity_id: entityId, detail: payload });
    // Khong chan thao tac chinh neu ghi nhat ky loi – nhung bao trong log server (khong kem du lieu khach)
    if (error) console.error(`[audit] ${action} ${entity}:${entityId} failed (${error.code})`);
    return;
  }
  const s = store();
  s.push({ id: crypto.randomUUID(), entity, entityId, actorName: user.name, action, detail: detail?.note ?? null, createdAt: new Date().toISOString() });
  if (s.length > 2000) s.shift();
}

export async function listAudit(entity: string, entityId: string): Promise<AuditEntry[]> {
  const db = getSupabaseAdmin();
  if (db) {
    const { data, error } = await db
      .from("audit_logs")
      .select("id, action, detail, created_at")
      .eq("entity", entity)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return [];
    return (data as { id: number; action: string; detail: { actor_name?: string; note?: string } | null; created_at: string }[]).map((r) => ({
      id: String(r.id),
      actorName: r.detail?.actor_name ?? "Quản lý",
      action: r.action,
      detail: r.detail?.note ?? null,
      createdAt: r.created_at,
    }));
  }
  return store()
    .filter((e) => e.entity === entity && e.entityId === entityId)
    .reverse();
}
