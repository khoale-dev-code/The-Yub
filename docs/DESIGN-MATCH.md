# Đối chiếu thiết kế canvas ↔ code

Bản này dựng lại giao diện theo đúng các artboard trên canvas: **Home-v2, Mobile-v2 (+ menu),
ThucDon(+mobile), DoUong(+mobile), SanPham(+mobile), GioHang(+mobile)**.

| Artboard | Route | File chính |
|---|---|---|
| Home-v2 / Mobile-v2 | `/` | `src/app/page.tsx`, `src/components/home/*` |
| Mobile-v2-menu | menu mở từ nút ☰ | `src/components/layout/site-header.tsx` |
| ThucDon | `/thuc-don` | `src/app/(shop)/thuc-don/page.tsx`, `src/components/catalog/catalog-browser.tsx` |
| DoUong | `/do-uong` | `src/app/do-uong/page.tsx` |
| SanPham | `/san-pham/[slug]` | `src/app/(shop)/san-pham/[slug]/page.tsx`, `src/components/product/*` |
| GioHang | `/gio-hang` | `src/components/cart/cart-checkout.tsx` |

## Giữ nguyên từ thiết kế
- Token màu, Fraunces 600 cho mọi tiêu đề (một kiểu duy nhất, không chữ 2 màu, không eyebrow), Be Vietnam Pro cho nội dung.
- Thanh thông báo, header 3 cột + nav chữ hoa; mobile: header nâu đậm, menu toàn màn hình.
- Sóng "giấy xé" viền bơ (hero, section nâu, footer) dùng đúng path SVG trên canvas.
- Hero carousel 4 slide + thẻ giá nghiêng; marquee nghiêng −1.6°.
- Nút giỏ hàng dạng icon (không chữ "Thêm vào giỏ") ở thẻ sản phẩm.
- Thực đơn bánh: tải thêm 6 món khi cuộn (IntersectionObserver) + nút "Xem thêm bánh" dự phòng.
- Đồ uống: menu minh hoạ phẳng (tên · giá "k"), ảnh không bị cắt theo tỉ lệ gốc.
- Giỏ hàng 3 bước, tóm tắt đơn nền nâu, chọn ngày/khung giờ, 2 cách thanh toán.

## Khác thiết kế (có chủ đích)
- **"Thêm đồ uống" ở trang chi tiết** (giảm 12.000đ khi mua kèm) chưa làm: cần chủ tiệm chốt quy tắc giá.
  Hiện dùng các sản phẩm combo có sẵn ("Cặp đôi").
- **Khung giờ "Đã kín"** chưa hiển thị: cần bảng sức chứa theo slot (Admin → Khung giờ nhận).
- **Trọng lượng bánh, link mạng xã hội, địa chỉ** hiển thị "chờ cập nhật" – không tự bịa.
- **Mã đơn** hiển thị như thiết kế, nhưng link tra cứu đơn có thêm token bí mật (yêu cầu bảo mật).
- Font tải qua Google Fonts CSS; nếu mạng chặn Google Fonts, trình duyệt dùng font dự phòng.
