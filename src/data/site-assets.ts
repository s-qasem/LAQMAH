import { images } from "./images";

/**
 * Read-only manifest of media that ships inside the website bundle.
 *
 * DERIVED, NOT MAINTAINED BY HAND. The list is produced at module load by
 * walking the existing `images` export — the same object every public component
 * already renders from — so it cannot drift out of sync with the site. Adding an
 * image to `images.ts` makes it appear here automatically; removing one makes it
 * disappear. There is no second copy of the path list to keep updated.
 *
 * These files live in `/public` and are served by Next.js. They are NOT Supabase
 * Storage objects: nothing here is ever uploaded, moved, rewritten or deleted,
 * and the Media Library shows them without a delete control.
 */

export type SiteAssetGroup = "menu" | "gallery" | "homepage" | "video";

export type SiteAsset = {
  /** Root-relative public path, e.g. "/coffee/Latte.png". */
  path: string;
  /** File name, for display and search. */
  name: string;
  group: SiteAssetGroup;
};

const MEDIA_EXTENSION = /\.(png|jpe?g|webp|mp4|webm)$/i;

/** Collects every root-relative media path reachable from a nested value. */
function collect(node: unknown, into: Set<string>) {
  if (typeof node === "string") {
    if (node.startsWith("/") && MEDIA_EXTENSION.test(node)) into.add(node);
    return;
  }

  if (Array.isArray(node)) {
    for (const item of node) collect(item, into);
    return;
  }

  if (node && typeof node === "object") {
    for (const value of Object.values(node)) collect(value, into);
  }
}

/**
 * The two bundled assets that are referenced directly by a component rather
 * than through `images.ts`, so they cannot be reached by the walk above.
 *
 *   /exterior/mobile-hero.png      src/data/hero.ts (defaultHeroContent)
 *   /menu/videos/signature-scene2.mp4  src/components/ui/HomeSections.tsx
 *
 * `hero.ts` is server-only and cannot be imported here, which is why these two
 * are named explicitly. Every other path is derived.
 */
const REFERENCED_OUTSIDE_IMAGES = ["/exterior/mobile-hero.png", "/menu/videos/signature-scene2.mp4"];

/** Groups an asset by its folder, matching how the site uses it. */
function groupFor(path: string): SiteAssetGroup {
  if (path.startsWith("/menu/videos/")) return "video";
  if (path.startsWith("/interior/")) return "gallery";
  if (path.startsWith("/exterior/")) return "homepage";
  return "menu";
}

/**
 * Paths `images.ts` names that were never added to /public.
 *
 * "/desserts/chocolate-cake-chess.png" has been dangling since the initial
 * commit — git has no record of the file ever existing. Advertising it as a
 * reusable Site Asset would let an administrator pick an image that renders as
 * the LQMAH fallback everywhere it is used.
 *
 * The reference in `images.ts` is deliberately left alone: the intended
 * replacement cannot be proven from project data, so substituting another
 * dessert would be a guess. It survives only as the `dessert-1` gallery
 * fallback, and the live Gallery row already points at a valid Storage object.
 */
const MISSING_FROM_BUNDLE = new Set(["/desserts/chocolate-cake-chess.png"]);

function buildManifest(): SiteAsset[] {
  const paths = new Set<string>();
  collect(images, paths);
  for (const path of REFERENCED_OUTSIDE_IMAGES) paths.add(path);

  return [...paths]
    .filter((path) => !MISSING_FROM_BUNDLE.has(path))
    .sort((a, b) => a.localeCompare(b))
    .map((path) => ({
      path,
      name: path.slice(path.lastIndexOf("/") + 1),
      group: groupFor(path),
    }));
}

/**
 * Every bundled asset the site actually references.
 *
 * Unreferenced files in `/public` — the Next.js starter SVGs, and any image no
 * component points at — are absent by construction, because the walk starts
 * from what the site renders rather than from the directory listing.
 */
export const siteAssets: SiteAsset[] = buildManifest();

const siteAssetPaths = new Set(siteAssets.map((asset) => asset.path));

/** True when a stored image URL points at a bundled asset rather than Storage. */
export function isSiteAsset(url: string | null | undefined): boolean {
  return Boolean(url) && siteAssetPaths.has(url as string);
}
