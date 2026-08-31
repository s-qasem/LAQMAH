-- Customer reviews shown on the public homepage.
--
-- The homepage currently reads `testimonials` in src/data/site.ts. This table
-- mirrors that shape so the data can be managed in the admin; the public page
-- is NOT switched over in this phase.

create table if not exists public.site_reviews (
  id uuid primary key default gen_random_uuid(),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  -- A person's name: never translated, stored once.
  reviewer_name text not null check (length(btrim(reviewer_name)) > 0),
  rating smallint not null check (rating between 1 and 5),
  review_en text not null check (length(btrim(review_en)) > 0),
  review_ar text check (review_ar is null or length(btrim(review_ar)) > 0),
  source text,
  -- Free text on purpose: the live values are relative phrases such as
  -- "3 months ago", not dates. Storing a timestamp would invent information.
  reviewed_on text,
  display_order integer not null default 0 check (display_order >= 0 and display_order <= 9999),
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_reviews_slug_key unique (slug)
);

create index if not exists site_reviews_order_idx on public.site_reviews (display_order, created_at);
create index if not exists site_reviews_visible_idx on public.site_reviews (is_visible, display_order);

alter table public.site_reviews enable row level security;

create or replace function public.set_site_reviews_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_site_reviews_updated_at on public.site_reviews;

create trigger set_site_reviews_updated_at
before update on public.site_reviews
for each row execute function public.set_site_reviews_updated_at();

revoke all on table public.site_reviews from anon, authenticated;
grant select on table public.site_reviews to anon, authenticated;
grant insert, update, delete on table public.site_reviews to authenticated;

drop policy if exists "Visible reviews are publicly readable" on public.site_reviews;
drop policy if exists "Admins read all reviews" on public.site_reviews;
drop policy if exists "Admins insert reviews" on public.site_reviews;
drop policy if exists "Admins update reviews" on public.site_reviews;
drop policy if exists "Admins delete reviews" on public.site_reviews;

create policy "Visible reviews are publicly readable"
on public.site_reviews for select to anon, authenticated
using (is_visible = true);

create policy "Admins read all reviews"
on public.site_reviews for select to authenticated
using (public.is_admin());

create policy "Admins insert reviews"
on public.site_reviews for insert to authenticated
with check (public.is_admin());

create policy "Admins update reviews"
on public.site_reviews for update to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "Admins delete reviews"
on public.site_reviews for delete to authenticated
using (public.is_admin());
