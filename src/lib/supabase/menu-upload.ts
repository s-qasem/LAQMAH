"use client";

import {
  MAX_UPLOAD_BYTES,
  MENU_BUCKET,
  buildManagedImagePath,
  extensionForType,
  isManagedUpload,
  publicUrlFor,
  storagePathFromUrl,
  type ManagedPrefix,
  type UploadErrorCode,
} from "@/lib/menu-images";

import { createBrowserSupabaseClient } from "./client";

export type BrowserUploadResult =
  | { ok: true; publicUrl: string; path: string }
  | { ok: false; code: UploadErrorCode };

/**
 * Uploads one image straight from the browser to Supabase Storage.
 *
 * The binary never touches a Server Action, so the Next.js request body limit
 * is irrelevant. The upload uses the cookie-backed browser client, so Storage
 * RLS sees the signed-in admin and the `menu/` policies still apply — nothing
 * about the security model changes, only the transport.
 */
export async function uploadMenuImageFromBrowser(
  folder: string,
  file: File,
  prefix: ManagedPrefix = "menu",
): Promise<BrowserUploadResult> {
  if (!file || file.size === 0) return { ok: false, code: "empty" };

  const extension = extensionForType(file.type);
  if (!extension) return { ok: false, code: "type" };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, code: "size" };

  const path = buildManagedImagePath(prefix, folder, extension);
  const supabase = createBrowserSupabaseClient();

  const { error } = await supabase.storage.from(MENU_BUCKET).upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false,
  });

  if (error) return { ok: false, code: "upload" };

  return { ok: true, publicUrl: publicUrlFor(path), path };
}

/**
 * Removes an object this session just uploaded but never saved — for example
 * when the admin picks an image and then removes it, or replaces it again
 * before saving. Never touches the seeded `/public` paths.
 */
export async function discardUnsavedUpload(url: string | null, prefix: ManagedPrefix = "menu") {
  // Scoped to the calling module's own prefix: a gallery editor can never
  // discard a menu object, even if it were handed one.
  if (!isManagedUpload(url, prefix)) return;

  const path = storagePathFromUrl(url as string);
  if (!path) return;

  try {
    await createBrowserSupabaseClient().storage.from(MENU_BUCKET).remove([path]);
  } catch {
    // An orphaned object is harmless; failing the edit would not be.
  }
}
