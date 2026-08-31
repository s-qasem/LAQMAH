-- Seeds the 8 images the public gallery renders today.
--
-- image_url keeps the existing /public bundle paths: nothing is copied into
-- Storage, so the live gallery keeps rendering byte-identical files.
-- alt_ar is NULL; the admin falls back to the English alt text.
--
-- Idempotent: re-running inserts nothing new and modifies no existing row.

insert into public.gallery_images (slug, category, image_url, alt_en, display_order, is_visible)
values
  ('exterior-1', 'Exterior', '/interior/LQAMAH OUTSIDE - Copy.png', 'LQMAH exterior illuminated at night', 1, true),
  ('interior-1', 'Interior', '/interior/LQAMH INSIDE - Copy.png', 'LQMAH seating, pastry counter, and game tables', 2, true),
  ('drink-1', 'Drinks', '/coffee/Spanish latte.png', 'LQMAH Spanish latte', 3, true),
  ('dessert-1', 'Desserts', '/desserts/chocolate-cake-chess.png', 'Chocolate cake, coffee, and chess', 4, true),
  ('atmosphere-1', 'Atmosphere', '/interior/Chess Table - Copy.png', 'Chess table inside LQMAH', 5, true),
  ('interior-2', 'Interior', '/interior/logo INSIDE - Copy.png', 'LQMAH interior logo detail', 6, true),
  ('drink-2', 'Drinks', '/menu/Avocado Juice.png', 'Fresh avocado juice', 7, true),
  ('drink-3', 'Drinks', '/menu/matcha.png', 'Matcha drink', 8, true)
on conflict (slug) do nothing;
