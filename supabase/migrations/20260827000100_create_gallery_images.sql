-- Images shown on the public gallery page.
--
-- The public gallery currently reads `galleryImages` in src/data/images.ts.
-- This table mirrors that shape so the data can be managed in the admin; the
-- public page is NOT switched over in this phase.
--
-- Reads: anonymous visitors see visible images. Writes: allowlisted admins only.

create table if not exists public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  -- Free text, matching the public filter strip (Exterior, Interior, Drinks, …).
  category text not null check (length(btrim(category)) > 0),
  image_url text not null check (length(btrim(image_url)) > 0),
  alt_en text not null check (length(btrim(alt_en)) > 0),
  alt_ar text check (alt_ar is null or length(btrim(alt_ar)) > 0),
  display_order integer not null default 0 check (display_order >= 0 and display_order <= 9999),
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gallery_images_slug_key unique (slug)
);

create index if not exists gallery_images_order_idx on public.gallery_images (display_order, created_at);
create index if not exists gallery_images_visible_idx on public.gallery_images (is_visible, display_order);

alter table public.gallery_images enable row level security;

create or replace function public.set_gallery_images_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_gallery_images_updated_at on public.gallery_images;

create trigger set_gallery_images_updated_at
before update on public.gallery_images
for each row execute function public.set_gallery_images_updated_at();

revoke all on table public.gallery_images from anon, authenticated;
grant select on table public.gallery_images to anon, authenticated;
grant insert, update, delete on table public.gallery_images to authenticated;

drop policy if exists "Visible gallery images are publicly readable" on public.gallery_images;
drop policy if exists "Admins read all gallery images" on public.gallery_images;
drop policy if exists "Admins insert gallery images" on public.gallery_images;
drop policy if exists "Admins update gallery images" on public.gallery_images;
drop policy if exists "Admins delete gallery images" on public.gallery_images;

create policy "Visible gallery images are publicly readable"
on public.gallery_images for select to anon, authenticated
using (is_visible = true);

create policy "Admins read all gallery images"
on public.gallery_images for select to authenticated
using (public.is_admin());

create policy "Admins insert gallery images"
on public.gallery_images for insert to authenticated
with check (public.is_admin());

create policy "Admins update gallery images"
on public.gallery_images for update to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "Admins delete gallery images"
on public.gallery_images for delete to authenticated
using (public.is_admin());
