import { FolderTree, Images, Star, UtensilsCrossed, type LucideIcon } from "lucide-react";

/**
 * Icon registry for props that cross a Server -> Client Component boundary.
 *
 * React can only serialize plain values across that boundary, so a Server
 * Component must pass a string key from here rather than the icon component
 * itself. The client component does the lookup and renders it.
 *
 * Icons used *within* a single component (rendered inline, never passed as a
 * prop) do not need this and can keep importing from `lucide-react` directly.
 */
export const adminIcons = {
  categories: FolderTree,
  products: UtensilsCrossed,
  gallery: Images,
  reviews: Star,
} as const satisfies Record<string, LucideIcon>;

export type AdminIconName = keyof typeof adminIcons;
