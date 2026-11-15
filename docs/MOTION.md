# Smooth scroll & hiệu ứng cuộn (Lenis + GSAP, cảm hứng lenis.dev)

## Cấu hình nhanh – `src/components/motion/motion-config.ts`
| Tuỳ chọn | Mặc định | Ý nghĩa |
|---|---|---|
| `smoothScrollRespectsReducedMotion` | `false` | Smooth scroll **luôn bật** trên mọi trang, kể cả khi Windows tắt "Animation effects" |
| `animationsRespectReducedMotion` | `false` | Hiệu ứng (chữ trượt, ảnh mở màn, banner, dải chữ chạy, transition) **luôn chạy**. Đặt `true` để tắt cho người bật "Giảm chuyển động" (gắn class `html.yub-reduced-motion`) |
| `lerp` | `0.085` | Độ "lướt" khi cuộn. Nhỏ hơn = mượt/dài hơn (lenis.dev ≈ 0.1) |
| `wheelMultiplier` | `1` | Tốc độ mỗi nấc cuộn |
| `syncTouch` | `false` | Điện thoại giữ cuộn native (ổn định nhất, nhất là iOS) |

**Chẩn đoán:** thêm `?motion=debug` vào URL bất kỳ (vd `http://localhost:3000/?motion=debug`) → góc trái dưới hiện
trạng thái Lenis và máy có đang bật "Giảm chuyển động" không.

> Windows: *Settings → Accessibility → Visual effects → Animation effects* đang **tắt** thì trình duyệt báo
> "giảm chuyển động". Smooth scroll vẫn chạy; muốn thấy cả hiệu ứng trang trí thì bật lại mục này.
> Đánh giá độ mượt nên dùng bản build: `npm run build && npm start` (chế độ dev chậm hơn).

## Thành phần
- `smooth-scroll.tsx` – Lenis + `gsap.ticker` + ScrollTrigger, thanh tiến độ cuộn màu bơ ở mép trên.
- `scroll-animations.tsx` – hiệu ứng gắn bằng data-attribute:

| Thuộc tính | Tác dụng |
|---|---|
| (tự động) `<section>` cấp 1 trong `<main>` | Trôi lên khi cuộn tới · tắt: `data-no-reveal` |
| (tự động) mọi `<h2>` trong `<main>` | Từng dòng chữ trượt lên từ mặt nạ (SplitText) · tắt: `data-no-split` |
| `data-split` | Áp hiệu ứng tách dòng cho phần tử bất kỳ |
| `data-reveal` / `data-reveal-stagger` | Fade-up một phần tử / các con lần lượt |
| `data-reveal-image` | Ảnh "mở màn" từ dưới lên + thu nhỏ 1.15 → 1 (ảnh cuối cùng **không bị cắt**) |
| `data-parallax="0.15"` | Cả khung trôi lệch so với trang (không cắt ảnh) |
| `data-scroll-x="-30"` | Chạy ngang theo cuộn (dải chữ lớn) |
| `data-scrub-line` / `="x"` | Đường kẻ "vẽ" dần theo cuộn |

## Ảnh không bị cắt
- `src/components/brand/photo.tsx` hiển thị ảnh **đúng tỉ lệ gốc** (width/height thật, `h-auto`).
- Danh sách ảnh + kích thước: `src/lib/story-images.ts`. Thay ảnh thật của tiệm: giữ tên file,
  sửa `width/height` nếu tỉ lệ khác.

## Trang Câu chuyện
- Hero: 2 "ảnh in" chồng nhau, trôi lệch tốc độ.
- "Một ngày ở tiệm": timeline có đường kẻ vẽ theo cuộn, ảnh đúng tỉ lệ.
- "Từ bột đến hộp quà": cột ảnh **dính (sticky)**, ảnh đổi theo bước đang đọc (máy tính); xếp dọc trên điện thoại.
- "Một tách cà phê, một lát bánh": 3 cột ảnh trôi lệch tốc độ.

Bản đồ (trang Ghé tiệm, tuỳ chọn, `.env.local`): `NEXT_PUBLIC_STORE_ADDRESS`, `NEXT_PUBLIC_STORE_MAP_URL`,
`NEXT_PUBLIC_STORE_MAP_EMBED_URL` (chỉ nhận `https://www.google.com/maps/embed?...`).

## Khác (Patch 04)
- **Header dính** khi cuộn (máy tính + điện thoại), tự thu gọn và đổ bóng. Chiều cao header ghi vào biến CSS
  `--yub-header-h`; mọi phần tử `[id]` có `scroll-margin-top` tương ứng, phần sticky (tóm tắt giỏ hàng,
  "Từ bột đến hộp quà") nằm ngay dưới header.
- **Banner trang chủ** tự chuyển sau 3 giây (`HERO_AUTOPLAY_MS` trong `hero-carousel.tsx`), không còn nút mũi tên;
  chấm đang chọn có thanh chạy 3 giây. Bản điện thoại cũng tự chuyển ảnh + thẻ giá.
- **Dải chữ dưới banner** chạy bằng GSAP: rê chuột vào thì chậm dần rồi dừng, rê ra chạy lại; cuộn nhanh thì chạy nhanh theo.
- **Thêm vào giỏ** (`src/modules/cart/cart-fx.ts`): ảnh sản phẩm bay theo đường cong vào icon giỏ, icon "nảy",
  số trên giỏ bật ra, rồi hiện thông báo "Đã thêm vào giỏ" (`cart-toast.tsx`) kèm nút "Xem giỏ".

## Trang Đặt bánh online `/dat-banh` (Patch 08)
- Trang riêng (trước đây chỉ là khu `#dat-banh` ở trang chủ). Menu "Đặt bánh online", nút "Đặt trước" ở footer,
  banner trang chủ, trang Ghé tiệm và Đồ uống đều trỏ về `/dat-banh`.
- Hero (Patch 10): tiêu đề căn giữa hiện từng dòng (SplitText), 3 bước bấm được (cuộn mượt tới Chọn bánh / Hẹn giờ / Đơn),
  dải ảnh bánh chạy ngang (rê chuột thì dừng, cuộn nhanh thì chạy nhanh), huy hiệu tròn xoay theo tốc độ cuộn (Lenis).
- Thanh 3 bước (Chọn bánh → Hẹn giờ → Xác nhận) dính dưới header, bấm để cuộn mượt tới từng phần; vạch vàng chạy theo cuộn.
- Chọn bánh: lọc theo loại, chọn quy cách, tăng/giảm số lượng ngay trên thẻ; thêm món đầu tiên có hiệu ứng bay vào giỏ.
- Hẹn giờ: 7 ngày (`PICKUP_DATE_COUNT` trong `src/lib/pickup.ts`), khung giờ hôm nay đã qua bị khoá (giờ Việt Nam);
  đơn có món "đặt trước 1 ngày" không chọn được hôm nay.
- Tóm tắt đơn dính bên phải (máy tính) / thanh dưới màn hình (điện thoại), tổng tiền "đếm" bằng GSAP.
  Nút "Tiếp tục" mở `/gio-hang?buoc=thong-tin` – vào thẳng bước điền thông tin; giá vẫn do server tính lại khi tạo đơn.
