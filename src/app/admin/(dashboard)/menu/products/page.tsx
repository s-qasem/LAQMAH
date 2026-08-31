import type { Metadata } from "next";

import { AdminPageHeader, AdminText } from "@/components/admin";
import { listMenuCategories } from "@/lib/supabase/menu-categories";
import { listMenuProducts } from "@/lib/supabase/menu-products";

import { ProductsManager } from "./ProductsManager";

export const metadata: Metadata = {
  title: "Menu Products",
  robots: { index: false, follow: false },
};

export default async function AdminMenuProductsPage() {
  const [products, categories] = await Promise.all([listMenuProducts(), listMenuCategories()]);

  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrowKey="page.eyebrow.menu"
        titleKey="page.products.title"
        descriptionKey="page.products.description"
      />

      {products.ok ? null : (
        <p className="admin-form__error" role="alert">
          <AdminText tKey="products.unavailableTable" />
        </p>
      )}

      <ProductsManager products={products.products} categories={categories.categories} />
    </div>
  );
}
