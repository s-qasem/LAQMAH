"use client";

import type { AdminTranslationKey } from "@/data/admin-i18n";

import { useAdminLanguage } from "./AdminLanguageProvider";

/**
 * Renders one fixed interface string. Lets Server Component pages stay server
 * components: they pass translation keys, and this leaf resolves them against
 * the reader's chosen language.
 */
export function AdminText({
  tKey,
  vars,
}: {
  tKey: AdminTranslationKey;
  vars?: Record<string, string | number>;
}) {
  const { t } = useAdminLanguage();

  return <>{t(tKey, vars)}</>;
}
