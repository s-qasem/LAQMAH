"use client";

import type { AdminTranslationKey } from "@/data/admin-i18n";

import { adminIcons, type AdminIconName } from "./adminIcons";
import { useAdminLanguage } from "./AdminLanguageProvider";

type StatCardProps = {
  labelKey: AdminTranslationKey;
  /** Real value when the card is connected; falls back to the placeholder dash. */
  value?: string;
  /**
   * Serializable icon key, resolved to a component here. A Server Component
   * cannot pass the icon component itself across the client boundary.
   */
  iconName: AdminIconName;
};

/** Overview tile on the dashboard. Values stay placeholders in this phase. */
export function StatCard({ labelKey, value, iconName }: StatCardProps) {
  const { t } = useAdminLanguage();
  const Icon = adminIcons[iconName];

  return (
    <article className="admin-stat" data-connected={value === undefined ? undefined : "true"}>
      <span className="admin-stat__icon" aria-hidden="true">
        <Icon />
      </span>
      <p className="admin-stat__label">{t(labelKey)}</p>
      <p className="admin-stat__value">{value ?? t("common.empty")}</p>
      {value === undefined ? <p className="admin-stat__hint">{t("dashboard.notConnectedShort")}</p> : null}
    </article>
  );
}
