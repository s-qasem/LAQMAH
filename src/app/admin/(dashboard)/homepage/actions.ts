"use server";

import { revalidatePath, updateTag } from "next/cache";

import { getAdminActionClient } from "@/lib/supabase/admin-action";
import { deleteMenuImageIfManaged } from "@/lib/supabase/menu-storage";
import { toHeroRow, validateHeroInput, type HeroErrors } from "@/lib/supabase/site-content";

export type HeroActionResult = { status: "success" } | { status: "error"; errors: HeroErrors };

const NOT_AUTHORIZED: HeroActionResult = { status: "error", errors: { form: "notAuthorized" } };

/**
 * Updates the existing `homepage_hero` row with id 'main'.
 *
 * The public homepage already renders this row through `src/data/hero.ts`,
 * which caches it under the "homepage-hero" tag for 60s. `updateTag` refreshes
 * that entry immediately from within a Server Action, so a save is visible on
 * the live site without touching any public rendering code.
 *
 * No row is ever created or deleted: the hero is a singleton, and the migration
 * grants UPDATE only.
 */
export async function updateHomepageHeroAction(formData: FormData): Promise<HeroActionResult> {
  const parsed = validateHeroInput(formData);
  if (!parsed.ok) return { status: "error", errors: parsed.errors };

  const supabase = await getAdminActionClient();
  if (!supabase) return NOT_AUTHORIZED;

  // Images were uploaded straight to Storage by the browser; only URLs arrive
  // here. The previous values ride along so a superseded upload can be cleaned
  // up *after* the row commits.
  const previousDesktop = String(formData.get("current_desktop_image_url") ?? "") || null;
  const previousMobile = String(formData.get("current_mobile_image_url") ?? "") || null;

  const { data, error } = await supabase
    .from("homepage_hero")
    .update(toHeroRow(parsed.value))
    .eq("id", "main")
    .select("id");

  if (error) return { status: "error", errors: { form: "save" } };
  if (!data || data.length === 0) return { status: "error", errors: { form: "notFound" } };

  // Only now that the row points at the new URLs are the old objects removable.
  // Scoped to the `homepage` prefix, so a menu or gallery asset can never match.
  if (previousDesktop && previousDesktop !== parsed.value.desktopImageUrl) {
    await deleteMenuImageIfManaged(supabase, previousDesktop, "homepage");
  }
  if (previousMobile && previousMobile !== parsed.value.mobileImageUrl) {
    await deleteMenuImageIfManaged(supabase, previousMobile, "homepage");
  }

  revalidatePath("/admin/homepage");
  // Refreshes the cached hero the public homepage reads. `updateTag` is the
  // Server-Action form and applies immediately, unlike the deprecated
  // single-argument `revalidateTag`.
  updateTag("homepage-hero");

  return { status: "success" };
}

/* ------------------------------------------------- homepage section copy -- */

import { HOMEPAGE_FIELDS, homepageSpecFor, type HomepageField } from "@/data/homepage-sections";
import { isAcceptableImageValue } from "@/lib/menu-images";
import { PUBLIC_HOMEPAGE_TAG } from "@/lib/supabase/homepage-public";

export type HomepageSectionErrorCode = "required" | "url" | "save" | "notAuthorized" | "notFound" | "unknownSection";

export type HomepageSectionErrors = Partial<Record<HomepageField | "form", HomepageSectionErrorCode>>;

export type HomepageSectionActionResult =
  | { status: "success" }
  | { status: "error"; errors: HomepageSectionErrors };

const SECTION_NOT_AUTHORIZED: HomepageSectionActionResult = {
  status: "error",
  errors: { form: "notAuthorized" },
};

/**
 * Site-relative or https, matching the database CHECK.
 *
 * "//host" is protocol-relative, not a site path, so it is excluded.
 */
function isSafeLink(value: string) {
  return (value.startsWith("/") && !value.startsWith("//")) || value.startsWith("https://");
}

function revalidateHomepageSections() {
  revalidatePath("/admin/homepage");
  // Publishes copy, image and visibility changes to the public homepage.
  // `updateTag` is the Server-Action form and applies immediately.
  updateTag(PUBLIC_HOMEPAGE_TAG);
}

/**
 * Updates one row of `homepage_sections`.
 *
 * The section's spec decides which columns it owns. Every column it does not
 * own is written as NULL, so the per-section CHECK constraint is satisfied by
 * construction and an unused column can never pick up a stray value.
 *
 * No row is created or deleted: the migration grants UPDATE only.
 */
