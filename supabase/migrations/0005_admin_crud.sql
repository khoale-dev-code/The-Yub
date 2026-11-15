-- ============================================================
-- 0005 – Admin sua / xoa don (1 transaction). Chay SAU 0004.
-- ============================================================

-- Sua thong tin + mon cua don. Chi ghi khi trang thai hien tai van la p_expected_status.
-- Doi ngay/khung gio thi kiem tra lai suc chua (khong tinh chinh don nay).
create or replace function public.update_order(p_code text, p_expected_status text, p_order jsonb, p_items jsonb)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_slot  public.pickup_slots%rowtype;
  v_date  date := (p_order->>'pickup_date')::date;
  v_total int := (p_order->>'total_vnd')::int;
  v_sum   int;
  v_count int;
begin
  select * into v_order from public.orders where code = p_code for update;
  if not found or v_order.status <> p_expected_status then
    return false;
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_ORDER' using errcode = 'P0001';
  end if;
  select coalesce(sum((i->>'line_total_vnd')::int), 0) into v_sum from jsonb_array_elements(p_items) i;
  if v_sum <> v_total then
    raise exception 'TOTAL_MISMATCH' using errcode = 'P0001';
  end if;

  if v_date <> v_order.pickup_date or (p_order->>'pickup_slot_id') <> v_order.pickup_slot_id then
    select * into v_slot from public.pickup_slots where id = p_order->>'pickup_slot_id' for update;
    if not found or not v_slot.is_active then
      raise exception 'SLOT_UNAVAILABLE' using errcode = 'P0001';
    end if;
    if v_slot.capacity is not null then
      select count(*) into v_count from public.orders
       where pickup_date = v_date and pickup_slot_id = v_slot.id and status not in ('cancelled', 'rejected') and id <> v_order.id;
      if v_count >= v_slot.capacity then
        raise exception 'SLOT_FULL' using errcode = 'P0001';
      end if;
    end if;
  end if;

  update public.orders set
    customer_name  = p_order->>'customer_name',
    customer_phone = p_order->>'customer_phone',
    pickup_date    = v_date,
    pickup_slot_id = p_order->>'pickup_slot_id',
    note           = coalesce(p_order->>'note', ''),
    payment_method = p_order->>'payment_method',
    total_vnd      = v_total
  where id = v_order.id;

  delete from public.order_items where order_id = v_order.id;
  insert into public.order_items (order_id, product_id, name_snapshot, unit_price_vnd, qty, line_total_vnd, variant_id, variant_label)
  select v_order.id, nullif(i->>'product_id', '')::uuid, i->>'name', (i->>'unit_price_vnd')::int, (i->>'qty')::int,
         (i->>'line_total_vnd')::int, nullif(i->>'variant_id', ''), nullif(i->>'variant_label', '')
  from jsonb_array_elements(p_items) i;
  return true;
end;
$$;
revoke execute on function public.update_order(text, text, jsonb, jsonb) from public;
grant execute on function public.update_order(text, text, jsonb, jsonb) to service_role;

-- Xoa han don – CHI don da huy / tu choi (don that van giu de doi soat, bao cao).
create or replace function public.delete_order(p_code text)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare v_id uuid;
begin
  select id into v_id from public.orders where code = p_code and status in ('cancelled', 'rejected') for update;
  if not found then
    return false;
  end if;
  delete from public.payments where order_id = v_id;
  delete from public.orders where id = v_id;
  return true;
end;
$$;
revoke execute on function public.delete_order(text) from public;
grant execute on function public.delete_order(text) to service_role;
