"use client";

import type { ReactNode } from "react";

import type { AdminTranslationKey } from "@/data/admin-i18n";

import { useAdminLanguage } from "./AdminLanguageProvider";

type AdminPageHeaderProps = {
  eyebrowKey?: AdminTranslationKey;
  titleKey: AdminTranslationKey;
  descriptionKey?: AdminTranslationKey;
  /** Primary action(s) for the screen, rendered at the end of the header row. */
  actions?: ReactNode;
};

/** Shared page title block. Rendered by every admin screen below the shell chrome. */
export function AdminPageHeader({ eyebrowKey, titleKey, descriptionKey, actions }: AdminPageHeaderProps) {
  const { t } = useAdminLanguage();

  return (
    <header className="admin-page__header">
      <div className="admin-page__heading">
        {eyebrowKey ? <p className="admin-page__eyebrow">{t(eyebrowKey)}</p> : null}
        <h1 className="admin-page__title">{t(titleKey)}</h1>
        {descriptionKey ? <p className="admin-page__description">{t(descriptionKey)}</p> : null}
      </div>

      {actions ? <div className="admin-page__actions">{actions}</div> : null}
    </header>
  );
}
