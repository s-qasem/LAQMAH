-- Menu products for the LQMAH menu.
--
-- Related to menu_categories by foreign key, never by category name.
--
-- ON DELETE RESTRICT is deliberate: deleting a category that still holds
-- products must fail loudly rather than cascade-delete the menu. The admin
-- turns that refusal into a readable message; the constraint is the guarantee.
--
-- Reads: anonymous visitors see available products inside active categories.
-- Writes: allowlisted admins only, via public.is_admin() from
-- 20260826000000_create_admin_authorization.sql.
--
-- No seed rows here; seeding happens in 20260826000400.

create table if not exists public.menu_products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.menu_categories (id) on delete restrict,
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_en text not null check (length(btrim(name_en)) > 0),
  -- Arabic copy and price are optional: the current public menu has neither.
  name_ar text check (name_ar is null or length(btrim(name_ar)) > 0),
  description_en text,
  description_ar text,
  price numeric(10, 2) check (price is null or price >= 0),
  image_url text,
  display_order integer not null default 0 check (display_order >= 0 and display_order <= 9999),
  is_available boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint menu_products_slug_key unique (slug)
);

-- Ordered listing inside one category, for both the admin and the public menu.
create index if not exists menu_products_category_order_idx
  on public.menu_products (category_id, display_order);

-- The public "Popular" tab is a computed view over featured, available rows.
create index if not exists menu_products_featured_idx
  on public.menu_products (is_featured, is_available);

alter table public.menu_products enable row level security;

create or replace function public.set_menu_products_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_menu_products_updated_at on public.menu_products;

create trigger set_menu_products_updated_at
before update on public.menu_products
for each row execute function public.set_menu_products_updated_at();

-- Role-wide privileges; RLS below narrows writes to allowlisted admins.
revoke all on table public.menu_products from anon, authenticated;
grant select on table public.menu_products to anon, authenticated;
grant insert, update, delete on table public.menu_products to authenticated;

drop policy if exists "Available products are publicly readable" on public.menu_products;
drop policy if exists "Admins read all products" on public.menu_products;
drop policy if exists "Admins insert products" on public.menu_products;
drop policy if exists "Admins update products" on public.menu_products;
drop policy if exists "Admins delete products" on public.menu_products;

-- Public website: available products whose category is itself active. The
-- EXISTS is evaluated under the caller's own RLS, so an anonymous visitor can
-- only match categories the category policy already lets them see.
create policy "Available products are publicly readable"
on public.menu_products
for select
to anon, authenticated
using (
  is_available = true
  and exists (
    select 1
    from public.menu_categories c
    where c.id = menu_products.category_id
      and c.is_active = true
  )
);

-- Admin dashboard: allowlisted admins additionally see unavailable products
-- and products sitting inside hidden categories.
create policy "Admins read all products"
on public.menu_products
for select
to authenticated
using (public.is_admin());

create policy "Admins insert products"
on public.menu_products
for insert
to authenticated
with check (public.is_admin());

create policy "Admins update products"
on public.menu_products
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins delete products"
on public.menu_products
for delete
to authenticated
using (public.is_admin());
