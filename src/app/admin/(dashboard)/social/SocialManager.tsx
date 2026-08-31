"use client";

import { ArrowDown, ArrowUp, Eye, EyeOff, Globe, Pencil, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

import { AdminDrawer, AdminModal, TextField, ToggleField, useAdminLanguage } from "@/components/admin";
import type { AdminTranslationKey } from "@/data/admin-i18n";
import type { SocialLink } from "@/lib/supabase/site-content";

import {
  createSocialLinkAction,
  deleteSocialLinkAction,
  setSocialVisibilityAction,
  updateSocialLinkAction,
  type SocialErrorCode,
  type SocialErrors,
} from "./actions";

const ERROR_KEYS: Record<SocialErrorCode, AdminTranslationKey> = {
  labelRequired: "social.error.labelRequired",
  platformRequired: "social.error.platformRequired",
  url: "social.error.url",
  duplicate: "social.error.duplicate",
  save: "social.error.save",
  delete: "social.error.delete",
  notAuthorized: "social.error.notAuthorized",
  notFound: "social.error.notFound",
};

const FORM_ID = "social-form";

type Dialog =
  | { mode: "create" }
  | { mode: "edit"; link: SocialLink }
  | { mode: "delete"; link: SocialLink }
  | null;

/**
 * Social platform management, backed by `social_links`.
 *
 * Platform names and URLs are identifiers, so neither is translated. A link
 * with no URL stays hidden rather than shipping a dead link.
 */
export function SocialManager({ links }: { links: SocialLink[] }) {
  const { t } = useAdminLanguage();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [errors, setErrors] = useState<SocialErrors>({});
  const [rowError, setRowError] = useState<SocialErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();

  const editing = dialog?.mode === "edit" ? dialog.link : null;
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
        ? await updateSocialLinkAction(editing.id, formData)
        : await createSocialLinkAction(formData);

      if (result.status === "error") {
        setErrors(result.errors);
        return;
      }

      closeDialog();
    });
  };

  const runRowAction = (action: () => Promise<{ status: string; errors?: SocialErrors }>) => {
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

  const fieldError = (field: keyof SocialErrors) => {
    const code = errors[field];
    return code ? t(ERROR_KEYS[code]) : null;
  };

  const nextOrder = links.reduce((highest, link) => Math.max(highest, link.displayOrder), 0) + 1;

  const reorder = (link: SocialLink, direction: -1 | 1) => {
    const sorted = [...links].sort((a, b) => a.displayOrder - b.displayOrder);
    const index = sorted.findIndex((entry) => entry.id === link.id);
    const target = index + direction;
    if (target < 0 || target >= sorted.length) return;

    const swap = sorted[target];
    const formData = new FormData();
    formData.set("platform", link.platform);
    formData.set("label", link.label);
    formData.set("url", link.url ?? "");
    formData.set("display_order", String(swap.displayOrder));
    if (link.isVisible) formData.set("is_visible", "on");

    const other = new FormData();
    other.set("platform", swap.platform);
    other.set("label", swap.label);
    other.set("url", swap.url ?? "");
    other.set("display_order", String(link.displayOrder));
    if (swap.isVisible) other.set("is_visible", "on");

    runRowAction(async () => {
      const first = await updateSocialLinkAction(link.id, formData);
      if (first.status === "error") return first;
      return updateSocialLinkAction(swap.id, other);
    });
  };

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
          <span>{t("social.add")}</span>
        </button>
      </div>

      {rowError ? (
        <p className="admin-form__error" role="alert">
          {t(ERROR_KEYS[rowError])}
        </p>
      ) : null}

      {links.length === 0 ? (
        <p className="admin-empty">{t("social.emptyReal")}</p>
      ) : (
        <ul className="admin-social">
          {links.map((link, index) => (
            <li key={link.id} className="admin-social__row">
              <span className="admin-social__icon" aria-hidden="true">
                <Globe />
              </span>

              <div className="admin-social__field">
                {/* Platform name and URL are identifiers, never translated. */}
                <p className="admin-section-list__name">{link.label}</p>
                <p className="admin-section-list__summary">{link.url ?? t("social.noUrl")}</p>
              </div>

              <div className="admin-row-actions">
                <button
                  type="button"
                  className="admin-icon-button"
                  disabled={isPending || index === 0}
                  onClick={() => reorder(link, -1)}
                  aria-label={t("common.moveUpAria", { subject: link.label })}
                  title={t("common.moveUp")}
                >
                  <ArrowUp aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="admin-icon-button"
                  disabled={isPending || index === links.length - 1}
                  onClick={() => reorder(link, 1)}
                  aria-label={t("common.moveDownAria", { subject: link.label })}
                  title={t("common.moveDown")}
                >
                  <ArrowDown aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="admin-icon-button"
                  disabled={isPending}
                  onClick={() => runRowAction(() => setSocialVisibilityAction(link.id, !link.isVisible))}
                  aria-pressed={!link.isVisible}
                  aria-label={t(link.isVisible ? "common.hideAria" : "common.showAria", { subject: link.label })}
                  title={t(link.isVisible ? "common.hideTitle" : "common.showTitle")}
                >
                  {link.isVisible ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}
                </button>
                <button
                  type="button"
                  className="admin-icon-button"
                  onClick={() => openDialog({ mode: "edit", link })}
                  aria-label={t("common.edit", { subject: link.label })}
                  title={t("common.edit", { subject: link.label })}
                >
                  <Pencil aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="admin-icon-button admin-icon-button--danger"
                  disabled={isPending}
                  onClick={() => openDialog({ mode: "delete", link })}
                  aria-label={t("common.delete", { subject: link.label })}
                  title={t("common.delete", { subject: link.label })}
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
        eyebrow={t("page.eyebrow.content")}
        title={editing ? t("social.editor.edit") : t("social.editor.add")}
        footer={
          <>
            <button type="button" className="admin-button admin-button--ghost" onClick={closeDialog} disabled={isPending}>
              {t("common.cancel")}
            </button>
            <button type="submit" form={FORM_ID} className="admin-button admin-button--primary" disabled={isPending}>
              {isPending ? t("common.saving") : t("social.save")}
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
            id="social-label"
            name="label"
            labelKey="social.field.label"
            placeholder="Instagram"
            defaultValue={editing?.label}
            errorMessage={fieldError("label") ?? fieldError("platform")}
          />

          <TextField
            id="social-url"
            name="url"
            labelKey="social.field.url"
            hintKey="social.field.urlHint"
            placeholder="https://"
            defaultValue={editing?.url ?? ""}
            optional
            errorMessage={fieldError("url")}
          />

          <ToggleField
            id="social-visible"
            name="is_visible"
            labelKey="social.show"
            defaultChecked={editing ? editing.isVisible : false}
          />

          {editing ? <input type="hidden" name="platform" value={editing.platform} /> : null}
          <input type="hidden" name="display_order" value={editing?.displayOrder ?? nextOrder} />
        </form>
      </AdminDrawer>

      <AdminModal
        open={dialog?.mode === "delete"}
        onClose={closeDialog}
        title={t("common.delete", { subject: dialog?.mode === "delete" ? dialog.link.label : "" })}
        description={t("categories.delete.description", {
          name: dialog?.mode === "delete" ? dialog.link.label : "",
        })}
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
                dialog?.mode === "delete" ? runRowAction(() => deleteSocialLinkAction(dialog.link.id)) : undefined
              }
            >
              {isPending ? t("common.deleting") : t("common.delete", { subject: "" })}
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
