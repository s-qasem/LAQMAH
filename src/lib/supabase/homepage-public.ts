import "server-only";

import { unstable_cache } from "next/cache";

import { createServerSupabaseClient } from "./server";

/**
 * The single public read adapter for homepage presentation copy.
 *
 * It carries only the chrome each section renders around its own content:
 * eyebrows, headings, body copy, CTA labels and the section images. Menu
 * categories and products, reviews, contact details, business hours and social
 * links keep their own adapters and are never duplicated here.
 *
 * `homepage_hero` is separate and untouched — it has its own adapter in
 * `src/data/hero.ts` and its own "homepage-hero" cache tag.
 *
 * Uses the anonymous client and the existing RLS. No session, no service-role
 * key.
 */

export const PUBLIC_HOMEPAGE_TAG = "homepage-sections";

export const HOMEPAGE_SECTION_KEYS = [
  "welcome",
  "signature_scene",
  "menu",
  "featured",
  "atmosphere",
  "interior_story",
  "reviews",
  "visit",
  "final_cta",
] as const;

export type HomepageSectionKey = (typeof HOMEPAGE_SECTION_KEYS)[number];

/**
 * Sections a CHECK constraint forbids unpublishing, because they frame content
 * owned by other tables. Their absence from a successful read is a fault, not
 * an administrator's choice — see `readFromSupabase`.
 */
const STRUCTURAL_KEYS: readonly HomepageSectionKey[] = ["menu", "featured", "reviews", "visit"];

export type HomepageSection = {
  eyebrow: string | null;
  headingLine1: string | null;
  /** Second line of the heading. Null renders a single-line heading. */
  headingLine2: string | null;
  /** Only the accent lines the design already displays. Not a translation. */
  arabicAccent: string | null;
  body: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  /** Visit renders two buttons; only that section uses this. */
  ctaSecondaryLabel: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
};

export type AtmosphereImage = {
  position: number;
  imageUrl: string;
  altText: string;
  caption: string;
};

export type PublicHomepage = {
  /** A null entry means the administrator unpublished that section. */
  sections: Record<HomepageSectionKey, HomepageSection | null>;
  /** Always exactly three, ordered by position. */
  atmosphereImages: AtmosphereImage[];
  /** "fallback" means the read failed, never that a section is hidden. */
  source: "supabase" | "fallback";
};

const COLUMNS =
  "section_key, eyebrow, heading_line_1, heading_line_2, arabic_accent, body, cta_label, cta_href, cta_secondary_label, image_url, image_alt";

type SectionRow = {
  section_key: string;
  eyebrow: string | null;
  heading_line_1: string | null;
  heading_line_2: string | null;
  arabic_accent: string | null;
  body: string | null;
  cta_label: string | null;
  cta_href: string | null;
  cta_secondary_label: string | null;
  image_url: string | null;
  image_alt: string | null;
};

type AtmosphereRow = {
  position: number;
  image_url: string | null;
  alt_text: string | null;
  caption: string | null;
};

/* ------------------------------------------------------------- fallbacks -- */

/**
 * The copy the homepage renders today, kept verbatim from
 * `src/components/ui/HomeSections.tsx`. Used only when the database cannot be
 * read — never to override an administrator's decision to hide a section.
 *
 * The old hard-coded content stays in the component tree as well; nothing has
 * been deleted.
 */
