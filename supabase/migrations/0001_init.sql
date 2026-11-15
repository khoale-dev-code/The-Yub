-- ============================================================
-- The Yub – Bakes & More · Schema khoi tao (PostgreSQL / Supabase)
-- Data Integrity First: PK/FK, CHECK, NOT NULL, index theo query patterns.
-- Chay trong SQL Editor cua Supabase hoac qua supabase CLI migration.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- Danh muc & san pham ----------
create table if not exists categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists products (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid not null references categories(id),
  slug         text not null unique,
  name         text not null,
  description  text not null default '',
  -- Gia luu bang integer VND, khong dung float cho tien
  price_vnd    integer not null check (price_vnd >= 0),
  status       text not null default 'ready'
               check (status in ('ready','oven','pre','out')),
  image_path   text,          -- Supabase Storage path
  is_active    boolean not null default true,
  deleted_at   timestamptz,   -- soft delete
  deleted_by   uuid,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_products_category on products(category_id) where deleted_at is null;
create index if not exists idx_products_active on products(is_active) where deleted_at is null;

-- ---------- Khung gio nhan ----------
create table if not exists pickup_slots (
  id         text primary key,          -- 's1'..'s5'
  label      text not null,
  sort_order int  not null default 0,
  is_active  boolean not null default true
);

-- ---------- Khach & don hang ----------
create table if not exists customers (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  phone      text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_customers_phone on customers(phone);

create table if not exists orders (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,                -- ma cong khai YUB-xxxx (khong phai bang chung xac thuc)
  access_token    uuid not null default gen_random_uuid(), -- token tra cuu don
  customer_id     uuid references customers(id),
  customer_name   text not null,
  customer_phone  text not null,
  pickup_date     date not null,
  pickup_slot_id  text not null references pickup_slots(id),
  note            text not null default '',
  -- Trang thai don va trang thai thanh toan DOC LAP
  status          text not null default 'pending_confirmation'
                  check (status in ('pending_confirmation','confirmed','preparing','ready','completed','cancelled','rejected')),
  payment_method  text not null check (payment_method in ('cod','transfer')),
  payment_status  text not null default 'unpaid'
                  check (payment_status in ('unpaid','pending_verification','paid','refunded')),
  total_vnd       integer not null check (total_vnd >= 0),
  idempotency_key text unique,                         -- chong trung don khi client retry
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_created on orders(created_at desc);
create index if not exists idx_orders_pickup on orders(pickup_date, pickup_slot_id);

-- Snapshot: KHONG truy nguoc gia hien tai tu products cho don cu
create table if not exists order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references orders(id) on delete cascade,
  product_id     uuid references products(id),
  name_snapshot  text not null,
  unit_price_vnd integer not null check (unit_price_vnd >= 0),
  qty            integer not null check (qty between 1 and 20),
  line_total_vnd integer not null check (line_total_vnd >= 0)
);
create index if not exists idx_order_items_order on order_items(order_id);

create table if not exists payments (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references orders(id),
  method        text not null check (method in ('cod','transfer')),
  amount_vnd    integer not null check (amount_vnd >= 0),
  status        text not null default 'pending'
                check (status in ('pending','verified','failed','refunded')),
  verified_by   uuid,           -- admin xac minh thu cong
  verified_at   timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists idx_payments_order on payments(order_id);

-- ---------- Cau hinh & audit ----------
create table if not exists store_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id         bigint generated always as identity primary key,
  actor      uuid,
  action     text not null,
  entity     text not null,
  entity_id  text not null,
  detail     jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_entity on audit_logs(entity, entity_id);

-- ---------- Row Level Security ----------
alter table categories    enable row level security;
alter table products      enable row level security;
alter table pickup_slots  enable row level security;
alter table customers     enable row level security;
alter table orders        enable row level security;
alter table order_items   enable row level security;
alter table payments      enable row level security;
alter table store_settings enable row level security;
alter table audit_logs    enable row level security;

-- Khach (anon) chi DOC catalog; moi ghi/doc don di qua server (service role bo qua RLS).
create policy "anon read categories"   on categories   for select using (true);
create policy "anon read products"     on products     for select using (deleted_at is null and is_active);
create policy "anon read pickup_slots" on pickup_slots for select using (is_active);
-- orders/customers/payments/audit: KHONG mo policy cho anon – chi service role (server) truy cap.
