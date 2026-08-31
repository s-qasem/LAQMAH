"use client";

import { Layers, Lock } from "lucide-react";
import { useState, useTransition } from "react";

import {
  AdminCard,
  ImageUploader,
  TextAreaField,
  TextField,
  ToggleField,
  useAdminLanguage,
} from "@/components/admin";
import type { AdminTranslationKey } from "@/data/admin-i18n";
import {
  HOMEPAGE_FIELD_LABELS,
  type HomepageField,
  type HomepageSectionSpec,
} from "@/data/homepage-sections";
import type { AtmosphereImageRow, HomepageSectionRow } from "@/lib/supabase/site-content";

import {
  updateAtmosphereImageAction,
  updateHomepageSectionAction,
  type AtmosphereErrors,
  type HomepageSectionErrorCode,
  type HomepageSectionErrors,
} from "./actions";

const ERROR_KEYS: Record<HomepageSectionErrorCode, AdminTranslationKey> = {
  required: "homepage.error.required",
  url: "homepage.error.url",
  save: "homepage.error.save",
  notAuthorized: "homepage.error.notAuthorized",
  notFound: "homepage.error.notFound",
  unknownSection: "homepage.error.unknownSection",
};

/** Body copy gets a textarea; everything else is a single line, as it renders. */
const MULTILINE: ReadonlySet<HomepageField> = new Set<HomepageField>(["body"]);

function valueFor(row: HomepageSectionRow, field: HomepageField): string {
  switch (field) {
    case "eyebrow": return row.eyebrow ?? "";
    case "heading_line_1": return row.headingLine1 ?? "";
    case "heading_line_2": return row.headingLine2 ?? "";
    case "arabic_accent": return row.arabicAccent ?? "";
    case "body": return row.body ?? "";
    case "cta_label": return row.ctaLabel ?? "";
    case "cta_href": return row.ctaHref ?? "";
    case "cta_secondary_label": return row.ctaSecondaryLabel ?? "";
    case "image_url": return row.imageUrl ?? "";
    case "image_alt": return row.imageAlt ?? "";
  }
}

/**
 * Editor for one row of `homepage_sections`.
 *
 * The spec decides which fields appear, so the form can only ever submit the
 * columns that section's CHECK constraint allows. Structural sections render no
 * visibility toggle, matching the constraint that keeps them published.
 */
export function HomepageSectionEditor({ spec, row }: { spec: HomepageSectionSpec; row: HomepageSectionRow }) {
  const { t } = useAdminLanguage();
  const [errors, setErrors] = useState<HomepageSectionErrors>({});
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await updateHomepageSectionAction(spec.key, formData);

      if (result.status === "error") {
        setSaved(false);
        setErrors(result.errors);
        return;
      }

      setErrors({});
      setSaved(true);
    });
  };

  const fieldError = (field: keyof HomepageSectionErrors) => {
    const code = errors[field];
    return code ? t(ERROR_KEYS[code]) : null;
  };

  return (
    <AdminCard
      titleKey={spec.titleKey}
      descriptionKey={spec.descriptionKey}
      actions={
        spec.canHide ? null : (
          <span className="admin-pill admin-pill--muted" title={t("homepage.locked.hint")}>
            <Lock aria-hidden="true" />
            {t("homepage.locked")}
          </span>
        )
      }
    >
      <form className="admin-form" onSubmit={submit} noValidate>
        {fieldError("form") ? (
          <p className="admin-form__error" role="alert">
            {fieldError("form")}
          </p>
        ) : null}

        {saved ? (
          <p className="admin-form__notice" role="status">
            {t("homepage.sectionSaved")}
          </p>
        ) : null}

        {spec.fields.map((field) => {
          const id = `${spec.key}-${field}`;
          const labelKey = HOMEPAGE_FIELD_LABELS[field];

          if (field === "image_url") {
            return (
              <ImageUploader
                key={field}
                name="image_url"
                prefix="homepage"
                // Objects land directly in homepage/, where the asset picker
                // lists them alongside the bundled site assets.
                folder=""
                currentUrl={row.imageUrl}
                errorMessage={fieldError("image_url")}
              />
            );
          }

          if (MULTILINE.has(field)) {
            return (
              <div key={field}>
                <TextAreaField
                  id={id}
                  name={field}
                  labelKey={labelKey}
                  rows={3}
                  defaultValue={valueFor(row, field)}
                />
                {fieldError(field) ? (
                  <p className="admin-field__error" role="alert">
                    {fieldError(field)}
                  </p>
                ) : null}
              </div>
            );
          }

          // The Arabic accent is the line this section already displays, not a
          // translation of the English copy.
          const isArabic = field === "arabic_accent";

          return (
            <TextField
              key={field}
              id={id}
              name={field}
              labelKey={labelKey}
              hintKey={isArabic ? "homepage.field.arabicAccentHint" : undefined}
              lang={isArabic ? "ar" : undefined}
              dir={isArabic ? "rtl" : undefined}
              defaultValue={valueFor(row, field)}
              errorMessage={fieldError(field)}
            />
          );
        })}

        {spec.canHide ? (
          <ToggleField
            id={`${spec.key}-published`}
            name="is_published"
            labelKey="homepage.field.published"
            descriptionKey="homepage.field.publishedHint"
            defaultChecked={row.isPublished}
          />
        ) : null}

        {/* Previous URL so a superseded upload can be cleaned up after commit. */}
        {spec.fields.includes("image_url") ? (
          <input type="hidden" name="current_image_url" value={row.imageUrl ?? ""} />
        ) : null}

        <div className="admin-form__footer">
          <button type="submit" className="admin-button admin-button--primary" disabled={isPending}>
            {isPending ? t("common.saving") : t("homepage.saveSection")}
          </button>
        </div>
      </form>
    </AdminCard>
  );
}

