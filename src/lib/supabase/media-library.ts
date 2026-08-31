import "server-only";

import { MANAGED_PREFIXES, MENU_BUCKET, publicUrlFor, type ManagedPrefix } from "@/lib/menu-images";

import { createAuthSupabaseClient } from "./server-auth";

/**
 * Read model for the Media Library.
 *
 * Lists the objects this admin actually manages inside the existing
 * `website-content` bucket. It introduces no second storage system and holds no
 * binaries in the database — the bucket is the only source of truth.
 *
 * Files under `/public` are part of the Next.js bundle, not Storage objects, so
 * they can never appear here and can never be deleted from here.
 */

export type MediaAsset = {
  /** Full object path inside the bucket, e.g. "menu/products/uuid.jpg". */
  path: string;
  name: string;
  /** Owning module — also the Storage policy that governs writes. */
  prefix: ManagedPrefix;
  /** Sub-folder inside the prefix, or null. */
  folder: string | null;
  publicUrl: string;
  sizeBytes: number | null;
  updatedAt: string | null;
};

export type MediaListResult =
  | { ok: true; assets: MediaAsset[] }
  | { ok: false; assets: []; reason: "unavailable" };

type StorageEntry = {
  name: string;
  id: string | null;
  updated_at: string | null;
  metadata: { size?: number } | null;
};

/** Folders the listing walks, one level deep inside each managed prefix. */
const SUBFOLDERS: Record<ManagedPrefix, string[]> = {
  menu: ["categories", "products"],
  gallery: [""],
  homepage: [""],
};

const PAGE_SIZE = 100;

export async function listMediaAssets(): Promise<MediaListResult> {
  const supabase = await createAuthSupabaseClient();
  const assets: MediaAsset[] = [];
  let anySucceeded = false;

  for (const prefix of MANAGED_PREFIXES) {
    for (const folder of SUBFOLDERS[prefix]) {
      const path = folder ? `${prefix}/${folder}` : prefix;

      const { data, error } = await supabase.storage.from(MENU_BUCKET).list(path, {
        limit: PAGE_SIZE,
        sortBy: { column: "updated_at", order: "desc" },
      });

      if (error) continue;

      anySucceeded = true;

      for (const entry of (data ?? []) as StorageEntry[]) {
        // `list` returns pseudo-folders with a null id; skip those.
        if (!entry.id) continue;

        const objectPath = `${path}/${entry.name}`;

        assets.push({
          path: objectPath,
          name: entry.name,
          prefix,
          folder: folder || null,
          publicUrl: publicUrlFor(objectPath),
          sizeBytes: entry.metadata?.size ?? null,
          updatedAt: entry.updated_at,
        });
      }
    }
  }

  if (!anySucceeded) return { ok: false, assets: [], reason: "unavailable" };

  assets.sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));

  return { ok: true, assets };
}

/** Human-readable size for the asset card. */
export function formatBytes(bytes: number | null): string {
  if (bytes === null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
