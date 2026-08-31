"use client";

import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

import {
  AdminDrawer,
  AdminModal,
  SelectField,
  StatusPill,
  TextAreaField,
  TextField,
  ToggleField,
  useAdminLanguage,
} from "@/components/admin";
import type { AdminTranslationKey } from "@/data/admin-i18n";
import type { SiteReview } from "@/lib/supabase/site-content";

import {
  createReviewAction,
  deleteReviewAction,
  moveReviewAction,
  setReviewVisibilityAction,
  updateReviewAction,
  type ReviewErrorCode,
  type ReviewErrors,
} from "./actions";

const ERROR_KEYS: Record<ReviewErrorCode, AdminTranslationKey> = {
  nameRequired: "reviews.error.nameRequired",
  textRequired: "reviews.error.textRequired",
  ratingRange: "reviews.error.ratingRange",
  duplicate: "reviews.error.duplicate",
  save: "reviews.error.save",
  delete: "reviews.error.delete",
  notAuthorized: "reviews.error.notAuthorized",
  notFound: "reviews.error.notFound",
};

const FORM_ID = "review-form";
const RATING_OPTIONS = ["5", "4", "3", "2", "1"] as const;
const SOURCE_OPTIONS = ["Google Review", "Instagram", "TikTok", "In store", "Other"] as const;

type Dialog =
  | { mode: "create" }
  | { mode: "edit"; review: SiteReview }
  | { mode: "delete"; review: SiteReview }
  | null;

/** Star readout. Decorative stars carry an accessible text equivalent. */
function Rating({ value, label }: { value: number; label: string }) {
  return (
    <span className="admin-rating">
      <span className="admin-rating__stars" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (
          <Star key={index} className={index < value ? "is-filled" : undefined} />
        ))}
      </span>
      <span className="admin-rating__text">{label}</span>
    </span>
  );
}

