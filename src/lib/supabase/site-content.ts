import "server-only";

import { isAcceptableImageValue } from "@/lib/menu-images";

import { createAuthSupabaseClient } from "./server-auth";

/**
 * Admin data layer for the sections added in the site-content migrations:
 * homepage hero, gallery, reviews, contact, hours and social links.
 *
 * Every read uses the cookie-backed client so RLS sees the admin session and
 * returns hidden rows too. Nothing here throws: a failed read returns an
 * `ok: false` result so a page can render a notice instead of crashing.
 */

/* -------------------------------------------------------------- homepage -- */

export type HomepageHero = {
  eyebrow: string;
  headlineLines: string[];
  description: string;
  buttonLabel: string;
  buttonHref: string;
  desktopImageUrl: string;
  mobileImageUrl: string;
  isPublished: boolean;
};

const HERO_COLUMNS =
  "eyebrow, headline_lines, description, button_label, button_href, desktop_image_url, mobile_image_url, is_published";

export async function getHomepageHeroRow(): Promise<HomepageHero | null> {
  const supabase = await createAuthSupabaseClient();

  const { data, error } = await supabase
    .from("homepage_hero")
    .select(HERO_COLUMNS)
    .eq("id", "main")
    .maybeSingle();

  if (error || !data) return null;

  const row = data as {
    eyebrow: string;
    headline_lines: string[];
    description: string;
    button_label: string;
    button_href: string;
    desktop_image_url: string;
    mobile_image_url: string;
    is_published: boolean;
  };

  return {
    eyebrow: row.eyebrow,
    headlineLines: row.headline_lines ?? [],
    description: row.description,
    buttonLabel: row.button_label,
    buttonHref: row.button_href,
    desktopImageUrl: row.desktop_image_url,
    mobileImageUrl: row.mobile_image_url,
    isPublished: row.is_published,
  };
}

export type HeroErrorCode =
  | "eyebrowRequired"
  | "headlineRequired"
  | "headlineCount"
  | "descriptionRequired"
  | "buttonLabelRequired"
  | "buttonHrefRequired"
  | "imageRequired"
  | "imageInvalid"
  | "save"
  | "notAuthorized"
  | "notFound";

export type HeroField =
  | "eyebrow"
  | "headlineLines"
  | "description"
  | "buttonLabel"
  | "buttonHref"
  | "desktopImage"
  | "mobileImage"
  | "form";

export type HeroErrors = Partial<Record<HeroField, HeroErrorCode>>;

/** A hero image may be a bundle path or an uploaded Storage URL. */
function validImageValue(value: string) {
  return isAcceptableImageValue(value);
}

/**
 * Validates the hero form. Mirrors the CHECK constraints on `homepage_hero`,
 * notably `cardinality(headline_lines) between 1 and 4`.
 */
export function validateHeroInput(form: FormData):
  | { ok: true; value: Omit<HomepageHero, "isPublished"> & { isPublished: boolean } }
  | { ok: false; errors: HeroErrors } {
  const errors: HeroErrors = {};

  const eyebrow = String(form.get("eyebrow") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const buttonLabel = String(form.get("button_label") ?? "").trim();
  const buttonHref = String(form.get("button_href") ?? "").trim();
  const desktopImageUrl = String(form.get("desktop_image_url") ?? "").trim();
  const mobileImageUrl = String(form.get("mobile_image_url") ?? "").trim();

  // One headline line per row of the textarea.
  const headlineLines = String(form.get("headline_lines") ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!eyebrow) errors.eyebrow = "eyebrowRequired";
  if (!description) errors.description = "descriptionRequired";
  if (!buttonLabel) errors.buttonLabel = "buttonLabelRequired";
  if (!buttonHref) errors.buttonHref = "buttonHrefRequired";

  if (headlineLines.length === 0) errors.headlineLines = "headlineRequired";
  else if (headlineLines.length > 4) errors.headlineLines = "headlineCount";

  if (!desktopImageUrl) errors.desktopImage = "imageRequired";
  else if (!validImageValue(desktopImageUrl)) errors.desktopImage = "imageInvalid";

  if (!mobileImageUrl) errors.mobileImage = "imageRequired";
  else if (!validImageValue(mobileImageUrl)) errors.mobileImage = "imageInvalid";

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      eyebrow,
      headlineLines,
      description,
      buttonLabel,
      buttonHref,
      desktopImageUrl,
      mobileImageUrl,
      // Absent checkbox means unchecked; the form always submits the control.
      isPublished: form.get("is_published") === "on",
    },
  };
}

