import type { Metadata } from "next";

import { AdminPageHeader, AdminText } from "@/components/admin";
import { siteAssets } from "@/data/site-assets";
import { formatBytes, listMediaAssets } from "@/lib/supabase/media-library";

import { MediaLibrary } from "./MediaLibrary";

export const metadata: Metadata = { title: "Media Library", robots: { index: false, follow: false } };

export default async function AdminMediaPage() {
  const result = await listMediaAssets();

  // Formatted on the server so the client component receives plain strings.
  const sizes = Object.fromEntries(result.assets.map((asset) => [asset.path, formatBytes(asset.sizeBytes)]));

  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrowKey="page.eyebrow.assets"
        titleKey="page.media.title"
        descriptionKey="page.media.description"
      />

      {result.ok ? null : (
        <p className="admin-form__error" role="alert">
          <AdminText tKey="media.unavailableReal" />
        </p>
      )}

      <MediaLibrary assets={result.assets} sizes={sizes} siteAssets={siteAssets} />
    </div>
  );
}
