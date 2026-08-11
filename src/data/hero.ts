import "server-only";

import { unstable_cache } from "next/cache";

import { images } from "@/data/images";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type HeroContent = {
  eyebrow: string;
  headlineLines: string[];
  description: string;
  buttonLabel: string;
  buttonHref: string;
  desktopImageUrl: string;
  mobileImageUrl: string;
};

type HomepageHeroRow = {
  eyebrow: string;
  headline_lines: string[];
  description: string;
  button_label: string;
  button_href: string;
  desktop_image_url: string;
  mobile_image_url: string;
};

export const defaultHeroContent: HeroContent = {
  eyebrow: "More Than Coffee",
  headlineLines: ["A PLACE TO", "GATHER, SIP &", "STAY AWHILE"],
  description: "Specialty coffee, fresh juices, delicious desserts and good company.\nWelcome to LQMAH.",
  buttonLabel: "Explore Our Menu",
  buttonHref: "/menu",
  desktopImageUrl: images.hero,
  mobileImageUrl: "/exterior/mobile-hero.png",
};

function nonEmpty(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function safeLink(value: unknown, fallback: string) {
  const link = nonEmpty(value, fallback);
  return link.startsWith("/") || /^https:\/\//i.test(link) ? link : fallback;
}

function safeImage(value: unknown, fallback: string) {
  const image = nonEmpty(value, fallback);
  if (image.startsWith("/")) return image;

  try {
    const url = new URL(image);
    const isConfiguredStorageImage =
      url.protocol === "https:" &&
      url.hostname === "gboueajrxypybqtdxdvl.supabase.co" &&
      url.pathname.startsWith("/storage/v1/object/public/website-content/");

    return isConfiguredStorageImage ? image : fallback;
  } catch {
    return fallback;
  }
}

function normalizeHero(row: HomepageHeroRow): HeroContent {
  const headlineLines = Array.isArray(row.headline_lines)
    ? row.headline_lines.filter((line): line is string => typeof line === "string" && Boolean(line.trim())).slice(0, 4)
    : [];

  return {
    eyebrow: nonEmpty(row.eyebrow, defaultHeroContent.eyebrow),
    headlineLines: headlineLines.length ? headlineLines : defaultHeroContent.headlineLines,
    description: nonEmpty(row.description, defaultHeroContent.description),
    buttonLabel: nonEmpty(row.button_label, defaultHeroContent.buttonLabel),
    buttonHref: safeLink(row.button_href, defaultHeroContent.buttonHref),
    desktopImageUrl: safeImage(row.desktop_image_url, defaultHeroContent.desktopImageUrl),
    mobileImageUrl: safeImage(row.mobile_image_url, defaultHeroContent.mobileImageUrl),
  };
}

const getCachedHomepageHero = unstable_cache(
  async (): Promise<HeroContent> => {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("homepage_hero")
      .select(
        "eyebrow, headline_lines, description, button_label, button_href, desktop_image_url, mobile_image_url",
      )
      .eq("id", "main")
      .eq("is_published", true)
      .maybeSingle<HomepageHeroRow>();

    if (error || !data) return defaultHeroContent;

    return normalizeHero(data);
  },
  ["homepage-hero"],
  { revalidate: 60, tags: ["homepage-hero"] },
);

export async function getHomepageHero(): Promise<HeroContent> {
  try {
    return await getCachedHomepageHero();
  } catch {
    return defaultHeroContent;
  }
}
