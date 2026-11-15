# The Yub – Kiến trúc kỹ thuật (Starter)

Tài liệu này ánh xạ source hiện tại với bản yêu cầu kiến trúc, và đánh dấu rõ
**[MVP]** (đã có trong starter) · **[NÊN]** (triển khai khi có lợi ích rõ) · **[MỞ RỘNG]** (chỉ làm khi hệ thống lớn lên).

## 1. Tổng quan

- Next.js App Router + React + TypeScript strict (`noUncheckedIndexedAccess` bật). **[MVP]**
- Tailwind CSS v4 – design tokens khai báo tại `src/app/globals.css` (`@theme`), dùng chung cho mọi trang. **[MVP]**
- Modular Monolith, feature-based: mỗi nghiệp vụ là một module trong `src/modules/*`. **[MVP]**
- Supabase (PostgreSQL + Auth + Storage): schema và RLS đã viết sẵn trong `supabase/`, code server có adapter chờ (`src/lib/supabase/server.ts`). **[NÊN – bước kế tiếp]**
- shadcn/ui + Radix, Motion, GSAP + ScrollTrigger, Lenis, TanStack Query: cố ý **chưa** đưa vào để MVP nhẹ và chạy được ngay; thêm theo lộ trình trong `docs/ROADMAP.md`. **[NÊN/MỞ RỘNG]**

## 2. Phân lớp

```
UI (app/, components/)        → chỉ render + gọi action
Server Action (modules/*/actions.ts) → validate biên bằng Zod, gọi service
Service (modules/*/service.ts)       → nghiệp vụ: tính lại giá, kiểm tra điều kiện
Repository (modules/*/repository.ts) → truy cập dữ liệu (local seed / Supabase)
```

Quy tắc đã áp dụng:
- Không viết nghiệp vụ trong `page.tsx` / component / action – action chỉ validate + gọi service.
- **Single source of truth về giá:** server luôn tính lại tổng tiền từ repository, không tin số tiền client gửi lên (`orders/service.ts`).
- **Snapshot đơn hàng:** mỗi order item lưu tên + đơn giá tại thời điểm đặt (`OrderItemSnapshot`, bảng `order_items`).
- Trạng thái đơn và trạng thái thanh toán **độc lập** (schema `orders.status` ≠ `orders.payment_status`).
- Phản hồi nút tức thì (pending state) nhưng **không optimistic success** cho tạo đơn.

## 3. Module hiện có

| Module | Vị trí | Ghi chú |
|---|---|---|
| Products | `src/modules/products` | types + seed data + repository (đọc) |
| Cart | `src/modules/cart` | client state + localStorage (per-device, có try/catch) |
| Orders | `src/modules/orders` | schema Zod, service tạo đơn, repository in-memory (demo) |
| Store Settings | `src/lib/store-config.ts` | thông tin chưa cung cấp để dạng chờ xác nhận |

Các module trong spec chưa dựng (Payments, Inventory, Promotions, Notifications, Automation, Administration) sẽ thêm theo roadmap – cấu trúc thư mục đã sẵn chỗ (`src/modules/<module>/{components,hooks,schemas,services,repositories,actions,types,tests}`).

## 4. Database (supabase/)

- `migrations/0001_init.sql`: categories, products (soft delete), pickup_slots, customers, orders (code công khai + `access_token` tra cứu + `idempotency_key` chống trùng), order_items (snapshot), payments (xác minh thủ công), store_settings, audit_logs. RLS: anon chỉ đọc catalog; đơn hàng chỉ đi qua server.
- `seed.sql`: danh mục + 16 sản phẩm (giá MẪU), khung giờ, store_settings (địa chỉ/bank = null chờ xác nhận).
- Khi nối Supabase: viết `SupabaseProductsRepository` / `SupabaseOrdersRepository` thay bản local — interface giữ nguyên nên UI/service không đổi. Tạo đơn nên gói trong một RPC (stored function) để INSERT orders + order_items trong MỘT transaction.

## 5. Bảo mật (đã áp dụng ở mức MVP)

- Mọi input khách → `zod` schema tại ranh giới server action.
- Giá, tổng tiền: server tự tính; client không gửi tiền.
- Mã đơn công khai không phải bằng chứng xác thực — schema đã có `access_token` cho trang tra cứu khi lên DB.
- Secrets chỉ trong env server (`SUPABASE_SERVICE_ROLE_KEY` không bao giờ NEXT_PUBLIC).
- Chưa có: rate limiting, CSP header, admin auth — xem ROADMAP trước khi đi live.

## 6. Hiệu năng

- Trang catalog render server (SSG/ISR được vì data tĩnh), trang đặt bánh `force-dynamic`.
- Font qua `next/font` (self-host, `display: swap`) – không CLS do font.
- Chưa đưa thư viện animation nặng vào bundle; khi thêm GSAP/Lenis phải theo đúng mục 6–7 của bản yêu cầu (cleanup, reduced motion, không pin mobile tràn lan).
- **Chưa đo = chưa tuyên bố đạt**: các chỉ số INP/LCP/CLS cần đo bằng Lighthouse + RUM sau khi deploy, theo Performance Budget trong spec.

## 7. Ảnh sản phẩm

Repo KHÔNG kèm ảnh thật (ảnh dùng trên canvas chỉ là ảnh tham khảo để duyệt thiết kế).
`ProductVisual` là placeholder; khi có ảnh của tiệm: đưa vào Supabase Storage,
đổi sang `next/image` với `sizes` + aspect ratio cố định (tránh CLS), AVIF/WebP tự động.