const DEFAULT_SECTIONS: Record<HomepageSectionKey, HomepageSection> = {
  welcome: {
    eyebrow: null,
    headingLine1: "COFFEE. CONVERSATION.",
    headingLine2: "EVERY MATCH.",
    arabicAccent: null,
    body: null,
    ctaLabel: null,
    ctaHref: null,
    ctaSecondaryLabel: null,
    imageUrl: "/interior/LQAMH INSIDE - Copy.png",
    imageAlt: "LQMAH café interior with pastry counter, seating, and warm lighting",
  },
  signature_scene: {
    eyebrow: "The Signature Scene",
    headingLine1: "CRAFTED DAILY.",
    headingLine2: "SERVED WITH PASSION.",
    arabicAccent: "محضّرة يومياً بشغف",
    body: "Premium ingredients, careful preparation, and flavors made to be remembered.",
    ctaLabel: "Discover Our Desserts",
    ctaHref: "/menu?category=Desserts",
    ctaSecondaryLabel: null,
    imageUrl: "/desserts/chocolate-cake-moderate-white-cup.png",
    imageAlt: "Clean cheesecake beneath a chocolate pot beside a white coffee cup and chess pieces",
  },
  menu: {
    eyebrow: "Made For Every Mood",
    headingLine1: "EXPLORE OUR MENU",
    headingLine2: null,
    arabicAccent: null,
    body: null,
    ctaLabel: "View full menu",
    ctaHref: "/menu",
    ctaSecondaryLabel: null,
    imageUrl: null,
    imageAlt: null,
  },
  featured: {
    eyebrow: "House Favorites",
    headingLine1: null,
    headingLine2: null,
    arabicAccent: null,
    body: null,
    ctaLabel: null,
    ctaHref: null,
    ctaSecondaryLabel: null,
    imageUrl: null,
    imageAlt: null,
  },
  atmosphere: {
    eyebrow: "Room For The Moment",
    headingLine1: "MORE THAN",
    headingLine2: "A CAFE",
    arabicAccent: null,
    body: "Whether you are here for a quiet coffee, a game with friends, a study session, or your favorite match, LQMAH makes room for the moment.",
    ctaLabel: null,
    ctaHref: null,
    ctaSecondaryLabel: null,
    imageUrl: null,
    imageAlt: null,
  },
  interior_story: {
    eyebrow: "The Atmosphere",
    headingLine1: "DESIGNED",
    headingLine2: "TO MAKE YOU STAY",
    arabicAccent: null,
    body: "Warm light, considered details, and comfortable tables create a setting that feels refined without losing its welcome.",
    ctaLabel: null,
    ctaHref: null,
    ctaSecondaryLabel: null,
    imageUrl: "/interior/LQAMH INSIDE - Copy.png",
    imageAlt: "Comfortable LQMAH seating and warm lighting",
  },
  reviews: {
    eyebrow: "Real Guest Reviews",
    headingLine1: "WHAT OUR",
    headingLine2: "GUESTS SAY",
    arabicAccent: null,
    body: null,
    ctaLabel: null,
    ctaHref: null,
    ctaSecondaryLabel: null,
    imageUrl: null,
    imageAlt: null,
  },
  visit: {
    eyebrow: "Visit LQMAH",
    headingLine1: "COME FIND",
    headingLine2: "YOUR FAVORITE TABLE",
    arabicAccent: null,
    body: null,
    ctaLabel: "Contact Us",
    ctaHref: null,
    ctaSecondaryLabel: "Get Directions",
    imageUrl: null,
    imageAlt: null,
  },
  final_cta: {
    eyebrow: null,
    headingLine1: "YOUR TABLE",
    headingLine2: "IS WAITING",
    arabicAccent: "أهلاً بكم",
    body: "Come for the coffee. Stay for the atmosphere.",
    ctaLabel: "Explore Menu",
    ctaHref: "/menu",
    ctaSecondaryLabel: null,
    imageUrl: null,
    imageAlt: null,
  },
};

/** The three slots as they render today, matching atmosphere-shot--1/2/3. */
const DEFAULT_ATMOSPHERE: AtmosphereImage[] = [
  { position: 1, imageUrl: "/interior/Chess Table - Copy.png", altText: "Chess with coffee", caption: "Play" },
  { position: 2, imageUrl: "/interior/logo INSIDE - Copy.png", altText: "Friends gathering at the cafe", caption: "Gather" },
  { position: 3, imageUrl: "/interior/LQAMH INSIDE - Copy.png", altText: "Live sports atmosphere", caption: "Stay" },
];

function buildFallback(): PublicHomepage {
  return {
    sections: { ...DEFAULT_SECTIONS },
    atmosphereImages: DEFAULT_ATMOSPHERE.map((image) => ({ ...image })),
    source: "fallback",
  };
}

/* ------------------------------------------------------------ normalizing -- */

function text(value: string | null | undefined): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/**
 * A link must be site-relative or https, matching the database CHECK and
 * `safeLink` in src/data/hero.ts. Anything else is dropped rather than rendered.
 */
function link(value: string | null | undefined): string | null {
  const candidate = text(value);
  if (!candidate) return null;

  return candidate.startsWith("/") || candidate.startsWith("https://") ? candidate : null;
}

