# The Yub – Bakes & More · Website (bản khớp thiết kế)

> **Nơi giòn rụm gặp thơm bơ** · Next.js full-stack starter cho website tiệm bánh,
> dựng theo bản thiết kế UI/UX trên canvas và tài liệu yêu cầu kiến trúc.

| Thành phần | Lựa chọn |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript strict |
| UI | Tailwind CSS v4 + design tokens The Yub (Fraunces + Be Vietnam Pro) |
| Backend | Server Components + Server Actions + Service/Repository layer |
| Validation | Zod tại ranh giới client → server |
| Database | Supabase PostgreSQL (schema + RLS sẵn trong `supabase/`) |
| Hosting | Vercel (khuyến nghị) |

**Trạng thái:** chạy được NGAY không cần database (dữ liệu seed local, đơn hàng lưu
trong bộ nhớ server để demo đủ luồng đặt bánh). Bước nối Supabase xem `docs/ROADMAP.md`.

---

## 1. Cài đặt từ file ZIP (Windows)

Yêu cầu: **Node.js 20+** (`node -v` để kiểm tra), PowerShell 5.1+.

ZIP tải về nằm ở `C:\Users\Bin77\Downloads`, script giải nén an toàn:
`tools/Extract-ProjectZip.ps1` (bản copy nằm sẵn trong repo; đặt một bản ở Downloads để chạy).

**Bước 1 – DryRun kiểm tra (không ghi file):**

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Extract-ProjectZip.ps1" -ZipName "TheYub-Design-Match-20261113.zip" -ProjectName "the-yub-v2" -DryRun
```

**Bước 2 – Giải nén thật:**

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Extract-ProjectZip.ps1" -ZipName "TheYub-Design-Match-20261113.zip" -ProjectName "the-yub-v2"
```

Source sẽ nằm tại `D:\freetime\the-yub-v2`. (Script không ghi đè thư mục đã có, nên bản này dùng tên mới `the-yub-v2` – bản starter cũ ở `D:\freetime\the-yub` vẫn giữ nguyên.)

**Bước 3 – Mở và chạy:**

```powershell
code "D:\freetime\the-yub-v2"
cd D:\freetime\the-yub-v2
npm install
npm run dev
```

Mở http://localhost:3000. Các lệnh khác:

```powershell
npm run build      # build production (kèm type-check + lint)
npm run start      # chạy bản build
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
```

---

## 2. Cấu trúc thư mục

```
src/
  app/
    layout.tsx              # Header (thanh thông báo + header 3 cột + menu mobile) + thanh giỏ nổi mobile
    page.tsx                # Trang chủ (Home-v2 + Mobile-v2) + footer đầy đủ có sóng "giấy xé"
    do-uong/                # Đồ uống (thiết kế riêng: menu minh hoạ phẳng + footer kiểu liên hệ)
    (shop)/                 # Các trang bên trong, dùng footer gọn
      thuc-don/             # Thực đơn bánh: hero thẻ, cam kết, được yêu thích, bộ lọc + tải thêm khi cuộn
      san-pham/[slug]/      # Chi tiết: gallery, quy cách, số lượng, nguyên liệu, gợi ý
      gio-hang/             # Giỏ hàng 3 bước: Giỏ hàng → Thông tin nhận → Xác nhận
      dat-banh/             # Chuyển hướng về /gio-hang
      don-hang/[code]/      # Tra cứu đơn – cần ?t=<token>, mã đơn thôi là không đủ
  components/
    layout/                 # site-header, site-footer (full | compact), mobile-cart-bar
    home/                   # hero carousel, mobile hero, marquee, bảng đồ uống, chọn giờ hẹn…
    catalog/ product/ cart/ drinks/  # theo từng trang
    ui/                     # icons, torn-wave, status-badge, heading
  modules/
    products/               # types, data seed, repository, pricing (giá theo quy cách)
    cart/                   # cart context (dòng giỏ + quy cách + ngày/khung giờ nhận, localStorage)
    orders/                 # schema Zod, service (tính lại giá, idempotency, token), action
    inquiries/              # form "Còn câu hỏi?" ở trang Đồ uống
  lib/                      # images, pickup slots, format, store config
public/images/              # ảnh sản phẩm (tạm), logo, minh hoạ đồ uống
supabase/
  migrations/0001_init.sql  # Schema + RLS
  migrations/0002_variants_inquiries.sql  # Quy cách, variant trong đơn, bảng inquiries
  seed.sql                  # Seed (GIÁ MẪU)
docs/
  ARCHITECTURE.md · ROADMAP.md · DESIGN-MATCH.md
tools/
  Extract-ProjectZip.ps1
```

Nguyên tắc: UI → Action (validate Zod) → Service (nghiệp vụ, tính lại giá) → Repository (dữ liệu).
Chi tiết trong `docs/ARCHITECTURE.md`.

---

## 3. Những điều cần biết trước khi đi live

1. **Giá đang là giá MẪU** (demo UI). Cập nhật giá thật trong `src/modules/products/data.ts`
   hoặc `supabase/seed.sql` trước khi công bố.
2. **Địa chỉ tiệm & tài khoản ngân hàng chưa cấu hình** – UI hiển thị placeholder.
   Điền `NEXT_PUBLIC_STORE_ADDRESS` trong `.env.local`; STK chỉ đưa ra ở bước tiệm gọi xác nhận.
3. **Đơn hàng demo lưu trong bộ nhớ server** – khởi động lại là mất. Nối Supabase
   (ROADMAP giai đoạn 1) để lưu bền vững + chống trùng đơn bằng idempotency key.
4. **Ảnh sản phẩm là ảnh tham khảo bạn đã dùng trên canvas** (`public/images/products`).
   Trước khi công bố, thay bằng ảnh chụp thật của tiệm – giữ nguyên tên file là xong
   (danh sách trong `src/lib/images.ts`).
5. **Form "Nhận tin mẻ bánh mới" chưa nối dịch vụ email** – bấm Đăng ký chỉ báo "chờ kích hoạt",
   không giả vờ đã lưu. Form "Còn câu hỏi?" (trang Đồ uống) lưu tạm trong bộ nhớ server.
6. **Mạng xã hội & trọng lượng bánh** chưa có thông tin → hiển thị "Chờ tiệm cập nhật"/không có link.
7. **Hiệu năng:** tuyên bố đạt INP/LCP/CLS chỉ sau khi ĐO (Lighthouse + RUM) trên môi trường thật.

## 4. Nối Supabase (tóm tắt)

1. Tạo project trên supabase.com → SQL Editor → chạy `supabase/migrations/0001_init.sql` rồi `supabase/seed.sql`.
2. Copy `.env.example` → `.env.local`, điền `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (service key KHÔNG commit, không NEXT_PUBLIC).
3. Viết `SupabaseProductsRepository` / `SupabaseOrdersRepository` theo interface sẵn có
   (`src/modules/*/repository.ts` có ghi chú hướng dẫn) – UI và service không phải đổi.
