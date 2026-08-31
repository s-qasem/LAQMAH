-- Menu categories for the LQMAH menu.
--
-- Reads: anonymous visitors see active categories only; allowlisted admins see
-- every category. Writes: allowlisted admins only, enforced by public.is_admin()
-- from 20260826000000_create_admin_authorization.sql.
--
-- No seed rows: categories are added from the admin dashboard.

create table if not exists public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  name_en text not null check (length(btrim(name_en)) > 0),
  name_ar text not null check (length(btrim(name_ar)) > 0),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  display_order integer not null default 0 check (display_order >= 0 and display_order <= 9999),
  is_active boolean not null default true,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint menu_categories_slug_key unique (slug)
);

-- Ordered listing for the admin table and, later, the public menu.
create index if not exists menu_categories_display_order_idx
  on public.menu_categories (display_order, name_en);

-- Public menu reads filter on is_active before ordering.
create index if not exists menu_categories_active_order_idx
  on public.menu_categories (is_active, display_order);

alter table public.menu_categories enable row level security;

create or replace function public.set_menu_categories_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_menu_categories_updated_at on public.menu_categories;

create trigger set_menu_categories_updated_at
before update on public.menu_categories
for each row execute function public.set_menu_categories_updated_at();

-- Table privileges are role-wide; RLS below narrows writes to allowlisted
-- admins. Anonymous visitors are never granted a write privilege at all.
revoke all on table public.menu_categories from anon, authenticated;
grant select on table public.menu_categories to anon, authenticated;
grant insert, update, delete on table public.menu_categories to authenticated;

-- Policies are dropped first so the migration can be re-run safely.
drop policy if exists "Active categories are publicly readable" on public.menu_categories;
drop policy if exists "Authenticated users read all categories" on public.menu_categories;
drop policy if exists "Authenticated users insert categories" on public.menu_categories;
drop policy if exists "Authenticated users update categories" on public.menu_categories;
drop policy if exists "Authenticated users delete categories" on public.menu_categories;
drop policy if exists "Admins read all categories" on public.menu_categories;
drop policy if exists "Admins insert categories" on public.menu_categories;
drop policy if exists "Admins update categories" on public.menu_categories;
drop policy if exists "Admins delete categories" on public.menu_categories;

-- Public website: active categories only. This is the ONLY policy a signed-out
-- visitor, or a signed-in non-admin, can match.
create policy "Active categories are publicly readable"
on public.menu_categories
for select
to anon, authenticated
using (is_active = true);

-- Admin dashboard: allowlisted admins additionally see inactive categories.
create policy "Admins read all categories"
on public.menu_categories
for select
to authenticated
using (public.is_admin());

create policy "Admins insert categories"
on public.menu_categories
for insert
to authenticated
with check (public.is_admin());

create policy "Admins update categories"
on public.menu_categories
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins delete categories"
on public.menu_categories
for delete
to authenticated
using (public.is_admin());
