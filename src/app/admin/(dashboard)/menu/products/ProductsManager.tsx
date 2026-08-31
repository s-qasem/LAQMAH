"use client";

import { ArrowDown, ArrowUp, Pencil, Plus, Search, Sparkles, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

import {
  AdminDrawer,
  AdminModal,
  AdminThumb,
  ImageUploader,
  TextAreaField,
  TextField,
  ToggleField,
  useAdminLanguage,
} from "@/components/admin";
import type { AdminTranslationKey } from "@/data/admin-i18n";
import type { MenuCategory } from "@/lib/supabase/menu-categories";
import type { MenuProductRecord, ProductErrorCode, ProductErrors } from "@/lib/supabase/menu-products";

import {
  createProductAction,
  deleteProductAction,
  moveProductAction,
  setProductFlagAction,
  updateProductAction,
} from "./actions";

const ERROR_KEYS: Record<ProductErrorCode, AdminTranslationKey> = {
  nameEnRequired: "products.error.nameEnRequired",
  slugFromName: "products.error.slugFromName",
  categoryRequired: "products.error.categoryRequired",
  priceNumeric: "products.error.priceNumeric",
  priceNegative: "products.error.priceNegative",
  duplicateName: "products.error.duplicateName",
  imageType: "products.error.imageType",
  imageSize: "products.error.imageSize",
  imageUpload: "products.error.imageUpload",
  imageUrl: "products.error.imageUrl",
  save: "products.error.save",
  delete: "products.error.delete",
  notAuthorized: "products.error.notAuthorized",
  notFound: "products.error.notFound",
};

const FORM_ID = "product-form";
const ALL = "__all__";

type Dialog =
  | { mode: "create" }
  | { mode: "edit"; product: MenuProductRecord }
  | { mode: "delete"; product: MenuProductRecord }
  | null;

type ProductsManagerProps = {
  products: MenuProductRecord[];
  categories: MenuCategory[];
  /**
   * When set, the screen is scoped to one category: the category filter is
   * hidden and new products are pre-assigned to it.
   */
  scopedCategory?: MenuCategory;
};

/**
 * Products management, backed by Supabase.
 *
 * Shared by the global Products screen and the per-category drill-down, so both
 * views read and write exactly the same rows.
 */
export function ProductsManager({ products, categories, scopedCategory }: ProductsManagerProps) {
  const { t, localized, alternate, isArabic } = useAdminLanguage();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [errors, setErrors] = useState<ProductErrors>({});
  const [rowError, setRowError] = useState<ProductErrorCode | null>(null);
  const [categoryFilter, setCategoryFilter] = useState(ALL);
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const editing = dialog?.mode === "edit" ? dialog.product : null;
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
        ? await updateProductAction(editing.id, formData)
        : await createProductAction(formData);

      if (result.status === "error") {
        setErrors(result.errors);
        return;
      }

      closeDialog();
    });
  };

  const runRowAction = (action: () => Promise<{ status: string; errors?: ProductErrors }>) => {
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

  const fieldError = (field: keyof ProductErrors) => {
    const code = errors[field];
    return code ? t(ERROR_KEYS[code]) : null;
  };

  const formError = fieldError("form");

  const visible = products.filter((product) => {
    const matchesCategory = scopedCategory
      ? true
      : categoryFilter === ALL || product.categoryId === categoryFilter;
    const matchesStatus =
      statusFilter === ALL || (statusFilter === "available" ? product.isAvailable : !product.isAvailable);
    const needle = query.trim().toLowerCase();
    const matchesQuery =
      !needle ||
      product.nameEn.toLowerCase().includes(needle) ||
      (product.nameAr ?? "").includes(query.trim());

    return matchesCategory && matchesStatus && matchesQuery;
  });

  const defaultCategoryId = scopedCategory?.id ?? editing?.categoryId ?? categories[0]?.id ?? "";
  const nextOrder = products.reduce((highest, p) => Math.max(highest, p.displayOrder), 0) + 1;

  return (
    <>
      <div className="admin-toolbar admin-toolbar--filters">
        <label className="admin-search" htmlFor="product-search">
          <Search aria-hidden="true" />
          <span className="admin-visually-hidden">{t("products.subtitleSearch")}</span>
          <input
            id="product-search"
            type="search"
            value={query}
            placeholder={t("products.subtitleSearch")}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        {scopedCategory ? null : (
          <label className="admin-inline-field" htmlFor="product-filter">
            <span>{t("products.filter")}</span>
            <select
              id="product-filter"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value={ALL}>{t("products.filter.all")}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {localized(category.nameEn, category.nameAr)}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="admin-inline-field" htmlFor="product-status">
          <span>{t("products.status")}</span>
          <select id="product-status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value={ALL}>{t("products.status.all")}</option>
            <option value="available">{t("common.available")}</option>
            <option value="unavailable">{t("common.unavailable")}</option>
          </select>
        </label>

        <button
          type="button"
          className="admin-button admin-button--primary"
          onClick={() => openDialog({ mode: "create" })}
          disabled={categories.length === 0}
        >
          <Plus aria-hidden="true" />
          <span>{t("products.add")}</span>
        </button>
      </div>

      {rowError ? (
        <p className="admin-form__error" role="alert">
          {t(ERROR_KEYS[rowError])}
        </p>
      ) : null}

      {products.length === 0 ? (
        <div className="admin-emptystate">
          <span className="admin-emptystate__mark" aria-hidden="true">
            LQMAH
          </span>
          <p className="admin-emptystate__text">
            {scopedCategory
              ? t("products.emptyCategory", { name: localized(scopedCategory.nameEn, scopedCategory.nameAr) })
              : t("products.emptyAll")}
          </p>
          <button
            type="button"
            className="admin-button admin-button--primary"
            onClick={() => openDialog({ mode: "create" })}
            disabled={categories.length === 0}
          >
            <Plus aria-hidden="true" />
            <span>{t("products.addFirst")}</span>
          </button>
        </div>
      ) : visible.length === 0 ? (
        <p className="admin-empty">{t("products.noResults")}</p>
      ) : (
        <ul className="admin-productlist">
          {visible.map((product, index) => (
            <li key={product.id} className={`admin-product${product.isAvailable ? "" : " admin-product--off"}`}>
              <AdminThumb url={product.imageUrl} label={localized(product.nameEn, product.nameAr)} variant="row" />

              <div className="admin-product__identity">
                <h3 className="admin-product__name">{localized(product.nameEn, product.nameAr)}</h3>
                {alternate(product.nameEn, product.nameAr) ? (
                  <p
                    className="admin-product__name-ar"
                    lang={isArabic ? "en" : "ar"}
                    dir={isArabic ? "ltr" : "rtl"}
                  >
                    {alternate(product.nameEn, product.nameAr)}
                  </p>
                ) : null}
                <p className="admin-product__category">
                  {localized(product.categoryNameEn, product.categoryNameAr)}
                </p>
              </div>

              <p className="admin-product__price">
                {product.price ?? <span className="admin-product__price-unset">{t("products.priceUnset")}</span>}
              </p>

              <div className="admin-product__flags">
                <button
                  type="button"
                  className="admin-state"
                  data-on={product.isAvailable ? "true" : undefined}
                  disabled={isPending}
                  onClick={() =>
                    runRowAction(() => setProductFlagAction(product.id, "is_available", !product.isAvailable))
                  }
                  aria-label={t(product.isAvailable ? "common.hideAria" : "common.showAria", {
                    subject: localized(product.nameEn, product.nameAr),
                  })}
                >
                  <span className="admin-state__dot" aria-hidden="true" />
                  {t(product.isAvailable ? "common.available" : "common.unavailable")}
                </button>

                <button
                  type="button"
                  className={`admin-state${product.isFeatured ? " admin-state--accent" : ""}`}
                  disabled={isPending}
                  onClick={() =>
                    runRowAction(() => setProductFlagAction(product.id, "is_featured", !product.isFeatured))
                  }
                  aria-pressed={product.isFeatured}
                  aria-label={t("common.featured")}
                >
                  <Sparkles aria-hidden="true" />
                  {t("common.featured")}
                </button>
              </div>

              <div className="admin-product__actions">
                <button
                  type="button"
                  className="admin-icon-button"
                  disabled={isPending || index === 0}
                  onClick={() => runRowAction(() => moveProductAction(product.id, product.categoryId, "up"))}
                  aria-label={t("common.moveUpAria", { subject: localized(product.nameEn, product.nameAr) })}
                  title={t("common.moveUp")}
                >
                  <ArrowUp aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="admin-icon-button"
                  disabled={isPending || index === visible.length - 1}
                  onClick={() => runRowAction(() => moveProductAction(product.id, product.categoryId, "down"))}
                  aria-label={t("common.moveDownAria", { subject: localized(product.nameEn, product.nameAr) })}
                  title={t("common.moveDown")}
                >
                  <ArrowDown aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="admin-button admin-button--ghost admin-button--small"
                  onClick={() => openDialog({ mode: "edit", product })}
                >
                  <Pencil aria-hidden="true" />
                  <span>{t("homepage.other.edit")}</span>
                </button>
                <button
                  type="button"
                  className="admin-icon-button admin-icon-button--danger"
                  disabled={isPending}
                  onClick={() => openDialog({ mode: "delete", product })}
                  aria-label={t("common.delete", { subject: localized(product.nameEn, product.nameAr) })}
                  title={t("common.delete", { subject: localized(product.nameEn, product.nameAr) })}
                >
                  <Trash2 aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AdminDrawer
        open={isEditorOpen}
        onClose={closeDialog}
        eyebrow={t("page.eyebrow.menu")}
        title={editing ? t("products.editor.edit") : t("products.editor.add")}
        footer={
          <>
            <button type="button" className="admin-button admin-button--ghost" onClick={closeDialog} disabled={isPending}>
              {t("common.cancel")}
            </button>
            <button type="submit" form={FORM_ID} className="admin-button admin-button--primary" disabled={isPending}>
              {isPending ? t("common.saving") : t("products.save")}
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
            folder="products"
            currentUrl={editing?.imageUrl}
            errorMessage={fieldError("image")}
          />

          <TextField
            id="product-name-en"
            name="name_en"
            labelKey="products.field.nameEn"
            placeholder="Spanish Latte"
            defaultValue={editing?.nameEn}
            errorMessage={fieldError("nameEn")}
          />

          <TextField
            id="product-name-ar"
            name="name_ar"
            labelKey="products.field.nameAr"
            defaultValue={editing?.nameAr ?? ""}
            lang="ar"
            dir="rtl"
            optional
          />

          <TextAreaField
            id="product-description-en"
            name="description_en"
            labelKey="products.field.descriptionEn"
            defaultValue={editing?.descriptionEn ?? ""}
            optional
          />

          <TextAreaField
            id="product-description-ar"
            name="description_ar"
            labelKey="products.field.descriptionAr"
            defaultValue={editing?.descriptionAr ?? ""}
            lang="ar"
            dir="rtl"
            optional
          />

          <div className="admin-form__grid">
            <div className="admin-field">
              <label htmlFor="product-category">{t("products.field.category")}</label>
              <select id="product-category" name="category_id" defaultValue={defaultCategoryId}>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {localized(category.nameEn, category.nameAr)}
                  </option>
                ))}
              </select>
              {fieldError("categoryId") ? (
                <p className="admin-field__error" role="alert">
                  {fieldError("categoryId")}
                </p>
              ) : null}
            </div>

            <TextField
              id="product-price"
              name="price"
              labelKey="products.field.price"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="5.50"
              defaultValue={editing?.price ?? ""}
              hintKey="products.field.priceHint"
              optional
              errorMessage={fieldError("price")}
            />
          </div>

          <div className="admin-form__toggles">
            <ToggleField
              id="product-available"
              name="is_available"
              labelKey="products.field.available"
              descriptionKey="products.field.availableHint"
              defaultChecked={editing ? editing.isAvailable : true}
            />
            <ToggleField
              id="product-featured"
              name="is_featured"
              labelKey="products.field.featured"
              descriptionKey="products.field.featuredHint"
              defaultChecked={editing ? editing.isFeatured : false}
            />
          </div>

          {/* Internal columns the owner never edits. */}
          {editing ? <input type="hidden" name="slug" value={editing.slug} /> : null}
          {editing?.imageUrl ? <input type="hidden" name="current_image_url" value={editing.imageUrl} /> : null}
          <input type="hidden" name="display_order" value={editing?.displayOrder ?? nextOrder} />
        </form>
      </AdminDrawer>

      <AdminModal
        open={dialog?.mode === "delete"}
        onClose={closeDialog}
        title={
          dialog?.mode === "delete"
            ? t("products.delete.confirmTitle", { name: localized(dialog.product.nameEn, dialog.product.nameAr) })
            : ""
        }
        description={t("products.delete.confirmBody")}
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
                dialog?.mode === "delete" ? runRowAction(() => deleteProductAction(dialog.product.id)) : undefined
              }
            >
              {isPending ? t("common.deleting") : t("products.delete.confirm")}
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
