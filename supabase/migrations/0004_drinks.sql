-- ============================================================
-- 0004 – Do uong quan ly trong Admin (gia M/L, het mon, an/hien). Chay SAU 0003.
-- ============================================================
create table if not exists drinks (
  id          text primary key check (id ~ '^[a-z0-9-]{2,60}$'),
  name        text not null check (char_length(name) between 2 and 80),
  description text not null default '',
  drink_group text not null check (drink_group in ('coffee', 'tea', 'other', 'juice')),
  temps       text[] not null default '{ice}' check (temps <@ array['hot', 'ice']::text[] and cardinality(temps) between 1 and 2),
  price_m_vnd int not null check (price_m_vnd >= 0),
  price_l_vnd int check (price_l_vnd is null or price_l_vnd >= 0),
  is_active   boolean not null default true,
  sold_out    boolean not null default false,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table drinks enable row level security;

drop trigger if exists trg_drinks_updated on drinks;
create trigger trg_drinks_updated before update on drinks for each row execute function public.set_updated_at();

drop policy if exists "public read active drinks" on drinks;
create policy "public read active drinks" on drinks for select using (is_active);
drop policy if exists "admin manage drinks" on drinks;
create policy "admin manage drinks" on drinks for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Bao cao doanh thu loc theo ngay nhan
create index if not exists idx_orders_pickup_date on orders(pickup_date);
