import "server-only";

import { unstable_cache } from "next/cache";

import { galleryImages } from "@/data/images";

import { createServerSupabaseClient } from "./server";

/**
 * Public read adapter for the LQMAH gallery.
 *
 * Uses the anonymous client, so it sees exactly what a visitor sees: the RLS
 * policy exposes only rows with `is_visible = true`. No session, no cookies, no
 * service-role key.
 *
 * `galleryImages` in `src/data/images.ts` is retained as a fallback for this
 * phase — if the database cannot be read the gallery renders the previous
 * hard-coded content rather than an empty page.
 */

export const PUBLIC_GALLERY_TAG = "public-gallery";

export type PublicGalleryImage = {
  id: string;
  category: string;
  src: string;
  /** English alt text; Arabic is carried for a future public Arabic mode. */
  alt: string;
  altAr: string | null;
  displayOrder: number;
};

export type PublicGallery = {
  images: PublicGalleryImage[];
  /** Which source produced this payload, for reporting during development. */
  source: "supabase" | "fallback";
};

type GalleryRow = {
  slug: string;
  category: string;
  image_url: string;
  alt_en: string;
  alt_ar: string | null;
  display_order: number;
};

/** The previous hard-coded gallery, in the shape the component now consumes. */
function buildFallbackGallery(): PublicGallery {
  return {
    images: galleryImages.map((image, index) => ({
      id: image.id,
      category: image.category,
      src: image.src,
      alt: image.alt,
      altAr: null,
      displayOrder: index + 1,
    })),
    source: "fallback",
  };
}

async function readGalleryFromSupabase(): Promise<PublicGallery | null> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("gallery_images")
    .select("slug, category, image_url, alt_en, alt_ar, display_order")
    .eq("is_visible", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error(
      "[public-gallery] Supabase read failed, falling back to src/data/images.ts:",
      error.message,
    );
    return null;
  }

  const rows = (data ?? []) as GalleryRow[];

  // An empty gallery is almost certainly a misconfiguration rather than an
  // intentional state, so the previous content is shown instead of a blank page.
  if (rows.length === 0) {
    console.error("[public-gallery] No visible gallery rows returned; falling back to src/data/images.ts");
    return null;
  }

  return {
    images: rows.map((row) => ({
      id: row.slug,
      category: row.category,
      src: row.image_url,
      alt: row.alt_en,
      altAr: row.alt_ar,
      displayOrder: row.display_order,
    })),
    source: "supabase",
  };
}

const getCachedPublicGallery = unstable_cache(
  async (): Promise<PublicGallery> => (await readGalleryFromSupabase()) ?? buildFallbackGallery(),
  ["public-gallery"],
  { revalidate: 60, tags: [PUBLIC_GALLERY_TAG] },
);

/** Visible gallery images in display order, ready for the public gallery. */
export async function getPublicGallery(): Promise<PublicGallery> {
  try {
    return await getCachedPublicGallery();
  } catch (error) {
    console.error("[public-gallery] Unexpected failure, falling back to src/data/images.ts:", error);
    return buildFallbackGallery();
  }
}

/**
 * Filter tabs for the gallery, in first-appearance order.
 *
 * The previous implementation hard-coded
 * ["All", "Exterior", "Interior", "Drinks", "Desserts", "Atmosphere"].
 * Deriving the list from the rows reproduces exactly that order for the current
 * data, drops a tab that would show nothing, and picks up a category the owner
 * adds later without a code change.
 */
export function galleryCategories(images: PublicGalleryImage[]): string[] {
  return ["All", ...new Set(images.map((image) => image.category))];
}
