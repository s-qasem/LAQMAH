"use server";

import { revalidatePath } from "next/cache";

import { MANAGED_PREFIXES, MENU_BUCKET, type ManagedPrefix } from "@/lib/menu-images";
import { getAdminActionClient } from "@/lib/supabase/admin-action";
import { listMediaAssets } from "@/lib/supabase/media-library";

export type MediaErrorCode = "path" | "inUse" | "delete" | "notAuthorized";
export type MediaActionResult = { status: "success" } | { status: "error"; code: MediaErrorCode };

/**
 * Tables whose rows may reference a Storage object.
 *
 * `key` is the column selected to prove a row exists. Most tables use `id`,
 * but the homepage section tables are keyed on their section slug and their
 * design slot, and selecting a non-existent `id` would error on every check.
 */
const REFERENCING = [
  { table: "menu_categories", column: "image_url", key: "id" },
  { table: "menu_products", column: "image_url", key: "id" },
  { table: "gallery_images", column: "image_url", key: "id" },
  { table: "homepage_hero", column: "desktop_image_url", key: "id" },
  { table: "homepage_hero", column: "mobile_image_url", key: "id" },
  { table: "homepage_sections", column: "image_url", key: "section_key" },
  { table: "homepage_atmosphere_images", column: "image_url", key: "position" },
] as const;

function isManagedPath(path: string): path is `${ManagedPrefix}/${string}` {
  const [prefix, ...rest] = path.split("/");
  if (rest.length === 0) return false;
  // Reject traversal and anything outside a module's own folder.
  if (path.includes("..")) return false;
  return (MANAGED_PREFIXES as readonly string[]).includes(prefix);
}

/**
 * Deletes one Storage object from the media library.
 *
 * Three guards, in order:
 *   1. the path must sit under a managed prefix — a `/public` bundle path can
 *      never be expressed here, so a seeded asset is unreachable by design;
 *   2. no database row may still reference the object, so deleting from this
 *      screen cannot silently break a product, category, gallery tile or hero;
 *   3. Storage RLS still evaluates `public.is_admin()` for the delete itself.
 */
export async function deleteMediaAssetAction(path: string, publicUrl: string): Promise<MediaActionResult> {
  if (!isManagedPath(path)) return { status: "error", code: "path" };

  const supabase = await getAdminActionClient();
  if (!supabase) return { status: "error", code: "notAuthorized" };

  for (const { table, column, key } of REFERENCING) {
    const { data, error } = await supabase.from(table).select(key).eq(column, publicUrl).limit(1);

    // A table that cannot be read is treated as "might reference it".
    if (error) return { status: "error", code: "inUse" };
    if (data && data.length > 0) return { status: "error", code: "inUse" };
  }

  const { error } = await supabase.storage.from(MENU_BUCKET).remove([path]);

  if (error) return { status: "error", code: "delete" };

  revalidatePath("/admin/media");

  return { status: "success" };
}

/**
 * Uploaded assets for the "choose existing" picker in the image editors.
 *
 * Read-only. Site assets are not returned here: they come from the static
 * manifest, which the client already has, and they are never Storage objects.
 */
export async function listUploadedAssetsAction(): Promise<
  { status: "success"; assets: { path: string; name: string; publicUrl: string; prefix: string }[] } | { status: "error" }
> {
  const supabase = await getAdminActionClient();
  if (!supabase) return { status: "error" };

  const result = await listMediaAssets();
  if (!result.ok) return { status: "error" };

  return {
    status: "success",
    assets: result.assets.map((asset) => ({
      path: asset.path,
      name: asset.name,
      publicUrl: asset.publicUrl,
      prefix: asset.prefix,
    })),
  };
}
