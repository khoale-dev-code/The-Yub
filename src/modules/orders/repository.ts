import { randomBytes, randomUUID } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { slotsRepository } from "@/modules/slots/repository";
import type { Order, OrderItemSnapshot, OrderStatus, PaymentMethod, PaymentStatus } from "./types";

/** Du lieu don da tinh gia o service – repository chi luu. */
export interface OrderDraft {
  idempotencyKey: string | null;
  customerName: string;
  customerPhone: string;
  pickupDate: string;
  pickupSlotId: string;
  payment: PaymentMethod;
  note: string;
  items: (OrderItemSnapshot & { variantId?: string; variantLabel?: string })[];
  totalVnd: number;
}

export type OrderCreateErrorCode = "SLOT_FULL" | "SLOT_UNAVAILABLE" | "UNKNOWN";
export class OrderCreateError extends Error {
  constructor(public readonly code: OrderCreateErrorCode) {
    super(code);
  }
}

export interface OrderFilter {
  statuses?: OrderStatus[];
  pickupDate?: string;
  /** Khoang ngay nhan (yyyy-mm-dd, gom ca 2 dau) – dung cho bao cao */
  pickupFrom?: string;
  pickupTo?: string;
  /** Tim theo ma don hoac so dien thoai */
  q?: string;
  limit?: number;
}

export interface OrderUpdate {
  status?: OrderStatus;
  statusNote?: string | null;
  paymentStatus?: PaymentStatus;
  confirmedAt?: string;
  paidAt?: string | null;
}

export interface OrdersRepository {
  create(draft: OrderDraft): Promise<Order>;
  findByCode(code: string): Promise<Order | null>;
  list(filter: OrderFilter): Promise<Order[]>;
  /** Dem so don theo trang thai (khong tai noi dung don – dung cho so tren menu) */
  count(statuses: OrderStatus[]): Promise<number>;
  /** So don theo khung gio cua 1 ngay (khong tinh don huy/tu choi) */
  slotUsage(date: string): Promise<Record<string, number>>;
  /** Admin sua thong tin + mon (tinh lai tong o service). false = don da doi trang thai */
  updateFull(code: string, expectedStatus: OrderStatus, data: Omit<OrderDraft, "idempotencyKey">): Promise<boolean>;
  /** Xoa han don – chi don da huy / tu choi. false = khong xoa duoc */
  remove(code: string): Promise<boolean>;
  /** Cap nhat co dieu kien: chi ghi khi trang thai hien tai van la `expected` (tranh 2 nguoi bam cung luc) */
  update(code: string, expected: { status?: OrderStatus; paymentStatus?: PaymentStatus }, patch: OrderUpdate): Promise<boolean>;
}

const ACTIVE = (s: OrderStatus) => s !== "cancelled" && s !== "rejected";
/** Chi giu ky tu an toan khi tim kiem (tranh chen bo loc PostgREST) */
export const sanitizeQuery = (q: string) => q.replace(/[^0-9A-Za-z-]/g, "").slice(0, 20);

// ---------------------------------------------------------------- local (demo)
function store(): Map<string, Order> {
  const g = globalThis as typeof globalThis & { __yubOrders?: Map<string, Order> };
  g.__yubOrders ??= new Map<string, Order>();
  return g.__yubOrders;
}

function localCode(): string {
  const day = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit" }).format(new Date()).replace("/", "");
  for (;;) {
    const code = `YUB-${day}-${1000 + (randomBytes(2).readUInt16BE(0) % 9000)}`;
    if (!store().has(code)) return code;
  }
}

