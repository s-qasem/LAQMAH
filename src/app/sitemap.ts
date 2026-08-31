import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/site-url";

/**
 * Public, indexable pages only.
 *
 * `/order` is deliberately absent: it declares `robots: { index: false }` while
 * online ordering is unfinished, and listing a noindex page here would send
 * contradictory signals. Every /admin route is likewise excluded — they are
 * noindex, disallowed in robots.txt and behind authentication.
 */
const ROUTES = ["", "/menu", "/about", "/gallery", "/contact"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((route) => ({
    url: absoluteUrl(route),
    changeFrequency: "monthly" as const,
    priority: route === "" ? 1 : 0.8,
  }));
}
