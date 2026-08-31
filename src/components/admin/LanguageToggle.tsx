"use client";

import { useAdminLanguage } from "./AdminLanguageProvider";

/**
 * Circular language switch for the admin top bar.
 *
 * Shows the language it will switch *to*: `AR` while the dashboard is in
 * English, `EN` while it is in Arabic. One tap flips the whole admin interface
 * and its text direction.
 */
export function LanguageToggle() {
  const { isArabic, toggleLanguage, t } = useAdminLanguage();

  const label = isArabic ? "EN" : "AR";
  const description = isArabic ? t("shell.language.toEnglish") : t("shell.language.toArabic");

  return (
    <button
      type="button"
      className="admin-lang-toggle"
      onClick={toggleLanguage}
      aria-label={description}
      title={description}
    >
      <span aria-hidden="true">{label}</span>
    </button>
  );
}
