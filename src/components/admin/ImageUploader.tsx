"use client";

import { ImageIcon, Images, Loader2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";

import { cssUrlFor, type ManagedPrefix, type UploadErrorCode } from "@/lib/menu-images";
import { discardUnsavedUpload, uploadMenuImageFromBrowser } from "@/lib/supabase/menu-upload";
import type { AdminTranslationKey } from "@/data/admin-i18n";

import { AssetPicker } from "./AssetPicker";
import { useAdminLanguage } from "./AdminLanguageProvider";

const UPLOAD_ERROR_KEYS: Record<UploadErrorCode, AdminTranslationKey> = {
  empty: "upload.error.empty",
  type: "upload.error.type",
  size: "upload.error.size",
  upload: "upload.error.failed",
};

type ImageUploaderProps = {
  /** Hidden field carrying the resulting URL to the Server Action. */
  name: string;
  /** Top-level module folder the object lands in. */
  prefix?: ManagedPrefix;
  /** Sub-folder inside the prefix; empty for modules that do not need one. */
  folder: string;
  /** Image already stored on the record, if any. */
  currentUrl?: string | null;
  /** Already-translated validation message from the server. */
  errorMessage?: string | null;
};

/**
 * Image field that uploads straight to Supabase Storage from the browser.
 *
 * The file is sent to Storage as soon as it is chosen, and only the resulting
 * public URL is submitted with the form. The image binary never passes through
 * a Server Action, which is what the 1 MB request body limit applies to.
 */
export function ImageUploader({
  name,
  prefix = "menu",
  folder,
  currentUrl = null,
  errorMessage,
}: ImageUploaderProps) {
  const { t } = useAdminLanguage();
  const inputRef = useRef<HTMLInputElement>(null);

  const [savedUrl] = useState<string | null>(currentUrl);
  const [url, setUrl] = useState<string | null>(currentUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<UploadErrorCode | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  /** Objects uploaded in this session that the row does not reference yet. */
  const pendingRef = useRef<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;

    setUploadError(null);
    setIsUploading(true);

    const result = await uploadMenuImageFromBrowser(folder, file, prefix);

    setIsUploading(false);

    if (!result.ok) {
      setUploadError(result.code);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    // A previous unsaved upload in this same session is now unreachable.
    const superseded = pendingRef.current;
    pendingRef.current = result.publicUrl;
    setUrl(result.publicUrl);

    if (superseded && superseded !== result.publicUrl) await discardUnsavedUpload(superseded, prefix);
  };

  const chooseExisting = async (chosen: string) => {
    const superseded = pendingRef.current;
    pendingRef.current = null;
    setUploadError(null);
    setUrl(chosen);

    // An unsaved upload from this session is now unreferenced.
    if (superseded && superseded !== chosen) await discardUnsavedUpload(superseded, prefix);
  };

  const clear = async () => {
    const superseded = pendingRef.current;
    pendingRef.current = null;
    setUrl(null);
    setUploadError(null);
    if (inputRef.current) inputRef.current.value = "";

    // Only discard what this session uploaded. The image already saved on the
    // row is removed by the Server Action, after the row update succeeds.
    if (superseded) await discardUnsavedUpload(superseded, prefix);
  };

  const message = uploadError ? t(UPLOAD_ERROR_KEYS[uploadError]) : errorMessage;
  const removedSavedImage = Boolean(savedUrl) && url === null;

  return (
    <div className="admin-field">
      <label htmlFor={name}>{t("upload.label")}</label>

      {isUploading ? (
        <p className="admin-upload__status" role="status">
          <Loader2 aria-hidden="true" className="admin-upload__spinner" />
          {t("upload.uploading")}
        </p>
      ) : null}

      {url ? (
        <div className="admin-upload__preview" data-busy={isUploading ? "true" : undefined}>
          <span
            className="admin-thumb admin-thumb--tile"
            role="img"
            aria-label={t("upload.previewAlt")}
            style={{ backgroundImage: `url("${cssUrlFor(url) ?? ""}")` }}
          />

          <div className="admin-upload__preview-actions">
            <button
              type="button"
              className="admin-button admin-button--ghost admin-button--small"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload aria-hidden="true" />
              <span>{t("upload.replace")}</span>
            </button>
            <button
              type="button"
              className="admin-button admin-button--ghost admin-button--small"
              onClick={() => setIsPickerOpen(true)}
              disabled={isUploading}
            >
              <Images aria-hidden="true" />
              <span>{t("upload.reuse")}</span>
            </button>
            <button
              type="button"
              className="admin-button admin-button--ghost admin-button--small"
              onClick={clear}
              disabled={isUploading}
            >
              <X aria-hidden="true" />
              <span>{t("upload.remove")}</span>
            </button>
          </div>
        </div>
      ) : (
        <div
          className="admin-upload"
          data-dragging={isDragging ? "true" : undefined}
          data-busy={isUploading ? "true" : undefined}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            void handleFile(event.dataTransfer.files?.[0]);
          }}
        >
          <ImageIcon aria-hidden="true" />
          <p className="admin-upload__title">{t("upload.drop")}</p>
          <p className="admin-upload__hint">{t("upload.hint")}</p>
          <div className="admin-upload__actions">
            <button
              type="button"
              className="admin-button admin-button--ghost admin-button--small"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
            >
              {t("upload.choose")}
            </button>
            <button
              type="button"
              className="admin-button admin-button--ghost admin-button--small"
              onClick={() => setIsPickerOpen(true)}
              disabled={isUploading}
            >
              <Images aria-hidden="true" />
              <span>{t("upload.reuse")}</span>
            </button>
          </div>
        </div>
      )}

      {/*
        The file input is never submitted: it has no `name`, so the binary stays
        out of the form payload entirely. Only the URL below travels to the
        Server Action.
      */}
      <input
        ref={inputRef}
        id={name}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="admin-upload__input"
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />

      <input type="hidden" name={name} value={url ?? ""} />
      {removedSavedImage ? <input type="hidden" name="remove_image" value="on" /> : null}

      {message ? (
        <p className="admin-field__error" role="alert">
          {message}
        </p>
      ) : null}

      <AssetPicker
        open={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={(chosen) => void chooseExisting(chosen)}
      />
    </div>
  );
}
