create table if not exists public.homepage_hero (
  id text primary key,
  eyebrow text not null,
  headline_lines text[] not null check (cardinality(headline_lines) between 1 and 4),
  description text not null,
  button_label text not null,
  button_href text not null,
  desktop_image_url text not null,
  mobile_image_url text not null,
  is_published boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint homepage_hero_singleton check (id = 'main')
);

alter table public.homepage_hero enable row level security;

create or replace function public.set_homepage_hero_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_homepage_hero_updated_at
before update on public.homepage_hero
for each row execute function public.set_homepage_hero_updated_at();

revoke all on table public.homepage_hero from anon, authenticated;
grant select on table public.homepage_hero to anon, authenticated;

create policy "Published hero is publicly readable"
on public.homepage_hero
for select
to anon, authenticated
using (id = 'main' and is_published = true);

insert into public.homepage_hero (
  id,
  eyebrow,
  headline_lines,
  description,
  button_label,
  button_href,
  desktop_image_url,
  mobile_image_url,
  is_published
)
values (
  'main',
  'More Than Coffee',
  array['A PLACE TO', 'GATHER, SIP &', 'STAY AWHILE'],
  E'Specialty coffee, fresh juices, delicious desserts and good company.\nWelcome to LQMAH.',
  'Explore Our Menu',
  '/menu',
  '/interior/LQAMAH OUTSIDE - Copy.png',
  '/exterior/mobile-hero.png',
  true
)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('website-content', 'website-content', true)
on conflict (id) do update set public = true;

create policy "Website content images are publicly readable"
on storage.objects
for select
to public
using (bucket_id = 'website-content');
