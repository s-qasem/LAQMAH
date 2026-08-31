"use client";

import type { ReactNode } from "react";

import { useAdminLanguage } from "./AdminLanguageProvider";

/**
 * Breadcrumb trail. Client-side so its landmark label is translated like the
 * rest of the interface rather than being a hardcoded English string.
 */
export function AdminBreadcrumb({ children }: { children: ReactNode }) {
  const { t } = useAdminLanguage();

  return (
    <nav className="admin-breadcrumb" aria-label={t("breadcrumb.aria")}>
      {children}
    </nav>
  );
}
