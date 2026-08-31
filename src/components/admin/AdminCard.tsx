"use client";

import type { ReactNode } from "react";

import type { AdminTranslationKey } from "@/data/admin-i18n";

import { useAdminLanguage } from "./AdminLanguageProvider";

type AdminCardProps = {
  titleKey?: AdminTranslationKey;
  descriptionKey?: AdminTranslationKey;
  /** Values for `{name}` placeholders in the description string. */
  descriptionVars?: Record<string, string | number>;
  /** Optional controls aligned to the end of the card header. */
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
};

/** Bordered panel used for every grouped block of admin content. */
export function AdminCard({
  titleKey,
  descriptionKey,
  descriptionVars,
  actions,
  className = "",
  children,
}: AdminCardProps) {
  const { t } = useAdminLanguage();

  return (
    <section className={`admin-card ${className}`.trim()}>
      {titleKey || actions ? (
        <div className="admin-card__header">
          <div>
            {titleKey ? <h2 className="admin-card__title">{t(titleKey)}</h2> : null}
            {descriptionKey ? (
              <p className="admin-card__description">{t(descriptionKey, descriptionVars)}</p>
            ) : null}
          </div>
          {actions ? <div className="admin-card__actions">{actions}</div> : null}
        </div>
      ) : null}

      <div className="admin-card__body">{children}</div>
    </section>
  );
}
