"use server";

import { revalidatePath, updateTag } from "next/cache";

import { PUBLIC_MENU_TAG } from "@/lib/supabase/menu-public";
import { deleteMenuImageIfManaged } from "@/lib/supabase/menu-storage";
import {
  MENU_CATEGORIES_TABLE,
  listMenuCategories,
  toCategoryRow,
  validateCategoryInput,
  type CategoryErrors,
} from "@/lib/supabase/menu-categories";
import { createAuthSupabaseClient, isCurrentUserAdmin } from "@/lib/supabase/server-auth";

export type CategoryActionResult = { status: "success" } | { status: "error"; errors: CategoryErrors };

const CATEGORIES_PATH = "/admin/menu/categories";
const DASHBOARD_PATH = "/admin";

/** Postgres unique-violation SQLSTATE, raised when a slug is already taken. */
const UNIQUE_VIOLATION = "23505";

/**
 * Foreign-key violation. Raised by menu_products.category_id ON DELETE RESTRICT
 * when a category still holds products.
 */
const FOREIGN_KEY_VIOLATION = "23503";



/**
 * Every action re-checks session *and* allowlist membership before touching the
 * database. RLS is still the real boundary.
 *
 * Returns null instead of redirecting. `redirect()` throws NEXT_REDIRECT, which
 * would reject the awaited call inside the client transition and leave the
 * button looking like it did nothing; callers surface a visible error instead.
 */
async function getAdminClient() {
  const supabase = await createAuthSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) return null;
  if (!(await isCurrentUserAdmin(supabase))) return null;

  return supabase;
}

const NOT_AUTHORIZED: CategoryActionResult = { status: "error", errors: { form: "notAuthorized" } };

function revalidateCategories() {
  revalidatePath(CATEGORIES_PATH);
  // The dashboard overview card reads the category count.
  revalidatePath(DASHBOARD_PATH);
  // The public menu and homepage rail read the same rows through a tagged
  // cache entry. `updateTag` is the Server-Action form and applies immediately.
  updateTag(PUBLIC_MENU_TAG);
}

export async function createCategoryAction(formData: FormData): Promise<CategoryActionResult> {
  const parsed = validateCategoryInput(formData);
  if (!parsed.ok) return { status: "error", errors: parsed.errors };

  const supabase = await getAdminClient();
  if (!supabase) return NOT_AUTHORIZED;

  // The browser has already uploaded the file to Storage; only its URL
  // arrives here, so no image binary passes through this Server Action.
  const imageUrl: string | null = parsed.value.imageUrl;

  // `select()` makes RLS refusals visible: without it a blocked insert can come
  // back without an error and the UI would report a success that never happened.
  const { data, error } = await supabase
    .from(MENU_CATEGORIES_TABLE)
    .insert({ ...toCategoryRow(parsed.value), image_url: imageUrl })
    .select("id");

  if (error) {
    await deleteMenuImageIfManaged(supabase, imageUrl);
    if (error.code === UNIQUE_VIOLATION) return { status: "error", errors: { nameEn: "duplicateName" } };
    return { status: "error", errors: { form: "save" } };
  }

  if (!data || data.length === 0) {
    await deleteMenuImageIfManaged(supabase, imageUrl);
    return NOT_AUTHORIZED;
  }

  revalidateCategories();

  return { status: "success" };
}

