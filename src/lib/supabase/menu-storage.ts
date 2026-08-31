import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { MENU_BUCKET, isManagedUpload, storagePathFromUrl, type ManagedPrefix } from "@/lib/menu-images";

export { MENU_BUCKET } from "@/lib/menu-images";

/**
 * Server-side Storage cleanup.
 *
 * Uploading no longer happens here: the browser sends the file directly to
 * Storage (see `menu-upload.ts`) and the Server Action receives only a URL, so
 * no image binary passes through a Server Action request body.
 *
 * Deletion stays on the server because it must run *after* the database row has
 * been committed to the new URL — that ordering is what prevents a row ever
 * pointing at an object that was already removed.
 */
export async function deleteMenuImageIfManaged(
  supabase: SupabaseClient,
  url: string | null,
  prefix: ManagedPrefix = "menu",
) {
  // Two things are refused here. Seeded rows point at `/public/...` bundle
  // paths, which are not Storage objects at all; and an object belonging to a
  // different module never matches this module's prefix. Both fall through
  // without a delete.
  if (!isManagedUpload(url, prefix)) return;

  const path = storagePathFromUrl(url as string);
  if (!path) return;

  try {
    await supabase.storage.from(MENU_BUCKET).remove([path]);
  } catch {
    // An orphaned object is harmless; a broken image reference would not be.
  }
}
