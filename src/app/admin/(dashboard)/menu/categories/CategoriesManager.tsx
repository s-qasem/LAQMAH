"use client";

import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
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
import type { CategoryErrorCode, CategoryErrors, MenuCategory } from "@/lib/supabase/menu-categories";

import {
  createCategoryAction,
  deleteCategoryAction,
  moveCategoryAction,
  setCategoryActiveAction,
  updateCategoryAction,
} from "./actions";

/** Server-side error codes mapped to the bilingual interface strings. */
const ERROR_KEYS: Record<CategoryErrorCode, AdminTranslationKey> = {
  nameEnRequired: "categories.error.nameEnRequired",
  nameArRequired: "categories.error.nameArRequired",
  slugRequired: "categories.error.slugRequired",
  slugFormat: "categories.error.slugFormat",
  slugFromName: "categories.error.slugFromName",
  duplicateName: "categories.error.duplicateName",
  orderNumeric: "categories.error.orderNumeric",
  orderRange: "categories.error.orderRange",
  slugDuplicate: "categories.error.slugDuplicate",
  imageUrl: "categories.error.imageUrl",
  imageType: "categories.error.imageType",
  imageSize: "categories.error.imageSize",
  imageUpload: "categories.error.imageUpload",
  deleteHasProducts: "categories.error.deleteHasProducts",
  save: "categories.error.save",
  delete: "categories.error.delete",
  deleteBlocked: "categories.error.deleteBlocked",
  notAuthorized: "categories.error.notAuthorized",
  notFound: "categories.error.notFound",
};

const FORM_ID = "category-form";

type Dialog =
  | { mode: "create" }
  | { mode: "edit"; category: MenuCategory }
  | { mode: "delete"; category: MenuCategory }
  | null;

/**
 * Categories management, backed by Supabase.
 *
 * Mutations call Server Actions directly inside a transition, so the result is
 * handled where it is returned — the editor closes on success and field errors
 * render in place. Each action revalidates the route, so the cards below are
 * re-rendered from the database rather than from local state.
 */
type CategoriesManagerProps = {
  categories: MenuCategory[];
  /** Real product counts keyed by category id; empty until products are seeded. */
  productCounts: Record<string, number>;
};

