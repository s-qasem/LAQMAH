import { supabaseConfig } from "./supabase/config";

/**
 * Shared menu-image rules.
 *
 * Deliberately free of `server-only` so the browser uploader and the Server
 * Actions apply byte-identical validation and derive identical URLs.
 */

/** Existing bucket, created by the homepage_hero migration. Public read. */
export const MENU_BUCKET = "website-content";

/**
 * Top-level folders inside the bucket, one per admin module.
 *
 * Storage policies grant admin writes per prefix, and every delete helper is
 * scoped to its own prefix, so one module can never remove another's assets.
 */
export const MANAGED_PREFIXES = ["menu", "gallery", "homepage"] as const;

export type ManagedPrefix = (typeof MANAGED_PREFIXES)[number];

/** Storage policies confine admin writes to this prefix. */
export const MENU_PREFIX = "menu";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/pjpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type UploadErrorCode = "empty" | "type" | "size" | "upload";

export function extensionForType(type: string): string | null {
  return EXTENSION_BY_TYPE[type] ?? null;
}

/** Public URL for an object in the menu bucket. */
export function publicUrlFor(path: string) {
  return `${supabaseConfig.url}/storage/v1/object/public/${MENU_BUCKET}/${path}`;
}

const PUBLIC_PREFIX = `${supabaseConfig.url}/storage/v1/object/public/${MENU_BUCKET}/`;

/**
 * True only for objects this app uploaded into `menu/`.
 *
 * The 36 seeded products point at `/public/...` paths that are files in the
 * Next.js bundle, not Storage objects. They must never reach any delete call,
 * and this guard is what keeps them out.
 */
export function isManagedUpload(
  url: string | null | undefined,
  prefix: ManagedPrefix = "menu",
): boolean {
  if (!url) return false;
  return url.startsWith(`${PUBLIC_PREFIX}${prefix}/`);
}

/** True for an object under any module's managed prefix. */
export function isAnyManagedUpload(url: string | null | undefined): boolean {
  return MANAGED_PREFIXES.some((prefix) => isManagedUpload(url, prefix));
}

/** Which module owns a managed URL, or null when it is not ours. */
export function managedPrefixOf(url: string | null | undefined): ManagedPrefix | null {
  return MANAGED_PREFIXES.find((prefix) => isManagedUpload(url, prefix)) ?? null;
}

/** Storage path for a managed URL, or null when the URL is not ours. */
export function storagePathFromUrl(url: string): string | null {
  return url.startsWith(PUBLIC_PREFIX) ? url.slice(PUBLIC_PREFIX.length) : null;
}

/** A fresh, collision-proof object path under the policy-protected prefix. */
export function buildManagedImagePath(prefix: ManagedPrefix, folder: string, extension: string) {
  const segment = folder ? `${folder}/` : "";
  return `${prefix}/${segment}${crypto.randomUUID()}.${extension}`;
}

/** Shape check for a value that claims to be a menu image URL. */
export function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

const STORAGE_PATH_PREFIX = `/storage/v1/object/public/${MENU_BUCKET}/`;

/**
 * True when a submitted image value is one the CMS may store.
 *
 * Delegates to `resolveImageSrc` below — the canonical rule — so every admin
 * editor accepts exactly what the public site can render: bundled root-relative
 * site assets (`/menu/Avocado Juice.png`) and uploads in the configured Storage
 * bucket. Protocol-relative `//host` values, `javascript:`/`data:` URLs,
 * malformed input and unapproved remote hosts are all rejected.
 *
 * Use this rather than `isValidImageUrl`, which cannot parse a root-relative
 * path and therefore rejects every bundled site asset.
 */
export function isAcceptableImageValue(url: string): boolean {
  return resolveImageSrc(url) !== null;
}

/**
 * Canonical rule for turning a stored `image_url` into something renderable.
 *
 * Two shapes are legitimate and both must work:
 *   - root-relative bundle paths from the seeded menu, e.g. "/coffee/Latte.png"
 *     and "/menu/strwberry mint.png" (spaces included)
 *   - absolute Supabase Storage URLs produced by the uploader
 *
 * Returns null for anything else — an empty value, a protocol-relative "//host"
 * path, a `data:`/`javascript:` URL, or a remote host that is not configured in
 * `next.config.ts` `images.remotePatterns` (which `next/image` would reject at
 * render time). Callers show the LQMAH mark for null.
 */
export function resolveImageSrc(url: string | null | undefined): string | null {
  if (!url) return null;

  const trimmed = url.trim();
  if (!trimmed) return null;

  // Root-relative public path. "//" is protocol-relative, not a local path.
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;

  // Mirrors the single configured remote pattern.
  const storageHost = new URL(supabaseConfig.url).hostname;
  if (parsed.hostname !== storageHost) return null;
  if (!parsed.pathname.startsWith(STORAGE_PATH_PREFIX)) return null;

  return trimmed;
}

/**
 * Render-safe `src` for `next/image`.
 *
 * The optimizer resolves a local path by parsing it as a URL, so a bundled
 * filename containing "&", "#" or "?" is truncated and rejected with "The
 * requested resource isn't a valid image" — even though the file is a valid
 * PNG that serves correctly as a static asset. "/menu/sandwiches/Turkey &
 * Cheese sandwish.png" is the one such name in the bundle. Percent-encoding
 * those characters up front keeps the whole filename intact.
 *
 * `encodeURI` leaves an existing %XX sequence alone, so this is safe to apply
 * to a path that is already partly encoded. Absolute Storage URLs are returned
 * untouched: they are already valid, and encoding "?" there would corrupt a
 * query string.
 */
export function imageSrcFor(url: string | null | undefined): string | null {
  const src = resolveImageSrc(url);
  if (!src) return null;
  if (!src.startsWith("/")) return src;

  return encodeURI(src).replace(/&/g, "%26").replace(/#/g, "%23").replace(/[?]/g, "%3F");
}

/**
 * Same rule, expressed for a CSS `url()` value.
 *
 * Characters that could terminate the `url()` are percent-encoded rather than
 * stripped, so a filename containing parentheses or an apostrophe survives
 * intact instead of being silently corrupted.
 */
export function cssUrlFor(url: string | null | undefined): string | null {
  const src = resolveImageSrc(url);
  if (!src) return null;

  // encodeURI leaves an existing %XX sequence alone, so this is safe to apply
  // to an already-encoded Storage URL as well as to a raw path with spaces.
  return encodeURI(src).replace(/\(/g, "%28").replace(/\)/g, "%29").replace(/'/g, "%27");
}
