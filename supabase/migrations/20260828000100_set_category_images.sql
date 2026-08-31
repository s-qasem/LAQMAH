-- Points each menu category at the image the public homepage already renders
-- for it in the "Explore Our Menu" rail.
--
-- WHY THESE VALUES
-- The public site never stored a category image. The homepage rail computes one
-- at render time (src/components/ui/HomeSections.tsx):
--
--   categoryImage = homepageCategoryImages[category]        -- explicit override
--                 ?? featuredProducts.find(p => p.category === category).image
--
-- Only Sandwiches and Desserts have an explicit override; the other three fall
-- back to a featured product's image. The five values below are that expression
-- evaluated against the current data — not a new choice of artwork.
--
-- NO ASSET IS COPIED, MOVED OR DELETED. These are the existing /public bundle
-- paths, byte-identical to what the live site serves today. `AdminThumb` already
-- renders root-relative paths, so no Storage upload is involved and the seeded
-- product images remain equally valid.
--
-- SAFETY
-- Five UPDATEs against one column. No DELETE, no TRUNCATE, no DROP, no schema
-- change, no policy change. Re-running is harmless.
--
-- SEPARATE ARTWORK, NOT TOUCHED
-- The /menu page has its own per-category hero art in
-- src/components/ui/MenuCategoryExperience.tsx (`categoryHeroes`). Per the
-- earlier decision to keep bespoke hero/icon maps keyed by slug, that art stays
-- hard-coded in the component and is deliberately NOT written into this column.

update public.menu_categories
set image_url = '/coffee/Spanish latte.png'
where slug = 'hot-drinks';

update public.menu_categories
set image_url = '/menu/iced coffee 2.png'
where slug = 'cold-drinks';

update public.menu_categories
set image_url = '/menu/Avocado Juice.png'
where slug = 'fresh-juices';

update public.menu_categories
set image_url = '/menu/sandwiches/grilled chiken sandwich.png'
where slug = 'sandwiches';

update public.menu_categories
set image_url = '/desserts/cookie.png'
where slug = 'desserts';