/* ------------------------------------------------------------ atmosphere -- */

/**
 * The three fixed slots of "More Than A Cafe".
 *
 * Exactly three, always: positions 1, 2 and 3 map to atmosphere-shot--1/2/3.
 * There is deliberately no add, delete or reorder control, and the table grants
 * UPDATE only, so the layout cannot be turned into a variable-length gallery.
 */
export function AtmosphereImagesEditor({ images }: { images: AtmosphereImageRow[] }) {
  return (
    <AdminCard
      titleKey="homepage.atmosphere.title"
      descriptionKey="homepage.atmosphere.description"
      actions={
        <span className="admin-pill admin-pill--muted">
          <Layers aria-hidden="true" />3
        </span>
      }
    >
      <div className="admin-form">
        {images.map((image) => (
          <AtmosphereSlotForm key={image.position} image={image} />
        ))}
      </div>
    </AdminCard>
  );
}

function AtmosphereSlotForm({ image }: { image: AtmosphereImageRow }) {
  const { t } = useAdminLanguage();
  const [errors, setErrors] = useState<AtmosphereErrors>({});
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await updateAtmosphereImageAction(image.position, formData);

      if (result.status === "error") {
        setSaved(false);
        setErrors(result.errors);
        return;
      }

      setErrors({});
      setSaved(true);
    });
  };

  const fieldError = (field: keyof AtmosphereErrors) => {
    const code = errors[field];
    return code ? t(ERROR_KEYS[code]) : null;
  };

  return (
    <form className="admin-form" onSubmit={submit} noValidate>
      <p className="admin-section-list__name">{t("homepage.atmosphere.slot", { position: image.position })}</p>

      {fieldError("form") ? (
        <p className="admin-form__error" role="alert">
          {fieldError("form")}
        </p>
      ) : null}

      {saved ? (
        <p className="admin-form__notice" role="status">
          {t("homepage.atmosphere.saved")}
        </p>
      ) : null}

      <ImageUploader
        name="image_url"
        prefix="homepage"
        folder=""
        currentUrl={image.imageUrl}
        errorMessage={fieldError("image_url")}
      />

      <div className="admin-form__grid">
        <TextField
          id={`atmosphere-${image.position}-alt`}
          name="alt_text"
          labelKey="homepage.atmosphere.altText"
          defaultValue={image.altText}
          errorMessage={fieldError("alt_text")}
        />
        <TextField
          id={`atmosphere-${image.position}-caption`}
          name="caption"
          labelKey="homepage.atmosphere.caption"
          defaultValue={image.caption}
          errorMessage={fieldError("caption")}
        />
      </div>

      <input type="hidden" name="current_image_url" value={image.imageUrl} />

      <div className="admin-form__footer">
        <button type="submit" className="admin-button admin-button--primary" disabled={isPending}>
          {isPending ? t("common.saving") : t("homepage.saveSection")}
        </button>
      </div>
    </form>
  );
}
