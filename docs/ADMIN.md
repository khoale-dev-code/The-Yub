# Trang quản lý (Admin) – The Yub

Địa chỉ: `/admin` (đăng nhập tại `/admin/dang-nhap`). Không có link công khai trên web, không cho Google lập chỉ mục.

## Có gì

| Mục | Dùng để |
|---|---|
| **Tổng quan** | Đơn chờ xác nhận, số đơn nhận hôm nay, doanh thu dự kiến, đơn chuyển khoản chưa ghi nhận, lịch nhận theo khung giờ. Tự cập nhật mỗi 30 giây. |
| **Đơn hàng** | **Tạo đơn** cho khách gọi điện / Zalo / tại quầy (giá do máy chủ tính theo thực đơn), **Sửa đơn** khi đơn chưa giao (đổi món, số lượng, ngày, khung giờ, thông tin khách – không đổi được tổng tiền nếu đã ghi nhận tiền), **Xoá** đơn đã huỷ / từ chối *(chủ tiệm)*. Nút bước tiếp theo ngay trên danh sách. Lọc theo trạng thái / ngày nhận, tìm theo mã đơn hoặc SĐT. Chi tiết đơn: Gọi / Zalo khách, Xác nhận → Bắt đầu làm → Sẵn sàng → Đã giao, Từ chối / Huỷ (bắt buộc ghi lý do – khách thấy ở trang tra cứu đơn), **Đánh dấu đã nhận tiền** (có bước xác nhận lại), nhật ký thao tác. Đơn *trả khi nhận* tự ghi “đã nhận tiền” khi bấm Đã giao; đơn *chuyển khoản* chưa ghi nhận tiền sẽ hỏi lại trước khi giao. |
| **Món bánh** | Đổi trạng thái Có sẵn / Ra lò / Đặt trước / Hết ngay trên danh sách, ẩn/hiện món, sửa tên – giá – quy cách – ảnh, thêm món mới, **xoá món** *(chủ tiệm; đơn cũ vẫn giữ tên + giá lúc đặt)*. Web cập nhật ngay sau khi lưu. |
| **Đồ uống** | Sửa giá size M / L, bật “Tạm hết” (vẫn hiện trên thực đơn nhưng mờ), ẩn/hiện, sửa tên – mô tả – nhóm – nóng/đá, thêm đồ uống mới, xoá *(chủ tiệm)*. |
| **Báo cáo** *(chỉ chủ tiệm)* | Doanh thu theo ngày (đơn đã giao), dự kiến, giá trị trung bình/đơn, tỉ lệ huỷ, món bán chạy, khung giờ được chọn, tiền mặt / chuyển khoản. Kỳ: 7 ngày, 30 ngày, tháng này, tháng trước. **Tải CSV** (mở bằng Excel) – có SĐT khách nên chỉ chủ tiệm tải được. |
| **Hộp thư** | Câu hỏi khách gửi ở trang Đồ uống: Gọi / Zalo, đánh dấu đã trả lời, lưu trữ, xoá tin đã lưu trữ. |
| **Khung giờ** | Bật/tắt từng khung giờ, giới hạn số đơn mỗi khung. Khung kín hiện “Đã kín” ở trang Đặt bánh, máy chủ chặn đơn vượt sức chứa. |
| **Cài đặt** | Tạm ngưng nhận đơn online (kèm thông báo), địa chỉ + bản đồ (hiện trên web), số tài khoản (chỉ hiện trong Admin để chép gửi khách). **Tài khoản quản lý**: thêm nhân viên / chủ tiệm (tạo mật khẩu ngẫu nhiên, chỉ hiện 1 lần), đổi vai trò, thu hồi quyền. Chỉ **chủ tiệm** sửa được. |

Giao diện: máy tính có thanh menu bên trái; điện thoại / máy tính bảng có thanh tab dưới cùng (Tổng quan · Đơn hàng · Món bánh · Hộp thư · Thêm → Đồ uống, Khung giờ, Báo cáo, Cài đặt).

## Bảo mật

- Đăng nhập bằng **Supabase Auth**; chỉ tài khoản có trong bảng `admin_users` mới vào được (đăng ký tài khoản thôi là không đủ).
- Mọi Server Action Admin đều **kiểm tra lại quyền** ở máy chủ (không chỉ dựa vào middleware), validate bằng Zod, ghi `audit_logs` (không ghi SĐT / nội dung khách).
- `SUPABASE_SERVICE_ROLE_KEY` chỉ đọc ở server. Khách không bao giờ tự xác nhận thanh toán; chỉ Admin bấm “Đã nhận tiền” sau khi tự kiểm tra.
- Đổi trạng thái đơn có kiểm tra “trạng thái hiện tại” để 2 người bấm cùng lúc không ghi đè nhau.
- Đăng nhập sai quá 8 lần / 10 phút (theo IP) bị tạm chặn. Nên tắt **Allow new users to sign up** trong Supabase → Authentication → Providers → Email.

## Cài đặt Supabase (một lần)

1. Tạo project tại https://supabase.com.
2. **SQL Editor** → chạy lần lượt: `supabase/migrations/0001_init.sql`, `0002_variants_inquiries.sql`, `0003_admin.sql`, `0004_drinks.sql`, `0005_admin_crud.sql`, `0006_product_media.sql`, `0007_categories.sql`, rồi `supabase/seed.sql`.
   (Đã chạy tới 0006 từ trước: chỉ cần chạy thêm `0007_categories.sql` – danh mục bánh / đồ uống tự quản lý.)
   Khi tạo project nên chọn region **Southeast Asia (Singapore)** cho nhanh hơn khi dùng ở Việt Nam.
