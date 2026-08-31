import type { AdminTranslationKey } from "@/data/admin-i18n";

/**
 * Which fields each homepage section actually owns.
 *
 * This mirrors the per-section CHECK constraints in
 * `20260829000000_create_homepage_sections.sql` exactly. The admin form renders
 * these fields and the Server Action writes NULL to every column a section does
 * not list, so a save can never violate a constraint and an unused column can
 * never quietly acquire a value.
 *
 * Every listed field is required, because the same CHECKs declare them NOT NULL
 * for that section.
 */

export const HOMEPAGE_FIELDS = [
  "eyebrow",
  "heading_line_1",
  "heading_line_2",
  "arabic_accent",
  "body",
  "cta_label",
  "cta_href",
  "cta_secondary_label",
  "image_url",
  "image_alt",
] as const;

export type HomepageField = (typeof HOMEPAGE_FIELDS)[number];

export type HomepageSectionSpec = {
  key: string;
  titleKey: AdminTranslationKey;
  descriptionKey: AdminTranslationKey;
  /** Required fields for this section. Everything else is written as NULL. */
  fields: readonly HomepageField[];
  /**
   * False for the four structural sections. A CHECK constraint keeps them
   * published, because they frame menu, review and contact content owned by
   * other tables.
   */
  canHide: boolean;
};

export const HOMEPAGE_SECTION_SPECS: readonly HomepageSectionSpec[] = [
  {
    key: "welcome",
    titleKey: "homepage.sec.welcome.title",
    descriptionKey: "homepage.sec.welcome.description",
    fields: ["heading_line_1", "heading_line_2", "image_url", "image_alt"],
    canHide: true,
  },
  {
    key: "signature_scene",
    titleKey: "homepage.sec.signature.title",
    descriptionKey: "homepage.sec.signature.description",
    fields: [
      "eyebrow",
      "heading_line_1",
      "heading_line_2",
      "arabic_accent",
      "body",
      "cta_label",
      "cta_href",
      "image_url",
      "image_alt",
    ],
    canHide: true,
  },
  {
    key: "menu",
    titleKey: "homepage.sec.menu.title",
    descriptionKey: "homepage.sec.menu.description",
    fields: ["eyebrow", "heading_line_1", "cta_label", "cta_href"],
    canHide: false,
  },
  {
    key: "featured",
    titleKey: "homepage.sec.featured.title",
    descriptionKey: "homepage.sec.featured.description",
    fields: ["eyebrow"],
    canHide: false,
  },
  {
    key: "atmosphere",
    titleKey: "homepage.sec.atmosphere.title",
    descriptionKey: "homepage.sec.atmosphere.description",
    fields: ["eyebrow", "heading_line_1", "heading_line_2", "body"],
    canHide: true,
  },
  {
    key: "interior_story",
    titleKey: "homepage.sec.interior.title",
    descriptionKey: "homepage.sec.interior.description",
    fields: ["eyebrow", "heading_line_1", "heading_line_2", "body", "image_url", "image_alt"],
    canHide: true,
  },
  {
    key: "reviews",
    titleKey: "homepage.sec.reviews.title",
    descriptionKey: "homepage.sec.reviews.description",
    fields: ["eyebrow", "heading_line_1", "heading_line_2"],
    canHide: false,
  },
  {
    key: "visit",
    titleKey: "homepage.sec.visit.title",
    descriptionKey: "homepage.sec.visit.description",
    fields: ["eyebrow", "heading_line_1", "heading_line_2", "cta_label", "cta_secondary_label"],
    canHide: false,
  },
  {
    key: "final_cta",
    titleKey: "homepage.sec.finalCta.title",
    descriptionKey: "homepage.sec.finalCta.description",
    fields: ["heading_line_1", "heading_line_2", "arabic_accent", "body", "cta_label", "cta_href"],
    canHide: true,
  },
] as const;

export function homepageSpecFor(key: string): HomepageSectionSpec | null {
  return HOMEPAGE_SECTION_SPECS.find((spec) => spec.key === key) ?? null;
}

/** Labels for the fields, in the order the editor renders them. */
export const HOMEPAGE_FIELD_LABELS: Record<HomepageField, AdminTranslationKey> = {
  eyebrow: "homepage.field.eyebrow",
  heading_line_1: "homepage.field.headingLine1",
  heading_line_2: "homepage.field.headingLine2",
  arabic_accent: "homepage.field.arabicAccent",
  body: "homepage.field.body",
  cta_label: "homepage.field.ctaLabel",
  cta_href: "homepage.field.ctaHref",
  cta_secondary_label: "homepage.field.ctaSecondaryLabel",
  image_url: "homepage.field.image",
  image_alt: "homepage.field.imageAlt",
};
