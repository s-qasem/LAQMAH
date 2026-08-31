import type { Metadata } from "next";

import { AdminPageHeader, AdminText } from "@/components/admin";
import { listSiteReviews } from "@/lib/supabase/site-content";

import { ReviewsManager } from "./ReviewsManager";

export const metadata: Metadata = { title: "Reviews", robots: { index: false, follow: false } };

export default async function AdminReviewsPage() {
  const result = await listSiteReviews();

  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrowKey="page.eyebrow.content"
        titleKey="page.reviews.title"
        descriptionKey="page.reviews.description"
      />

      {result.ok ? null : (
        <p className="admin-form__error" role="alert">
          <AdminText tKey="reviews.unavailable" />
        </p>
      )}

      <ReviewsManager reviews={result.reviews} />
    </div>
  );
}
