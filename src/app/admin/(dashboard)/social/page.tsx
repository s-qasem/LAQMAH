import type { Metadata } from "next";

import { AdminPageHeader, AdminText } from "@/components/admin";
import { listSocialLinks } from "@/lib/supabase/site-content";

import { SocialManager } from "./SocialManager";

export const metadata: Metadata = { title: "Social Media", robots: { index: false, follow: false } };

export default async function AdminSocialPage() {
  const result = await listSocialLinks();

  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrowKey="page.eyebrow.content"
        titleKey="page.social.title"
        descriptionKey="page.social.description"
      />

      {result.ok ? null : (
        <p className="admin-form__error" role="alert">
          <AdminText tKey="social.unavailable" />
        </p>
      )}

      <SocialManager links={result.links} />
    </div>
  );
}
