-- Homepage section presentation copy.
--
-- One typed row per rendered homepage section. Every field is a real column;
-- there is no JSON. Sections that own repeated ordered items keep their own
-- child table (see 20260829000100 for the three atmosphere images).
--
-- This table holds ONLY presentation chrome. It never duplicates data that
-- already has a proper source: menu categories/products, reviews, contact
-- details, business hours and social links all stay where they are.
--
-- homepage_hero is a separate, already-working table and is not touched here.

create table if not exists public.homepage_sections (
  section_key text primary key,

  eyebrow text,
  heading_line_1 text,
  heading_line_2 text,
  -- Only the two Arabic accent lines the current design already displays.
  -- This is not a general translation column.
  arabic_accent text,
  body text,
  cta_label text,
  cta_href text,
  -- Used only by the Visit section, which renders two buttons.
  cta_secondary_label text,
  image_url text,
  image_alt text,

  is_published boolean not null default true,
  updated_at timestamptz not null default now(),

  -- ------------------------------------------------------------- identity ---
  -- The nine sections the homepage actually renders, in render order. Combined
  -- with the absence of insert/delete grants below, the set is fixed.
  constraint homepage_sections_key_known check (
    section_key in (
      'welcome',
      'signature_scene',
      'menu',
      'featured',
      'atmosphere',
      'interior_story',
      'reviews',
      'visit',
      'final_cta'
    )
  ),

  -- --------------------------------------------------------- blank guards ---
  -- A cleared field must be NULL, never an empty string, so "unset" stays a
  -- single state.
  constraint homepage_sections_eyebrow_not_blank check (eyebrow is null or length(btrim(eyebrow)) > 0),
  constraint homepage_sections_heading_1_not_blank check (heading_line_1 is null or length(btrim(heading_line_1)) > 0),
  constraint homepage_sections_heading_2_not_blank check (heading_line_2 is null or length(btrim(heading_line_2)) > 0),
  constraint homepage_sections_arabic_not_blank check (arabic_accent is null or length(btrim(arabic_accent)) > 0),
  constraint homepage_sections_body_not_blank check (body is null or length(btrim(body)) > 0),
  constraint homepage_sections_cta_label_not_blank check (cta_label is null or length(btrim(cta_label)) > 0),
  constraint homepage_sections_cta_href_not_blank check (cta_href is null or length(btrim(cta_href)) > 0),
  constraint homepage_sections_cta_secondary_not_blank check (cta_secondary_label is null or length(btrim(cta_secondary_label)) > 0),
  constraint homepage_sections_image_url_not_blank check (image_url is null or length(btrim(image_url)) > 0),
  constraint homepage_sections_image_alt_not_blank check (image_alt is null or length(btrim(image_alt)) > 0),

  -- A link is either site-relative or https. Mirrors safeLink() in src/data/hero.ts.
  constraint homepage_sections_cta_href_shape check (
    cta_href is null or cta_href ~ '^(/|https://)'
  ),

  -- An image is either a bundled /public path or an https URL. The application
  -- still narrows https to the configured Storage host.
  constraint homepage_sections_image_url_shape check (
    image_url is null or image_url ~ '^(/|https://)'
  ),

  -- ------------------------------------------------------ structural lock ---
  -- Menu, Featured, Reviews and Visit are structural: they carry data from
  -- other tables and the homepage would lose real content if they vanished.
  -- The admin UI shows no visibility toggle for them; this makes that a
  -- database guarantee rather than a UI convention.
  constraint homepage_sections_structural_always_published check (
    is_published or section_key not in ('menu', 'featured', 'reviews', 'visit')
  ),

  -- --------------------------------------------- per-section field shapes ---
  -- Each section states exactly which fields it requires and which must stay
  -- NULL. This replaces the per-table NOT NULL constraints that separate
  -- singleton tables would have given, and additionally keeps unused columns
  -- genuinely unused (a Final CTA can never acquire an image, for example).

  constraint homepage_sections_welcome_shape check (
    section_key <> 'welcome' or (
      eyebrow is null
      and heading_line_1 is not null
      and heading_line_2 is not null
      and arabic_accent is null
      and body is null
      and cta_label is null
      and cta_href is null
      and cta_secondary_label is null
      and image_url is not null
      and image_alt is not null
    )
  ),

  constraint homepage_sections_signature_scene_shape check (
    section_key <> 'signature_scene' or (
      eyebrow is not null
      and heading_line_1 is not null
      and heading_line_2 is not null
      and arabic_accent is not null
      and body is not null
      and cta_label is not null
      and cta_href is not null
      and cta_secondary_label is null
      -- The poster still shown behind/next to the hard-coded video.
      and image_url is not null
      and image_alt is not null
    )
  ),

  constraint homepage_sections_menu_shape check (
    section_key <> 'menu' or (
      eyebrow is not null
      and heading_line_1 is not null
      and heading_line_2 is null
      and arabic_accent is null
      and body is null
      -- cta_label / cta_href carry the "View full menu" text link.
      and cta_label is not null
      and cta_href is not null
      and cta_secondary_label is null
      and image_url is null
      and image_alt is null
    )
  ),

  constraint homepage_sections_featured_shape check (
    section_key <> 'featured' or (
      eyebrow is not null
      and heading_line_1 is null
      and heading_line_2 is null
      and arabic_accent is null
      and body is null
      and cta_label is null
      and cta_href is null
      and cta_secondary_label is null
      and image_url is null
      and image_alt is null
    )
  ),

  constraint homepage_sections_atmosphere_shape check (
    section_key <> 'atmosphere' or (
      eyebrow is not null
      and heading_line_1 is not null
      and heading_line_2 is not null
      and arabic_accent is null
      and body is not null
      and cta_label is null
      and cta_href is null
      and cta_secondary_label is null
      -- The three images live in homepage_atmosphere_images.
      and image_url is null
      and image_alt is null
    )
  ),

  constraint homepage_sections_interior_story_shape check (
    section_key <> 'interior_story' or (
      eyebrow is not null
      and heading_line_1 is not null
      and heading_line_2 is not null
      and arabic_accent is null
      and body is not null
      and cta_label is null
      and cta_href is null
      and cta_secondary_label is null
      and image_url is not null
      and image_alt is not null
    )
  ),

  constraint homepage_sections_reviews_shape check (
    section_key <> 'reviews' or (
      eyebrow is not null
      and heading_line_1 is not null
      and heading_line_2 is not null
      and arabic_accent is null
      and body is null
      and cta_label is null
      and cta_href is null
      and cta_secondary_label is null
      and image_url is null
      and image_alt is null
    )
  ),

  constraint homepage_sections_visit_shape check (
    section_key <> 'visit' or (
      eyebrow is not null
      and heading_line_1 is not null
      and heading_line_2 is not null
      and arabic_accent is null
      and body is null
      -- Two button labels. "Contact Us" always points at /contact and
      -- "Get Directions" uses site_contact.map_url, so neither href is stored.
      and cta_label is not null
      and cta_href is null
      and cta_secondary_label is not null
      and image_url is null
      and image_alt is null
    )
  ),

  constraint homepage_sections_final_cta_shape check (
    section_key <> 'final_cta' or (
      eyebrow is null
      and heading_line_1 is not null
      and heading_line_2 is not null
      and arabic_accent is not null
      and body is not null
      and cta_label is not null
      and cta_href is not null
      and cta_secondary_label is null
      and image_url is null
      and image_alt is null
    )
  )
);

