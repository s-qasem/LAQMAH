"use client";

import { FileVideo, ImageIcon, Info, Lock, Search, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

import { AdminModal, AdminThumb, useAdminLanguage } from "@/components/admin";
import type { AdminTranslationKey } from "@/data/admin-i18n";
import type { SiteAsset } from "@/data/site-assets";
import type { ManagedPrefix } from "@/lib/menu-images";
import type { MediaAsset } from "@/lib/supabase/media-library";

import { deleteMediaAssetAction, type MediaErrorCode } from "./actions";

const ERROR_KEYS: Record<MediaErrorCode, AdminTranslationKey> = {
  path: "media.error.path",
  inUse: "media.error.inUse",
  delete: "media.error.delete",
  notAuthorized: "media.error.notAuthorized",
};

const MODULE_KEYS: Record<ManagedPrefix, AdminTranslationKey> = {
  menu: "media.module.menu",
  gallery: "media.module.gallery",
  homepage: "media.module.homepage",
};

/** Bundled videos live alongside images in the library and preview natively. */
function isVideoAsset(name: string) {
  return name.toLowerCase().endsWith(".mp4");
}

const GROUP_KEYS: Record<SiteAsset["group"], AdminTranslationKey> = {
  menu: "media.module.menu",
  gallery: "media.module.gallery",
  homepage: "media.module.homepage",
  video: "media.group.video",
};

const ALL = "__all__";
const SOURCE_SITE = "site";
const SOURCE_UPLOADED = "uploaded";

/** One row in the grid, from either source. */
type Row = {
  key: string;
  name: string;
  url: string;
  detail: string;
  groupKey: AdminTranslationKey;
  /** Bundled assets ship with the site and are never Storage objects. */
  isBundled: boolean;
  asset?: MediaAsset;
};

type MediaLibraryProps = {
  assets: MediaAsset[];
  sizes: Record<string, string>;
  siteAssets: SiteAsset[];
};

/**
 * Media Library over two sources.
 *
 * "Site assets" are files bundled with the website, listed from a manifest
 * derived from `src/data/images.ts`. They are read-only by nature: they are not
 * Storage objects, so there is nothing to delete and no delete control is shown.
 *
 * "Uploaded assets" are Supabase Storage objects under the managed prefixes and
 * keep their existing behaviour, including guarded deletion.
 *
 * Nothing here ever copies a bundled file into Storage.
 */
export function MediaLibrary({ assets, sizes, siteAssets }: MediaLibraryProps) {
  const { t } = useAdminLanguage();
  const [sourceFilter, setSourceFilter] = useState(ALL);
  const [moduleFilter, setModuleFilter] = useState(ALL);
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<MediaAsset | null>(null);
  const [error, setError] = useState<MediaErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();

  const uploadedRows: Row[] = assets.map((asset) => ({
    key: `uploaded:${asset.path}`,
    name: asset.name,
    url: asset.publicUrl,
    detail: `${asset.folder ? `${asset.prefix}/${asset.folder}` : asset.prefix} · ${sizes[asset.path] ?? "—"}`,
    groupKey: MODULE_KEYS[asset.prefix],
    isBundled: false,
    asset,
  }));

  const siteRows: Row[] = siteAssets.map((asset) => ({
    key: `site:${asset.path}`,
    name: asset.name,
    url: asset.path,
    detail: asset.path,
    groupKey: GROUP_KEYS[asset.group],
    isBundled: true,
  }));

  const rows = [...uploadedRows, ...siteRows].filter((row) => {
    const matchesSource =
      sourceFilter === ALL ||
      (sourceFilter === SOURCE_SITE ? row.isBundled : !row.isBundled);
    const matchesModule = moduleFilter === ALL || t(row.groupKey) === t(moduleFilter as AdminTranslationKey);
    const needle = query.trim().toLowerCase();
    const matchesQuery = !needle || row.name.toLowerCase().includes(needle) || row.detail.toLowerCase().includes(needle);

    return matchesSource && matchesModule && matchesQuery;
  });

  const confirmDelete = () => {
    if (!pending) return;

    startTransition(async () => {
      const result = await deleteMediaAssetAction(pending.path, pending.publicUrl);

      if (result.status === "error") {
        setError(result.code);
        return;
      }

      setError(null);
      setPending(null);
    });
  };

  return (
    <>
      <p className="admin-callout">
        <Info aria-hidden="true" />
        <span>{t("media.sources.note")}</span>
      </p>

      <div className="admin-toolbar admin-toolbar--filters">
        <label className="admin-search" htmlFor="media-search">
          <Search aria-hidden="true" />
          <span className="admin-visually-hidden">{t("media.search")}</span>
          <input
            id="media-search"
            type="search"
            value={query}
            placeholder={t("media.search")}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <label className="admin-inline-field" htmlFor="media-source">
          <span>{t("media.source")}</span>
          <select id="media-source" value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
            <option value={ALL}>{t("media.source.all")}</option>
            <option value={SOURCE_SITE}>{t("media.source.site")}</option>
            <option value={SOURCE_UPLOADED}>{t("media.source.uploaded")}</option>
          </select>
        </label>

        <label className="admin-inline-field" htmlFor="media-module">
          <span>{t("media.module")}</span>
          <select id="media-module" value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)}>
            <option value={ALL}>{t("media.folder.all")}</option>
            <option value="media.module.menu">{t("media.module.menu")}</option>
            <option value="media.module.gallery">{t("media.module.gallery")}</option>
            <option value="media.module.homepage">{t("media.module.homepage")}</option>
            <option value="media.group.video">{t("media.group.video")}</option>
          </select>
        </label>
      </div>

      {error && !pending ? (
        <p className="admin-form__error" role="alert">
          {t(ERROR_KEYS[error])}
        </p>
      ) : null}

      <p className="admin-toolbar__count">
        {t("media.counts", { site: siteAssets.length, uploaded: assets.length })}
      </p>

      {rows.length === 0 ? (
        <p className="admin-empty">{t("media.empty")}</p>
      ) : (
        <ul className="admin-grid">
          {rows.map((row) => (
            <li key={row.key} className="admin-tile">
              {/* AdminThumb is image-only; a video would fail the optimizer
                  and fall back to the LQMAH mark even though the file is fine. */}
              {isVideoAsset(row.name) ? (
                <div className="admin-thumb admin-thumb--tile">
                  <video src={row.url} muted playsInline preload="metadata" aria-label={row.name} />
                </div>
              ) : (
                <AdminThumb url={row.url} label={row.name} />
              )}

              <div className="admin-tile__body">
                {/* Filenames and paths are identifiers: never translated. */}
                <p className="admin-tile__name">{row.name}</p>
                <p className="admin-tile__meta">{row.detail}</p>
                <p className="admin-tile__order">{t(row.groupKey)}</p>
              </div>

              <div className="admin-tile__actions">
                {row.isBundled ? (
                  <span className="admin-state" title={t("media.bundled.hint")}>
                    <Lock aria-hidden="true" />
                    {t("media.bundled")}
                  </span>
                ) : (
                  <span className="admin-state" aria-hidden="true">
                    {isVideoAsset(row.name) ? <FileVideo /> : <ImageIcon />}
                  </span>
                )}

                {row.isBundled ? null : (
                  <button
                    type="button"
                    className="admin-icon-button admin-icon-button--danger"
                    disabled={isPending}
                    onClick={() => {
                      setError(null);
                      setPending(row.asset ?? null);
                    }}
                    aria-label={t("common.delete", { subject: row.name })}
                    title={t("common.delete", { subject: row.name })}
                  >
                    <Trash2 aria-hidden="true" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <AdminModal
        open={pending !== null}
        onClose={() => {
          setPending(null);
          setError(null);
        }}
        title={t("media.delete.title")}
        description={t("media.delete.body")}
        footer={
          <>
            <button
              type="button"
              className="admin-button admin-button--ghost"
              onClick={() => {
                setPending(null);
                setError(null);
              }}
              disabled={isPending}
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              className="admin-button admin-button--danger"
              onClick={confirmDelete}
              disabled={isPending}
            >
              {isPending ? t("common.deleting") : t("media.delete.confirm")}
            </button>
          </>
        }
      >
        {error ? (
          <p className="admin-form__error" role="alert">
            {t(ERROR_KEYS[error])}
          </p>
        ) : (
          <p className="admin-modal__note">{pending?.path}</p>
        )}
      </AdminModal>
    </>
  );
}
