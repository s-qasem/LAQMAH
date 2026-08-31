-- Seeds the five real categories currently rendered by the public menu.
--
-- "Popular" is deliberately absent: on the public site it is a computed view
-- over is_featured (see MenuExplorer), not a category, and creating it as a row
-- would produce a second, conflicting source of truth.
--
-- display_order preserves the order of menuCategories in src/data/menu.ts.
-- image_url is left NULL: the homepage currently supplies category imagery from
-- its own hard-coded map, and that map stays in charge until images are
-- uploaded through the admin.
--
-- Idempotent: re-running inserts nothing new and modifies no existing row.

insert into public.menu_categories (name_en, name_ar, slug, display_order, is_active)
values
  ('Hot Drinks',   'مشروبات ساخنة', 'hot-drinks',   1, true),
  ('Cold Drinks',  'مشروبات باردة', 'cold-drinks',  2, true),
  ('Fresh Juices', 'عصائر طازجة',   'fresh-juices', 3, true),
  ('Sandwiches',   'ساندويتشات',    'sandwiches',   4, true),
  ('Desserts',     'حلويات',        'desserts',     5, true)
on conflict (slug) do nothing;
