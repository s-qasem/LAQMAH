import { Sparkles } from "lucide-react";
import type { Metadata } from "next";

import { AdminPageHeader, AdminText } from "@/components/admin";
import { HOMEPAGE_SECTION_SPECS } from "@/data/homepage-sections";
import { getHomepageHeroRow, listAtmosphereImages, listHomepageSections } from "@/lib/supabase/site-content";

import { HeroEditor } from "./HeroEditor";
import { AtmosphereImagesEditor, HomepageSectionEditor } from "./SectionEditors";

export const metadata: Metadata = {
  title: "Homepage",
  robots: { index: false, follow: false },
};

export default async function AdminHomepagePage() {
  const [hero, sections, atmosphereImages] = await Promise.all([
    getHomepageHeroRow(),
    listHomepageSections(),
    listAtmosphereImages(),
  ]);

  const byKey = new Map((sections ?? []).map((row) => [row.sectionKey, row]));

  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrowKey="page.eyebrow.content"
        titleKey="page.homepage.title"
        descriptionKey="page.homepage.description"
      />

      <p className="admin-callout">
        <Sparkles aria-hidden="true" />
        <span>
          <AdminText tKey="homepage.callout" />
        </span>
      </p>

      {hero ? (
        <HeroEditor hero={hero} />
      ) : (
        <p className="admin-form__error" role="alert">
          <AdminText tKey="hero.unavailable" />
        </p>
      )}

      {sections === null ? (
        <p className="admin-form__error" role="alert">
          <AdminText tKey="homepage.unavailable" />
        </p>
      ) : null}

      {/* One editor per section, in the order the public homepage renders them.
          The atmosphere image slots sit directly beneath their own section. */}
      {HOMEPAGE_SECTION_SPECS.map((spec) => {
        const row = byKey.get(spec.key);
        if (!row) return null;

        return (
          <div key={spec.key}>
            <HomepageSectionEditor spec={spec} row={row} />
            {spec.key === "atmosphere" ? (
              atmosphereImages && atmosphereImages.length > 0 ? (
                <AtmosphereImagesEditor images={atmosphereImages} />
              ) : (
                <p className="admin-form__error" role="alert">
                  <AdminText tKey="homepage.atmosphere.unavailable" />
                </p>
              )
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