export async function updateCategoryAction(id: string, formData: FormData): Promise<CategoryActionResult> {
  const parsed = validateCategoryInput(formData);
  if (!parsed.ok) return { status: "error", errors: parsed.errors };

  const supabase = await getAdminClient();
  if (!supabase) return NOT_AUTHORIZED;

  // `image_url` is whatever the uploader last put in the hidden field: the
  // newly uploaded URL, the unchanged existing one, or empty after a removal.
  const savedImageUrl = String(formData.get("current_image_url") ?? "") || null;
  const nextImageUrl = parsed.value.imageUrl;

  // The previously saved object is only superseded once the row commits below.
  const replacedImageUrl = nextImageUrl === savedImageUrl ? null : savedImageUrl;

  const { data, error } = await supabase
    .from(MENU_CATEGORIES_TABLE)
    .update({ ...toCategoryRow(parsed.value), image_url: nextImageUrl })
    .eq("id", id)
    .select("id");

  if (error) {
    if (nextImageUrl !== savedImageUrl) await deleteMenuImageIfManaged(supabase, nextImageUrl);
    if (error.code === UNIQUE_VIOLATION) return { status: "error", errors: { nameEn: "duplicateName" } };
    return { status: "error", errors: { form: "save" } };
  }

  if (!data || data.length === 0) {
    if (nextImageUrl !== savedImageUrl) await deleteMenuImageIfManaged(supabase, nextImageUrl);
    return { status: "error", errors: { form: "notFound" } };
  }

  // Only now, with the row committed to the new URL, is the old file removable.
  await deleteMenuImageIfManaged(supabase, replacedImageUrl);

  revalidateCategories();

  return { status: "success" };
}

export async function deleteCategoryAction(id: string): Promise<CategoryActionResult> {
  const supabase = await getAdminClient();
  if (!supabase) return NOT_AUTHORIZED;

  // A row the policy hides is simply not matched: the delete reports no error
  // and affects nothing. Asking for the deleted ids back is the only way to
  // tell "deleted" from "silently refused".
  const { data, error } = await supabase
    .from(MENU_CATEGORIES_TABLE)
    .delete()
    .eq("id", id)
    .select("id, image_url");

  if (error) {
    // ON DELETE RESTRICT fired: the category still holds products. The owner is
    // told to move or delete them rather than losing a menu section silently.
    if (error.code === FOREIGN_KEY_VIOLATION) {
      return { status: "error", errors: { form: "deleteHasProducts" } };
    }
    return { status: "error", errors: { form: "delete" } };
  }

  if (!data || data.length === 0) return { status: "error", errors: { form: "deleteBlocked" } };

  await deleteMenuImageIfManaged(supabase, (data[0] as { image_url: string | null }).image_url);

  revalidateCategories();

  return { status: "success" };
}

/** Quick active/inactive switch from the category card. */
export async function setCategoryActiveAction(id: string, isActive: boolean): Promise<CategoryActionResult> {
  const supabase = await getAdminClient();
  if (!supabase) return NOT_AUTHORIZED;

  const { data, error } = await supabase
    .from(MENU_CATEGORIES_TABLE)
    .update({ is_active: isActive })
    .eq("id", id)
    .select("id");

  if (error) return { status: "error", errors: { form: "save" } };
  if (!data || data.length === 0) return { status: "error", errors: { form: "notFound" } };

  revalidateCategories();

  return { status: "success" };
}

/**
 * Moves a category one position up or down.
 *
 * Rewrites `display_order` for the whole list as a 1-based sequence rather than
 * swapping two values, so ordering stays correct even when several rows share
 * the same order (for example when they were all created with the default 0).
 */
export async function moveCategoryAction(id: string, direction: "up" | "down"): Promise<CategoryActionResult> {
  const supabase = await getAdminClient();
  if (!supabase) return NOT_AUTHORIZED;

  const listed = await listMenuCategories();
  if (!listed.ok) return { status: "error", errors: { form: "save" } };

  const ordered = listed.categories;
  const index = ordered.findIndex((category) => category.id === id);
  if (index === -1) return { status: "error", errors: { form: "notFound" } };

  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= ordered.length) return { status: "success" };

  const reordered = [...ordered];
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

  const changed = reordered
    .map((category, position) => ({ id: category.id, display_order: position + 1 }))
    .filter((row, position) => reordered[position].displayOrder !== row.display_order);

  if (changed.length === 0) return { status: "success" };

  for (const row of changed) {
    const { data, error } = await supabase
      .from(MENU_CATEGORIES_TABLE)
      .update({ display_order: row.display_order })
      .eq("id", row.id)
      .select("id");

    if (error) return { status: "error", errors: { form: "save" } };
    if (!data || data.length === 0) return { status: "error", errors: { form: "notFound" } };
  }

  revalidateCategories();

  return { status: "success" };
}
