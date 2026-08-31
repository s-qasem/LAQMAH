-- Contact details, opening hours and social links.
--
-- The public site currently reads `business` and `socials` from src/data/site.ts.
-- Those values are placeholders today ("Address to be confirmed"), and they are
-- seeded verbatim rather than replaced with invented content — the admin is
-- where real values get entered.
--
-- Three tables rather than one, because the shapes genuinely differ: a
-- singleton for contact details, one row per weekday for hours, and one row per
-- platform for socials.
--
-- Reads: anonymous visitors may read all three (the public site displays them).
-- Writes: allowlisted admins only, via public.is_admin().

-- ---------------------------------------------------------------- contact ---

create table if not exists public.site_contact (
  id text primary key,
  address_en text,
  address_ar text,
  phone text,
  email text,
  map_url text,
  map_embed_url text,
  order_url text,
  order_label_en text,
  order_label_ar text,
  updated_at timestamptz not null default now(),
  constraint site_contact_singleton check (id = 'main')
);

alter table public.site_contact enable row level security;

create or replace function public.set_site_contact_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_site_contact_updated_at on public.site_contact;

create trigger set_site_contact_updated_at
before update on public.site_contact
for each row execute function public.set_site_contact_updated_at();

-- Current public values, preserved exactly. These are the placeholders the live
-- site already shows; nothing is invented here.
insert into public.site_contact (id, address_en, phone, email, map_url)
values ('main', 'Address to be confirmed', 'Phone to be confirmed', 'Email to be confirmed', null)
on conflict (id) do nothing;

-- ------------------------------------------------------------------ hours ---

create table if not exists public.business_hours (
  -- 0 = Monday … 6 = Sunday, matching the order the admin renders.
  day_of_week smallint primary key check (day_of_week between 0 and 6),
  opens time,
  closes time,
  is_closed boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.business_hours enable row level security;

create or replace function public.set_business_hours_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_business_hours_updated_at on public.business_hours;

create trigger set_business_hours_updated_at
before update on public.business_hours
for each row execute function public.set_business_hours_updated_at();

-- Seven rows with NULL times. The live site says "Opening hours to be
-- confirmed", so no opening time is known; the admin fills these in.
insert into public.business_hours (day_of_week, opens, closes, is_closed)
values (0, null, null, false), (1, null, null, false), (2, null, null, false),
       (3, null, null, false), (4, null, null, false), (5, null, null, false),
       (6, null, null, false)
on conflict (day_of_week) do nothing;

-- ----------------------------------------------------------------- social ---

create table if not exists public.social_links (
  id uuid primary key default gen_random_uuid(),
  -- Stable machine key: instagram, tiktok, facebook, …
  platform text not null check (platform ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  label text not null check (length(btrim(label)) > 0),
  url text,
  display_order integer not null default 0 check (display_order >= 0 and display_order <= 9999),
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint social_links_platform_key unique (platform)
);

create index if not exists social_links_order_idx on public.social_links (display_order);

alter table public.social_links enable row level security;

create or replace function public.set_social_links_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_social_links_updated_at on public.social_links;

create trigger set_social_links_updated_at
before update on public.social_links
for each row execute function public.set_social_links_updated_at();

-- The two platforms listed in src/data/site.ts. Their hrefs are "#", i.e. not
-- real links, so url stays NULL and they start hidden rather than shipping a
-- dead link.
insert into public.social_links (platform, label, url, display_order, is_visible)
values ('instagram', 'Instagram', null, 1, false),
       ('facebook', 'Facebook', null, 2, false)
on conflict (platform) do nothing;

-- --------------------------------------------------------------- policies ---

revoke all on table public.site_contact from anon, authenticated;
revoke all on table public.business_hours from anon, authenticated;
revoke all on table public.social_links from anon, authenticated;

grant select on table public.site_contact to anon, authenticated;
grant select on table public.business_hours to anon, authenticated;
grant select on table public.social_links to anon, authenticated;

-- Contact and hours are singleton/fixed-row tables: admins update them, they do
-- not create or delete rows, so no INSERT or DELETE privilege is granted.
grant update on table public.site_contact to authenticated;
grant update on table public.business_hours to authenticated;
grant insert, update, delete on table public.social_links to authenticated;

drop policy if exists "Contact details are publicly readable" on public.site_contact;
drop policy if exists "Admins update contact details" on public.site_contact;
drop policy if exists "Business hours are publicly readable" on public.business_hours;
drop policy if exists "Admins update business hours" on public.business_hours;
drop policy if exists "Visible social links are publicly readable" on public.social_links;
drop policy if exists "Admins read all social links" on public.social_links;
drop policy if exists "Admins insert social links" on public.social_links;
drop policy if exists "Admins update social links" on public.social_links;
drop policy if exists "Admins delete social links" on public.social_links;

create policy "Contact details are publicly readable"
on public.site_contact for select to anon, authenticated
using (id = 'main');

create policy "Admins update contact details"
on public.site_contact for update to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "Business hours are publicly readable"
on public.business_hours for select to anon, authenticated
using (true);

create policy "Admins update business hours"
on public.business_hours for update to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "Visible social links are publicly readable"
on public.social_links for select to anon, authenticated
using (is_visible = true);

create policy "Admins read all social links"
on public.social_links for select to authenticated
using (public.is_admin());

create policy "Admins insert social links"
on public.social_links for insert to authenticated
with check (public.is_admin());

create policy "Admins update social links"
on public.social_links for update to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "Admins delete social links"
on public.social_links for delete to authenticated
using (public.is_admin());
