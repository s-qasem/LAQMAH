"use client";

import { useAdminLanguage } from "./AdminLanguageProvider";

type AdminLocalizedProps = {
  en: string;
  ar?: string | null;
  /**
   * Render the value in the language that was *not* chosen — used for the
   * secondary line under a heading. Renders nothing when there is no distinct
   * second value.
   */
  secondary?: boolean;
};

/**
 * Renders one bilingual database value in the reader's language.
 *
 * Lets Server Component pages stay server components: they pass both columns
 * and this leaf picks, falling back to English when the Arabic column is empty.
 */
export function AdminLocalized({ en, ar, secondary = false }: AdminLocalizedProps) {
  const { localized, alternate } = useAdminLanguage();

  if (secondary) {
    const other = alternate(en, ar);
    return other ? <>{other}</> : null;
  }

  return <>{localized(en, ar)}</>;
}
