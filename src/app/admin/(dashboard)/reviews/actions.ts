"use server";

import { revalidatePath, updateTag } from "next/cache";

import { getAdminActionClient } from "@/lib/supabase/admin-action";
import { PUBLIC_REVIEWS_TAG } from "@/lib/supabase/reviews-public";
import { deriveSlug } from "@/lib/supabase/menu-categories";
import { listSiteReviews } from "@/lib/supabase/site-content";

export type ReviewErrorCode =
  | "nameRequired"
  | "textRequired"
  | "ratingRange"
  | "duplicate"
  | "save"
  | "delete"
  | "notAuthorized"
  | "notFound";

export type ReviewField = "reviewerName" | "rating" | "reviewEn" | "reviewAr" | "source" | "form";
export type ReviewErrors = Partial<Record<ReviewField, ReviewErrorCode>>;

export type ReviewActionResult = { status: "success" } | { status: "error"; errors: ReviewErrors };

const TABLE = "site_reviews";
const UNIQUE_VIOLATION = "23505";
const NOT_AUTHORIZED: ReviewActionResult = { status: "error", errors: { form: "notAuthorized" } };

function revalidateReviews() {
  revalidatePath("/admin/reviews");
  revalidatePath("/admin");
  // Publishes add / edit / hide / reorder / delete to the public reviews band.
  // `updateTag` is the Server-Action form and applies immediately.
  updateTag(PUBLIC_REVIEWS_TAG);
}

type ParsedReview = {
  slug: string;
  reviewerName: string;
  rating: number;
  reviewEn: string;
  reviewAr: string | null;
  source: string | null;
  reviewedOn: string | null;
  displayOrder: number;
  isVisible: boolean;
};

function parse(form: FormData): { ok: true; value: ParsedReview } | { ok: false; errors: ReviewErrors } {
  const errors: ReviewErrors = {};

  const reviewerName = String(form.get("reviewer_name") ?? "").trim();
  const reviewEn = String(form.get("review_en") ?? "").trim();
  const reviewAr = String(form.get("review_ar") ?? "").trim();
  const source = String(form.get("source") ?? "").trim();
  // Free text on purpose: the seeded values are relative phrases such as
  // "3 months ago", not dates.
  const reviewedOn = String(form.get("reviewed_on") ?? "").trim();
  const rating = Number(String(form.get("rating") ?? "").trim());
  const rawOrder = Number(String(form.get("display_order") ?? "").trim());
  const submittedSlug = String(form.get("slug") ?? "").trim().toLowerCase();

  if (!reviewerName) errors.reviewerName = "nameRequired";
  if (!reviewEn) errors.reviewEn = "textRequired";
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) errors.rating = "ratingRange";

  // A reviewer name may be non-Latin, so fall back to a timestamped slug rather
  // than rejecting the review.
  const slug = submittedSlug || deriveSlug(reviewerName) || `review-${Date.now()}`;

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      slug,
      reviewerName,
      rating,
      reviewEn,
      reviewAr: reviewAr || null,
      source: source || null,
      reviewedOn: reviewedOn || null,
      displayOrder: Number.isInteger(rawOrder) && rawOrder >= 0 && rawOrder <= 9999 ? rawOrder : 0,
      isVisible: form.get("is_visible") === "on",
    },
  };
}

function toRow(value: ParsedReview) {
  return {
    slug: value.slug,
    reviewer_name: value.reviewerName,
    rating: value.rating,
    review_en: value.reviewEn,
    review_ar: value.reviewAr,
    source: value.source,
    reviewed_on: value.reviewedOn,
    display_order: value.displayOrder,
    is_visible: value.isVisible,
  };
}

export async function createReviewAction(formData: FormData): Promise<ReviewActionResult> {
  const parsed = parse(formData);
  if (!parsed.ok) return { status: "error", errors: parsed.errors };

  const supabase = await getAdminActionClient();
  if (!supabase) return NOT_AUTHORIZED;

  const { data, error } = await supabase.from(TABLE).insert(toRow(parsed.value)).select("id");

  if (error) {
    if (error.code === UNIQUE_VIOLATION) return { status: "error", errors: { reviewerName: "duplicate" } };
    return { status: "error", errors: { form: "save" } };
  }

  if (!data || data.length === 0) return NOT_AUTHORIZED;

  revalidateReviews();

  return { status: "success" };
}

export async function updateReviewAction(id: string, formData: FormData): Promise<ReviewActionResult> {
  const parsed = parse(formData);
  if (!parsed.ok) return { status: "error", errors: parsed.errors };

  const supabase = await getAdminActionClient();
  if (!supabase) return NOT_AUTHORIZED;

  const { data, error } = await supabase.from(TABLE).update(toRow(parsed.value)).eq("id", id).select("id");

  if (error) {
    if (error.code === UNIQUE_VIOLATION) return { status: "error", errors: { reviewerName: "duplicate" } };
    return { status: "error", errors: { form: "save" } };
  }

  if (!data || data.length === 0) return { status: "error", errors: { form: "notFound" } };

  revalidateReviews();

  return { status: "success" };
}

export async function deleteReviewAction(id: string): Promise<ReviewActionResult> {
  const supabase = await getAdminActionClient();
  if (!supabase) return NOT_AUTHORIZED;

  const { data, error } = await supabase.from(TABLE).delete().eq("id", id).select("id");

  if (error) return { status: "error", errors: { form: "delete" } };
  if (!data || data.length === 0) return { status: "error", errors: { form: "notFound" } };

  revalidateReviews();

  return { status: "success" };
}

export async function setReviewVisibilityAction(id: string, isVisible: boolean): Promise<ReviewActionResult> {
  const supabase = await getAdminActionClient();
  if (!supabase) return NOT_AUTHORIZED;

  const { data, error } = await supabase.from(TABLE).update({ is_visible: isVisible }).eq("id", id).select("id");

  if (error) return { status: "error", errors: { form: "save" } };
  if (!data || data.length === 0) return { status: "error", errors: { form: "notFound" } };

  revalidateReviews();

  return { status: "success" };
}

export async function moveReviewAction(id: string, direction: "up" | "down"): Promise<ReviewActionResult> {
  const supabase = await getAdminActionClient();
  if (!supabase) return NOT_AUTHORIZED;

  const listed = await listSiteReviews();
  if (!listed.ok) return { status: "error", errors: { form: "save" } };

  const ordered = listed.reviews;
  const index = ordered.findIndex((review) => review.id === id);
  if (index === -1) return { status: "error", errors: { form: "notFound" } };

  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= ordered.length) return { status: "success" };

  const reordered = [...ordered];
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

  const changed = reordered
    .map((review, position) => ({ id: review.id, display_order: position + 1 }))
    .filter((row, position) => reordered[position].displayOrder !== row.display_order);

  for (const row of changed) {
    const { data, error } = await supabase
      .from(TABLE)
      .update({ display_order: row.display_order })
      .eq("id", row.id)
      .select("id");

    if (error) return { status: "error", errors: { form: "save" } };
    if (!data || data.length === 0) return { status: "error", errors: { form: "notFound" } };
  }

  revalidateReviews();

  return { status: "success" };
}
