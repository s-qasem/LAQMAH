import "server-only";

import { isAcceptableImageValue } from "@/lib/menu-images";

import { deriveSlug } from "./menu-categories";
import { createAuthSupabaseClient } from "./server-auth";

/** A product as the admin consumes it. */
export type MenuProductRecord = {
  id: string;
  categoryId: string;
  categorySlug: string;
  categoryNameEn: string;
  categoryNameAr: string | null;
  slug: string;
  nameEn: string;
  nameAr: string | null;
  descriptionEn: string | null;
  descriptionAr: string | null;
  price: string | null;
  imageUrl: string | null;
  displayOrder: number;
  isAvailable: boolean;
  isFeatured: boolean;
};

type ProductRow = {
  id: string;
  category_id: string;
  slug: string;
  name_en: string;
  name_ar: string | null;
  description_en: string | null;
  description_ar: string | null;
  price: string | number | null;
  image_url: string | null;
  display_order: number;
  is_available: boolean;
  is_featured: boolean;
  menu_categories: { slug: string; name_en: string; name_ar: string | null } | null;
};

export const MENU_PRODUCTS_TABLE = "menu_products";

const SELECT_COLUMNS =
  "id, category_id, slug, name_en, name_ar, description_en, description_ar, price, image_url, display_order, is_available, is_featured, menu_categories(slug, name_en, name_ar)";

function toProduct(row: ProductRow): MenuProductRecord {
  return {
    id: row.id,
    categoryId: row.category_id,
    categorySlug: row.menu_categories?.slug ?? "",
    categoryNameEn: row.menu_categories?.name_en ?? "",
    categoryNameAr: row.menu_categories?.name_ar ?? null,
    slug: row.slug,
    nameEn: row.name_en,
    nameAr: row.name_ar,
    descriptionEn: row.description_en,
    descriptionAr: row.description_ar,
    price: row.price === null ? null : String(row.price),
    imageUrl: row.image_url,
    displayOrder: row.display_order,
    isAvailable: row.is_available,
    isFeatured: row.is_featured,
  };
}

export type ProductErrorCode =
  | "nameEnRequired"
  | "slugFromName"
  | "categoryRequired"
  | "priceNumeric"
  | "priceNegative"
  | "duplicateName"
  | "imageType"
  | "imageSize"
  | "imageUpload"
  | "imageUrl"
  | "save"
  | "delete"
  | "notAuthorized"
  | "notFound";

export type ProductField =
  | "nameEn"
  | "nameAr"
  | "descriptionEn"
  | "descriptionAr"
  | "categoryId"
  | "price"
  | "image"
  | "form";

export type ProductErrors = Partial<Record<ProductField, ProductErrorCode>>;

export type ProductInput = {
  categoryId: string;
  slug: string;
  nameEn: string;
  nameAr: string | null;
  descriptionEn: string | null;
  descriptionAr: string | null;
  price: string | null;
  imageUrl: string | null;
  displayOrder: number;
  isAvailable: boolean;
  isFeatured: boolean;
};

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Validates product form values. Mirrors the CHECK constraints in the
 * migration, so the admin sees a field-level message instead of a raw
 * database error.
 *
 * Arabic copy and price stay optional: the migrated menu has neither.
 */
export function validateProductInput(form: FormData):
  | { ok: true; value: ProductInput }
  | { ok: false; errors: ProductErrors } {
  const errors: ProductErrors = {};

  const nameEn = String(form.get("name_en") ?? "").trim();
  const nameAr = String(form.get("name_ar") ?? "").trim();
  const descriptionEn = String(form.get("description_en") ?? "").trim();
  const descriptionAr = String(form.get("description_ar") ?? "").trim();
  const categoryId = String(form.get("category_id") ?? "").trim();
  const rawPrice = String(form.get("price") ?? "").trim();
  const rawOrder = String(form.get("display_order") ?? "").trim();
  const submittedSlug = String(form.get("slug") ?? "").trim().toLowerCase();
  const rawImageUrl = String(form.get("image_url") ?? "").trim();

  const slug = submittedSlug || deriveSlug(nameEn);

  if (!nameEn) errors.nameEn = "nameEnRequired";
  else if (!SLUG_PATTERN.test(slug)) errors.nameEn = "slugFromName";

  if (!categoryId) errors.categoryId = "categoryRequired";

  let price: string | null = null;

  if (rawPrice) {
    const parsed = Number(rawPrice);
    if (!Number.isFinite(parsed)) errors.price = "priceNumeric";
    else if (parsed < 0) errors.price = "priceNegative";
    else price = parsed.toFixed(2);
  }

  // The URL comes from the browser uploader; re-checked here because the form
  // is client-supplied like any other field.
  let imageUrl: string | null = null;

  if (rawImageUrl) {
    if (isAcceptableImageValue(rawImageUrl)) imageUrl = rawImageUrl;
    else errors.image = "imageUrl";
  }

  const displayOrder = rawOrder === "" ? 0 : Number(rawOrder);
  const safeOrder = Number.isInteger(displayOrder) && displayOrder >= 0 && displayOrder <= 9999 ? displayOrder : 0;

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      categoryId,
      slug,
      nameEn,
      nameAr: nameAr || null,
      descriptionEn: descriptionEn || null,
      descriptionAr: descriptionAr || null,
      price,
      imageUrl,
      displayOrder: safeOrder,
      isAvailable: form.get("is_available") === "on",
      isFeatured: form.get("is_featured") === "on",
    },
  };
}

/** Maps validated input to database column names. `image_url` is applied separately. */
export function toProductRow(input: ProductInput) {
  return {
    category_id: input.categoryId,
    slug: input.slug,
    name_en: input.nameEn,
    name_ar: input.nameAr,
    description_en: input.descriptionEn,
    description_ar: input.descriptionAr,
    price: input.price,
    display_order: input.displayOrder,
    is_available: input.isAvailable,
    is_featured: input.isFeatured,
  };
}

export type ProductListResult =
  | { ok: true; products: MenuProductRecord[] }
  | { ok: false; products: []; reason: "unavailable" };

/**
 * Products for the admin, optionally scoped to one category.
 *
 * Uses the cookie-backed client so RLS returns unavailable products and
 * products in hidden categories too. Never throws.
 */
export async function listMenuProducts(categoryId?: string): Promise<ProductListResult> {
  const supabase = await createAuthSupabaseClient();

  let query = supabase.from(MENU_PRODUCTS_TABLE).select(SELECT_COLUMNS);
  if (categoryId) query = query.eq("category_id", categoryId);

  const { data, error } = await query
    .order("display_order", { ascending: true })
    .order("name_en", { ascending: true });

  if (error) return { ok: false, products: [], reason: "unavailable" };

  return { ok: true, products: (data as unknown as ProductRow[]).map(toProduct) };
}

/** Product counts per category id, for the category cards. Empty on failure. */
export async function countProductsByCategory(): Promise<Record<string, number>> {
  const supabase = await createAuthSupabaseClient();

  const { data, error } = await supabase.from(MENU_PRODUCTS_TABLE).select("category_id");

  if (error || !data) return {};

  return data.reduce<Record<string, number>>((counts, row) => {
    const key = (row as { category_id: string }).category_id;
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

/** Total product count, for the dashboard overview tile. Null when unreadable. */
export async function countMenuProducts(): Promise<number | null> {
  const supabase = await createAuthSupabaseClient();

  const { count, error } = await supabase
    .from(MENU_PRODUCTS_TABLE)
    .select("id", { count: "exact", head: true });

  if (error) return null;

  return count ?? 0;
}
