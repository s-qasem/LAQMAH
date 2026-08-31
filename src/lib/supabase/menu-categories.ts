import "server-only";

import { isAcceptableImageValue } from "@/lib/menu-images";

import { createAuthSupabaseClient } from "./server-auth";

/** A menu category as the rest of the app consumes it. */
export type MenuCategory = {
  id: string;
  nameEn: string;
  nameAr: string;
  slug: string;
  displayOrder: number;
  isActive: boolean;
  imageUrl: string | null;
};

type MenuCategoryRow = {
  id: string;
  name_en: string;
  name_ar: string;
  slug: string;
  display_order: number;
  is_active: boolean;
  image_url: string | null;
};

const SELECT_COLUMNS = "id, name_en, name_ar, slug, display_order, is_active, image_url";

export const MENU_CATEGORIES_TABLE = "menu_categories";

function toMenuCategory(row: MenuCategoryRow): MenuCategory {
  return {
    id: row.id,
    nameEn: row.name_en,
    nameAr: row.name_ar,
    slug: row.slug,
    displayOrder: row.display_order,
    isActive: row.is_active,
    imageUrl: row.image_url,
  };
}

/** Field-level problems a category form can report back to the admin UI. */
export type CategoryErrorCode =
  | "nameEnRequired"
  | "nameArRequired"
  | "slugRequired"
  | "slugFormat"
  | "orderNumeric"
  | "orderRange"
  | "slugDuplicate"
  | "slugFromName"
  | "duplicateName"
  | "imageUrl"
  | "save"
  | "delete"
  | "deleteBlocked"
  | "deleteHasProducts"
  | "imageType"
  | "imageSize"
  | "imageUpload"
  | "notAuthorized"
  | "notFound";

export type CategoryField = "nameEn" | "nameAr" | "slug" | "displayOrder" | "imageUrl" | "form";

export type CategoryErrors = Partial<Record<CategoryField, CategoryErrorCode>>;

export type CategoryInput = {
  nameEn: string;
  nameAr: string;
  slug: string;
  displayOrder: number;
  isActive: boolean;
  imageUrl: string | null;
};

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Derives a URL-safe slug from the English name.
 *
 * The column is NOT NULL UNIQUE in the database, but it is a technical detail
 * the admin should not have to think about, so the form no longer exposes it.
 * An explicit slug field in the payload still wins when one is supplied.
 */
export function deriveSlug(nameEn: string): string {
  return nameEn
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Validates raw form values. Mirrors the CHECK constraints in the migration so
 * the admin gets a field-level message instead of a database error.
 *
 * Returns the parsed input when everything passes, otherwise the field errors.
 */
export function validateCategoryInput(form: FormData):
  | { ok: true; value: CategoryInput }
  | { ok: false; errors: CategoryErrors } {
  const errors: CategoryErrors = {};

  const nameEn = String(form.get("name_en") ?? "").trim();
  const nameAr = String(form.get("name_ar") ?? "").trim();
  const submittedSlug = String(form.get("slug") ?? "").trim().toLowerCase();
  const slug = submittedSlug || deriveSlug(nameEn);
  const rawOrder = String(form.get("display_order") ?? "").trim();
  const rawImageUrl = String(form.get("image_url") ?? "").trim();
  const isActive = form.get("is_active") === "on";

  if (!nameEn) errors.nameEn = "nameEnRequired";
  if (!nameAr) errors.nameAr = "nameArRequired";

  // With the slug field hidden, an underivable slug means an unusable English
  // name (for example one written only in Arabic), so report it on that field.
  if (!slug) {
    if (submittedSlug) errors.slug = "slugRequired";
    else errors.nameEn = "slugFromName";
  } else if (!SLUG_PATTERN.test(slug)) {
    if (submittedSlug) errors.slug = "slugFormat";
    else errors.nameEn = "slugFromName";
  }

  const displayOrder = rawOrder === "" ? 0 : Number(rawOrder);

  if (!Number.isInteger(displayOrder)) {
    errors.displayOrder = "orderNumeric";
  } else if (displayOrder < 0 || displayOrder > 9999) {
    errors.displayOrder = "orderRange";
  }

  let imageUrl: string | null = null;

  if (rawImageUrl) {
    // new URL() throws on a root-relative path, which used to reject every
    // bundled site asset. The shared rule accepts those and Storage uploads.
    if (isAcceptableImageValue(rawImageUrl)) imageUrl = rawImageUrl;
    else errors.imageUrl = "imageUrl";
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return { ok: true, value: { nameEn, nameAr, slug, displayOrder, isActive, imageUrl } };
}

/** Maps a category row to the database column names. */
export function toCategoryRow(input: CategoryInput) {
  return {
    name_en: input.nameEn,
    name_ar: input.nameAr,
    slug: input.slug,
    display_order: input.displayOrder,
    is_active: input.isActive,
    image_url: input.imageUrl,
  };
}

export type CategoryListResult =
  | { ok: true; categories: MenuCategory[] }
  | { ok: false; categories: []; reason: "unavailable" };

/**
 * Every category, ordered for the admin table. Uses the cookie-backed client so
 * RLS sees the admin session and returns inactive categories too.
 *
 * Never throws: an unreachable or not-yet-migrated table returns `ok: false` so
 * the page can render an explanatory notice instead of a runtime error.
 */
export async function listMenuCategories(): Promise<CategoryListResult> {
  const supabase = await createAuthSupabaseClient();

  const { data, error } = await supabase
    .from(MENU_CATEGORIES_TABLE)
    .select(SELECT_COLUMNS)
    .order("display_order", { ascending: true })
    .order("name_en", { ascending: true });

  if (error) return { ok: false, categories: [], reason: "unavailable" };

  return { ok: true, categories: (data ?? []).map(toMenuCategory) };
}

/**
 * Number of categories, for the dashboard overview card. Returns `null` when the
 * table cannot be read so the card can fall back to its placeholder.
 */
export async function countMenuCategories(): Promise<number | null> {
  const supabase = await createAuthSupabaseClient();

  const { count, error } = await supabase
    .from(MENU_CATEGORIES_TABLE)
    .select("id", { count: "exact", head: true });

  if (error) return null;

  return count ?? 0;
}