/** Reviews management, backed by `site_reviews`. */
export function ReviewsManager({ reviews }: { reviews: SiteReview[] }) {
  const { t, localized } = useAdminLanguage();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [errors, setErrors] = useState<ReviewErrors>({});
  const [rowError, setRowError] = useState<ReviewErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();

  const editing = dialog?.mode === "edit" ? dialog.review : null;
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
        ? await updateReviewAction(editing.id, formData)
        : await createReviewAction(formData);

      if (result.status === "error") {
        setErrors(result.errors);
        return;
      }

      closeDialog();
    });
  };

  const runRowAction = (action: () => Promise<{ status: string; errors?: ReviewErrors }>) => {
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

  const fieldError = (field: keyof ReviewErrors) => {
    const code = errors[field];
    return code ? t(ERROR_KEYS[code]) : null;
  };

  const nextOrder = reviews.reduce((highest, review) => Math.max(highest, review.displayOrder), 0) + 1;

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
          <span>{t("reviews.add")}</span>
        </button>
      </div>

      {rowError ? (
        <p className="admin-form__error" role="alert">
          {t(ERROR_KEYS[rowError])}
        </p>
      ) : null}

      {reviews.length === 0 ? (
        <div className="admin-emptystate">
          <span className="admin-emptystate__mark" aria-hidden="true">
            LQMAH
          </span>
          <p className="admin-emptystate__text">{t("reviews.emptyReal")}</p>
          <button
            type="button"
            className="admin-button admin-button--primary"
            onClick={() => openDialog({ mode: "create" })}
          >
            <Plus aria-hidden="true" />
            <span>{t("reviews.add")}</span>
          </button>
        </div>
      ) : (
        <ul className="admin-list-cards">
          {reviews.map((review, index) => (
            <li key={review.id} className={`admin-review${review.isVisible ? "" : " admin-review--hidden"}`}>
              <div className="admin-review__head">
                <div>
                  {/* A person's name is never translated. */}
                  <p className="admin-review__name">{review.reviewerName}</p>
                  <Rating value={review.rating} label={t("reviews.rating", { value: review.rating })} />
                </div>

                <div className="admin-row-actions">
                  <button
                    type="button"
                    className="admin-icon-button"
                    disabled={isPending || index === 0}
                    onClick={() => runRowAction(() => moveReviewAction(review.id, "up"))}
                    aria-label={t("common.moveUpAria", { subject: review.reviewerName })}
                    title={t("common.moveUp")}
                  >
                    <ArrowUp aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="admin-icon-button"
                    disabled={isPending || index === reviews.length - 1}
                    onClick={() => runRowAction(() => moveReviewAction(review.id, "down"))}
                    aria-label={t("common.moveDownAria", { subject: review.reviewerName })}
                    title={t("common.moveDown")}
                  >
                    <ArrowDown aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="admin-icon-button"
                    disabled={isPending}
                    onClick={() => runRowAction(() => setReviewVisibilityAction(review.id, !review.isVisible))}
                    aria-pressed={!review.isVisible}
                    aria-label={t(review.isVisible ? "common.hideAria" : "common.showAria", {
                      subject: review.reviewerName,
                    })}
                    title={t(review.isVisible ? "common.hideTitle" : "common.showTitle")}
                  >
                    {review.isVisible ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}
                  </button>
                  <button
                    type="button"
                    className="admin-icon-button"
                    onClick={() => openDialog({ mode: "edit", review })}
                    aria-label={t("common.edit", { subject: review.reviewerName })}
                    title={t("common.edit", { subject: review.reviewerName })}
                  >
                    <Pencil aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="admin-icon-button admin-icon-button--danger"
                    disabled={isPending}
                    onClick={() => openDialog({ mode: "delete", review })}
                    aria-label={t("common.delete", { subject: review.reviewerName })}
                    title={t("common.delete", { subject: review.reviewerName })}
                  >
                    <Trash2 aria-hidden="true" />
                  </button>
                </div>
              </div>

              <p className="admin-review__text">{localized(review.reviewEn, review.reviewAr)}</p>

              <div className="admin-review__foot">
                {review.source ? <span className="admin-review__source">{review.source}</span> : null}
                {review.reviewedOn ? <span className="admin-review__source">{review.reviewedOn}</span> : null}
                <StatusPill active={review.isVisible} activeKey="common.shown" inactiveKey="common.hidden" />
              </div>
            </li>
          ))}
        </ul>
      )}

      <AdminDrawer
        open={isEditorOpen}
        onClose={closeDialog}
        eyebrow={t("page.eyebrow.content")}
        title={editing ? t("reviews.form.editTitle", { name: editing.reviewerName }) : t("reviews.form.addTitle")}
        footer={
          <>
            <button type="button" className="admin-button admin-button--ghost" onClick={closeDialog} disabled={isPending}>
              {t("common.cancel")}
            </button>
            <button type="submit" form={FORM_ID} className="admin-button admin-button--primary" disabled={isPending}>
              {isPending ? t("common.saving") : t("reviews.save")}
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

          <TextField
            id="review-name"
            name="reviewer_name"
            labelKey="reviews.field.name"
            defaultValue={editing?.reviewerName}
            errorMessage={fieldError("reviewerName")}
          />

          <div className="admin-form__grid">
            <SelectField
              id="review-rating"
              name="rating"
              labelKey="reviews.field.rating"
              options={RATING_OPTIONS}
              defaultValue={editing ? String(editing.rating) : "5"}
            />
            <SelectField
              id="review-source"
              name="source"
              labelKey="reviews.field.source"
              options={SOURCE_OPTIONS}
              defaultValue={editing?.source ?? "Google Review"}
            />
          </div>

          <TextField
            id="review-date"
            name="reviewed_on"
            labelKey="reviews.field.reviewedOn"
            hintKey="reviews.field.reviewedOnHint"
            defaultValue={editing?.reviewedOn ?? ""}
            optional
          />

          <TextAreaField
            id="review-text-en"
            name="review_en"
            labelKey="reviews.field.reviewEn"
            rows={5}
            defaultValue={editing?.reviewEn}
          />
          {fieldError("reviewEn") ? (
            <p className="admin-field__error" role="alert">
              {fieldError("reviewEn")}
            </p>
          ) : null}

          <TextAreaField
            id="review-text-ar"
            name="review_ar"
            labelKey="reviews.field.reviewAr"
            rows={5}
            defaultValue={editing?.reviewAr ?? ""}
            lang="ar"
            dir="rtl"
            optional
          />

          <ToggleField
            id="review-visible"
            name="is_visible"
            labelKey="reviews.field.visible"
            defaultChecked={editing ? editing.isVisible : true}
          />

          {editing ? <input type="hidden" name="slug" value={editing.slug} /> : null}
          <input type="hidden" name="display_order" value={editing?.displayOrder ?? nextOrder} />
        </form>
      </AdminDrawer>

      <AdminModal
        open={dialog?.mode === "delete"}
        onClose={closeDialog}
        title={t("reviews.delete.title")}
        description={
          dialog?.mode === "delete"
            ? t("reviews.delete.description", { name: dialog.review.reviewerName })
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
                dialog?.mode === "delete" ? runRowAction(() => deleteReviewAction(dialog.review.id)) : undefined
              }
            >
              {isPending ? t("common.deleting") : t("reviews.delete.confirm")}
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