3. **Project Settings → API** → chép vào `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```
4. **Authentication → Users → Add user** (email + mật khẩu, tick *Auto confirm*).
5. **SQL Editor** → cấp quyền chủ tiệm (đổi email):
   ```sql
   insert into admin_users (user_id, display_name, role)
   select id, 'Chủ tiệm', 'owner' from auth.users where email = 'email-cua-ban@example.com';
   ```
   Sau đó thêm nhân viên ngay trong **Admin → Cài đặt → Tài khoản quản lý** (nhân viên không sửa được Cài đặt, không xoá đơn / món, không bỏ được đánh dấu “đã nhận tiền”).
6. Dừng `npm run dev`, chạy lại, mở http://localhost:3000/admin.

Khi đã cấu hình Supabase, **toàn bộ web** (thực đơn, giá, đơn hàng, câu hỏi, khung giờ, địa chỉ) đọc/ghi từ database. Giá trong `seed.sql` là **giá mẫu** – chủ tiệm sửa lại trong Admin > Món bánh trước khi mở bán.

## Dữ liệu mẫu để thử Admin

SQL Editor → chạy `supabase/test-data/du-lieu-mau.sql`: ~70 đơn mẫu (30 ngày trước → 3 ngày tới, đủ trạng thái) + 10 câu hỏi khách. Giá lấy theo thực đơn hiện tại. Xoá: chạy `supabase/test-data/xoa-du-lieu-mau.sql` (chỉ xoá dữ liệu mẫu). **Xoá trước khi mở bán thật.**

## Xem thử khi chưa có Supabase

Thêm vào `.env.local`: `ADMIN_DEMO_PASSWORD=<ít nhất 12 ký tự>` rồi `npm run dev`. Đăng nhập bằng mật khẩu đó.
Dữ liệu chỉ lưu tạm trong bộ nhớ (mất khi tắt server). Chế độ này **không chạy** với `npm run build` / `npm start`.

## Danh mục

- Admin → **Danh mục**: 2 tab *Bánh* và *Đồ uống*. Thêm danh mục mới, đổi tên, đưa lên / xuống để đổi thứ tự hiển thị trên web.
- Chọn danh mục cho món trong form món (Admin → Món bánh) và cho đồ uống trong Admin → Đồ uống.
- Danh mục chưa có món không hiện cho khách. Chỉ chủ tiệm xoá được, và chỉ khi danh mục trống (chuyển món sang danh mục khác trước).
- Danh mục *Combo* có thêm ô “Giá lẻ khi mua riêng”.

## Ảnh & video của món

- Admin → Món bánh → mở món → **Ảnh & video**: *Chọn ảnh / video từ máy* (chọn nhiều file) hoặc kéo thả. Tối đa 12 file mỗi món.
- Ảnh JPG / PNG / WebP / AVIF: trình duyệt tự thu nhỏ (cạnh dài 1800px, WebP) trước khi tải – ảnh điện thoại 10–20 MB vẫn nhận.
- Video MP4 / WebM / MOV: **dưới 7 MB** (không tự nén). Video dài hơn: cắt ngắn hoặc nén trước khi tải.
- Ảnh đầu tiên là **ảnh bìa** (thẻ bánh, giỏ hàng). Đổi thứ tự bằng mũi tên / kéo thả, hoặc bấm “Đặt làm ảnh bìa”. Bấm **Lưu thay đổi** mới áp dụng lên web.
- Có Supabase: file nằm ở bucket `product-media` (tạo bởi migration 0006, Supabase tự chặn file > 7 MB và loại file khác). Trình duyệt tải thẳng lên Supabase bằng đường dẫn có chữ ký – không qua server web (Vercel giới hạn 4,5 MB/request).
- Chưa có Supabase (chạy thử): file lưu ở thư mục `.data/uploads` trong dự án (không đưa lên git).
- Bỏ ảnh / video rồi Lưu: file bị xoá khỏi kho. Món chưa có ảnh hiện ảnh chờ có logo tiệm.

## Tốc độ

- `npm run dev` giờ dùng **Turbopack** (biên dịch nhanh hơn nhiều so với webpack). Lần đầu mở mỗi trang vẫn mất 1–3 giây để biên dịch – đó là chế độ phát triển; bản `npm run build` + `npm start` không có độ trễ này. Cần webpack cũ: `npm run dev:webpack`.
- Admin có bố cục riêng, không tải hiệu ứng / Lenis / giỏ hàng của trang công khai.
- Nếu Turbopack báo lỗi lạ sau khi cập nhật: dừng dev, xoá thư mục `.next`, chạy lại.
- `npm run dev` in thời gian từng lần gọi Supabase (`[supabase] 142ms GET rest/orders`). Mỗi lần > 400ms ghi “(chậm)” → kiểm tra region project (nên Singapore) hoặc mạng.
- Supabase → Project Settings → **JWT Keys**: nếu project còn dùng *Legacy JWT secret*, chuyển sang khoá ký mới (ECC) để server tự kiểm phiên đăng nhập, không phải hỏi Supabase mỗi lần mở trang.
- Windows: thêm thư mục dự án vào danh sách loại trừ của Windows Security (Virus & threat protection → Exclusions) giúp `npm run dev` biên dịch nhanh hơn rõ rệt.

## Chưa có (gợi ý làm tiếp)

- Tải ảnh món lên Supabase Storage (hiện chọn từ thư viện ảnh có sẵn).
- Thông báo đơn mới qua Zalo/email.
- Ghi nhận doanh thu bán tại quầy (POS) để báo cáo gộp.
- Thêm / xoá khung giờ nhận (hiện chỉ bật/tắt và đặt sức chứa cho các khung có sẵn).
