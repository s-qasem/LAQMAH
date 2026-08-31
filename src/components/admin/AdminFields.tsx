"use client";

import { ImageIcon, Upload } from "lucide-react";
import type { ReactNode } from "react";

import type { AdminTranslationKey } from "@/data/admin-i18n";

import { useAdminLanguage } from "./AdminLanguageProvider";

type FieldShellProps = {
  id: string;
  labelKey: AdminTranslationKey;
  /** Values for `{name}` placeholders in the label string. */
  labelVars?: Record<string, string | number>;
  hintKey?: AdminTranslationKey;
  optional?: boolean;
  /** Already-translated validation message for this field. */
  errorMessage?: string | null;
  className?: string;
  children: ReactNode;
};

/**
 * Label + control wrapper. Reuses the `.admin-field` rules already used by the
 * login form so the two surfaces stay visually identical.
 */
export function FieldShell({
  id,
  labelKey,
  labelVars,
  hintKey,
  optional,
  errorMessage,
  className = "",
  children,
}: FieldShellProps) {
  const { t } = useAdminLanguage();

  return (
    <div className={`admin-field ${className}`.trim()}>
      <label htmlFor={id}>
        {t(labelKey, labelVars)}
        {optional ? <span className="admin-field__optional"> {t("common.optional")}</span> : null}
      </label>
      {children}
      {hintKey ? (
        <p className="admin-field__hint" id={`${id}-hint`}>
          {t(hintKey)}
        </p>
      ) : null}
      {errorMessage ? (
        <p className="admin-field__error" id={`${id}-error`} role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}

type TextFieldProps = {
  id: string;
  name: string;
  labelKey: AdminTranslationKey;
  labelVars?: Record<string, string | number>;
  defaultValue?: string;
  /** Literal example value — sample data, not interface copy. */
  placeholder?: string;
  /** Translated placeholder, for sentence-style prompts. */
  placeholderKey?: AdminTranslationKey;
  hintKey?: AdminTranslationKey;
  optional?: boolean;
  errorMessage?: string | null;
  type?: "text" | "number" | "url" | "tel" | "email";
  inputMode?: "text" | "numeric" | "decimal" | "tel" | "url";
  lang?: string;
  dir?: "rtl" | "ltr";
  step?: string;
  min?: string;
};

export function TextField({
  id,
  name,
  labelKey,
  labelVars,
  defaultValue,
  placeholder,
  placeholderKey,
  hintKey,
  optional,
  errorMessage,
  type = "text",
  inputMode,
  lang,
  dir,
  step,
  min,
}: TextFieldProps) {
  const { t } = useAdminLanguage();

  return (
    <FieldShell
      id={id}
      labelKey={labelKey}
      labelVars={labelVars}
      hintKey={hintKey}
      optional={optional}
      errorMessage={errorMessage}
    >
      <input
        id={id}
        name={name}
        type={type}
        inputMode={inputMode}
        defaultValue={defaultValue}
        placeholder={placeholderKey ? t(placeholderKey) : placeholder}
        lang={lang}
        dir={dir}
        step={step}
        min={min}
        aria-invalid={errorMessage ? true : undefined}
        aria-describedby={
          [hintKey ? `${id}-hint` : null, errorMessage ? `${id}-error` : null].filter(Boolean).join(" ") ||
          undefined
        }
      />
    </FieldShell>
  );
}

type TextAreaFieldProps = {
  id: string;
  name: string;
  labelKey: AdminTranslationKey;
  defaultValue?: string;
  placeholder?: string;
  placeholderKey?: AdminTranslationKey;
  hintKey?: AdminTranslationKey;
  optional?: boolean;
  rows?: number;
  lang?: string;
  dir?: "rtl" | "ltr";
};

export function TextAreaField({
  id,
  name,
  labelKey,
  defaultValue,
  placeholder,
  placeholderKey,
  hintKey,
  optional,
  rows = 4,
  lang,
  dir,
}: TextAreaFieldProps) {
  const { t } = useAdminLanguage();

  return (
    <FieldShell id={id} labelKey={labelKey} hintKey={hintKey} optional={optional}>
      <textarea
        id={id}
        name={name}
        rows={rows}
        lang={lang}
        dir={dir}
        defaultValue={defaultValue}
        placeholder={placeholderKey ? t(placeholderKey) : placeholder}
        aria-describedby={hintKey ? `${id}-hint` : undefined}
      />
    </FieldShell>
  );
}

type SelectFieldProps = {
  id: string;
  name: string;
  labelKey: AdminTranslationKey;
  /** Option values are content (category names, sources), not interface copy. */
  options: readonly string[];
  defaultValue?: string;
  hintKey?: AdminTranslationKey;
  optional?: boolean;
};

export function SelectField({ id, name, labelKey, options, defaultValue, hintKey, optional }: SelectFieldProps) {
  return (
    <FieldShell id={id} labelKey={labelKey} hintKey={hintKey} optional={optional}>
      <select id={id} name={name} defaultValue={defaultValue} aria-describedby={hintKey ? `${id}-hint` : undefined}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

type ToggleFieldProps = {
  id: string;
  name: string;
  labelKey: AdminTranslationKey;
  descriptionKey?: AdminTranslationKey;
  defaultChecked?: boolean;
};

/** Switch-styled checkbox used for active / available / featured / visible flags. */
export function ToggleField({ id, name, labelKey, descriptionKey, defaultChecked = false }: ToggleFieldProps) {
  const { t } = useAdminLanguage();

  return (
    <div className="admin-toggle">
      <input id={id} name={name} type="checkbox" defaultChecked={defaultChecked} className="admin-toggle__input" />
      <label htmlFor={id} className="admin-toggle__label">
        <span className="admin-toggle__track" aria-hidden="true">
          <span className="admin-toggle__thumb" />
        </span>
        <span className="admin-toggle__text">
          <span className="admin-toggle__title">{t(labelKey)}</span>
          {descriptionKey ? <span className="admin-toggle__description">{t(descriptionKey)}</span> : null}
        </span>
      </label>
    </div>
  );
}

type ImageFieldProps = {
  id: string;
  name: string;
  labelKey: AdminTranslationKey;
  hintKey?: AdminTranslationKey;
  optional?: boolean;
  /** Name of the currently attached file, when one exists. */
  currentLabel?: string | null;
};

/** File picker with a preview slot. Selection is not uploaded in this phase. */
export function ImageField({ id, name, labelKey, hintKey, optional = true, currentLabel }: ImageFieldProps) {
  const { t } = useAdminLanguage();

  return (
    <FieldShell id={id} labelKey={labelKey} hintKey={hintKey} optional={optional}>
      <div className="admin-imagefield">
        <span className="admin-imagefield__preview" aria-hidden="true">
          <ImageIcon />
        </span>
        <div className="admin-imagefield__body">
          <label className="admin-imagefield__button" htmlFor={id}>
            <Upload aria-hidden="true" />
            {t("common.chooseImage")}
          </label>
          <input id={id} name={name} type="file" accept="image/*" className="admin-imagefield__input" />
          <p className="admin-imagefield__current">{currentLabel ?? t("common.noImage")}</p>
        </div>
      </div>
    </FieldShell>
  );
}
