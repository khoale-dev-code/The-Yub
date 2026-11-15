-- 0002 – Quy cach san pham, quy cach trong don, cau hoi tu khach
-- Chay SAU 0001_init.sql.

-- Quy cach (1 cai / hop 4 / hop 6). Gia luu integer VND.
create table if not exists product_variants (
  id          text not null,                 -- 'one' | 'box4' | 'box6'
  product_id  uuid not null references products(id) on delete cascade,
  label       text not null,
  price_vnd   integer not null check (price_vnd >= 0),
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  primary key (product_id, id)
);
alter table product_variants enable row level security;
create policy "anon read product_variants" on product_variants for select using (is_active);

-- Gia ban le de hien "Giá lẻ" cho combo (chi hien thi, khong dung de tinh tien)
alter table products add column if not exists compare_at_vnd integer check (compare_at_vnd >= 0);

-- Snapshot quy cach trong don
alter table order_items add column if not exists variant_id text;
alter table order_items add column if not exists variant_label text;

-- Cau hoi / loi nhan tu trang Do uong.
-- Anon KHONG co policy: server ghi bang service role sau khi validate Zod.
create table if not exists inquiries (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 2 and 80),
  phone       text not null,
  message     text not null check (char_length(message) between 3 and 600),
  status      text not null default 'new' check (status in ('new','answered','archived')),
  created_at  timestamptz not null default now()
);
alter table inquiries enable row level security;
create index if not exists idx_inquiries_created on inquiries(created_at desc);
