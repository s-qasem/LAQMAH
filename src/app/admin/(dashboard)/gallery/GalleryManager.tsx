"use client";

import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

import {
  AdminDrawer,
  AdminModal,
  AdminThumb,
  ImageUploader,
  TextField,
  ToggleField,
  useAdminLanguage,
} from "@/components/admin";
import type { AdminTranslationKey } from "@/data/admin-i18n";
import type { GalleryImage } from "@/lib/supabase/site-content";

import {
  createGalleryImageAction,
  deleteGalleryImageAction,
  moveGalleryImageAction,
  setGalleryVisibilityAction,
  updateGalleryImageAction,
  type GalleryErrorCode,
  type GalleryErrors,
} from "./actions";

const ERROR_KEYS: Record<GalleryErrorCode, AdminTranslationKey> = {
  altRequired: "gallery.error.altRequired",
  categoryRequired: "gallery.error.categoryRequired",
  imageRequired: "gallery.error.imageRequired",
  imageInvalid: "gallery.error.imageInvalid",
  duplicate: "gallery.error.duplicate",
  save: "gallery.error.save",
  delete: "gallery.error.delete",
  notAuthorized: "gallery.error.notAuthorized",
  notFound: "gallery.error.notFound",
};

const FORM_ID = "gallery-form";

type Dialog =
  | { mode: "create" }
  | { mode: "edit"; image: GalleryImage }
  | { mode: "delete"; image: GalleryImage }
  | null;

/**
 * Gallery management, backed by `gallery_images`.
 *
 * Seeded rows point at `/public` bundle paths and uploaded rows at Storage
 * URLs; both render through the same resolver, and the delete helpers refuse
 * anything outside the `gallery/` Storage prefix.
 */