alter table public.homepage_sections enable row level security;

-- ------------------------------------------------------------- updated_at ---
-- Same per-table pattern as homepage_hero, menu_categories, site_contact and
-- social_links: a dedicated function with an empty search_path.

create or replace function public.set_homepage_sections_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_homepage_sections_updated_at on public.homepage_sections;

create trigger set_homepage_sections_updated_at
before update on public.homepage_sections
for each row execute function public.set_homepage_sections_updated_at();

-- ----------------------------------------------------------------- grants ---
-- Read-only for anonymous visitors. Administrators may only UPDATE: without
-- insert or delete, the nine seeded rows can never be added to or removed.

revoke all on table public.homepage_sections from anon, authenticated;
grant select on table public.homepage_sections to anon, authenticated;
grant update on table public.homepage_sections to authenticated;

-- --------------------------------------------------------------- policies ---

drop policy if exists "Published homepage sections are publicly readable" on public.homepage_sections;
drop policy if exists "Admins read all homepage sections" on public.homepage_sections;
drop policy if exists "Admins update homepage sections" on public.homepage_sections;

create policy "Published homepage sections are publicly readable"
on public.homepage_sections for select to anon, authenticated
using (is_published = true);

create policy "Admins read all homepage sections"
on public.homepage_sections for select to authenticated
using (public.is_admin());

