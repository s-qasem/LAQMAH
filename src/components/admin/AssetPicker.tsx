"use client";

import { Lock, Search } from "lucide-react";
import { useState, useTransition } from "react";

import { listUploadedAssetsAction } from "@/app/admin/(dashboard)/media/actions";
import { siteAssets } from "@/data/site-assets";

import { AdminModal } from "./AdminModal";
import { AdminThumb } from "./AdminThumb";
import { useAdminLanguage } from "./AdminLanguageProvider";

type UploadedAsset = { path: string; name: string; publicUrl: string; prefix: string };

type PickerRow = { key: string; name: string; url: string; detail: string; isBundled: boolean };

const ALL = "__all__";

/**
 * Lets an editor reuse media that already exists instead of uploading a copy.
 *
 * Offers both sources: bundled site assets from the derived manifest, and
 * Storage objects already uploaded through the admin. Choosing a bundled asset
 * stores its `/public` path verbatim — nothing is copied into Storage.
 */
export function AssetPicker({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}) {
  const { t } = useAdminLanguage();
  const [uploaded, setUploaded] = useState<UploadedAsset[] | null>(null);
  const [query, setQuery] = useState("");
  const [source, setSource] = useState(ALL);
  const [isPending, startTransition] = useTransition();

  // Loaded on first open so the picker costs nothing until it is used.
  if (open && uploaded === null && !isPending) {
    startTransition(async () => {
      const result = await listUploadedAssetsAction();
      setUploaded(result.status === "success" ? result.assets : []);
    });
  }

  const rows: PickerRow[] = [
    ...(uploaded ?? []).map((asset) => ({
      key: `uploaded:${asset.path}`,
      name: asset.name,
      url: asset.publicUrl,
      detail: asset.prefix,
      isBundled: false,
    })),
    // Videos are bundled assets too, but every field this picker fills is an
      // image field, so they are not offered here.
      ...siteAssets.filter((asset) => asset.group !== "video").map((asset) => ({
      key: `site:${asset.path}`,
      name: asset.name,
      url: asset.path,
      detail: asset.path,
      isBundled: true,
    })),
  ].filter((row) => {
    const matchesSource = source === ALL || (source === "site" ? row.isBundled : !row.isBundled);
    const needle = query.trim().toLowerCase();
    return matchesSource && (!needle || row.name.toLowerCase().includes(needle) || row.detail.toLowerCase().includes(needle));
  });

  return (
    <AdminModal open={open} onClose={onClose} title={t("picker.title")} description={t("picker.description")}>
      <div className="admin-toolbar admin-toolbar--filters">
        <label className="admin-search" htmlFor="picker-search">
          <Search aria-hidden="true" />
          <span className="admin-visually-hidden">{t("media.search")}</span>
          <input
            id="picker-search"
            type="search"
            value={query}
            placeholder={t("media.search")}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <label className="admin-inline-field" htmlFor="picker-source">
          <span>{t("media.source")}</span>
          <select id="picker-source" value={source} onChange={(event) => setSource(event.target.value)}>
            <option value={ALL}>{t("media.source.all")}</option>
            <option value="site">{t("media.source.site")}</option>
            <option value="uploaded">{t("media.source.uploaded")}</option>
          </select>
        </label>
      </div>

      {isPending && uploaded === null ? <p className="admin-empty">{t("picker.loading")}</p> : null}

      {rows.length === 0 && uploaded !== null ? (
        <p className="admin-empty">{t("media.empty")}</p>
      ) : (
        <ul className="admin-grid admin-grid--picker">
          {rows.map((row) => (
            <li key={row.key}>
              <button
                type="button"
                className="admin-picker__option"
                onClick={() => {
                  onSelect(row.url);
                  onClose();
                }}
              >
                <AdminThumb url={row.url} label={row.name} />
                <span className="admin-picker__name">{row.name}</span>
                {row.isBundled ? (
                  <span className="admin-picker__badge">
                    <Lock aria-hidden="true" />
                    {t("media.bundled")}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </AdminModal>
  );
}
