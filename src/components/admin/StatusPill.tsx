"use client";

import type { AdminTranslationKey } from "@/data/admin-i18n";

import { useAdminLanguage } from "./AdminLanguageProvider";

type StatusPillProps = {
  /** Drives the colour treatment: `true` reads as positive. */
  active: boolean;
  activeKey?: AdminTranslationKey;
  inactiveKey?: AdminTranslationKey;
};

/** Compact on/off indicator shared by every management table. */
export function StatusPill({
  active,
  activeKey = "common.active",
  inactiveKey = "common.inactive",
}: StatusPillProps) {
  const { t } = useAdminLanguage();

  return (
    <span className={`admin-pill ${active ? "admin-pill--on" : "admin-pill--off"}`}>
      {t(active ? activeKey : inactiveKey)}
    </span>
  );
}
