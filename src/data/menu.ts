import { images } from "./images";

export const menuCategories = ["Popular", "Hot Drinks", "Cold Drinks", "Fresh Juices", "Sandwiches", "Desserts"] as const;
export type MenuCategory = (typeof menuCategories)[number];

export function normalizeCategory(value: string | null | undefined): MenuCategory {
  if (!value) return "Popular";

  let normalized = value.replace(/\+/g, " ");
  try {
    normalized = decodeURIComponent(normalized);
  } catch {
    // Malformed percent-encoding is treated as an unknown category.
  }

  const match = menuCategories.find((category) => category.toLowerCase() === normalized.trim().toLowerCase());
  return match ?? "Popular";
}

export type MenuProduct = { id: string; name: string; category: MenuCategory; description: string; image: string; featured?: boolean; dietary?: string };

export const menuProducts: MenuProduct[] = [
  { id: "espresso", name: "Espresso", category: "Hot Drinks", description: "A focused, aromatic espresso with a lasting finish.", image: images.coffee.espresso },
  { id: "americano", name: "Americano", category: "Hot Drinks", description: "Espresso lengthened with hot water for a smooth cup.", image: images.coffee.americano },
  { id: "cappuccino", name: "Cappuccino", category: "Hot Drinks", description: "Espresso balanced with steamed milk and a soft cap of foam.", image: images.coffee.cappuccino },
  { id: "latte", name: "Latte", category: "Hot Drinks", description: "A mellow espresso drink finished with silky steamed milk.", image: images.coffee.latte },
  { id: "flat-white", name: "Flat White", category: "Hot Drinks", description: "A compact espresso and milk drink with a velvety texture.", image: images.coffee.flatWhite },
  { id: "spanish-latte", name: "Spanish Latte", category: "Hot Drinks", description: "A smooth espresso drink with a rich, creamy finish.", image: images.coffee.spanishLatte, featured: true },
  { id: "mocha", name: "Mocha", category: "Hot Drinks", description: "Espresso and chocolate brought together with steamed milk.", image: images.coffee.mocha },
  { id: "hot-chocolate", name: "Hot Chocolate", category: "Hot Drinks", description: "A warm chocolate drink with a smooth, comforting finish.", image: images.coffee.hotChocolate },
  { id: "turkish-coffee", name: "Turkish Coffee", category: "Hot Drinks", description: "Finely prepared coffee with a bold, traditional character.", image: images.coffee.turkishCoffee },
  { id: "iced-coffee", name: "Iced Coffee", category: "Cold Drinks", description: "Chilled coffee prepared for a clean, refreshing finish.", image: images.drinks.icedCoffee, featured: true },
  { id: "iced-coffee-signature", name: "Signature Iced Coffee", category: "Cold Drinks", description: "A cold house-style coffee with a smooth layered profile.", image: images.drinks.icedCoffeeAlt },
  { id: "iced-coffee-classic", name: "Classic Iced Coffee", category: "Cold Drinks", description: "Coffee served over ice with a balanced, refreshing profile.", image: images.drinks.icedCoffeeWide },
  { id: "matcha", name: "Matcha", category: "Cold Drinks", description: "Earthy matcha served cold and balanced for an easy sip.", image: images.drinks.matcha, featured: true },
  { id: "avocado-juice", name: "Avocado Juice", category: "Fresh Juices", description: "Fresh avocado blended until silky and refreshing.", image: images.drinks.avocado, featured: true },
  { id: "banana-juice", name: "Banana Juice", category: "Fresh Juices", description: "A smooth, naturally sweet banana blend.", image: images.drinks.banana },
  { id: "mango-juice", name: "Mango Juice", category: "Fresh Juices", description: "Bright mango blended into a rich tropical refreshment.", image: images.drinks.mango },
  { id: "orange-juice", name: "Orange Juice", category: "Fresh Juices", description: "A fresh citrus classic served cold.", image: images.drinks.orange },
  { id: "lemonade", name: "Lemonade", category: "Fresh Juices", description: "Bright lemon refreshment with a clean citrus finish.", image: images.drinks.lemonade },
  { id: "strawberry-juice", name: "Strawberry Juice", category: "Fresh Juices", description: "A vivid strawberry blend served chilled.", image: images.drinks.strawberry },
  { id: "strawberry-mint", name: "Strawberry Mint", category: "Cold Drinks", description: "Strawberry lifted with a fresh mint finish.", image: images.drinks.strawberryMint },
  { id: "lqmah-cocktail", name: "LQMAH Cocktail", category: "Fresh Juices", description: "A layered house fruit blend made for sharing moments.", image: images.drinks.cocktail, featured: true },
  { id: "club-sandwich", name: "Club Sandwich", category: "Sandwiches", description: "A layered cafe classic with a fresh, satisfying finish.", image: images.sandwiches.club },
  { id: "falafel-sandwich", name: "Falafel Sandwich", category: "Sandwiches", description: "Crisp falafel paired with fresh, balanced flavors.", image: images.sandwiches.falafel },
  { id: "grilled-chicken-sandwich", name: "Grilled Chicken Sandwich", category: "Sandwiches", description: "Grilled chicken served in a warm, savory sandwich.", image: images.sandwiches.grilledChicken },
  { id: "halloumi-sandwich", name: "Halloumi Sandwich", category: "Sandwiches", description: "Warm halloumi with a bright, satisfying balance.", image: images.sandwiches.halloumi },
  { id: "steak-sandwich", name: "Steak Sandwich", category: "Sandwiches", description: "A hearty steak sandwich with a rich, savory finish.", image: images.sandwiches.steak },
  { id: "tuna-sandwich", name: "Tuna Sandwich", category: "Sandwiches", description: "A fresh cafe-style tuna sandwich served with care.", image: images.sandwiches.tuna },
  { id: "turkey-cheese-sandwich", name: "Turkey & Cheese Sandwich", category: "Sandwiches", description: "Turkey and cheese brought together in a comforting classic.", image: images.sandwiches.turkeyCheese },
  { id: "cheesecake", name: "Cheesecake", category: "Desserts", description: "Creamy cheesecake with a smooth, delicate finish.", image: images.desserts.cheesecake },
  { id: "chocolate-brownie", name: "Chocolate Brownie", category: "Desserts", description: "A rich chocolate brownie with a deeply cocoa finish.", image: images.desserts.chocolateBrownie },
  { id: "cookie", name: "Cookie", category: "Desserts", description: "A golden cafe cookie with a soft, comforting center.", image: images.desserts.cookie },
  { id: "lotus-cake", name: "Lotus Cake", category: "Desserts", description: "A creamy cake layered with warm spiced biscuit flavor.", image: images.desserts.lotusCake },
  { id: "pistachio-kunafa", name: "Pistachio Kunafa", category: "Desserts", description: "Crisp kunafa paired with a rich pistachio finish.", image: images.desserts.pistachioKunafa },
  { id: "red-velvet-cake", name: "Red Velvet Cake", category: "Desserts", description: "Velvety cocoa cake with a smooth, creamy finish.", image: images.desserts.redVelvetCake },
  { id: "san-sebastian-cake", name: "San Sebastian Cake", category: "Desserts", description: "A deeply baked cheesecake with a soft, creamy center.", image: images.desserts.sanSebastianCake },
  { id: "skillet-cookie", name: "Skillet Cookie", category: "Desserts", description: "A warm cookie dessert with a rich, indulgent texture.", image: images.desserts.skilletCookie },
];

export const featuredProducts = menuProducts.filter((product) => product.featured);
