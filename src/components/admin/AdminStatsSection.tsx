"use client";

import type { ReactNode } from "react";

import { useAdminLanguage } from "./AdminLanguageProvider";

/**
 * Overview tile group. Client-side so its landmark label is translated rather
 * than being a hardcoded English string.
 */
export function AdminStatsSection({ children }: { children: ReactNode }) {
  const { t } = useAdminLanguage();

  return (
    <section className="admin-stats" aria-label={t("page.eyebrow.overview")}>
      {children}
    </section>
  );
}
