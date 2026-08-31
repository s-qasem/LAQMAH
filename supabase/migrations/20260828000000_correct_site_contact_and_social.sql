-- Corrects the seeded contact, hours and social rows to the values the public
-- site actually renders today.
--
-- WHY THIS EXISTS
-- The original seed (20260827000500) read `business` and `socials` from
-- src/data/site.ts. Those objects are stale placeholders: `business` is
-- referenced only once on the homepage (for a single hours line) and `socials`
-- is not referenced by any component at all. The real values are hard-coded in
-- src/app/contact/page.tsx and src/components/layout/SiteFooter.tsx, which the
-- seed never looked at. This migration fixes the data, not the schema.
--
-- SAFETY
-- UPDATE and a single additive INSERT only. No DELETE, no TRUNCATE, no DROP, no
-- schema change, no policy change. Every value below is copied verbatim from the
-- public source; nothing is invented. Fields the public site genuinely does not
-- have (email, ordering link, Arabic address) are set to NULL rather than
-- guessed.
--
-- The existing `facebook` row is deliberately left untouched: Facebook does not
-- appear anywhere on the public site, but removing data is a separate decision.

-- ------------------------------------------------------------- contact ------
-- Source: src/app/contact/page.tsx lines 10-14 (identical values also appear in
-- src/components/layout/SiteFooter.tsx).

update public.site_contact
set
  address_en    = '3065 Oakwood Blvd Ste D, Melvindale, MI 48122',
  phone         = '(313) 722-4149',
  map_url       = 'https://maps.app.goo.gl/DFKXSAyDmfVc6RmW6',
  map_embed_url = 'https://www.google.com/maps?q=42.2820387,-83.175805&z=16&output=embed',
  -- No email address appears anywhere on the public site, so the placeholder
  -- becomes NULL rather than a guess.
  email         = null,
  -- No Arabic address exists publicly yet.
  address_ar    = null,
  -- The /order page links internally; there is no external ordering URL.
  order_url      = null,
  order_label_en = null,
  order_label_ar = null
where id = 'main';

-- --------------------------------------------------------------- hours ------
-- Source: src/app/contact/page.tsx lines 15-19 and SiteFooter.tsx.
--   Monday–Thursday: 10:00 AM–10:00 PM
--   Friday–Saturday: 10:00 AM–11:00 PM
--   Sunday:          10:00 AM–10:00 PM
-- day_of_week: 0 = Monday … 6 = Sunday.

update public.business_hours
set opens = '10:00', closes = '22:00', is_closed = false
where day_of_week in (0, 1, 2, 3);

update public.business_hours
set opens = '10:00', closes = '23:00', is_closed = false
where day_of_week in (4, 5);

update public.business_hours
set opens = '10:00', closes = '22:00', is_closed = false
where day_of_week = 6;

-- -------------------------------------------------------------- social ------
-- Source: src/components/layout/SiteFooter.tsx line 13. Exactly two platforms
-- are displayed, both with the handle @lqmah_bakery.
--
-- The third external link in that footer (https://wa.me/905352973229) is the
-- ArtiCode developer credit, not an LQMAH social profile, and is excluded.

update public.social_links
set
  label         = 'Instagram',
  url           = 'https://www.instagram.com/lqmah_bakery/',
  display_order = 1,
  is_visible    = true
where platform = 'instagram';

insert into public.social_links (platform, label, url, display_order, is_visible)
values ('tiktok', 'TikTok', 'https://www.tiktok.com/@lqmah_bakery', 2, true)
on conflict (platform) do update
set
  label         = excluded.label,
  url           = excluded.url,
  display_order = excluded.display_order,
  is_visible    = excluded.is_visible;

-- Facebook is intentionally NOT modified and NOT removed here. It is seeded with
-- url = NULL and is_visible = false, so it is inert. Deleting it is a separate
-- decision for the owner.