export function GalleryManager({ images }: { images: GalleryImage[] }) {
  const { t, localized } = useAdminLanguage();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [errors, setErrors] = useState<GalleryErrors>({});
  const [rowError, setRowError] = useState<GalleryErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();

  const editing = dialog?.mode === "edit" ? dialog.image : null;
  const isEditorOpen = dialog?.mode === "create" || dialog?.mode === "edit";

  const closeDialog = () => {
    setDialog(null);
    setErrors({});
  };

  const openDialog = (next: Dialog) => {
    setErrors({});
    setRowError(null);
    setDialog(next);
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = editing
        ? await updateGalleryImageAction(editing.id, formData)
        : await createGalleryImageAction(formData);

      if (result.status === "error") {
        setErrors(result.errors);
        return;
      }

      closeDialog();
    });
  };

  const runRowAction = (action: () => Promise<{ status: string; errors?: GalleryErrors }>) => {
    setRowError(null);

    startTransition(async () => {
      const result = await action();

      if (result.status === "error") {
        setRowError(result.errors?.form ?? "save");
        return;
      }

      closeDialog();
    });
  };

  const fieldError = (field: keyof GalleryErrors) => {
    const code = errors[field];
    return code ? t(ERROR_KEYS[code]) : null;
  };

  const nextOrder = images.reduce((highest, image) => Math.max(highest, image.displayOrder), 0) + 1;

  return (
    <>
      <div className="admin-toolbar">
        <p className="admin-toolbar__count" />
        <button
          type="button"
          className="admin-button admin-button--primary"
          onClick={() => openDialog({ mode: "create" })}
        >
          <Plus aria-hidden="true" />
          <span>{t("gallery.add")}</span>
        </button>
      </div>

      {rowError ? (
        <p className="admin-form__error" role="alert">
          {t(ERROR_KEYS[rowError])}
        </p>
      ) : null}

      {images.length === 0 ? (
        <div className="admin-emptystate">
          <span className="admin-emptystate__mark" aria-hidden="true">
            LQMAH
          </span>
          <p className="admin-emptystate__text">{t("gallery.emptyReal")}</p>
          <button
            type="button"
            className="admin-button admin-button--primary"
            onClick={() => openDialog({ mode: "create" })}
          >
            <Plus aria-hidden="true" />
            <span>{t("gallery.add")}</span>
          </button>
        </div>
      ) : (
        <ul className="admin-grid">
          {images.map((image, index) => (
            <li key={image.id} className={`admin-tile${image.isVisible ? "" : " admin-tile--hidden"}`}>
              <AdminThumb url={image.imageUrl} label={localized(image.altEn, image.altAr)} />

              <div className="admin-tile__body">
                <p className="admin-tile__name">{localized(image.altEn, image.altAr)}</p>
                <p className="admin-tile__meta">{image.category}</p>
                <p className="admin-tile__order">{t("gallery.position", { order: image.displayOrder })}</p>
              </div>

              <div className="admin-tile__actions">
                <div className="admin-row-actions">
                  <button
                    type="button"
                    className="admin-icon-button"
                    disabled={isPending || index === 0}
                    onClick={() => runRowAction(() => moveGalleryImageAction(image.id, "up"))}
                    aria-label={t("common.moveUpAria", { subject: localized(image.altEn, image.altAr) })}
                    title={t("common.moveUp")}
                  >
                    <ArrowUp aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="admin-icon-button"
                    disabled={isPending || index === images.length - 1}
                    onClick={() => runRowAction(() => moveGalleryImageAction(image.id, "down"))}
                    aria-label={t("common.moveDownAria", { subject: localized(image.altEn, image.altAr) })}
                    title={t("common.moveDown")}
                  >
                    <ArrowDown aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="admin-icon-button"
                    disabled={isPending}
                    onClick={() => runRowAction(() => setGalleryVisibilityAction(image.id, !image.isVisible))}
                    aria-pressed={!image.isVisible}
                    aria-label={t(image.isVisible ? "common.hideAria" : "common.showAria", {
                      subject: localized(image.altEn, image.altAr),
                    })}
                    title={t(image.isVisible ? "common.hideTitle" : "common.showTitle")}
                  >
                    {image.isVisible ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}
                  </button>
                  <button
                    type="button"
                    className="admin-icon-button"
                    onClick={() => openDialog({ mode: "edit", image })}
                    aria-label={t("common.edit", { subject: localized(image.altEn, image.altAr) })}
                    title={t("common.edit", { subject: localized(image.altEn, image.altAr) })}
                  >
                    <Pencil aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="admin-icon-button admin-icon-button--danger"
                    disabled={isPending}
                    onClick={() => openDialog({ mode: "delete", image })}
                    aria-label={t("common.delete", { subject: localized(image.altEn, image.altAr) })}
                    title={t("common.delete", { subject: localized(image.altEn, image.altAr) })}
                  >
                    <Trash2 aria-hidden="true" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AdminDrawer
        open={isEditorOpen}
        onClose={closeDialog}
        eyebrow={t("page.eyebrow.content")}
        title={editing ? t("gallery.editor.edit") : t("gallery.editor.add")}
        footer={
          <>
            <button type="button" className="admin-button admin-button--ghost" onClick={closeDialog} disabled={isPending}>
              {t("common.cancel")}
            </button>
            <button type="submit" form={FORM_ID} className="admin-button admin-button--primary" disabled={isPending}>
              {isPending ? t("common.saving") : t("gallery.save")}
            </button>
          </>
        }
      >
        <form id={FORM_ID} className="admin-form" onSubmit={submit} noValidate>
          {fieldError("form") ? (
            <p className="admin-form__error" role="alert">
              {fieldError("form")}
            </p>
          ) : null}

          <ImageUploader
            name="image_url"
            prefix="gallery"
            folder=""
            currentUrl={editing?.imageUrl}
            errorMessage={fieldError("image")}
          />

          <TextField
            id="gallery-category"
            name="category"
            labelKey="gallery.field.category"
            hintKey="gallery.field.categoryHint"
            placeholder="Interior"
            defaultValue={editing?.category}
            errorMessage={fieldError("category")}
          />

          <TextField
            id="gallery-alt-en"
            name="alt_en"
            labelKey="gallery.field.altEn"
            defaultValue={editing?.altEn}
            errorMessage={fieldError("altEn")}
          />

          <TextField
            id="gallery-alt-ar"
            name="alt_ar"
            labelKey="gallery.field.altAr"
            defaultValue={editing?.altAr ?? ""}
            lang="ar"
            dir="rtl"
            optional
          />

          <ToggleField
            id="gallery-visible"
            name="is_visible"
            labelKey="reviews.field.visible"
            defaultChecked={editing ? editing.isVisible : true}
          />

          {editing ? <input type="hidden" name="slug" value={editing.slug} /> : null}
          {editing?.imageUrl ? <input type="hidden" name="current_image_url" value={editing.imageUrl} /> : null}
          <input type="hidden" name="display_order" value={editing?.displayOrder ?? nextOrder} />
        </form>
      </AdminDrawer>

      <AdminModal
        open={dialog?.mode === "delete"}
        onClose={closeDialog}
        title={t("gallery.delete.title")}
        description={
          dialog?.mode === "delete"
            ? t("gallery.delete.description", { name: localized(dialog.image.altEn, dialog.image.altAr) })
            : undefined
        }
        footer={
          <>
            <button type="button" className="admin-button admin-button--ghost" onClick={closeDialog} disabled={isPending}>
              {t("common.cancel")}
            </button>
            <button
              type="button"
              className="admin-button admin-button--danger"
              disabled={isPending}
              onClick={() =>
                dialog?.mode === "delete" ? runRowAction(() => deleteGalleryImageAction(dialog.image.id)) : undefined
              }
            >
              {isPending ? t("common.deleting") : t("gallery.delete.confirm")}
            </button>
          </>
        }
      >
        {rowError ? (
          <p className="admin-form__error" role="alert">
            {t(ERROR_KEYS[rowError])}
          </p>
        ) : null}
      </AdminModal>
    </>
  );
}
