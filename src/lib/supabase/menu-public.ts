import "server-only";

import { unstable_cache } from "next/cache";

import { images } from "@/data/images";
import { menuCategories, menuProducts } from "@/data/menu";

import { createServerSupabaseClient } from "./server";

/**
 * Public read adapter for the LQMAH menu.
 *
 * Uses the anonymous client, so it sees exactly what a visitor sees: active
 * categories, and available products inside them. No session, no cookies, no
 * service-role key.
 *
 * `src/data/menu.ts` is retained as a fallback for this phase — if the database
 * cannot be read the public menu renders the previous hard-coded content rather
 * than an empty page.
 */

export const PUBLIC_MENU_TAG = "public-menu";

export type PublicCategory = {
  slug: string;
  /** English label, used by the tab strip and the homepage rail. */
  name: string;
  nameAr: string | null;
  imageUrl: string | null;
  displayOrder: number;
};

export type PublicProduct = {
  id: string;
  slug: string;
  categorySlug: string;
  name: string;
  nameAr: string | null;
  description: string;
  descriptionAr: string | null;
  /** Null keeps the existing "Price available in store" line. */
  price: string | null;
  image: string;
  featured: boolean;
  displayOrder: number;
};

export type PublicMenu = {
  categories: PublicCategory[];
  products: PublicProduct[];
  /** Which source produced this payload, for reporting during development. */
  source: "supabase" | "fallback";
};

type CategoryRow = {
  slug: string;
  name_en: string;
  name_ar: string | null;
  image_url: string | null;
  display_order: number;
};

type ProductRow = {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string | null;
  description_en: string | null;
  description_ar: string | null;
  price: string | number | null;
  image_url: string | null;
  display_order: number;
  is_featured: boolean;
  menu_categories: { slug: string; display_order: number } | null;
};

export function slugifyCategory(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/**
 * The previous hard-coded menu, in the shape the components now consume.
 *
 * Ordering matches the database rule below (category order, then position
 * within the category), so a fallback render is indistinguishable from a
 * successful one.
 */
function buildFallbackMenu(): PublicMenu {
  const categories: PublicCategory[] = menuCategories
    .filter((name) => name !== "Popular")
    .map((name, index) => ({
      slug: slugifyCategory(name),
      name,
      nameAr: null,
      imageUrl: null,
      displayOrder: index + 1,
    }));

  const perCategory = new Map<string, number>();

  const products: PublicProduct[] = menuProducts.map((product) => {
    const categorySlug = slugifyCategory(product.category);
    const position = (perCategory.get(categorySlug) ?? 0) + 1;
    perCategory.set(categorySlug, position);

    return {
      id: product.id,
      slug: product.id,
      categorySlug,
      name: product.name,
      nameAr: null,
      description: product.description,
      descriptionAr: null,
      price: null,
      image: product.image,
      featured: Boolean(product.featured),
      displayOrder: position,
    };
  });

  return { categories, products, source: "fallback" };
}

async function readMenuFromSupabase(): Promise<PublicMenu | null> {
  const supabase = createServerSupabaseClient();

  const [categoryResult, productResult] = await Promise.all([
    supabase
      .from("menu_categories")
      .select("slug, name_en, name_ar, image_url, display_order")
      .eq("is_active", true)
      .order("display_order", { ascending: true }),
    supabase
      .from("menu_products")
      .select(
        "id, slug, name_en, name_ar, description_en, description_ar, price, image_url, display_order, is_featured, menu_categories(slug, display_order)",
      )
      .eq("is_available", true),
  ]);

  if (categoryResult.error || productResult.error) {
    console.error(
      "[public-menu] Supabase read failed, falling back to src/data/menu.ts:",
      categoryResult.error?.message ?? productResult.error?.message,
    );
    return null;
  }

  const categories = (categoryResult.data as CategoryRow[]).map((row) => ({
    slug: row.slug,
    name: row.name_en,
    nameAr: row.name_ar,
    imageUrl: row.image_url,
    displayOrder: row.display_order,
  }));

  // A category with no products still belongs in the tab strip, so an empty
  // product list is a valid result rather than a failure.
  if (categories.length === 0) {
    console.error("[public-menu] No active categories returned; falling back to src/data/menu.ts");
    return null;
  }

  const rows = productResult.data as unknown as ProductRow[];

  const products: PublicProduct[] = rows
    .filter((row) => row.menu_categories?.slug)
    // Category order first, then position within the category. This reproduces
    // the order of the original hard-coded array exactly.
    .sort(
      (a, b) =>
        (a.menu_categories!.display_order - b.menu_categories!.display_order) ||
        a.display_order - b.display_order ||
        a.name_en.localeCompare(b.name_en),
    )
    .map((row) => ({
      id: row.slug,
      slug: row.slug,
      categorySlug: row.menu_categories!.slug,
      name: row.name_en,
      nameAr: row.name_ar,
      // Arabic is carried through for a future public Arabic mode; English is
      // what renders today. A null description becomes an empty string rather
      // than breaking the card layout.
      description: row.description_en ?? "",
      descriptionAr: row.description_ar,
      price: row.price === null ? null : String(row.price),
      image: row.image_url ?? images.intro,
      featured: row.is_featured,
      displayOrder: row.display_order,
    }));

  return { categories, products, source: "supabase" };
}

const getCachedPublicMenu = unstable_cache(
  async (): Promise<PublicMenu> => (await readMenuFromSupabase()) ?? buildFallbackMenu(),
  ["public-menu"],
  { revalidate: 60, tags: [PUBLIC_MENU_TAG] },
);

/** Active categories and their available products, ready for the public menu. */
export async function getPublicMenu(): Promise<PublicMenu> {
  try {
    return await getCachedPublicMenu();
  } catch (error) {
    console.error("[public-menu] Unexpected failure, falling back to src/data/menu.ts:", error);
    return buildFallbackMenu();
  }
}

/**
 * The "Popular" tab is a computed view, never a category row: featured products
 * that are available and sit in an active category. The query above already
 * enforces availability and category activity, so this is the last filter.
 */
export function popularProducts(products: PublicProduct[]) {
  return products.filter((product) => product.featured);
}

/**
 * Resolves a `?category=` value to a category slug.
 *
 * Accepts either the English label (what the homepage rail has always linked
 * with) or the slug, so existing links and bookmarks keep working. Anything
 * unrecognised falls back to Popular, matching the previous behaviour.
 */
export function resolveCategoryParam(value: string | null | undefined, categories: PublicCategory[]): string {
  if (!value) return POPULAR_SLUG;

  let normalized = value.replace(/\+/g, " ");
  try {
    normalized = decodeURIComponent(normalized);
  } catch {
    // Malformed percent-encoding is treated as an unknown category.
  }

  const needle = normalized.trim().toLowerCase();
  const match = categories.find(
    (category) => category.name.toLowerCase() === needle || category.slug === needle,
  );

  return match?.slug ?? POPULAR_SLUG;
}

export const POPULAR_SLUG = "popular";
