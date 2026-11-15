-- ============================================================
-- 0003 – Admin: tai khoan quan ly, khung gio co suc chua, tao don 1 transaction,
-- cot bo sung cho san pham, audit log. Chay SAU 0001 va 0002.
-- ============================================================

-- ---------- Tai khoan quan ly ----------
-- Chi nhung user co dong o day moi vao duoc /admin (dang ky Supabase Auth thoi la KHONG du).
create table if not exists admin_users (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  role         text not null default 'staff' check (role in ('owner', 'staff')),
  created_at   timestamptz not null default now()
);
alter table admin_users enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;
revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, service_role;

drop policy if exists "admin read self" on admin_users;
create policy "admin read self" on admin_users for select to authenticated using (user_id = auth.uid());

-- ---------- San pham: cot bo sung ----------
alter table products add column if not exists tagline        text;
alter table products add column if not exists image_position text;
alter table products add column if not exists gallery        text[] not null default '{}';
alter table products add column if not exists details        jsonb;
alter table products add column if not exists sort_order     int not null default 0;

-- ---------- Khung gio: suc chua ----------
-- capacity = so don toi da moi khung gio moi ngay; null = khong gioi han.
alter table pickup_slots add column if not exists capacity int check (capacity is null or capacity between 0 and 500);

-- ---------- Don hang: moc thoi gian + ly do ----------
alter table orders add column if not exists status_note  text;
alter table orders add column if not exists confirmed_at timestamptz;
alter table orders add column if not exists paid_at      timestamptz;
create index if not exists idx_orders_pickup_status on orders(pickup_date, status);
create index if not exists idx_orders_phone on orders(customer_phone);

-- ---------- updated_at tu dong ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_products_updated on products;
create trigger trg_products_updated before update on products for each row execute function public.set_updated_at();
drop trigger if exists trg_orders_updated on orders;
create trigger trg_orders_updated before update on orders for each row execute function public.set_updated_at();

-- ---------- Tao don: 1 transaction, chong trung, kiem tra suc chua ----------
-- Server (service role) da tinh lai gia tu bang products truoc khi goi ham nay.
-- Ham kiem tra lai tong tien = tong cac dong de khong luu don sai so.
create or replace function public.create_order(p_order jsonb, p_items jsonb)
returns table (order_code text, order_token uuid, order_created_at timestamptz, already_existed boolean)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_key   text := nullif(p_order->>'idempotency_key', '');
  v_slot  public.pickup_slots%rowtype;
  v_date  date := (p_order->>'pickup_date')::date;
  v_count int;
  v_total int := (p_order->>'total_vnd')::int;
  v_sum   int;
  v_code  text;
  v_id    uuid;
  v_try   int := 0;
begin
  if v_key is not null then
    return query select o.code, o.access_token, o.created_at, true from public.orders o where o.idempotency_key = v_key;
    if found then return; end if;
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_ORDER' using errcode = 'P0001';
  end if;
  select coalesce(sum((i->>'line_total_vnd')::int), 0) into v_sum from jsonb_array_elements(p_items) i;
  if v_sum <> v_total then
    raise exception 'TOTAL_MISMATCH' using errcode = 'P0001';
  end if;

  -- Khoa dong khung gio de 2 don cung luc khong vuot suc chua
  select * into v_slot from public.pickup_slots where id = p_order->>'pickup_slot_id' for update;
  if not found or not v_slot.is_active then
    raise exception 'SLOT_UNAVAILABLE' using errcode = 'P0001';
  end if;
  if v_slot.capacity is not null then
    select count(*) into v_count from public.orders
     where pickup_date = v_date and pickup_slot_id = v_slot.id and status not in ('cancelled', 'rejected');
    if v_count >= v_slot.capacity then
      raise exception 'SLOT_FULL' using errcode = 'P0001';
    end if;
  end if;

  loop
    v_try := v_try + 1;
    v_code := 'YUB-' || to_char(now() at time zone 'Asia/Ho_Chi_Minh', 'DDMM') || '-' || lpad((floor(random() * 9000) + 1000)::int::text, 4, '0');
    exit when not exists (select 1 from public.orders where code = v_code);
    if v_try > 20 then raise exception 'CODE_EXHAUSTED' using errcode = 'P0001'; end if;
  end loop;

  begin
    insert into public.orders (code, customer_name, customer_phone, pickup_date, pickup_slot_id, note, payment_method, total_vnd, idempotency_key)
    values (v_code, p_order->>'customer_name', p_order->>'customer_phone', v_date, v_slot.id,
            coalesce(p_order->>'note', ''), p_order->>'payment_method', v_total, v_key)
    returning id into v_id;
  exception when unique_violation then
    -- Hai request cung idempotency key gui gan nhu dong thoi: tra ve don da tao
    if v_key is not null then
      return query select o.code, o.access_token, o.created_at, true from public.orders o where o.idempotency_key = v_key;
      return;
    end if;
    raise;
  end;

  insert into public.order_items (order_id, product_id, name_snapshot, unit_price_vnd, qty, line_total_vnd, variant_id, variant_label)
  select v_id, nullif(i->>'product_id', '')::uuid, i->>'name', (i->>'unit_price_vnd')::int, (i->>'qty')::int,
         (i->>'line_total_vnd')::int, nullif(i->>'variant_id', ''), nullif(i->>'variant_label', '')
  from jsonb_array_elements(p_items) i;

  return query select o.code, o.access_token, o.created_at, false from public.orders o where o.id = v_id;
end;
$$;
revoke execute on function public.create_order(jsonb, jsonb) from public;
grant execute on function public.create_order(jsonb, jsonb) to service_role;

-- ---------- RLS cho admin (lop bao ve thu 2; server van kiem tra quyen truoc moi thao tac) ----------
do $$
declare t text;
begin
  foreach t in array array['categories','products','product_variants','pickup_slots','orders','order_items','payments','store_settings','inquiries','customers']
  loop
    execute format('drop policy if exists "admin manage %1$s" on %1$I', t);
    execute format('create policy "admin manage %1$s" on %1$I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

drop policy if exists "admin read audit" on audit_logs;
create policy "admin read audit" on audit_logs for select to authenticated using (public.is_admin());
create index if not exists idx_audit_created on audit_logs(created_at desc);