const localRepository: OrdersRepository = {
  async create(d) {
    if (d.idempotencyKey) {
      for (const o of store().values()) if (o.idempotencyKey === d.idempotencyKey) return o;
    }
    const slot = (await slotsRepository.list()).find((s) => s.id === d.pickupSlotId);
    if (!slot || !slot.isActive) throw new OrderCreateError("SLOT_UNAVAILABLE");
    if (slot.capacity !== null) {
      const used = (await this.slotUsage(d.pickupDate))[slot.id] ?? 0;
      if (used >= slot.capacity) throw new OrderCreateError("SLOT_FULL");
    }
    const now = new Date().toISOString();
    const order: Order = {
      code: localCode(),
      accessToken: randomUUID(),
      idempotencyKey: d.idempotencyKey,
      status: "pending_confirmation",
      paymentStatus: "unpaid",
      statusNote: null,
      customerName: d.customerName,
      customerPhone: d.customerPhone,
      pickupDate: d.pickupDate,
      pickupSlotId: d.pickupSlotId,
      payment: d.payment,
      note: d.note,
      items: d.items.map(({ productId, name, unitPriceVnd, qty, lineTotalVnd, variantId }) => ({ productId, name, unitPriceVnd, qty, lineTotalVnd, variantId })),
      totalVnd: d.totalVnd,
      createdAt: now,
      updatedAt: now,
      paidAt: null,
    };
    store().set(order.code, order);
    return order;
  },
  async findByCode(code) {
    const o = store().get(code);
    return o ? { ...o } : null;
  },
  async list(f) {
    const q = f.q ? sanitizeQuery(f.q).toLowerCase() : "";
    return [...store().values()]
      .filter((o) => !f.statuses || f.statuses.includes(o.status))
      .filter((o) => !f.pickupDate || o.pickupDate === f.pickupDate)
      .filter((o) => (!f.pickupFrom || o.pickupDate >= f.pickupFrom) && (!f.pickupTo || o.pickupDate <= f.pickupTo))
      .filter((o) => !q || o.code.toLowerCase().includes(q) || o.customerPhone.replace(/\D/g, "").includes(q))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, f.limit ?? 200)
      .map((o) => ({ ...o }));
  },
  async updateFull(code, expectedStatus, d) {
    const o = store().get(code);
    if (!o || o.status !== expectedStatus) return false;
    if (d.pickupDate !== o.pickupDate || d.pickupSlotId !== o.pickupSlotId) {
      const slot = (await slotsRepository.list()).find((s) => s.id === d.pickupSlotId);
      if (!slot || !slot.isActive) throw new OrderCreateError("SLOT_UNAVAILABLE");
      if (slot.capacity !== null && ((await this.slotUsage(d.pickupDate))[slot.id] ?? 0) >= slot.capacity) throw new OrderCreateError("SLOT_FULL");
    }
    Object.assign(o, {
      customerName: d.customerName,
      customerPhone: d.customerPhone,
      pickupDate: d.pickupDate,
      pickupSlotId: d.pickupSlotId,
      payment: d.payment,
      note: d.note,
      items: d.items.map(({ productId, name, unitPriceVnd, qty, lineTotalVnd, variantId }) => ({ productId, name, unitPriceVnd, qty, lineTotalVnd, variantId })),
      totalVnd: d.totalVnd,
      updatedAt: new Date().toISOString(),
    });
    return true;
  },
  async remove(code) {
    const o = store().get(code);
    if (!o || (o.status !== "cancelled" && o.status !== "rejected")) return false;
    return store().delete(code);
  },
  async count(statuses) {
    let n = 0;
    for (const o of store().values()) if (statuses.includes(o.status)) n++;
    return n;
  },
  async slotUsage(date) {
    const usage: Record<string, number> = {};
    for (const o of store().values()) {
      if (o.pickupDate === date && ACTIVE(o.status)) usage[o.pickupSlotId] = (usage[o.pickupSlotId] ?? 0) + 1;
    }
    return usage;
  },
  async update(code, expected, patch) {
    const o = store().get(code);
    if (!o) return false;
    if (expected.status && o.status !== expected.status) return false;
    if (expected.paymentStatus && o.paymentStatus !== expected.paymentStatus) return false;
    if (patch.status) o.status = patch.status;
    if (patch.statusNote !== undefined) o.statusNote = patch.statusNote;
    if (patch.paymentStatus) o.paymentStatus = patch.paymentStatus;
    if (patch.paidAt !== undefined) o.paidAt = patch.paidAt;
    o.updatedAt = new Date().toISOString();
    return true;
  },
};