function normalizeSection(row: SectionRow): HomepageSection {
  return {
    eyebrow: text(row.eyebrow),
    headingLine1: text(row.heading_line_1),
    headingLine2: text(row.heading_line_2),
    arabicAccent: text(row.arabic_accent),
    body: text(row.body),
    ctaLabel: text(row.cta_label),
    ctaHref: link(row.cta_href),
    ctaSecondaryLabel: text(row.cta_secondary_label),
    imageUrl: link(row.image_url),
    imageAlt: text(row.image_alt),
  };
}

/* ------------------------------------------------------------------ read -- */

/**
 * Returns null only on a genuine read failure.
 *
 * A section missing from a *successful* read is unambiguous: RLS returns only
 * published rows, and the migration grants no INSERT or DELETE, so the nine
 * rows are permanent. Absence therefore means "unpublished", and that decision
 * is honoured rather than papered over with fallback copy.
 *
 * The four structural sections are the exception. A CHECK constraint forbids
 * unpublishing them, so if one is missing something is genuinely wrong and the
 * section keeps its default copy instead of vanishing along with the menu,
 * reviews or visit content it frames.
 */
async function readFromSupabase(): Promise<Omit<PublicHomepage, "source"> | null> {
  const supabase = createServerSupabaseClient();

  const [sectionsResult, imagesResult] = await Promise.all([
    supabase.from("homepage_sections").select(COLUMNS),
    supabase
      .from("homepage_atmosphere_images")
      .select("position, image_url, alt_text, caption")
      .order("position", { ascending: true }),
  ]);

  if (sectionsResult.error || imagesResult.error) {
    console.error(
      "[homepage-sections] Supabase read failed, falling back to the local homepage copy:",
      sectionsResult.error?.message ?? imagesResult.error?.message,
    );
    return null;
  }

  const byKey = new Map<string, SectionRow>(
    ((sectionsResult.data ?? []) as SectionRow[]).map((row) => [row.section_key, row]),
  );

  const sections = {} as Record<HomepageSectionKey, HomepageSection | null>;

  for (const key of HOMEPAGE_SECTION_KEYS) {
    const row = byKey.get(key);

    if (row) {
      sections[key] = normalizeSection(row);
      continue;
    }

    if (STRUCTURAL_KEYS.includes(key)) {
      console.error(`[homepage-sections] Structural section "${key}" is missing; using its default copy.`);
      sections[key] = DEFAULT_SECTIONS[key];
      continue;
    }

    // Deliberately hidden by an administrator.
    sections[key] = null;
  }

  // Exactly three slots. A slot the database somehow did not return keeps the
  // image it renders today rather than leaving a hole in the grid.
  const byPosition = new Map<number, AtmosphereRow>(
    ((imagesResult.data ?? []) as AtmosphereRow[]).map((row) => [row.position, row]),
  );

  const atmosphereImages = DEFAULT_ATMOSPHERE.map((fallbackImage) => {
    const row = byPosition.get(fallbackImage.position);
    const imageUrl = row ? link(row.image_url) : null;

    if (!row || !imageUrl) {
      console.error(
        `[homepage-sections] Atmosphere slot ${fallbackImage.position} is missing or unusable; using its default image.`,
      );
      return { ...fallbackImage };
    }

    return {
      position: fallbackImage.position,
      imageUrl,
      altText: text(row.alt_text) ?? fallbackImage.altText,
      caption: text(row.caption) ?? fallbackImage.caption,
    };
  });

  return { sections, atmosphereImages };
}

const getCachedPublicHomepage = unstable_cache(
  async (): Promise<PublicHomepage> => {
    const result = await readFromSupabase();

    return result === null ? buildFallback() : { ...result, source: "supabase" };
  },
  ["homepage-sections"],
  { revalidate: 60, tags: [PUBLIC_HOMEPAGE_TAG] },
);

/** Presentation copy and the three atmosphere images for the public homepage. */
export async function getPublicHomepage(): Promise<PublicHomepage> {
  try {
    return await getCachedPublicHomepage();
  } catch (error) {
    console.error("[homepage-sections] Unexpected failure, falling back to the local homepage copy:", error);
    return buildFallback();
  }
}
