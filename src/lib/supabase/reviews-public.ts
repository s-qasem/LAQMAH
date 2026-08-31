import "server-only";

import { unstable_cache } from "next/cache";

import { testimonials } from "@/data/site";

import { createServerSupabaseClient } from "./server";

/**
 * Public read adapter for customer reviews.
 *
 * Uses the anonymous client, so it sees exactly what a visitor sees: the RLS
 * policy exposes only rows with `is_visible = true`. No session, no cookies, no
 * service-role key.
 *
 * `testimonials` in `src/data/site.ts` is retained as a fallback for this phase
 * — if the database cannot be read the section renders the previous hard-coded
 * reviews rather than an empty band.
 */

export const PUBLIC_REVIEWS_TAG = "public-reviews";

export type PublicReview = {
  id: string;
  /** A person's name: never translated, stored once. */
  name: string;
  rating: number;
  /** English text; Arabic is carried for a future public Arabic mode. */
  review: string;
  reviewAr: string | null;
  /**
   * Free text, e.g. "3 months ago". Deliberately not a date — the values are
   * relative phrases, and formatting them would invent information.
   */
  date: string;
  source: string;
  displayOrder: number;
};

export type PublicReviews = {
  reviews: PublicReview[];
  /** Which source produced this payload, for reporting during development. */
  source: "supabase" | "fallback";
};

type ReviewRow = {
  slug: string;
  reviewer_name: string;
  rating: number;
  review_en: string;
  review_ar: string | null;
  source: string | null;
  reviewed_on: string | null;
  display_order: number;
};

/** The previous hard-coded testimonials, in the shape the section consumes. */
function buildFallbackReviews(): PublicReviews {
  return {
    reviews: testimonials.map((review, index) => ({
      id: review.name,
      name: review.name,
      rating: review.rating,
      review: review.review,
      reviewAr: null,
      date: review.date,
      source: review.source,
      displayOrder: index + 1,
    })),
    source: "fallback",
  };
}

async function readReviewsFromSupabase(): Promise<PublicReviews | null> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("site_reviews")
    .select("slug, reviewer_name, rating, review_en, review_ar, source, reviewed_on, display_order")
    .eq("is_visible", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[public-reviews] Supabase read failed, falling back to src/data/site.ts:", error.message);
    return null;
  }

  const rows = (data ?? []) as ReviewRow[];

  // An empty band is almost certainly a misconfiguration rather than an
  // intentional state, so the previous content is shown instead.
  if (rows.length === 0) {
    console.error("[public-reviews] No visible reviews returned; falling back to src/data/site.ts");
    return null;
  }

  return {
    reviews: rows.map((row) => ({
      id: row.slug,
      name: row.reviewer_name,
      rating: row.rating,
      review: row.review_en,
      reviewAr: row.review_ar,
      // Blank rather than a placeholder: the footer simply renders nothing.
      date: row.reviewed_on ?? "",
      source: row.source ?? "",
      displayOrder: row.display_order,
    })),
    source: "supabase",
  };
}

const getCachedPublicReviews = unstable_cache(
  async (): Promise<PublicReviews> => (await readReviewsFromSupabase()) ?? buildFallbackReviews(),
  ["public-reviews"],
  { revalidate: 60, tags: [PUBLIC_REVIEWS_TAG] },
);

/** Visible reviews in display order, ready for the public reviews section. */
export async function getPublicReviews(): Promise<PublicReviews> {
  try {
    return await getCachedPublicReviews();
  } catch (error) {
    console.error("[public-reviews] Unexpected failure, falling back to src/data/site.ts:", error);
    return buildFallbackReviews();
  }
}