// ---------------------------------------------------------------- supabase
interface OrderRow {
  code: string;
  access_token: string;
  idempotency_key: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  status_note: string | null;
  customer_name: string;
  customer_phone: string;
  pickup_date: string;
  pickup_slot_id: string;
  payment_method: PaymentMethod;
  note: string;
  total_vnd: number;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
  order_items: { product_id: string | null; name_snapshot: string; unit_price_vnd: number; qty: number; line_total_vnd: number; variant_id: string | null }[] | null;
}

const ORDER_SELECT =
  "code, access_token, idempotency_key, status, payment_status, status_note, customer_name, customer_phone, pickup_date, pickup_slot_id, payment_method, note, total_vnd, created_at, updated_at, paid_at, order_items(product_id, name_snapshot, unit_price_vnd, qty, line_total_vnd, variant_id)";

function fromRow(r: OrderRow): Order {
  return {
    code: r.code,
    accessToken: r.access_token,
    idempotencyKey: r.idempotency_key,
    status: r.status,
    paymentStatus: r.payment_status,
    statusNote: r.status_note,
    customerName: r.customer_name,
    customerPhone: r.customer_phone,
    pickupDate: r.pickup_date,
    pickupSlotId: r.pickup_slot_id,
    payment: r.payment_method,
    note: r.note,
    items: (r.order_items ?? []).map((i) => ({ productId: i.product_id ?? "", name: i.name_snapshot, unitPriceVnd: i.unit_price_vnd, qty: i.qty, lineTotalVnd: i.line_total_vnd, variantId: i.variant_id ?? undefined })),
    totalVnd: r.total_vnd,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    paidAt: r.paid_at,
  };
}