export function CategoriesManager({ categories, productCounts }: CategoriesManagerProps) {
  const { t, localized, alternate, isArabic } = useAdminLanguage();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [errors, setErrors] = useState<CategoryErrors>({});
  const [rowError, setRowError] = useState<CategoryErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();

  const editing = dialog?.mode === "edit" ? dialog.category : null;
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

  const submitForm = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = editing
        ? await updateCategoryAction(editing.id, formData)
        : await createCategoryAction(formData);

      if (result.status === "error") {
        setErrors(result.errors);
        return;
      }

      closeDialog();
    });
  };

  const runRowAction = (action: () => Promise<{ status: string; errors?: CategoryErrors }>) => {
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

  const fieldError = (field: keyof CategoryErrors) => {
    const code = errors[field];
    return code ? t(ERROR_KEYS[code]) : null;
  };

  const formError = fieldError("form");

  /** New categories are placed after the last existing one. */
  const nextDisplayOrder =
    categories.reduce((highest, category) => Math.max(highest, category.displayOrder), 0) + 1;

  return (
    <>
      <div className="admin-toolbar">
        <p className="admin-toolbar__count">
          {categories.length > 0 ? t("categories.caption") : null}
        </p>

        <button
          type="button"
          className="admin-button admin-button--primary"
          onClick={() => openDialog({ mode: "create" })}
        >
          <Plus aria-hidden="true" />
          <span>{t("categories.add")}</span>
        </button>
      </div>

      {rowError ? (
        <p className="admin-form__error" role="alert">
          {t(ERROR_KEYS[rowError])}
        </p>
      ) : null}

      {categories.length === 0 ? (
        <div className="admin-emptystate">
          <span className="admin-emptystate__mark" aria-hidden="true">
            LQMAH
          </span>
          <p className="admin-emptystate__text">{t("categories.empty")}</p>
          <button
            type="button"
            className="admin-button admin-button--primary"
            onClick={() => openDialog({ mode: "create" })}
          >
            <Plus aria-hidden="true" />
            <span>{t("categories.add")}</span>
          </button>
        </div>
      ) : (
        <ul className="admin-catgrid">
          {categories.map((category, index) => (
            <li key={category.id} className={`admin-cat${category.isActive ? "" : " admin-cat--hidden"}`}>
              <AdminThumb url={category.imageUrl} label={localized(category.nameEn, category.nameAr)} />

              <div className="admin-cat__body">
                <p className="admin-cat__index" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </p>

                <h3 className="admin-cat__name">
                  <Link
                    href={`/admin/menu/categories/${category.slug}`}
                    title={t("categories.open", { name: localized(category.nameEn, category.nameAr) })}
                  >
                    {localized(category.nameEn, category.nameAr)}
                  </Link>
                </h3>
                {alternate(category.nameEn, category.nameAr) ? (
                  <p
                    className="admin-cat__name-ar"
                    lang={isArabic ? "en" : "ar"}
                    dir={isArabic ? "ltr" : "rtl"}
                  >
                    {alternate(category.nameEn, category.nameAr)}
                  </p>
                ) : null}

                <p className="admin-cat__meta">
                  <Link className="admin-cat__products" href={`/admin/menu/categories/${category.slug}`}>
                    {t("categories.productCountReal", { count: productCounts[category.id] ?? 0 })}
                  </Link>
                  <button
                    type="button"
                    className="admin-state"
                    data-on={category.isActive ? "true" : undefined}
                    disabled={isPending}
                    onClick={() => runRowAction(() => setCategoryActiveAction(category.id, !category.isActive))}
                    aria-label={t(
                      category.isActive ? "categories.deactivateAria" : "categories.activateAria",
                      { name: localized(category.nameEn, category.nameAr) },
                    )}
                  >
                    <span className="admin-state__dot" aria-hidden="true" />
                    {t(category.isActive ? "categories.live" : "categories.hiddenState")}
                  </button>
                </p>
              </div>

              <div className="admin-cat__actions">
                <button
                  type="button"
                  className="admin-button admin-button--ghost admin-button--small"
                  onClick={() => openDialog({ mode: "edit", category })}
                >
                  <Pencil aria-hidden="true" />
                  <span>{t("homepage.other.edit")}</span>
                </button>

                <div className="admin-row-actions">
                  <button
                    type="button"
                    className="admin-icon-button"
                    disabled={isPending || index === 0}
                    onClick={() => runRowAction(() => moveCategoryAction(category.id, "up"))}
                    aria-label={t("common.moveUpAria", { subject: localized(category.nameEn, category.nameAr) })}
                    title={t("common.moveUp")}
                  >
                    <ArrowUp aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="admin-icon-button"
                    disabled={isPending || index === categories.length - 1}
                    onClick={() => runRowAction(() => moveCategoryAction(category.id, "down"))}
                    aria-label={t("common.moveDownAria", { subject: localized(category.nameEn, category.nameAr) })}
                    title={t("common.moveDown")}
                  >
                    <ArrowDown aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="admin-icon-button admin-icon-button--danger"
                    disabled={isPending}
                    onClick={() => openDialog({ mode: "delete", category })}
                    aria-label={t("common.delete", { subject: localized(category.nameEn, category.nameAr) })}
                    title={t("common.delete", { subject: localized(category.nameEn, category.nameAr) })}
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
        eyebrow={t("page.eyebrow.menu")}
        title={
          editing
            ? t("categories.form.editTitle", { name: localized(editing.nameEn, editing.nameAr) })
            : t("categories.form.addTitle")
        }
        footer={
          <>
            <button type="button" className="admin-button admin-button--ghost" onClick={closeDialog} disabled={isPending}>
              {t("common.cancel")}
            </button>
            <button type="submit" form={FORM_ID} className="admin-button admin-button--primary" disabled={isPending}>
              {isPending ? t("common.saving") : t("categories.save")}
            </button>
          </>
        }
      >
        <form id={FORM_ID} className="admin-form" onSubmit={submitForm} noValidate>
          {formError ? (
            <p className="admin-form__error" role="alert">
              {formError}
            </p>
          ) : null}

          <ImageUploader
            name="image_url"
            folder="categories"
            currentUrl={editing?.imageUrl}
            errorMessage={fieldError("imageUrl")}
          />

          <TextField
            id="category-name-en"
            name="name_en"
            labelKey="categories.field.nameEn"
            placeholder="Hot Drinks"
            defaultValue={editing?.nameEn}
            errorMessage={fieldError("nameEn")}
          />

          <TextField
            id="category-name-ar"
            name="name_ar"
            labelKey="categories.field.nameAr"
            placeholder="مشروبات ساخنة"
            defaultValue={editing?.nameAr}
            lang="ar"
            dir="rtl"
            errorMessage={fieldError("nameAr")}
          />

          <ToggleField
            id="category-active"
            name="is_active"
            labelKey="categories.field.active"
            descriptionKey="categories.field.activeHint"
            defaultChecked={editing ? editing.isActive : true}
          />

          {/* Technical columns the owner never edits. The slug is derived from the
              English name; an existing slug and image are preserved so editing can
              never change a public URL or drop an image by accident. New categories
              are placed after the last existing one. */}
          {editing ? <input type="hidden" name="slug" value={editing.slug} /> : null}
          {editing?.imageUrl ? <input type="hidden" name="current_image_url" value={editing.imageUrl} /> : null}
          <input
            type="hidden"
            name="display_order"
            value={editing?.displayOrder ?? nextDisplayOrder}
          />
        </form>
      </AdminDrawer>

      <AdminModal
        open={dialog?.mode === "delete"}
        onClose={closeDialog}
        title={t("categories.delete.title")}
        description={
          dialog?.mode === "delete"
            ? t("categories.delete.description", { name: localized(dialog.category.nameEn, dialog.category.nameAr) })
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
                dialog?.mode === "delete"
                  ? runRowAction(() => deleteCategoryAction(dialog.category.id))
                  : undefined
              }
            >
              {isPending ? t("common.deleting") : t("categories.delete.confirm")}
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
