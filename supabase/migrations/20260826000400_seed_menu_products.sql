-- Seeds the 36 products currently rendered by the public menu.
--
-- Values are transcribed mechanically from src/data/menu.ts; image paths point
-- at the existing files in /public and are NOT moved into Storage, so the live
-- site keeps rendering byte-identical imagery.
--
-- name_ar, description_ar and price are intentionally left NULL: the current
-- public menu carries no Arabic copy and no prices. The reader falls back to
-- English, and a NULL price keeps the existing "Price available in store" line.
--
-- Idempotent: re-running inserts nothing new. Existing rows are never modified.

insert into public.menu_products (
  category_id, slug, name_en, description_en, image_url, display_order, is_featured
)
select c.id, v.slug, v.name_en, v.description_en, v.image_url, v.display_order, v.is_featured
from (
  values
    ('hot-drinks', 'espresso', 'Espresso', 'A focused, aromatic espresso with a lasting finish.', '/coffee/espresso.png', 1, false),
    ('hot-drinks', 'americano', 'Americano', 'Espresso lengthened with hot water for a smooth cup.', '/coffee/Americano.png', 2, false),
    ('hot-drinks', 'cappuccino', 'Cappuccino', 'Espresso balanced with steamed milk and a soft cap of foam.', '/coffee/cappucino.png', 3, false),
    ('hot-drinks', 'latte', 'Latte', 'A mellow espresso drink finished with silky steamed milk.', '/coffee/Latte.png', 4, false),
    ('hot-drinks', 'flat-white', 'Flat White', 'A compact espresso and milk drink with a velvety texture.', '/coffee/flat white.png', 5, false),
    ('hot-drinks', 'spanish-latte', 'Spanish Latte', 'A smooth espresso drink with a rich, creamy finish.', '/coffee/Spanish latte.png', 6, true),
    ('hot-drinks', 'mocha', 'Mocha', 'Espresso and chocolate brought together with steamed milk.', '/coffee/mocha.png', 7, false),
    ('hot-drinks', 'hot-chocolate', 'Hot Chocolate', 'A warm chocolate drink with a smooth, comforting finish.', '/coffee/hot chocolate.png', 8, false),
    ('hot-drinks', 'turkish-coffee', 'Turkish Coffee', 'Finely prepared coffee with a bold, traditional character.', '/coffee/Trukish coffee.png', 9, false),
    ('cold-drinks', 'iced-coffee', 'Iced Coffee', 'Chilled coffee prepared for a clean, refreshing finish.', '/menu/iced coffee 2.png', 1, true),
    ('cold-drinks', 'iced-coffee-signature', 'Signature Iced Coffee', 'A cold house-style coffee with a smooth layered profile.', '/menu/iced coffee 3.png', 2, false),
    ('cold-drinks', 'iced-coffee-classic', 'Classic Iced Coffee', 'Coffee served over ice with a balanced, refreshing profile.', '/menu/iced coffee one1.png', 3, false),
    ('cold-drinks', 'matcha', 'Matcha', 'Earthy matcha served cold and balanced for an easy sip.', '/menu/matcha.png', 4, true),
    ('fresh-juices', 'avocado-juice', 'Avocado Juice', 'Fresh avocado blended until silky and refreshing.', '/menu/Avocado Juice.png', 1, true),
    ('fresh-juices', 'banana-juice', 'Banana Juice', 'A smooth, naturally sweet banana blend.', '/menu/Banana Juice.png', 2, false),
    ('fresh-juices', 'mango-juice', 'Mango Juice', 'Bright mango blended into a rich tropical refreshment.', '/menu/Mango Juice.png', 3, false),
    ('fresh-juices', 'orange-juice', 'Orange Juice', 'A fresh citrus classic served cold.', '/menu/Orange Juice.png', 4, false),
    ('fresh-juices', 'lemonade', 'Lemonade', 'Bright lemon refreshment with a clean citrus finish.', '/menu/lemonade.png', 5, false),
    ('fresh-juices', 'strawberry-juice', 'Strawberry Juice', 'A vivid strawberry blend served chilled.', '/menu/Strawberry Juice.png', 6, false),
    ('cold-drinks', 'strawberry-mint', 'Strawberry Mint', 'Strawberry lifted with a fresh mint finish.', '/menu/strwberry mint.png', 5, false),
    ('fresh-juices', 'lqmah-cocktail', 'LQMAH Cocktail', 'A layered house fruit blend made for sharing moments.', '/menu/coctail Juice.png', 7, true),
    ('sandwiches', 'club-sandwich', 'Club Sandwich', 'A layered cafe classic with a fresh, satisfying finish.', '/menu/sandwiches/club sandwish.png', 1, false),
    ('sandwiches', 'falafel-sandwich', 'Falafel Sandwich', 'Crisp falafel paired with fresh, balanced flavors.', '/menu/sandwiches/falafel sandwich.png', 2, false),
    ('sandwiches', 'grilled-chicken-sandwich', 'Grilled Chicken Sandwich', 'Grilled chicken served in a warm, savory sandwich.', '/menu/sandwiches/grilled chiken sandwich.png', 3, false),
    ('sandwiches', 'halloumi-sandwich', 'Halloumi Sandwich', 'Warm halloumi with a bright, satisfying balance.', '/menu/sandwiches/hallomi sandwich.png', 4, false),
    ('sandwiches', 'steak-sandwich', 'Steak Sandwich', 'A hearty steak sandwich with a rich, savory finish.', '/menu/sandwiches/Steak sandwich.png', 5, false),
    ('sandwiches', 'tuna-sandwich', 'Tuna Sandwich', 'A fresh cafe-style tuna sandwich served with care.', '/menu/sandwiches/Tuna Sandwich.png', 6, false),
    ('sandwiches', 'turkey-cheese-sandwich', 'Turkey & Cheese Sandwich', 'Turkey and cheese brought together in a comforting classic.', '/menu/sandwiches/Turkey & Cheese sandwish.png', 7, false),
    ('desserts', 'cheesecake', 'Cheesecake', 'Creamy cheesecake with a smooth, delicate finish.', '/desserts/cheesecake.png', 1, false),
    ('desserts', 'chocolate-brownie', 'Chocolate Brownie', 'A rich chocolate brownie with a deeply cocoa finish.', '/desserts/chocolate browni.png', 2, false),
    ('desserts', 'cookie', 'Cookie', 'A golden cafe cookie with a soft, comforting center.', '/desserts/cookie.png', 3, false),
    ('desserts', 'lotus-cake', 'Lotus Cake', 'A creamy cake layered with warm spiced biscuit flavor.', '/desserts/Lotus Cake.png', 4, false),
    ('desserts', 'pistachio-kunafa', 'Pistachio Kunafa', 'Crisp kunafa paired with a rich pistachio finish.', '/desserts/pisto kunafa.png', 5, false),
    ('desserts', 'red-velvet-cake', 'Red Velvet Cake', 'Velvety cocoa cake with a smooth, creamy finish.', '/desserts/redvelvet cake.png', 6, false),
    ('desserts', 'san-sebastian-cake', 'San Sebastian Cake', 'A deeply baked cheesecake with a soft, creamy center.', '/desserts/San sebstan cake.png', 7, false),
    ('desserts', 'skillet-cookie', 'Skillet Cookie', 'A warm cookie dessert with a rich, indulgent texture.', '/desserts/skillct cookie.png', 8, false)
) as v (category_slug, slug, name_en, description_en, image_url, display_order, is_featured)
join public.menu_categories c on c.slug = v.category_slug
on conflict (slug) do nothing;
