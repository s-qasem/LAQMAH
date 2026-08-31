import {
  FolderOpen,
  FolderTree,
  Home,
  Images,
  LayoutDashboard,
  MapPin,
  Share2,
  Star,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

import type { AdminTranslationKey } from "./admin-i18n";

export type AdminNavLink = {
  labelKey: AdminTranslationKey;
  href: string;
  icon: LucideIcon;
  /** Short label used by the collapsed rail tooltip and mobile drawer. */
  hintKey: AdminTranslationKey;
};

export type AdminNavGroup = {
  labelKey: AdminTranslationKey;
  icon: LucideIcon;
  children: AdminNavLink[];
};

export type AdminNavEntry = AdminNavLink | AdminNavGroup;

export function isNavGroup(entry: AdminNavEntry): entry is AdminNavGroup {
  return "children" in entry;
}

/**
 * Single source of truth for the admin sidebar. Adding a route here is all that
 * is needed for it to appear in the desktop rail, tablet rail and mobile drawer.
 * Labels are translation keys, resolved against the reader's chosen language.
 */
export const adminNavigation: AdminNavEntry[] = [
  { labelKey: "nav.dashboard", href: "/admin", icon: LayoutDashboard, hintKey: "nav.dashboard.hint" },
  { labelKey: "nav.homepage", href: "/admin/homepage", icon: Home, hintKey: "nav.homepage.hint" },
  {
    labelKey: "nav.menu",
    icon: UtensilsCrossed,
    children: [
      {
        labelKey: "nav.categories",
        href: "/admin/menu/categories",
        icon: FolderTree,
        hintKey: "nav.categories.hint",
      },
      {
        labelKey: "nav.products",
        href: "/admin/menu/products",
        icon: UtensilsCrossed,
        hintKey: "nav.products.hint",
      },
    ],
  },
  { labelKey: "nav.gallery", href: "/admin/gallery", icon: Images, hintKey: "nav.gallery.hint" },
  { labelKey: "nav.reviews", href: "/admin/reviews", icon: Star, hintKey: "nav.reviews.hint" },
  { labelKey: "nav.contact", href: "/admin/contact", icon: MapPin, hintKey: "nav.contact.hint" },
  { labelKey: "nav.social", href: "/admin/social", icon: Share2, hintKey: "nav.social.hint" },
  { labelKey: "nav.media", href: "/admin/media", icon: FolderOpen, hintKey: "nav.media.hint" },
];

/** Flattened leaf links, used by the collapsed rail and for active-route matching. */
export const adminNavLinks: AdminNavLink[] = adminNavigation.flatMap((entry) =>
  isNavGroup(entry) ? entry.children : [entry],
);
