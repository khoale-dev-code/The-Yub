-- The Yub · Công thức nội bộ. Áp dụng sau 0008.
begin;

create table if not exists public.item_recipes (
  product_id uuid unique references public.products(id) on delete restrict,
  drink_id text unique references public.drinks(id) on delete restrict,
  batch text not null check (char_length(trim(batch)) between 1 and 100),
  ingredients text not null check (char_length(trim(ingredients)) between 1 and 8000),
  steps text not null check (char_length(trim(steps)) between 1 and 16000),
  notes text not null default '' check (char_length(notes) <= 4000),
  revision uuid primary key default gen_random_uuid(),
  constraint recipe_has_one_item check (num_nonnulls(product_id, drink_id) = 1)
);

-- Cấp quyền theo cột để mã món và phiên bản do máy chủ quản lý sau khi tạo.
alter table public.item_recipes enable row level security;
revoke all on public.item_recipes from public, anon, authenticated;
-- Các truy vấn dùng phiên đăng nhập và các policy RLS hiện có của thực đơn.
grant select (user_id, role) on public.admin_users to authenticated;
grant select (id, name, sort_order, deleted_at) on public.products to authenticated;
grant select (id, name, sort_order) on public.drinks to authenticated;
grant select, delete on public.item_recipes to authenticated;
grant insert (product_id, drink_id, batch, ingredients, steps, notes),
      update (batch, ingredients, steps, notes) on public.item_recipes to authenticated;

create or replace function public.bump_item_recipe_revision()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.revision := gen_random_uuid();
  return new;
end;
$$;
drop trigger if exists bump_recipe_revision on public.item_recipes;
create trigger bump_recipe_revision before update on public.item_recipes
for each row execute function public.bump_item_recipe_revision();

drop policy if exists recipe_read on public.item_recipes;
create policy recipe_read on public.item_recipes for select to authenticated
using ((select public.is_admin()));

drop policy if exists recipe_manage on public.item_recipes;
create policy recipe_manage on public.item_recipes for all to authenticated
using (exists (select 1 from public.admin_users where user_id = (select auth.uid()) and role = 'owner'))
with check (
  exists (select 1 from public.admin_users where user_id = (select auth.uid()) and role = 'owner')
  and (product_id is null or exists (select 1 from public.products p where p.id = product_id and p.deleted_at is null))
);

notify pgrst, 'reload schema';
commit;
