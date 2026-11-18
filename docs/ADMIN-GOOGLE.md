# Đăng nhập Google cho quản trị The Yub

## Kết nối một lần

1. Nếu khách hàng đã dùng Google trên cùng dự án Supabase, dùng lại cấu hình provider đó. Nếu thiết lập lần đầu, tạo OAuth client loại **Web application** trong Google Cloud, thêm origin của website và thêm **Authorized redirect URI** chính xác như URL callback được hiển thị trong trang provider Google của Supabase (thường là `https://<project-ref>.supabase.co/auth/v1/callback`). Bật Google trong Supabase **Authentication → Sign In / Providers**, điền Client ID và Client Secret.
2. Trong Supabase **Authentication → URL Configuration → Redirect URLs**, thêm `http://localhost:3000/admin/dang-nhap/callback` và URL HTTPS tương ứng của website thật. Dùng đúng tên miền và cổng mà trình duyệt đang mở. Giữ URL callback của trang khách nếu tiệm dùng cả hai luồng.
3. Mở `/admin/dang-nhap` rồi bấm **Tiếp tục với Google**. Với tài khoản hoàn toàn mới, Supabase Auth cần cho phép đăng ký mới, hoặc quản trị viên cần chuẩn bị trước tài khoản tương ứng. Khi ứng dụng Google ở trạng thái Testing, thêm Gmail cần thử vào danh sách Test users của Google.

## Cấp quyền cho một người

Sau lần xác thực Google đầu tiên, mở **Authentication → Users**, tìm đúng email và sao chép **User UID**. Tài khoản có thể đã tồn tại nếu trước đây người đó đã đăng nhập bằng một phương thức khác với cùng email đã xác minh. Dùng UID thực tế trong Supabase.

Trong **Table Editor → public.admin_users**, thêm hàng với `user_id` là UID vừa sao chép, `display_name` là tên hiển thị, `role` là `staff` (nhân viên) hoặc `owner` (chủ tiệm toàn quyền). Nếu đã có hàng cho UID này, dùng quyền đang cấp hoặc sửa trực tiếp theo nhu cầu.

Người đó mở lại **Đăng nhập quản lý → Tiếp tục với Google**. Nếu lần đầu xác thực thành công nhưng chưa có quyền, họ sẽ thấy hướng dẫn liên hệ chủ tiệm. Bước xác thực chỉ tạo/liên kết danh tính trong Supabase Auth. Việc cấp vai trò do chủ tiệm thực hiện. Mật khẩu admin và chế độ demo tiếp tục hoạt động.

## Khi gặp lỗi

- **Google chưa được bật** — kiểm tra provider Google của đúng dự án Supabase đang dùng trong `.env.local`.
- **redirect_uri_mismatch** ở Google — đối chiếu Authorized redirect URI trong Google Cloud với callback của Supabase, kể cả tên miền tùy chỉnh nếu có.
- **Trở về sai trang hoặc liên kết hết hạn** — đối chiếu Redirect URLs trong Supabase, rồi bấm đăng nhập lại trong cùng trình duyệt và tên miền. Mỗi lượt đăng nhập dùng một mã PKCE.
- **Chưa được cấp quyền** — đối chiếu UID của email đã chọn với hàng trong `public.admin_users`.
- **Chưa kiểm tra được quyền** — kiểm tra kết nối và migration `0003_admin.sql` trong dự án hiện tại.

[Tài liệu Supabase về Google](https://supabase.com/docs/guides/auth/social-login/auth-google) · [Liên kết danh tính](https://supabase.com/docs/guides/auth/auth-identity-linking)
