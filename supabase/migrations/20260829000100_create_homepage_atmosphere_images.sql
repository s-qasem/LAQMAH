-- The three images in the "More Than A Cafe" section.
--
-- Exactly three, permanently. Position 1, 2 and 3 map to the existing CSS
-- classes atmosphere-shot--1 / --2 / --3, which use explicit grid placement
-- (src/styles/site.css lines 81-87). The count is a design constraint, not a
-- preference, so there is no add, delete or reorder anywhere in this design.
--
-- The parent row public.homepage_sections['atmosphere'] owns the section's
-- eyebrow, headings, body and is_published. This table owns only the images.
--
-- These rows are independent of gallery_images by design: hiding a gallery
-- image must never change the homepage.

create table if not exists public.homepage_atmosphere_images (
  -- The primary key IS the design slot. This guarantees uniqueness and, with
  -- the range check, caps the table at three rows without a surrogate id,
  -- a display_order column or a visibility flag.
  position integer primary key,

  image_url text not null,
  alt_text text not null,
  caption text not null,

  updated_at timestamptz not null default now(),

  constraint homepage_atmosphere_images_position_range check (position between 1 and 3),

  constraint homepage_atmosphere_images_url_not_blank check (length(btrim(image_url)) > 0),
  constraint homepage_atmosphere_images_alt_not_blank check (length(btrim(alt_text)) > 0),
  constraint homepage_atmosphere_images_caption_not_blank check (length(btrim(caption)) > 0),

  -- Either a bundled /public path or an https URL. The application still
  -- narrows https to the configured Storage host.
  constraint homepage_atmosphere_images_url_shape check (image_url ~ '^(/|https://)')
);

alter table public.homepage_atmosphere_images enable row level security;

-- ------------------------------------------------------------- updated_at ---
-- Same per-table pattern used by every other table in this project.

create or replace function public.set_homepage_atmosphere_images_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_homepage_atmosphere_images_updated_at on public.homepage_atmosphere_images;

create trigger set_homepage_atmosphere_images_updated_at
before update on public.homepage_atmosphere_images
for each row execute function public.set_homepage_atmosphere_images_updated_at();

-- ----------------------------------------------------------------- grants ---
-- Read-only for anonymous visitors. Administrators may only UPDATE the three
-- seeded slots: without insert or delete, a fourth image cannot be added and
-- an existing slot cannot be removed.

revoke all on table public.homepage_atmosphere_images from anon, authenticated;
grant select on table public.homepage_atmosphere_images to anon, authenticated;
grant update on table public.homepage_atmosphere_images to authenticated;

-- --------------------------------------------------------------- policies ---
-- Public SELECT is unconditional by decision: whether the section renders is
-- decided by homepage_sections['atmosphere'].is_published in the application,
-- not by a cross-table RLS dependency here.

drop policy if exists "Atmosphere images are publicly readable" on public.homepage_atmosphere_images;
drop policy if exists "Admins update atmosphere images" on public.homepage_atmosphere_images;

create policy "Atmosphere images are publicly readable"
on public.homepage_atmosphere_images for select to anon, authenticated
using (true);

create policy "Admins update atmosphere images"
on public.homepage_atmosphere_images for update to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ------------------------------------------------------------------- seed ---
-- Verbatim from src/components/ui/HomeSections.tsx line 114 and the
-- images.atmosphere array in src/data/images.ts.
--
-- The alt text is seeded exactly as it renders today, including the two
-- descriptions that do not match their images (positions 2 and 3). Correcting
-- them is the owner's call once the editor exists; this migration does not
-- silently rewrite published content.

insert into public.homepage_atmosphere_images (position, image_url, alt_text, caption)
values
  (1, '/interior/Chess Table - Copy.png', 'Chess with coffee', 'Play'),
  (2, '/interior/logo INSIDE - Copy.png', 'Friends gathering at the cafe', 'Gather'),
  (3, '/interior/LQAMH INSIDE - Copy.png', 'Live sports atmosphere', 'Stay')
on conflict (position) do nothing;
