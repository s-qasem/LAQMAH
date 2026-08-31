/**
 * The site's public origin, read once from `NEXT_PUBLIC_SITE_URL`.
 *
 * Every piece of production metadata — the sitemap, the robots sitemap link and
 * `metadataBase` — derives from this one value, so the domain is configured in
 * a single place and cannot drift between files.
 *
 * A missing or malformed value is never papered over with a plausible-looking
 * default: shipping `https://example.com` in a sitemap is exactly the failure
 * this replaces. Development falls back to localhost with a warning so the app
 * still runs, but a production build stops rather than emitting a wrong origin.
 */

const DEVELOPMENT_FALLBACK = "http://localhost:3000";

/** Strips trailing slashes so callers can always append "/path" safely. */
function normalize(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

function resolveSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configured) {
    const normalized = normalize(configured);

    try {
      const parsed = new URL(normalized);

      if (parsed.protocol === "http:" || parsed.protocol === "https:") return normalized;
    } catch {
      // Falls through to the error below.
    }

    throw new Error(
      `NEXT_PUBLIC_SITE_URL must be an absolute http(s) URL, received "${configured}".`,
    );
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL is required for a production build. " +
        "Set it to the public origin, for example https://laqmah.com, so the sitemap, " +
        "robots.txt and metadataBase reference the real domain.",
    );
  }

  console.warn(
    `[site-url] NEXT_PUBLIC_SITE_URL is not set; using ${DEVELOPMENT_FALLBACK} for development metadata.`,
  );

  return DEVELOPMENT_FALLBACK;
}

export const SITE_URL = resolveSiteUrl();

/** Absolute URL for a root-relative path, e.g. absoluteUrl("/menu"). */
export function absoluteUrl(path = ""): string {
  return path ? `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}` : SITE_URL;
}
