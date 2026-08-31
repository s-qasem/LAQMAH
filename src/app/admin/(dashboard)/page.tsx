import { FolderTree, Home, Images, Plus, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

import { AdminPageHeader, AdminStatsSection, AdminText, StatCard } from "@/components/admin";
import type { AdminTranslationKey } from "@/data/admin-i18n";
import { countMenuCategories } from "@/lib/supabase/menu-categories";
import { countMenuProducts } from "@/lib/supabase/menu-products";
import { countGalleryImages, countSiteReviews } from "@/lib/supabase/site-content";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  robots: { index: false, follow: false },
};

/**
 * `iconName` is a plain string, not an icon component: `StatCard` is a Client
 * Component, and only serializable values can cross that boundary.
 *
 * Only Menu Categories is connected; the rest show a restrained placeholder
 * until their own tables land.
 */
/**
 * Quick actions link to screens that already exist. None of them invent
 * behaviour: each one opens the destination the admin would navigate to anyway.
 */
const quickActions = [
  { href: "/admin/menu/categories", labelKey: "dashboard.action.addCategory", icon: FolderTree, lead: true },
  { href: "/admin/menu/products", labelKey: "dashboard.action.addProduct", icon: UtensilsCrossed, lead: false },
  { href: "/admin/gallery", labelKey: "dashboard.action.uploadImage", icon: Images, lead: false },
  { href: "/admin/homepage", labelKey: "dashboard.action.editHomepage", icon: Home, lead: false },
] as const satisfies readonly {
  href: string;
  labelKey: AdminTranslationKey;
  icon: unknown;
  lead: boolean;
}[];

export default async function AdminDashboardPage() {
  // Null when the table cannot be read, so the tile falls back to its placeholder.
  // Each count resolves independently; one failing table shows a placeholder
  // tile instead of breaking the dashboard.
  const [categoryCount, productCount, galleryCount, reviewCount] = await Promise.all([
    countMenuCategories(),
    countMenuProducts(),
    countGalleryImages(),
    countSiteReviews(),
  ]);

  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrowKey="page.eyebrow.overview"
        titleKey="page.dashboard.title"
        descriptionKey="page.dashboard.description"
      />

      <AdminStatsSection>
        <StatCard
          labelKey="dashboard.stat.categories"
          iconName="categories"
          value={categoryCount === null ? undefined : String(categoryCount)}
        />
        <StatCard
          labelKey="dashboard.stat.products"
          iconName="products"
          value={productCount === null ? undefined : String(productCount)}
        />
        <StatCard
          labelKey="dashboard.stat.gallery"
          iconName="gallery"
          value={galleryCount === null ? undefined : String(galleryCount)}
        />
        <StatCard
          labelKey="dashboard.stat.reviews"
          iconName="reviews"
          value={reviewCount === null ? undefined : String(reviewCount)}
        />
      </AdminStatsSection>

      <section className="admin-quick" aria-labelledby="quick-actions-heading">
        <h2 id="quick-actions-heading" className="admin-section-title">
          <AdminText tKey="dashboard.quickActions" />
        </h2>

        <ul className="admin-quick__list">
          {quickActions.map((action) => {
            // Rendered here in the Server Component, so only the resulting
            // element tree crosses the boundary — never the component itself.
            const Icon = action.icon;

            return (
              <li key={action.href}>
                <Link
                  href={action.href}
                  className={`admin-quick__action${action.lead ? " admin-quick__action--lead" : ""}`}
                >
                  <span className="admin-quick__icon" aria-hidden="true">
                    {action.lead ? <Plus /> : <Icon />}
                  </span>
                  <span className="admin-quick__label">
                    <AdminText tKey={action.labelKey} />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
