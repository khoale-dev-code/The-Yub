-- ============================================================
-- 0008 – Tai khoan khach (dang nhap Google), mon yeu thich, nhat ky dong y,
--        gan don hang voi tai khoan khach.
-- Chay SAU 0001–0007. Chay lai nhieu lan khong sao.
-- (Bang "customers" cu tu 0001 chua tung duoc dung – giu nguyen, tai khoan khach o bang moi
--  "customer_accounts" gan voi Supabase Auth.)
--
-- Bao mat: bat RLS va KHONG tao policy cho anon/authenticated
-- -> trinh duyet khong doc/ghi truc tiep duoc; chi server (service role)
--    doc ghi sau khi da xac thuc phien khach hoac quyen quan ly.
-- ============================================================

create table if not exists public.customer_accounts (
  id               uuid primary key references auth.users(id) on delete cascade,
  email            text not null default '',
  full_name        text not null default '' check (char_length(full_name) <= 80),
  avatar_url       text check (avatar_url is null or (avatar_url like 'https://%' and char_length(avatar_url) <= 500)),
  phone            text check (phone is null or char_length(phone) <= 20),
  address          text check (address is null or char_length(address) <= 200),
  -- Bang chung dong y (phien ban chinh sach + thoi diem) – Luat Bao ve du lieu ca nhan
  consent_version  text not null,
  consented_at     timestamptz not null,
  marketing_opt_in boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  last_login_at    timestamptz not null default now()
);
alter table public.customer_accounts enable row level security;
create index if not exists idx_customer_accounts_last_login on public.customer_accounts(last_login_at desc);

drop trigger if exists trg_customer_accounts_updated on public.customer_accounts;
create trigger trg_customer_accounts_updated before update on public.customer_accounts for each row execute function public.set_updated_at();

-- Mon yeu thich (product_id dang text: dung duoc ca ma mon cu)
create table if not exists public.customer_favorites (
  customer_id uuid not null references public.customer_accounts(id) on delete cascade,
  product_id  text not null check (char_length(product_id) between 1 and 64),
  created_at  timestamptz not null default now(),
  primary key (customer_id, product_id)
);
alter table public.customer_favorites enable row level security;

-- Nhat ky dong y / rut lai dong y (xoa theo tai khoan khi khach xoa tai khoan)
create table if not exists public.customer_consents (
  id          bigint generated always as identity primary key,
  customer_id uuid not null references public.customer_accounts(id) on delete cascade,
  version     text not null,
  purposes    text[] not null,
  marketing   boolean not null default false,
  action      text not null check (action in ('grant', 'withdraw', 'marketing_on', 'marketing_off')),
  created_at  timestamptz not null default now()
);
alter table public.customer_consents enable row level security;
create index if not exists idx_customer_consents_customer on public.customer_consents(customer_id, created_at desc);

-- Don hang <-> tai khoan khach. Xoa tai khoan: don van con (so sach) nhung bo lien ket.
alter table public.orders add column if not exists customer_id uuid;
-- Cot customer_id cu tro toi bang customers (khong dung) -> chuyen sang customer_accounts
alter table public.orders drop constraint if exists orders_customer_id_fkey;
alter table public.orders drop constraint if exists orders_customer_fk;
update public.orders set customer_id = null
 where customer_id is not null and customer_id not in (select id from public.customer_accounts);
alter table public.orders add constraint orders_customer_fk foreign key (customer_id) references public.customer_accounts(id) on delete set null;
create index if not exists idx_orders_customer on public.orders(customer_id, created_at desc) where customer_id is not null;

-- Khong cap quyen truc tiep cho trinh duyet
revoke all on public.customer_accounts, public.customer_favorites, public.customer_consents from anon, authenticated;
