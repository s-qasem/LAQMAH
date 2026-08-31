-- Seeds the 3 customer reviews the public homepage renders today.
--
-- `reviewed_on` is stored as free text because the current values are relative
-- phrases ("3 months ago", "Edited a month ago"), not dates. Converting them to
-- timestamps would invent information that does not exist.
--
-- review_ar is NULL; the admin falls back to the English text.
--
-- Idempotent: re-running inserts nothing new and modifies no existing row.

insert into public.site_reviews (slug, reviewer_name, rating, review_en, source, reviewed_on, display_order, is_visible)
values
  ('review-1', 'Gazem Ali', 5, 'I went to Lqmah Cafe and honestly had such a good experience. Everyone there is super nice and welcoming, like you feel comfortable right away. The food and drinks were so good, everything tasted fresh and just hit. Customer service was a 10/10 too, they were really sweet and attentive. I’d definitely recommend it and I’m for sure going back.', 'Google Review', '3 months ago', 1, true),
  ('review-2', 'Quantum Roofing', 5, 'Best experience I had the cakes were so fresh and verely good 10 out of 10 I recommend this place family oriented and very kind bring my kids here they love everything and the prices are really good', 'Google Review', '3 months ago', 2, true),
  ('review-3', 'Raheem Abdullah', 5, 'It''s a beautiful and well-organized café with a great selection of sandwiches and desserts. I tried one of the sandwiches, and it was fresh and delicious. The pastry was crispy, light, and full of flavor. The service was fast, and the place was clean and peaceful. I''ll definitely be back to try more items. Highly recommended!', 'Google Review', 'Edited a month ago', 3, true)
on conflict (slug) do nothing;
