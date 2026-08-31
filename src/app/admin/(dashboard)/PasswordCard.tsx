"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { AdminCard, useAdminLanguage } from "@/components/admin";

import { updatePasswordAction } from "../password-actions";
import { initialPasswordState } from "../password-state";

function SubmitButton() {
  const { t } = useAdminLanguage();
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="admin-button admin-button--primary" disabled={pending}>
      {pending ? t("common.saving") : t("security.save")}
    </button>
  );
}

/**
 * Password change for the signed-in admin.
 *
 * Supabase updates the credential for the current session, so no old password
 * is required and none is asked for. Nothing is stored by this application.
 */
export function PasswordCard() {
  const { t } = useAdminLanguage();
  const [state, formAction] = useActionState(updatePasswordAction, initialPasswordState);

  return (
    <AdminCard titleKey="security.card.title" descriptionKey="security.card.description">
      <form action={formAction} className="admin-form" noValidate>
        {state.message ? (
          <p
            className={state.status === "success" ? "admin-form__notice" : "admin-form__error"}
            role={state.status === "success" ? "status" : "alert"}
          >
            {state.message}
          </p>
        ) : null}

        <div className="admin-form__grid">
          <div className="admin-field">
            <label htmlFor="admin-new-password">{t("security.newPassword")}</label>
            <input
              id="admin-new-password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
            />
            <p className="admin-field__hint">{t("security.hint")}</p>
          </div>

          <div className="admin-field">
            <label htmlFor="admin-confirm-password">{t("security.confirmPassword")}</label>
            <input
              id="admin-confirm-password"
              name="confirm_password"
              type="password"
              autoComplete="new-password"
              minLength={8}
            />
          </div>
        </div>

        <div className="admin-form__footer">
          <SubmitButton />
        </div>
      </form>
    </AdminCard>
  );
}
