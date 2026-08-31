"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";

import {
  adminTranslations,
  formatTranslation,
  type AdminLanguage,
  type AdminTranslationKey,
} from "@/data/admin-i18n";

const LANGUAGE_STORAGE_KEY = "lqmah-admin-language";

/**
 * The chosen language lives in localStorage rather than React state so it
 * survives reloads. `useSyncExternalStore` reads it without an effect, and
 * renders English on the server so hydration stays clean.
 */
const languageListeners = new Set<() => void>();

function subscribeToLanguage(listener: () => void) {
  languageListeners.add(listener);
  return () => {
    languageListeners.delete(listener);
  };
}

function readLanguage(): AdminLanguage {
  try {
    return window.localStorage.getItem(LANGUAGE_STORAGE_KEY) === "ar" ? "ar" : "en";
  } catch {
    // Storage can be unavailable (private mode); English is the default.
    return "en";
  }
}

function readServerLanguage(): AdminLanguage {
  return "en";
}

function writeLanguage(next: AdminLanguage) {
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
  } catch {
    // The preference is a convenience only.
  }
  languageListeners.forEach((listener) => listener());
}

export type AdminLanguageValue = {
  lang: AdminLanguage;
  dir: "ltr" | "rtl";
  isArabic: boolean;
  setLanguage: (next: AdminLanguage) => void;
  toggleLanguage: () => void;
  /** Look up a fixed interface string, filling any `{name}` placeholders. */
  t: (key: AdminTranslationKey, vars?: Record<string, string | number>) => string;
  /**
   * Chooses the right language for a bilingual *database* value.
   *
   * Arabic wins in Arabic mode, but only when it actually has content: a NULL
   * or blank Arabic column falls back to English rather than rendering an empty
   * cell. Never use this for identifiers, slugs, URLs or filenames.
   */
  localized: (en: string, ar?: string | null) => string;
  /** The value in the language that `localized` did not pick, or null. */
  alternate: (en: string, ar?: string | null) => string | null;
};

const AdminLanguageContext = createContext<AdminLanguageValue | null>(null);

export function AdminLanguageProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore(subscribeToLanguage, readLanguage, readServerLanguage);

  const t = useCallback(
    (key: AdminTranslationKey, vars?: Record<string, string | number>) =>
      formatTranslation(adminTranslations[lang][key], vars),
    [lang],
  );

  const localized = useCallback(
    (en: string, ar?: string | null) => (lang === "ar" && ar && ar.trim() ? ar : en),
    [lang],
  );

  const alternate = useCallback(
    (en: string, ar?: string | null) => {
      const primary = lang === "ar" && ar && ar.trim() ? ar : en;
      const other = primary === en ? (ar && ar.trim() ? ar : null) : en;
      return other && other !== primary ? other : null;
    },
    [lang],
  );

  const value = useMemo<AdminLanguageValue>(
    () => ({
      lang,
      dir: lang === "ar" ? "rtl" : "ltr",
      isArabic: lang === "ar",
      setLanguage: writeLanguage,
      toggleLanguage: () => writeLanguage(lang === "ar" ? "en" : "ar"),
      t,
      localized,
      alternate,
    }),
    [lang, t, localized, alternate],
  );

  return <AdminLanguageContext.Provider value={value}>{children}</AdminLanguageContext.Provider>;
}

export function useAdminLanguage() {
  const value = useContext(AdminLanguageContext);

  if (!value) {
    throw new Error("useAdminLanguage must be used inside AdminLanguageProvider");
  }

  return value;
}
