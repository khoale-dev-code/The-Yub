-- ============================================================
-- 0007 – Danh muc tu quan ly (Admin > Danh muc) cho ca banh va do uong.
-- Chay SAU 0001–0006. Chay lai nhieu lan khong sao.
-- ============================================================

-- Loai danh muc: 'product' (banh) hoac 'drink' (do uong)
alter table categories add column if not exists kind text not null default 'product';
alter table categories drop constraint if exists categories_kind_check;
alter table categories add constraint categories_kind_check check (kind in ('product', 'drink'));
alter table categories drop constraint if exists categories_slug_format;
alter table categories add constraint categories_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 60);
alter table categories drop constraint if exists categories_name_length;
alter table categories add constraint categories_name_length check (char_length(name) between 1 and 60);
create index if not exists idx_categories_kind_order on categories(kind, sort_order);

-- Nhom do uong cu thanh danh muc (giu nguyen ma de du lieu cu khong doi)
insert into categories (slug, name, sort_order, kind) values
  ('coffee', 'Cà phê', 1, 'drink'),
  ('tea', 'Trà & trái cây', 2, 'drink'),
  ('other', 'Không cà phê', 3, 'drink'),
  ('juice', 'Nước ép & sinh tố', 4, 'drink')
on conflict (slug) do update set kind = 'drink';

-- Do uong: bo danh sach nhom co dinh, thay bang lien ket toi danh muc
alter table drinks drop constraint if exists drinks_drink_group_check;
alter table drinks drop constraint if exists drinks_drink_group_fk;
alter table drinks add constraint drinks_drink_group_fk foreign key (drink_group) references categories(slug) on update cascade;
