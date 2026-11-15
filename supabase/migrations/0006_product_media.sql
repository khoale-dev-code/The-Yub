-- ============================================================
-- 0006 – Anh / video cua mon tai len tu may (Admin > Mon banh).
-- Chay SAU 0001–0005. Chay lai nhieu lan khong sao.
-- ============================================================

-- Danh sach anh / video theo thu tu hien thi, vd ["products/<uuid>.webp", "products/<uuid>.mp4"].
-- null = mon chua tung luu media (web dung image_path + gallery cu).
alter table products add column if not exists media jsonb;
alter table products drop constraint if exists products_media_is_array;
alter table products add constraint products_media_is_array
  check (media is null or (jsonb_typeof(media) = 'array' and jsonb_array_length(media) <= 12));

-- Kho file: cong khai de web hien anh; CHI server (service role) tao duoc duong tai len co chu ky.
-- Supabase tu chan file > 7 MB va loai file khong nam trong danh sach.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-media',
  'product-media',
  true,
  7340032,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