export function toHeroRow(value: Omit<HomepageHero, "isPublished"> & { isPublished: boolean }) {
  return {
    eyebrow: value.eyebrow,
    headline_lines: value.headlineLines,
    description: value.description,
    button_label: value.buttonLabel,
    button_href: value.buttonHref,
    desktop_image_url: value.desktopImageUrl,
    mobile_image_url: value.mobileImageUrl,
    is_published: value.isPublished,
  };
}

/* --------------------------------------------------------------- gallery -- */

export type GalleryImage = {
  id: string;
  slug: string;
  category: string;
  imageUrl: string;
  altEn: string;
  altAr: string | null;
  displayOrder: number;
  isVisible: boolean;
};

export type GalleryListResult =
  | { ok: true; images: GalleryImage[] }
  | { ok: false; images: []; reason: "unavailable" };

export async function listGalleryImages(): Promise<GalleryListResult> {
  const supabase = await createAuthSupabaseClient();

  const { data, error } = await supabase
    .from("gallery_images")
    .select("id, slug, category, image_url, alt_en, alt_ar, display_order, is_visible")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return { ok: false, images: [], reason: "unavailable" };

  return {
    ok: true,
    images: (data ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      return {
        id: r.id as string,
        slug: r.slug as string,
        category: r.category as string,
        imageUrl: r.image_url as string,
        altEn: r.alt_en as string,
        altAr: (r.alt_ar as string | null) ?? null,
        displayOrder: r.display_order as number,
        isVisible: r.is_visible as boolean,
      };
    }),
  };
}

/* --------------------------------------------------------------- reviews -- */

export type SiteReview = {
  id: string;
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

export type ReviewListResult =
  | { ok: true; reviews: SiteReview[] }
  | { ok: false; reviews: []; reason: "unavailable" };

export async function listSiteReviews(): Promise<ReviewListResult> {
  const supabase = await createAuthSupabaseClient();

  const { data, error } = await supabase
    .from("site_reviews")
    .select("id, slug, reviewer_name, rating, review_en, review_ar, source, reviewed_on, display_order, is_visible")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return { ok: false, reviews: [], reason: "unavailable" };

  return {
    ok: true,
    reviews: (data ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      return {
        id: r.id as string,
        slug: r.slug as string,
        reviewerName: r.reviewer_name as string,
        rating: r.rating as number,
        reviewEn: r.review_en as string,
        reviewAr: (r.review_ar as string | null) ?? null,
        source: (r.source as string | null) ?? null,
        reviewedOn: (r.reviewed_on as string | null) ?? null,
        displayOrder: r.display_order as number,
        isVisible: r.is_visible as boolean,
      };
    }),
  };
}

/* --------------------------------------------------- contact and hours --- */

export type SiteContact = {
  addressEn: string | null;
  addressAr: string | null;
  phone: string | null;
  email: string | null;
  mapUrl: string | null;
  mapEmbedUrl: string | null;
  orderUrl: string | null;
  orderLabelEn: string | null;
  orderLabelAr: string | null;
};

export type BusinessHour = {
  dayOfWeek: number;
  opens: string | null;
  closes: string | null;
  isClosed: boolean;
};

export async function getSiteContact(): Promise<SiteContact | null> {
  const supabase = await createAuthSupabaseClient();

  const { data, error } = await supabase
    .from("site_contact")
    .select("address_en, address_ar, phone, email, map_url, map_embed_url, order_url, order_label_en, order_label_ar")
    .eq("id", "main")
    .maybeSingle();

  if (error || !data) return null;

  const r = data as Record<string, string | null>;

  return {
    addressEn: r.address_en,
    addressAr: r.address_ar,
    phone: r.phone,
    email: r.email,
    mapUrl: r.map_url,
    mapEmbedUrl: r.map_embed_url,
    orderUrl: r.order_url,
    orderLabelEn: r.order_label_en,
    orderLabelAr: r.order_label_ar,
  };
}

