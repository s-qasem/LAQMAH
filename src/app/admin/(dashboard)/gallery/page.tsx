import type { Metadata } from "next";

import { AdminPageHeader, AdminText } from "@/components/admin";
import { listGalleryImages } from "@/lib/supabase/site-content";

import { GalleryManager } from "./GalleryManager";

export const metadata: Metadata = { title: "Gallery", robots: { index: false, follow: false } };

export default async function AdminGalleryPage() {
  const result = await listGalleryImages();

  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrowKey="page.eyebrow.content"
        titleKey="page.gallery.title"
        descriptionKey="page.gallery.description"
      />

      {result.ok ? null : (
        <p className="admin-form__error" role="alert">
          <AdminText tKey="gallery.unavailable" />
        </p>
      )}

      <GalleryManager images={result.images} />
    </div>
  );
}