create policy "Admins update homepage sections"
on public.homepage_sections for update to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ------------------------------------------------------------------- seed ---
-- Verbatim from src/components/ui/HomeSections.tsx (lines 76-123) and the
-- paths in src/data/images.ts. Nothing rewritten, nothing translated.

insert into public.homepage_sections (
  section_key,
  eyebrow,
  heading_line_1,
  heading_line_2,
  arabic_accent,
  body,
  cta_label,
  cta_href,
  cta_secondary_label,
  image_url,
  image_alt,
  is_published
)
values
  -- Welcome Banner. The five feature chips stay hard-coded by decision.
  (
    'welcome',
    null,
    'COFFEE. CONVERSATION.',
    'EVERY MATCH.',
    null,
    null,
    null,
    null,
    null,
    '/interior/LQAMH INSIDE - Copy.png',
    'LQMAH café interior with pastry counter, seating, and warm lighting',
    true
  ),
  -- Signature Scene. The video /menu/videos/signature-scene2.mp4 stays
  -- hard-coded by decision; only its poster image is managed here.
  (
    'signature_scene',
    'The Signature Scene',
    'CRAFTED DAILY.',
    'SERVED WITH PASSION.',
    'محضّرة يومياً بشغف',
    'Premium ingredients, careful preparation, and flavors made to be remembered.',
    'Discover Our Desserts',
    '/menu?category=Desserts',
    null,
    '/desserts/chocolate-cake-moderate-white-cup.png',
    'Clean cheesecake beneath a chocolate pot beside a white coffee cup and chess pieces',
    true
  ),
  -- Explore Our Menu. Category rail items come from menu_categories.
  (
    'menu',
    'Made For Every Mood',
    'EXPLORE OUR MENU',
    null,
    null,
    null,
    'View full menu',
    '/menu',
    null,
    null,
    null,
    true
  ),
  -- Featured Products. Items come from menu_products.is_featured.
  (
    'featured',
    'House Favorites',
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    true
  ),
  -- More Than A Cafe. Its three images live in homepage_atmosphere_images.
  (
    'atmosphere',
    'Room For The Moment',
    'MORE THAN',
    'A CAFE',
    null,
    'Whether you are here for a quiet coffee, a game with friends, a study session, or your favorite match, LQMAH makes room for the moment.',
    null,
    null,
    null,
    null,
    null,
    true
  ),
  -- Interior Story.
  (
    'interior_story',
    'The Atmosphere',
    'DESIGNED',
    'TO MAKE YOU STAY',
    null,
    'Warm light, considered details, and comfortable tables create a setting that feels refined without losing its welcome.',
    null,
    null,
    null,
    '/interior/LQAMH INSIDE - Copy.png',
    'Comfortable LQMAH seating and warm lighting',
    true
  ),
  -- Reviews Strip. Review items come from site_reviews.
  (
    'reviews',
    'Real Guest Reviews',
    'WHAT OUR',
    'GUESTS SAY',
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    true
  ),
  -- Visit. Address, hours and maps come from site_contact + business_hours.
  -- The homepage keeps its existing literal "LQMAH" location treatment.
  (
    'visit',
    'Visit LQMAH',
    'COME FIND',
    'YOUR FAVORITE TABLE',
    null,
    null,
    'Contact Us',
    null,
    'Get Directions',
    null,
    null,
    true
  ),
  -- Final CTA.
  (
    'final_cta',
    null,
    'YOUR TABLE',
    'IS WAITING',
    'أهلاً بكم',
    'Come for the coffee. Stay for the atmosphere.',
    'Explore Menu',
    '/menu',
    null,
    null,
    null,
    true
  )
on conflict (section_key) do nothing;
