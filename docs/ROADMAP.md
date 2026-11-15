# Lộ trình phát triển

## Giai đoạn 0 – Starter (bản này)
- [x] Next.js + TS strict + Tailwind v4 + design tokens The Yub
- [x] Trang: Trang chủ, Thực đơn bánh (lọc theo loại), Đồ uống, Chi tiết sản phẩm, Giỏ hàng, Đặt bánh, Xác nhận đơn
- [x] Modules products / cart / orders (service + repository, Zod ở biên)
- [x] SQL schema + seed Supabase, RLS

## Giai đoạn 1 – Nối dữ liệu thật (NÊN làm ngay sau khi chạy thử)
- [ ] Tạo project Supabase, chạy `0001_init.sql` + `seed.sql`
- [x] `SupabaseProductsRepository`, `SupabaseOrdersRepository` (RPC tạo đơn 1 transaction + idempotency key)
- [x] Trang tra cứu đơn dùng `access_token` (không chỉ mã đơn)
- [ ] Chủ tiệm cập nhật GIÁ THẬT + địa chỉ + STK vào store_settings

## Giai đoạn 2 – Admin (Patch 11 – xem docs/ADMIN.md)
- [x] Supabase Auth (chỉ admin đăng nhập), route nhóm `/admin`
- [x] Danh sách đơn theo trạng thái, xác nhận / từ chối, đánh dấu đã nhận tiền (payment_status riêng)
- [x] Bật/tắt món, đổi trạng thái ready/oven/pre/out
- [x] Audit log cho thao tác đơn/thanh toán

## Giai đoạn 3 – Trải nghiệm & hiệu năng
- [ ] Ảnh thật (Supabase Storage + next/image), đo LCP/INP/CLS bằng Lighthouse + RUM
- [ ] Motion micro-interactions; GSAP + ScrollTrigger cho homepage; Lenis (desktop, tôn trọng reduced-motion)
- [ ] shadcn/ui cho form/dialog phía admin
- [ ] Rate limiting + security headers + CSP, kiểm thử E2E (Playwright)

## Giai đoạn 4 – Mở rộng (chỉ khi có nhu cầu thật)
- [ ] Notifications (email/Zalo), automation nhắc nhận bánh – tách khỏi business core
- [ ] Inventory / Promotions
- [ ] Đối soát thanh toán, báo cáo doanh thu cuối ngày