function supabaseRepository(): OrdersRepository | null {
  const db = getSupabaseAdmin();
  if (!db) return null;
  const repo: OrdersRepository = {
    async create(d) {
      const { data, error } = await db.rpc("create_order", {
        p_order: {
          idempotency_key: d.idempotencyKey,
          customer_name: d.customerName,
          customer_phone: d.customerPhone,
          pickup_date: d.pickupDate,
          pickup_slot_id: d.pickupSlotId,
          note: d.note,
          payment_method: d.payment,
          total_vnd: d.totalVnd,
        },
        p_items: d.items.map((i) => ({
          // Mon seed local (id "p-...") khong phai uuid -> de trong
          product_id: /^[0-9a-f-]{36}$/i.test(i.productId) ? i.productId : "",
          name: i.name,
          unit_price_vnd: i.unitPriceVnd,
          qty: i.qty,
          line_total_vnd: i.lineTotalVnd,
          variant_id: i.variantId ?? "",
          variant_label: i.variantLabel ?? "",
        })),
      });
      if (error) {
        if (error.message.includes("SLOT_FULL")) throw new OrderCreateError("SLOT_FULL");
        if (error.message.includes("SLOT_UNAVAILABLE")) throw new OrderCreateError("SLOT_UNAVAILABLE");
        throw new OrderCreateError("UNKNOWN");
      }
      const row = (data as { order_code: string }[] | null)?.[0];
      const created = row ? await repo.findByCode(row.order_code) : null;
      if (!created) throw new OrderCreateError("UNKNOWN");
      return created;
    },
    async findByCode(code) {
      const { data, error } = await db.from("orders").select(ORDER_SELECT).eq("code", code).maybeSingle();
      if (error) throw new Error(`Không đọc được đơn (${error.code}).`);
      return data ? fromRow(data as unknown as OrderRow) : null;
    },
    async list(f) {
      // Supabase tra toi da 1000 dong/lan -> doc theo trang khi can nhieu hon (bao cao)
      const limit = f.limit ?? 200;
      const PAGE = 1000;
      const rows: OrderRow[] = [];
      for (let start = 0; start < limit; start += PAGE) {
        let query = db.from("orders").select(ORDER_SELECT).order("created_at", { ascending: false }).range(start, Math.min(start + PAGE, limit) - 1);
        if (f.statuses?.length) query = query.in("status", f.statuses);
        if (f.pickupDate) query = query.eq("pickup_date", f.pickupDate);
        if (f.pickupFrom) query = query.gte("pickup_date", f.pickupFrom);
        if (f.pickupTo) query = query.lte("pickup_date", f.pickupTo);
        const q = f.q ? sanitizeQuery(f.q) : "";
        if (q) query = query.or(`code.ilike.%${q}%,customer_phone.ilike.%${q}%`);
        const { data, error } = await query;
        if (error) throw new Error(`Không đọc được danh sách đơn (${error.code}).`);
        const page = data as unknown as OrderRow[];
        rows.push(...page);
        if (page.length < Math.min(PAGE, limit - start)) break;
      }
      return rows.map(fromRow);
    },
    async updateFull(code, expectedStatus, d) {
      const { data, error } = await db.rpc("update_order", {
        p_code: code,
        p_expected_status: expectedStatus,
        p_order: {
          customer_name: d.customerName,
          customer_phone: d.customerPhone,
          pickup_date: d.pickupDate,
          pickup_slot_id: d.pickupSlotId,
          note: d.note,
          payment_method: d.payment,
          total_vnd: d.totalVnd,
        },
        p_items: d.items.map((i) => ({
          product_id: /^[0-9a-f-]{36}$/i.test(i.productId) ? i.productId : "",
          name: i.name,
          unit_price_vnd: i.unitPriceVnd,
          qty: i.qty,
          line_total_vnd: i.lineTotalVnd,
          variant_id: i.variantId ?? "",
          variant_label: i.variantLabel ?? "",
        })),
      });
      if (error) {
        if (error.message.includes("SLOT_FULL")) throw new OrderCreateError("SLOT_FULL");
        if (error.message.includes("SLOT_UNAVAILABLE")) throw new OrderCreateError("SLOT_UNAVAILABLE");
        throw new OrderCreateError("UNKNOWN");
      }
      return data === true;
    },
    async remove(code) {
      const { data, error } = await db.rpc("delete_order", { p_code: code });
      if (error) throw new Error(`Không xoá được đơn (${error.code}).`);
      return data === true;
    },
    async count(statuses) {
      const { count, error } = await db.from("orders").select("code", { count: "exact", head: true }).in("status", statuses);
      if (error) throw new Error(`Không đếm được đơn (${error.code}).`);
      return count ?? 0;
    },
    async slotUsage(date) {
      const { data, error } = await db.from("orders").select("pickup_slot_id, status").eq("pickup_date", date);
      if (error) throw new Error(`Không đọc được khung giờ (${error.code}).`);
      const usage: Record<string, number> = {};
      for (const r of (data ?? []) as { pickup_slot_id: string; status: OrderStatus }[]) {
        if (ACTIVE(r.status)) usage[r.pickup_slot_id] = (usage[r.pickup_slot_id] ?? 0) + 1;
      }
      return usage;
    },
    async update(code, expected, patch) {
      const row: Record<string, unknown> = {};
      if (patch.status) row.status = patch.status;
      if (patch.statusNote !== undefined) row.status_note = patch.statusNote;
      if (patch.paymentStatus) row.payment_status = patch.paymentStatus;
      if (patch.confirmedAt) row.confirmed_at = patch.confirmedAt;
      if (patch.paidAt !== undefined) row.paid_at = patch.paidAt;
      let query = db.from("orders").update(row).eq("code", code);
      if (expected.status) query = query.eq("status", expected.status);
      if (expected.paymentStatus) query = query.eq("payment_status", expected.paymentStatus);
      const { data, error } = await query.select("code");
      if (error) throw new Error(`Không cập nhật được đơn (${error.code}).`);
      return (data ?? []).length > 0;
    },
  };
  return repo;
}

export function getOrdersRepository(): OrdersRepository {
  return supabaseRepository() ?? localRepository;
}