export async function listBusinessHours(): Promise<BusinessHour[]> {
  const supabase = await createAuthSupabaseClient();

  const { data, error } = await supabase
    .from("business_hours")
    .select("day_of_week, opens, closes, is_closed")
    .order("day_of_week", { ascending: true });

  if (error || !data) return [];

  return data.map((row) => {
    const r = row as Record<string, unknown>;
    return {
      dayOfWeek: r.day_of_week as number,
      // Postgres `time` comes back as "08:00:00"; the input wants "08:00".
      opens: r.opens ? String(r.opens).slice(0, 5) : null,
      closes: r.closes ? String(r.closes).slice(0, 5) : null,
      isClosed: r.is_closed as boolean,
    };
  });
}

/* ---------------------------------------------------------------- social -- */

export type SocialLink = {
  id: string;
  platform: string;
  label: string;
  url: string | null;
  displayOrder: number;
  isVisible: boolean;
};

export type SocialListResult =
  | { ok: true; links: SocialLink[] }
  | { ok: false; links: []; reason: "unavailable" };

export async function listSocialLinks(): Promise<SocialListResult> {
  const supabase = await createAuthSupabaseClient();

  const { data, error } = await supabase
    .from("social_links")
    .select("id, platform, label, url, display_order, is_visible")
    .order("display_order", { ascending: true });

  if (error) return { ok: false, links: [], reason: "unavailable" };

  return {
    ok: true,
    links: (data ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      return {
        id: r.id as string,
        platform: r.platform as string,
        label: r.label as string,
        url: (r.url as string | null) ?? null,
        displayOrder: r.display_order as number,
        isVisible: r.is_visible as boolean,
      };
    }),
  };
}

/* ----------------------------------------------------------------- counts -- */

/** Row count for a dashboard tile. Null when the table cannot be read. */
async function countRows(table: string): Promise<number | null> {
  const supabase = await createAuthSupabaseClient();
  const { count, error } = await supabase.from(table).select("id", { count: "exact", head: true });

  if (error) return null;

  return count ?? 0;
}

export const countGalleryImages = () => countRows("gallery_images");
export const countSiteReviews = () => countRows("site_reviews");

/* ----------------------------------------------- homepage section content -- */

export type HomepageSectionRow = {
  sectionKey: string;
  eyebrow: string | null;
  headingLine1: string | null;
  headingLine2: string | null;
  arabicAccent: string | null;
  body: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  ctaSecondaryLabel: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  isPublished: boolean;
};

export type AtmosphereImageRow = {
  position: number;
  imageUrl: string;
  altText: string;
  caption: string;
};

const HOMEPAGE_SECTION_COLUMNS =
  "section_key, eyebrow, heading_line_1, heading_line_2, arabic_accent, body, cta_label, cta_href, cta_secondary_label, image_url, image_alt, is_published";

/**
 * All nine rows, including any the administrator has unpublished. The admin
 * policy grants a full SELECT to `is_admin()`, so hidden sections are visible
 * here even though the public adapter cannot see them.
 */
export async function listHomepageSections(): Promise<HomepageSectionRow[] | null> {
  const supabase = await createAuthSupabaseClient();

  const { data, error } = await supabase.from("homepage_sections").select(HOMEPAGE_SECTION_COLUMNS);

  if (error || !data) return null;

  return (data as Record<string, unknown>[]).map((row) => ({
    sectionKey: String(row.section_key),
    eyebrow: (row.eyebrow as string | null) ?? null,
    headingLine1: (row.heading_line_1 as string | null) ?? null,
    headingLine2: (row.heading_line_2 as string | null) ?? null,
    arabicAccent: (row.arabic_accent as string | null) ?? null,
    body: (row.body as string | null) ?? null,
    ctaLabel: (row.cta_label as string | null) ?? null,
    ctaHref: (row.cta_href as string | null) ?? null,
    ctaSecondaryLabel: (row.cta_secondary_label as string | null) ?? null,
    imageUrl: (row.image_url as string | null) ?? null,
    imageAlt: (row.image_alt as string | null) ?? null,
    isPublished: Boolean(row.is_published),
  }));
}

/** The three fixed atmosphere slots, ordered by position. */
export async function listAtmosphereImages(): Promise<AtmosphereImageRow[] | null> {
  const supabase = await createAuthSupabaseClient();

  const { data, error } = await supabase
    .from("homepage_atmosphere_images")
    .select("position, image_url, alt_text, caption")
    .order("position", { ascending: true });

  if (error || !data) return null;

  return (data as Record<string, unknown>[]).map((row) => ({
    position: Number(row.position),
    imageUrl: String(row.image_url ?? ""),
    altText: String(row.alt_text ?? ""),
    caption: String(row.caption ?? ""),
  }));
}
