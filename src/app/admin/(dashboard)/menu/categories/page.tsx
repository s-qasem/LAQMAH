import type { Metadata } from "next";

import { AdminPageHeader, AdminText } from "@/components/admin";
import { listMenuCategories } from "@/lib/supabase/menu-categories";
import { countProductsByCategory } from "@/lib/supabase/menu-products";

import { CategoriesManager } from "./CategoriesManager";

export const metadata: Metadata = {
  title: "Menu Categories",
  robots: { index: false, follow: false },
};

export default async function AdminMenuCategoriesPage() {
  const [result, productCounts] = await Promise.all([listMenuCategories(), countProductsByCategory()]);

  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrowKey="page.eyebrow.menu"
        titleKey="page.categories.title"
        descriptionKey="page.categories.description"
      />

      {result.ok ? null : (
        <p className="admin-form__error" role="alert">
          <AdminText tKey="categories.unavailable" />
        </p>
      )}

      <CategoriesManager categories={result.categories} productCounts={productCounts} />
    </div>
  );
}
