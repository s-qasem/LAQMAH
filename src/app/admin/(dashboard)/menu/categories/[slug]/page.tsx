import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { AdminBreadcrumb, AdminLocalized, AdminText } from "@/components/admin";
import { listMenuCategories } from "@/lib/supabase/menu-categories";
import { listMenuProducts } from "@/lib/supabase/menu-products";

import { ProductsManager } from "../../products/ProductsManager";

export const metadata: Metadata = {
  title: "Category Products",
  robots: { index: false, follow: false },
};

/**
 * Drill-down view: the products inside one category.
 *
 * Reuses `ProductsManager`, so this screen and the global Products screen read
 * and write exactly the same rows. New products here are pre-assigned to this
 * category.
 */
export default async function AdminCategoryProductsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const categories = await listMenuCategories();
  const category = categories.categories.find((entry) => entry.slug === slug);

  if (!category) notFound();

  const products = await listMenuProducts(category.id);

  return (
    <div className="admin-page">
      <AdminBreadcrumb>
        <Link href="/admin/menu/categories">
          <AdminText tKey="breadcrumb.categories" />
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">
          <AdminLocalized en={category.nameEn} ar={category.nameAr} />
        </span>
      </AdminBreadcrumb>

      <header className="admin-page__header">
        <div className="admin-page__heading">
          <p className="admin-page__eyebrow">
            <AdminText tKey="page.eyebrow.menu" />
          </p>
          <h1 className="admin-page__title">
            <AdminLocalized en={category.nameEn} ar={category.nameAr} />
          </h1>
          <p className="admin-category-detail__ar">
            <AdminLocalized en={category.nameEn} ar={category.nameAr} secondary />
          </p>
          <p className="admin-page__description">
            <AdminText tKey="category.detail.products" vars={{ count: products.products.length }} />
          </p>
        </div>
      </header>

      {products.ok ? null : (
        <p className="admin-form__error" role="alert">
          <AdminText tKey="products.unavailableTable" />
        </p>
      )}

      <ProductsManager
        products={products.products}
        categories={categories.categories}
        scopedCategory={category}
      />
    </div>
  );
}
