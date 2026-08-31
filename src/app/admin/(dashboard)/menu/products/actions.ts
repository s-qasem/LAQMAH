"use server";

import { revalidatePath, updateTag } from "next/cache";

import { PUBLIC_MENU_TAG } from "@/lib/supabase/menu-public";
import { deleteMenuImageIfManaged } from "@/lib/supabase/menu-storage";
import {
  MENU_PRODUCTS_TABLE,
  listMenuProducts,
  toProductRow,
  validateProductInput,
  type ProductErrors,
} from "@/lib/supabase/menu-products";
import { createAuthSupabaseClient, isCurrentUserAdmin } from "@/lib/supabase/server-auth";

export type ProductActionResult = { status: "success" } | { status: "error"; errors: ProductErrors };

const UNIQUE_VIOLATION = "23505";
const NOT_AUTHORIZED: ProductActionResult = { status: "error", errors: { form: "notAuthorized" } };

/**
 * Returns null rather than redirecting: `redirect()` throws NEXT_REDIRECT,
 * which would reject the awaited call inside the client transition and leave
 * the button looking like it did nothing.
 */
async function getAdminClient() {
  const supabase = await createAuthSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) return null;
  if (!(await isCurrentUserAdmin(supabase))) return null;

  return supabase;
}

function revalidateMenu() {
  revalidatePath("/admin/menu/products");
  revalidatePath("/admin/menu/categories", "layout");
  revalidatePath("/admin");
  // Publishes the change to the public menu and homepage rail.
  updateTag(PUBLIC_MENU_TAG);
}

export async function createProductAction(formData: FormData): Promise<ProductActionResult> {
  const parsed = validateProductInput(formData);
  if (!parsed.ok) return { status: "error", errors: parsed.errors };

  const supabase = await getAdminClient();
  if (!supabase) return NOT_AUTHORIZED;

  // The browser has already uploaded the file to Storage; only its URL
  // arrives here, so no image binary passes through this Server Action.
  const imageUrl = parsed.value.imageUrl;

  const { data, error } = await supabase
    .from(MENU_PRODUCTS_TABLE)
    .insert({ ...toProductRow(parsed.value), image_url: imageUrl })
    .select("id");

  if (error) {
    // The row was rejected, so the just-uploaded file is now an orphan.
    await deleteMenuImageIfManaged(supabase, imageUrl);
    if (error.code === UNIQUE_VIOLATION) return { status: "error", errors: { nameEn: "duplicateName" } };
    return { status: "error", errors: { form: "save" } };
  }

  if (!data || data.length === 0) {
    await deleteMenuImageIfManaged(supabase, imageUrl);
    return NOT_AUTHORIZED;
  }

  revalidateMenu();

  return { status: "success" };
}

export async function updateProductAction(id: string, formData: FormData): Promise<ProductActionResult> {
  const parsed = validateProductInput(formData);
  if (!parsed.ok) return { status: "error", errors: parsed.errors };

  const supabase = await getAdminClient();
  if (!supabase) return NOT_AUTHORIZED;

  const savedImageUrl = String(formData.get("current_image_url") ?? "") || null;
  const nextImageUrl = parsed.value.imageUrl;

  // The previously saved object is only superseded once the row commits below.
  const replacedImageUrl = nextImageUrl === savedImageUrl ? null : savedImageUrl;

  const { data, error } = await supabase
    .from(MENU_PRODUCTS_TABLE)
    .update({ ...toProductRow(parsed.value), image_url: nextImageUrl })
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

  revalidateMenu();

  return { status: "success" };
}

export async function deleteProductAction(id: string): Promise<ProductActionResult> {
  const supabase = await getAdminClient();
  if (!supabase) return NOT_AUTHORIZED;

  const { data, error } = await supabase
    .from(MENU_PRODUCTS_TABLE)
    .delete()
    .eq("id", id)
    .select("id, image_url");

  if (error) return { status: "error", errors: { form: "delete" } };
  if (!data || data.length === 0) return { status: "error", errors: { form: "notFound" } };

  await deleteMenuImageIfManaged(supabase, (data[0] as { image_url: string | null }).image_url);

  revalidateMenu();

  return { status: "success" };
}

export async function setProductFlagAction(
  id: string,
  flag: "is_available" | "is_featured",
  value: boolean,
): Promise<ProductActionResult> {
  const supabase = await getAdminClient();
  if (!supabase) return NOT_AUTHORIZED;

  const { data, error } = await supabase
    .from(MENU_PRODUCTS_TABLE)
    .update({ [flag]: value })
    .eq("id", id)
    .select("id");

  if (error) return { status: "error", errors: { form: "save" } };
  if (!data || data.length === 0) return { status: "error", errors: { form: "notFound" } };

  revalidateMenu();

  return { status: "success" };
}

/**
 * Moves a product one position within its own category.
 *
 * Rewrites display_order for that category as a 1-based sequence rather than
 * swapping two values, so ordering stays correct even when rows share an order.
 */
export async function moveProductAction(
  id: string,
  categoryId: string,
  direction: "up" | "down",
): Promise<ProductActionResult> {
  const supabase = await getAdminClient();
  if (!supabase) return NOT_AUTHORIZED;

  const listed = await listMenuProducts(categoryId);
  if (!listed.ok) return { status: "error", errors: { form: "save" } };

  const ordered = listed.products;
  const index = ordered.findIndex((product) => product.id === id);
  if (index === -1) return { status: "error", errors: { form: "notFound" } };

  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= ordered.length) return { status: "success" };

  const reordered = [...ordered];
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

  const changed = reordered
    .map((product, position) => ({ id: product.id, display_order: position + 1 }))
    .filter((row, position) => reordered[position].displayOrder !== row.display_order);

  for (const row of changed) {
    const { data, error } = await supabase
      .from(MENU_PRODUCTS_TABLE)
      .update({ display_order: row.display_order })
      .eq("id", row.id)
      .select("id");

    if (error) return { status: "error", errors: { form: "save" } };
    if (!data || data.length === 0) return { status: "error", errors: { form: "notFound" } };
  }

  revalidateMenu();

  return { status: "success" };
}
