import {
  CakeSlice,
  Coffee,
  GlassWater,
  Sandwich,
  Snowflake,
  Star,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

import { images } from "./images";

/**
 * Design-specific presentation for public menu categories, keyed by slug.
 *
 * The database owns which categories exist, their order, their names and their
 * products. It deliberately does NOT own this: icons, hero artwork, hero copy
 * and visual modifiers are bespoke design assets, and forcing them into columns
 * would mean inventing artwork for every future category.
 *
 * Every value below is transcribed verbatim from the previous hard-coded maps in
 * `MenuExplorer.tsx`, `MenuCategoryExperience.tsx` and `HomeSections.tsx`, so the
 * public site renders identically. A category added through the admin that has
 * no entry here falls back to a restrained neutral treatment.
 */

export type CategoryPresentation = {
  icon: LucideIcon;
  /** Short label for the tab strip when the full name is too long. */
  shortLabel?: string;
  /** Copy under the category name on the homepage rail. */
  blurb: string;
  /** Hero band on /menu. */
  hero: {
    eyebrow: string;
    heading: string[];
    body: string;
    image: string;
  };
  /** Bespoke hero visual: steam for hot drinks, a cooler treatment for cold. */
  heroModifier?: "hot" | "cold";
};

const KNOWN: Record<string, CategoryPresentation> = {
  "hot-drinks": {
    icon: Coffee,
    blurb: "Carefully prepared for the rhythm of your day.",
    heroModifier: "hot",
    hero: {
      eyebrow: "Crafted Daily",
      heading: ["Crafted Daily.", "Served with Passion."],
      body: "From focused espresso to silky steamed milk, every cup is prepared with care for a warm LQMAH moment.",
      image: images.coffee.latte,
    },
  },
  "cold-drinks": {
    icon: Snowflake,
    blurb: "Carefully prepared for the rhythm of your day.",
    heroModifier: "cold",
    hero: {
      eyebrow: "Chilled to Perfection",
      heading: ["Cool, Smooth.", "Made to Refresh."],
      body: "Refreshing iced drinks, layered flavors, and carefully crafted finishes for every kind of craving.",
      image: images.drinks.icedCoffee,
    },
  },
  "fresh-juices": {
    icon: GlassWater,
    shortLabel: "Juices",
    blurb: "Carefully prepared for the rhythm of your day.",
    hero: {
      eyebrow: "Freshly Blended",
      heading: ["Fresh Fruit.", "Bright Flavor."],
      body: "Vibrant juices blended from fresh ingredients and served with the signature LQMAH touch.",
      image: images.drinks.cocktail,
    },
  },
  sandwiches: {
    icon: Sandwich,
    blurb: "Carefully prepared for the rhythm of your day.",
    hero: {
      eyebrow: "Made Fresh",
      heading: ["Crafted for Every Bite."],
      body: "Warm, satisfying sandwiches prepared with fresh ingredients and balanced flavor.",
      image: images.sandwiches.club,
    },
  },
  desserts: {
    icon: CakeSlice,
    blurb: "Handcrafted finishes worth lingering over.",
    hero: {
      eyebrow: "Sweetly Crafted",
      heading: ["Made to Indulge."],
      body: "Handcrafted desserts, rich textures, and memorable finishes made for sharing—or keeping to yourself.",
      image: images.desserts.sanSebastianCake,
    },
  },
};

/** The synthetic Popular tab, computed from featured products. */
export const POPULAR_PRESENTATION: CategoryPresentation = {
  icon: Star,
  blurb: "Carefully prepared for the rhythm of your day.",
  hero: {
    eyebrow: "House Favorites",
    heading: ["The LQMAH Favorites.", "Loved for a Reason."],
    body: "A curated selection of the drinks, desserts, and bites our guests return for again and again.",
    image: images.desserts.cookie,
  },
};

/**
 * Neutral treatment for a category the owner adds later. Deliberately restrained:
 * no invented photography and no hero art borrowed from another category — it
 * reuses the interior shot the hero band already sits on.
 */
const FALLBACK: CategoryPresentation = {
  icon: UtensilsCrossed,
  blurb: "Carefully prepared for the rhythm of your day.",
  hero: {
    eyebrow: "LQMAH",
    heading: ["Made With Care."],
    body: "Carefully prepared and served with the signature LQMAH touch.",
    image: images.intro,
  },
};

export function categoryPresentation(slug: string): CategoryPresentation {
  if (slug === "popular") return POPULAR_PRESENTATION;
  return KNOWN[slug] ?? FALLBACK;
}

/** True when the slug has bespoke artwork rather than the neutral fallback. */
export function hasBespokePresentation(slug: string): boolean {
  return slug in KNOWN;
}

/**
 * Homepage rail artwork.
 *
 * Previously computed as `homepageCategoryImages[category] ?? featuredProduct
 * .image`. The category's own `image_url` now carries that value (set by the
 * 20260828000100 migration), so the database is the source; this falls back to
 * a featured product from the category, then to the hero image, exactly as
 * before.
 */
export function railImageFor(
  slug: string,
  categoryImageUrl: string | null,
  fallbackProductImage: string | undefined,
): string {
  return categoryImageUrl || fallbackProductImage || categoryPresentation(slug).hero.image;
}

/** The copy the public menu has always shown when a product has no price set. */
export const PRICE_UNAVAILABLE_LABEL = "Price available in store";

const PRICE_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

/**
 * Formats a menu price for public display.
 *
 * The single place price copy is produced, so the product card, the product
 * drawer and the homepage featured showcase can never drift apart.
 *
 * Prices are `numeric(10,2)` and arrive as a string. A missing, blank or
 * unparseable value falls back to the original label rather than rendering an
 * empty slot or "$NaN" — the public menu has shown that line since launch and
 * most products still have no price.
 *
 *   null   -> "Price available in store"
 *   "5"    -> "$5.00"
 *   "5.5"  -> "$5.50"
 *   "5.99" -> "$5.99"
 */
export function formatMenuPrice(price: string | null | undefined): string {
  if (price === null || price === undefined || price.trim() === "") return PRICE_UNAVAILABLE_LABEL;

  const value = Number(price);
  if (!Number.isFinite(value)) return PRICE_UNAVAILABLE_LABEL;

  return PRICE_FORMATTER.format(value);
}