export async function updateHomepageSectionAction(
  sectionKey: string,
  formData: FormData,
): Promise<HomepageSectionActionResult> {
  const spec = homepageSpecFor(sectionKey);
  if (!spec) return { status: "error", errors: { form: "unknownSection" } };

  const errors: HomepageSectionErrors = {};
  const values = {} as Record<HomepageField, string | null>;

  for (const field of HOMEPAGE_FIELDS) {
    if (!spec.fields.includes(field)) {
      // Not owned by this section; the CHECK requires NULL.
      values[field] = null;
      continue;
    }

    const raw = String(formData.get(field) ?? "").trim();
    if (!raw) {
      errors[field] = "required";
      values[field] = null;
      continue;
    }

    // An image must satisfy the shared image rule (bundled asset or Storage
    // upload); a CTA is an ordinary link.
    const invalid = field === "image_url" ? !isAcceptableImageValue(raw) : !isSafeLink(raw);

    if ((field === "cta_href" || field === "image_url") && invalid) {
      errors[field] = "url";
    }

    values[field] = raw;
  }

  if (Object.keys(errors).length > 0) return { status: "error", errors };

  const supabase = await getAdminActionClient();
  if (!supabase) return SECTION_NOT_AUTHORIZED;

  // Structural sections cannot be hidden; the database enforces this too.
  const isPublished = spec.canHide ? formData.get("is_published") === "on" : true;

  const previousImage = String(formData.get("current_image_url") ?? "") || null;

  const { data, error } = await supabase
    .from("homepage_sections")
    .update({
      eyebrow: values.eyebrow,
      heading_line_1: values.heading_line_1,
      heading_line_2: values.heading_line_2,
      arabic_accent: values.arabic_accent,
      body: values.body,
      cta_label: values.cta_label,
      cta_href: values.cta_href,
      cta_secondary_label: values.cta_secondary_label,
      image_url: values.image_url,
      image_alt: values.image_alt,
      is_published: isPublished,
    })
    .eq("section_key", sectionKey)
    .select("section_key");

  if (error) return { status: "error", errors: { form: "save" } };
  if (!data || data.length === 0) return { status: "error", errors: { form: "notFound" } };

  // Only once the row points at the new URL is the superseded object removable.
  // Scoped to the `homepage` prefix, so menu and gallery assets can never match.
  if (previousImage && previousImage !== values.image_url) {
    await deleteMenuImageIfManaged(supabase, previousImage, "homepage");
  }

  revalidateHomepageSections();

  return { status: "success" };
}

/* --------------------------------------------------- atmosphere image slot -- */

export type AtmosphereErrors = Partial<
  Record<"image_url" | "alt_text" | "caption" | "form", HomepageSectionErrorCode>
>;

export type AtmosphereActionResult = { status: "success" } | { status: "error"; errors: AtmosphereErrors };

/**
 * Updates one of the three fixed atmosphere slots.
 *
 * Position is never written: it is the primary key and the design slot that
 * maps to atmosphere-shot--1/2/3. The migration grants UPDATE only, so a fourth
 * slot cannot be added and an existing one cannot be removed.
 */
export async function updateAtmosphereImageAction(
  position: number,
  formData: FormData,
): Promise<AtmosphereActionResult> {
  if (![1, 2, 3].includes(position)) return { status: "error", errors: { form: "unknownSection" } };

  const errors: AtmosphereErrors = {};

  const imageUrl = String(formData.get("image_url") ?? "").trim();
  const altText = String(formData.get("alt_text") ?? "").trim();
  const caption = String(formData.get("caption") ?? "").trim();

  if (!imageUrl) errors.image_url = "required";
  else if (!isAcceptableImageValue(imageUrl)) errors.image_url = "url";
  if (!altText) errors.alt_text = "required";
  if (!caption) errors.caption = "required";

  if (Object.keys(errors).length > 0) return { status: "error", errors };

  const supabase = await getAdminActionClient();
  if (!supabase) return { status: "error", errors: { form: "notAuthorized" } };

  const previousImage = String(formData.get("current_image_url") ?? "") || null;

  const { data, error } = await supabase
    .from("homepage_atmosphere_images")
    .update({ image_url: imageUrl, alt_text: altText, caption })
    .eq("position", position)
    .select("position");

  if (error) return { status: "error", errors: { form: "save" } };
  if (!data || data.length === 0) return { status: "error", errors: { form: "notFound" } };

  if (previousImage && previousImage !== imageUrl) {
    await deleteMenuImageIfManaged(supabase, previousImage, "homepage");
  }

  revalidateHomepageSections();

  return { status: "success" };
}
