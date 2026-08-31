import "server-only";

import { unstable_cache } from "next/cache";

import { createServerSupabaseClient } from "./server";

/**
 * The single public read adapter for social links.
 *
 * The database owns platform, label, URL, visibility and order. The visual icon
 * for each platform stays in the application — no React components or icon
 * names are stored in Supabase.
 *
 * Uses the anonymous client and the existing RLS. No session, no service-role
 * key.
 */

export const PUBLIC_SOCIAL_TAG = "public-social";

export type PublicSocialLink = {
  /** Stable machine key used to pick an icon: "instagram", "tiktok", … */
  platform: string;
  /** Human name, e.g. "Instagram". Used for the accessible label. */
  label: string;
  /** Always a complete, non-blank URL — unusable rows never reach here. */
  url: string;
  /** "@lqmah_bakery" when derivable from the URL, otherwise null. */
  handle: string | null;
};

export type PublicSocial = {
  links: PublicSocialLink[];
  /**
   * "supabase" covers every valid read, including one that legitimately yields
   * zero links. "fallback" means the read failed and the site is showing the
   * old hard-coded links instead.
   */
  source: "supabase" | "fallback";
};

type SocialRow = {
  platform: string;
  label: string;
  url: string | null;
  is_visible: boolean;
  display_order: number;
};

/**
 * Derives the displayed handle from the stored URL.
 *
 * The footer has always shown "@lqmah_bakery" rather than the platform name,
 * and there is no handle column. The last path segment carries it for both
 * "instagram.com/lqmah_bakery/" and "tiktok.com/@lqmah_bakery". Anything that
 * does not look like a plain handle returns null so the caller can show the
 * label instead of a mangled string.
 */
function toHandle(url: string): string | null {
  try {
    const segment = new URL(url).pathname.split("/").filter(Boolean).pop();
    if (!segment) return null;

    const handle = segment.startsWith("@") ? segment.slice(1) : segment;

    return /^[A-Za-z0-9._-]+$/.test(handle) ? `@${handle}` : null;
  } catch {
    return null;
  }
}

/**
 * The links the footer renders correctly today. Used only when the database
 * cannot be read — never to paper over a valid result.
 *
 * No Facebook entry: the site has never shown one and its URL is unknown.
 */
function buildFallbackSocial(): PublicSocial {
  const links = [
    { platform: "instagram", label: "Instagram", url: "https://www.instagram.com/lqmah_bakery/" },
    { platform: "tiktok", label: "TikTok", url: "https://www.tiktok.com/@lqmah_bakery" },
  ];

  return {
    links: links.map((link) => ({ ...link, handle: toHandle(link.url) })),
    source: "fallback",
  };
}

/**
 * Returns null only on a genuine read failure.
 *
 * A successful query that yields no usable links returns an empty array, not
 * null: if an administrator hides every platform, the public site must show
 * nothing rather than resurrecting the old hard-coded links.
 */
async function readSocialFromSupabase(): Promise<PublicSocialLink[] | null> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("social_links")
    .select("platform, label, url, is_visible, display_order")
    // `platform` is unique, so it is a deterministic tiebreak when two rows
    // share a display_order rather than leaving it to database order.
    .order("display_order", { ascending: true })
    .order("platform", { ascending: true });

  if (error) {
    console.error("[public-social] Supabase read failed, falling back to the local social links:", error.message);
    return null;
  }

  return ((data ?? []) as SocialRow[])
    // RLS already restricts anonymous reads to visible rows; this repeats the
    // rule in the application so the intent is explicit either way.
    .filter((row) => row.is_visible)
    // A row with no URL is not a usable link, so it is never rendered as an
    // empty anchor. No URL is invented for it.
    .filter((row): row is SocialRow & { url: string } => typeof row.url === "string" && row.url.trim() !== "")
    .map((row) => ({
      platform: row.platform,
      label: row.label,
      url: row.url.trim(),
      handle: toHandle(row.url.trim()),
    }));
}

const getCachedPublicSocial = unstable_cache(
  async (): Promise<PublicSocial> => {
    const links = await readSocialFromSupabase();

    // Distinguish a failed read from a valid empty result: only the former
    // falls back.
    return links === null ? buildFallbackSocial() : { links, source: "supabase" };
  },
  ["public-social"],
  { revalidate: 60, tags: [PUBLIC_SOCIAL_TAG] },
);

/** Ordered, renderable social links for every public surface. */
export async function getPublicSocial(): Promise<PublicSocial> {
  try {
    return await getCachedPublicSocial();
  } catch (error) {
    console.error("[public-social] Unexpected failure, falling back to the local social links:", error);
    return buildFallbackSocial();
  }
}
