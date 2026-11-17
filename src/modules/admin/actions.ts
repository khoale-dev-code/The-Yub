"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { isMapEmbedUrl, looksLikeIframe, normalizeMapEmbed } from "@/modules/settings/map";
import { MEDIA_MAX_BYTES, MEDIA_MAX_ITEMS, MEDIA_TYPES, formatMb, isMediaMime } from "@/lib/media-rules";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { storeConfig } from "@/lib/store-config";
import { deleteUploads, isValidMediaRef, MEDIA_BUCKET, mediaSrc } from "@/modules/products/media";
import { DRINKS_TAG, drinksRepository } from "@/modules/drinks/repository";
import { inquiriesRepository } from "@/modules/inquiries/repository";
import { productsRepository, PRODUCTS_TAG } from "@/modules/products/repository";
import { CATEGORIES_TAG, categoriesRepository } from "@/modules/categories/repository";
import { settingsRepository, SETTINGS_TAG } from "@/modules/settings/repository";
import { slotsRepository } from "@/modules/slots/repository";
import { logAudit } from "./audit";
import { changeOrderStatus, createOrderByAdmin, deleteOrder, editOrder, setOrderPaid } from "./orders";
import { addStaff, removeStaff, updateStaff } from "./staff";
import { orderInputSchema } from "@/modules/orders/schema";
import { ADMIN_USERS_TAG, AdminAuthError, assertAdmin } from "./session";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

const fail = (err: unknown): ActionResult => ({
  ok: false,
  error: err instanceof AdminAuthError || err instanceof Error ? err.message : "Có lỗi xảy ra, vui lòng thử lại.",
});

const firstIssue = (e: z.ZodError) => e.issues[0]?.message ?? "Thông tin chưa hợp lệ.";

// ---------------------------------------------------------------- don hang
const statusSchema = z.object({
  code: z.string().trim().regex(/^YUB-[0-9]{4}-[0-9]{4}$/, "Mã đơn không hợp lệ"),
  to: z.enum(["confirmed", "preparing", "ready", "completed", "cancelled", "rejected"]),
  note: z.string().trim().max(300, "Lý do tối đa 300 ký tự").optional(),
});

export async function updateOrderStatusAction(raw: unknown): Promise<ActionResult> {
  try {
    const user = await assertAdmin();
    const parsed = statusSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
    await changeOrderStatus(user, parsed.data.code, parsed.data.to, parsed.data.note || null);
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

const paidSchema = z.object({ code: statusSchema.shape.code, paid: z.boolean() });

export async function setOrderPaidAction(raw: unknown): Promise<ActionResult> {
  try {
    const parsed = paidSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
    // Bo danh dau "da nhan tien" chi chu tiem duoc lam
    const user = await assertAdmin(parsed.data.paid ? undefined : "owner");
    await setOrderPaid(user, parsed.data.code, parsed.data.paid);
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

// ---------------------------------------------------------------- mon
const statusEnum = z.enum(["ready", "oven", "pre", "out"]);
const priceSchema = z.number().int("Giá phải là số nguyên").min(0, "Giá không âm").max(50_000_000, "Giá quá lớn");

const quickSchema = z.object({
  id: z.string().min(1).max(64),
  status: statusEnum.optional(),
  isActive: z.boolean().optional(),
  priceVnd: priceSchema.optional(),
});

export async function updateProductQuickAction(raw: unknown): Promise<ActionResult> {
  try {
    const user = await assertAdmin();
    const parsed = quickSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
    const { id, ...patch } = parsed.data;
    await productsRepository.update(id, patch);
    await logAudit(user, "product.update", "product", id, patch);
    revalidateTag(PRODUCTS_TAG);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}


/** Ma danh muc */
const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Danh mục không hợp lệ").max(60);

const productSchema = z
  .object({
    id: z.string().min(1).max(64).nullable(),
    name: z.string().trim().min(2, "Tên món quá ngắn").max(80, "Tên món tối đa 80 ký tự"),
    slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Đường dẫn chỉ gồm chữ thường không dấu, số và dấu gạch ngang").max(80),
    category: slugSchema,
    tagline: z.string().trim().max(120, "Mô tả ngắn tối đa 120 ký tự").nullable(),
    description: z.string().trim().min(3, "Nhập mô tả món").max(600, "Mô tả tối đa 600 ký tự"),
    priceVnd: priceSchema,
    compareAtVnd: priceSchema.nullable(),
    status: statusEnum,
    media: z
      .array(z.string().max(80).refine(isValidMediaRef, "Ảnh / video không hợp lệ – vui lòng tải lại"))
      .max(MEDIA_MAX_ITEMS, `Tối đa ${MEDIA_MAX_ITEMS} ảnh / video mỗi món`)
      .refine((list) => new Set(list).size === list.length, "Có ảnh bị trùng"),
    // "center" hoac "center NN%" (du lieu cu co gia tri le nhu "center 35%")
    imagePosition: z.string().regex(/^center(?: (?:100|[1-9]?[0-9])%)?$/, "Vị trí ảnh không hợp lệ").nullable(),
    isActive: z.boolean(),
    variants: z
      .array(
        z.object({
          id: z.string().trim().regex(/^[a-z0-9-]{1,20}$/, "Mã quy cách không hợp lệ"),
          label: z.string().trim().min(1, "Nhập tên quy cách").max(40),
          priceVnd: priceSchema,
        }),
      )
      .max(8, "Tối đa 8 quy cách"),
  })
  .refine((v) => new Set(v.variants.map((x) => x.id)).size === v.variants.length, "Mã quy cách bị trùng");

export async function saveProductAction(raw: unknown): Promise<ActionResult> {
  try {
    const user = await assertAdmin();
    const parsed = productSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
    const { id, ...data } = parsed.data;
    if (!(await categoriesRepository.exists(data.category, "product"))) return { ok: false, error: "Danh mục không còn – chọn lại danh mục." };
    const savedId = await productsRepository.save(id, data);
    await logAudit(user, id ? "product.edit" : "product.create", "product", savedId, { name: data.name, price: data.priceVnd });
    revalidateTag(PRODUCTS_TAG);
    revalidatePath("/", "layout");
    return { ok: true, id: savedId };
  } catch (err) {
    return fail(err);
  }
}

// ---------------------------------------------------------------- anh / video cua mon
const uploadSchema = z.object({
  mime: z.string().refine(isMediaMime, "Chỉ nhận ảnh JPG, PNG, WebP, AVIF hoặc video MP4, WebM, MOV"),
  size: z.number().int().positive().max(MEDIA_MAX_BYTES, `File tối đa ${formatMb(MEDIA_MAX_BYTES)}`),
});

export type UploadTarget =
  | { ok: true; target: "supabase"; signedUrl: string; ref: string; src: string; kind: "image" | "video" }
  | { ok: true; target: "local" }
  | { ok: false; error: string };

/**
 * Chuan bi tai 1 file: co Supabase -> URL ky san (2 gio) de trinh duyet tai THANG len Storage
 * (khong di qua server Next – tranh gioi han 4,5 MB cua Vercel). Bucket tu chan file > 7 MB / sai loai.
 * Khong co Supabase -> tai qua POST /admin/media.
 */
export async function prepareMediaUploadAction(raw: unknown): Promise<UploadTarget> {
  try {
    await assertAdmin();
    const parsed = uploadSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
    const db = getSupabaseAdmin();
    if (!db) return { ok: true, target: "local" };
    const { ext, kind } = MEDIA_TYPES[parsed.data.mime as keyof typeof MEDIA_TYPES];
    const ref = `products/${crypto.randomUUID()}.${ext}`;
    const { data, error } = await db.storage.from(MEDIA_BUCKET).createSignedUploadUrl(ref);
    if (error || !data) {
      const msg = /bucket/i.test(error?.message ?? "") ? "Chưa có kho ảnh – chạy supabase/migrations/0006_product_media.sql." : "Không tạo được đường tải lên – thử lại.";
      return { ok: false, error: msg };
    }
    return { ok: true, target: "supabase", signedUrl: data.signedUrl, ref, src: mediaSrc(ref), kind };
  } catch (err) {
    const r = fail(err);
    return { ok: false, error: r.ok ? "Lỗi không xác định" : r.error };
  }
}

/**
 * Bo file vua tai len nhung chua luu vao mon (nguoi dung bam xoa truoc khi luu).
 * Chi xoa file KHONG thuoc mon nao – khong the dung de xoa anh cua mon khac.
 */
export async function discardUploadsAction(raw: unknown): Promise<ActionResult> {
  try {
    await assertAdmin();
    const parsed = z.array(z.string().max(80)).max(MEDIA_MAX_ITEMS).safeParse(raw);
    if (!parsed.success) return { ok: false, error: "Danh sách file không hợp lệ." };
    const used = new Set((await productsRepository.listAll()).flatMap((p) => p.media.map((m) => m.ref)));
    const free = parsed.data.filter((r) => isValidMediaRef(r) && !r.startsWith("lib:") && !used.has(r));
    await deleteUploads(free);
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

// ---------------------------------------------------------------- danh muc
const kindSchema = z.enum(["product", "drink"]);
const categoryNameSchema = z.string().trim().min(2, "Tên danh mục quá ngắn").max(60, "Tên danh mục tối đa 60 ký tự");

const afterCategoryChange = () => {
  revalidateTag(CATEGORIES_TAG);
  revalidatePath("/", "layout");
};

export async function createCategoryAction(raw: unknown): Promise<ActionResult> {
  try {
    const user = await assertAdmin();
    const parsed = z.object({ kind: kindSchema, name: categoryNameSchema }).safeParse(raw);
    if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
    const cat = await categoriesRepository.create(parsed.data.kind, parsed.data.name);
    await logAudit(user, "category.create", "category", cat.slug, { name: cat.name, kind: cat.kind });
    afterCategoryChange();
    return { ok: true, id: cat.slug };
  } catch (err) {
    return fail(err);
  }
}

export async function renameCategoryAction(raw: unknown): Promise<ActionResult> {
  try {
    const user = await assertAdmin();
    const parsed = z.object({ slug: slugSchema, name: categoryNameSchema }).safeParse(raw);
    if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
    await categoriesRepository.rename(parsed.data.slug, parsed.data.name);
    await logAudit(user, "category.rename", "category", parsed.data.slug, { name: parsed.data.name });
    afterCategoryChange();
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function reorderCategoriesAction(raw: unknown): Promise<ActionResult> {
  try {
    await assertAdmin();
    const parsed = z.object({ kind: kindSchema, slugs: z.array(slugSchema).min(1).max(50) }).safeParse(raw);
    if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
    await categoriesRepository.reorder(parsed.data.kind, parsed.data.slugs);
    afterCategoryChange();
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteCategoryAction(raw: unknown): Promise<ActionResult> {
  try {
    const user = await assertAdmin("owner");
    const parsed = z.object({ slug: slugSchema }).safeParse(raw);
    if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
    await categoriesRepository.remove(parsed.data.slug);
    await logAudit(user, "category.delete", "category", parsed.data.slug);
    afterCategoryChange();
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

// ---------------------------------------------------------------- hop thu
const inquirySchema = z.object({ id: z.string().min(1).max(64), status: z.enum(["new", "answered", "archived"]) });

export async function setInquiryStatusAction(raw: unknown): Promise<ActionResult> {
  try {
    const user = await assertAdmin();
    const parsed = inquirySchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
    await inquiriesRepository.setStatus(parsed.data.id, parsed.data.status);
    await logAudit(user, `inquiry.${parsed.data.status}`, "inquiry", parsed.data.id);
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

// ---------------------------------------------------------------- khung gio
const slotSchema = z.object({
  id: z.string().regex(/^s[0-9]{1,2}$/),
  isActive: z.boolean(),
  capacity: z.number().int().min(0, "Sức chứa không âm").max(500, "Sức chứa tối đa 500").nullable(),
});

export async function updateSlotAction(raw: unknown): Promise<ActionResult> {
  try {
    const user = await assertAdmin();
    const parsed = slotSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
    await slotsRepository.update(parsed.data.id, { isActive: parsed.data.isActive, capacity: parsed.data.capacity });
    await logAudit(user, "slot.update", "slot", parsed.data.id, { active: parsed.data.isActive, capacity: parsed.data.capacity });
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

// ---------------------------------------------------------------- cai dat
const optText = (max: number, msg: string) =>
  z
    .string()
    .trim()
    .max(max, msg)
    .transform((v) => (v === "" ? null : v))
    .nullable();
const optUrl = (prefix: string, msg: string) =>
  optText(500, "Link quá dài").refine((v) => v === null || (v.startsWith(prefix) && !/[\s"'<>]/.test(v)), msg);

const optTime = (msg: string) => optText(5, msg).refine((v) => v === null || /^([01]\d|2[0-3]):[0-5]\d$/.test(v), msg);
const minutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

const settingsSchema = z
  .object({
    storeName: optText(80, "Tên tiệm tối đa 80 ký tự").refine((v) => v === null || v.length >= 2, "Tên tiệm quá ngắn"),
    phone: optText(20, "Số điện thoại quá dài").refine(
      (v) => v === null || (/^[0-9+ .()-]+$/.test(v) && /^(\+?84|0)\d{8,10}$/.test(v.replace(/[^\d+]/g, ""))),
      "Số điện thoại chưa đúng (VD: 0975 840 157)",
    ),
    openTime: optTime("Giờ mở cửa chưa đúng (HH:mm)"),
    closeTime: optTime("Giờ đóng cửa chưa đúng (HH:mm)"),
    freshBatchTime: optTime("Giờ mẻ bánh chưa đúng (HH:mm)"),
    address: optText(200, "Địa chỉ tối đa 200 ký tự"),
    mapUrl: z.preprocess(
      (v) => (typeof v === "string" && looksLikeIframe(v) ? "<iframe>" : v),
      optUrl("https://", "Link chỉ đường phải bắt đầu bằng https:// (mã <iframe> dán vào ô Bản đồ nhúng)"),
    ),
    // Chap nhan ca ma <iframe …> lan link src; chi luu link https://www.google.com/maps/embed?…
    mapEmbedUrl: z.preprocess(
      (v) => (typeof v === "string" ? normalizeMapEmbed(v) : v),
      optText(1000, "Mã bản đồ quá dài").refine((v) => v === null || isMapEmbedUrl(v), "Bản đồ nhúng chưa đúng – dán mã <iframe> từ Google Maps → Chia sẻ → Nhúng bản đồ"),
    ),
    bankName: optText(80, "Tên ngân hàng tối đa 80 ký tự"),
    bankAccountNo: optText(30, "Số tài khoản tối đa 30 ký tự").refine((v) => v === null || /^[0-9 ]+$/.test(v), "Số tài khoản chỉ gồm chữ số"),
    bankAccountName: optText(80, "Tên chủ tài khoản tối đa 80 ký tự"),
    orderingEnabled: z.boolean(),
    orderingPausedMessage: optText(200, "Thông báo tối đa 200 ký tự"),
  })
  .superRefine((d, ctx) => {
    const open = d.openTime ?? storeConfig.openTime;
    const close = d.closeTime ?? storeConfig.closeTime;
    if (minutes(open) >= minutes(close)) ctx.addIssue({ code: "custom", message: "Giờ đóng cửa phải sau giờ mở cửa" });
    const fresh = d.freshBatchTime ?? storeConfig.freshBatchTime;
    if (minutes(fresh) < minutes(open) || minutes(fresh) >= minutes(close)) ctx.addIssue({ code: "custom", message: "Giờ mẻ bánh phải nằm trong giờ mở cửa" });
  });

export async function saveSettingsAction(raw: unknown): Promise<ActionResult> {
  try {
    const user = await assertAdmin("owner");
    const parsed = settingsSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
    await settingsRepository.save(parsed.data);
    await logAudit(user, "settings.update", "settings", "store_info", { ordering: parsed.data.orderingEnabled });
    revalidateTag(SETTINGS_TAG);
    revalidatePath("/", "layout");
    // Cac trang tinh co hien dia chi / ban do: lam moi chac chan (khong phu thuoc cach Next gom route group)
    for (const path of ["/", "/ghe-tiem", "/thuc-don", "/do-uong", "/gio-hang", "/chinh-sach-bao-mat", "/dang-nhap", "/yeu-thich"]) revalidatePath(path);
    revalidatePath("/san-pham/[slug]", "page");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

// ---------------------------------------------------------------- do uong
const drinkSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]{2,60}$/).nullable(),
    name: z.string().trim().min(2, "Tên đồ uống quá ngắn").max(80, "Tên tối đa 80 ký tự"),
    description: z.string().trim().max(160, "Mô tả tối đa 160 ký tự"),
    group: slugSchema,
    temps: z.array(z.enum(["hot", "ice"])).min(1, "Chọn ít nhất Nóng hoặc Đá").max(2),
    priceMVnd: priceSchema,
    priceLVnd: priceSchema.nullable(),
    isActive: z.boolean(),
    soldOut: z.boolean(),
  })
  .refine((d) => d.priceLVnd === null || d.priceLVnd >= d.priceMVnd, "Giá size L phải lớn hơn hoặc bằng size M");

export async function saveDrinkAction(raw: unknown): Promise<ActionResult> {
  try {
    const user = await assertAdmin();
    const parsed = drinkSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
    const { id, ...data } = parsed.data;
    const temps = [...new Set(data.temps)];
    if (!(await categoriesRepository.exists(data.group, "drink"))) return { ok: false, error: "Danh mục không còn – chọn lại danh mục." };
    const savedId = await drinksRepository.save(id, { ...data, temps });
    await logAudit(user, id ? "drink.edit" : "drink.create", "drink", savedId, { name: data.name, m: data.priceMVnd, l: data.priceLVnd, sold_out: data.soldOut });
    revalidateTag(DRINKS_TAG);
    revalidatePath("/", "layout");
    return { ok: true, id: savedId };
  } catch (err) {
    return fail(err);
  }
}

// ---------------------------------------------------------------- don: tao / sua / xoa
const adminOrderSchema = orderInputSchema.extend({ confirmNow: z.boolean().optional() });

export async function createOrderAdminAction(raw: unknown): Promise<ActionResult> {
  try {
    const user = await assertAdmin();
    const parsed = adminOrderSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
    const { confirmNow, ...input } = parsed.data;
    const code = await createOrderByAdmin(user, input, confirmNow ?? true);
    revalidatePath("/admin", "layout");
    return { ok: true, id: code };
  } catch (err) {
    return fail(err);
  }
}

export async function editOrderAction(raw: unknown): Promise<ActionResult> {
  try {
    const user = await assertAdmin();
    const parsed = adminOrderSchema.extend({ code: statusSchema.shape.code }).safeParse(raw);
    if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
    const { code, confirmNow: _ignored, ...input } = parsed.data;
    void _ignored;
    await editOrder(user, code, input);
    revalidatePath("/admin", "layout");
    return { ok: true, id: code };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteOrderAction(raw: unknown): Promise<ActionResult> {
  try {
    const user = await assertAdmin("owner");
    const parsed = z.object({ code: statusSchema.shape.code }).safeParse(raw);
    if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
    await deleteOrder(user, parsed.data.code);
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

// ---------------------------------------------------------------- xoa mon / do uong / cau hoi
const idSchema = z.object({ id: z.string().min(1).max(64) });

export async function deleteProductAction(raw: unknown): Promise<ActionResult> {
  try {
    const user = await assertAdmin("owner");
    const parsed = idSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
    await productsRepository.remove(parsed.data.id);
    await logAudit(user, "product.delete", "product", parsed.data.id);
    revalidateTag(PRODUCTS_TAG);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteDrinkAction(raw: unknown): Promise<ActionResult> {
  try {
    const user = await assertAdmin("owner");
    const parsed = idSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
    await drinksRepository.remove(parsed.data.id);
    await logAudit(user, "drink.delete", "drink", parsed.data.id);
    revalidateTag(DRINKS_TAG);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteInquiryAction(raw: unknown): Promise<ActionResult> {
  try {
    const user = await assertAdmin();
    const parsed = idSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
    await inquiriesRepository.remove(parsed.data.id);
    await logAudit(user, "inquiry.delete", "inquiry", parsed.data.id);
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

// ---------------------------------------------------------------- tai khoan quan ly
const roleEnum = z.enum(["owner", "staff"]);

export async function addStaffAction(raw: unknown): Promise<ActionResult> {
  try {
    const user = await assertAdmin("owner");
    const parsed = z
      .object({
        email: z.string().trim().toLowerCase().email("Email chưa đúng").max(120),
        name: z.string().trim().min(2, "Nhập tên hiển thị").max(60),
        role: roleEnum,
        password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự").max(72),
      })
      .safeParse(raw);
    if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
    await addStaff(parsed.data);
    await logAudit(user, "staff.add", "staff", parsed.data.email, { role: parsed.data.role });
    revalidateTag(ADMIN_USERS_TAG);
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function updateStaffAction(raw: unknown): Promise<ActionResult> {
  try {
    const user = await assertAdmin("owner");
    const parsed = z.object({ userId: z.string().min(1).max(64), name: z.string().trim().min(2, "Nhập tên hiển thị").max(60), role: roleEnum }).safeParse(raw);
    if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
    await updateStaff(user, parsed.data.userId, { name: parsed.data.name, role: parsed.data.role });
    await logAudit(user, "staff.update", "staff", parsed.data.userId, { role: parsed.data.role });
    revalidateTag(ADMIN_USERS_TAG);
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function removeStaffAction(raw: unknown): Promise<ActionResult> {
  try {
    const user = await assertAdmin("owner");
    const parsed = z.object({ userId: z.string().min(1).max(64) }).safeParse(raw);
    if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
    await removeStaff(user, parsed.data.userId);
    await logAudit(user, "staff.remove", "staff", parsed.data.userId);
    revalidateTag(ADMIN_USERS_TAG);
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}
