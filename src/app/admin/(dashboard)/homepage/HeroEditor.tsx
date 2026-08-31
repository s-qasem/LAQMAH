"use client";

import { Sparkles } from "lucide-react";
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
import type { HeroErrorCode, HeroErrors, HomepageHero } from "@/lib/supabase/site-content";

import { updateHomepageHeroAction, type HeroActionResult } from "./actions";

const ERROR_KEYS: Record<HeroErrorCode, AdminTranslationKey> = {
  eyebrowRequired: "hero.error.eyebrowRequired",
  headlineRequired: "hero.error.headlineRequired",
  headlineCount: "hero.error.headlineCount",
  descriptionRequired: "hero.error.descriptionRequired",
  buttonLabelRequired: "hero.error.buttonLabelRequired",
  buttonHrefRequired: "hero.error.buttonHrefRequired",
  imageRequired: "hero.error.imageRequired",
  imageInvalid: "hero.error.imageInvalid",
  save: "hero.error.save",
  notAuthorized: "hero.error.notAuthorized",
  notFound: "hero.error.notFound",
};



/**
 * Editor for the existing `homepage_hero` row that the public homepage already
 * renders. Loads the real current values and updates that same row — no second
 * table, no duplicate content.
 */
export function HeroEditor({ hero }: { hero: HomepageHero }) {
  const { t } = useAdminLanguage();
  const [errors, setErrors] = useState<HeroErrors>({});
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result: HeroActionResult = await updateHomepageHeroAction(formData);

      if (result.status === "error") {
        setSaved(false);
        setErrors(result.errors);
        return;
      }

      setErrors({});
      setSaved(true);
    });
  };

  const fieldError = (field: keyof HeroErrors) => {
    const code = errors[field];
    return code ? t(ERROR_KEYS[code]) : null;
  };

  return (
    <AdminCard
      titleKey="hero.card.title"
      descriptionKey="hero.card.description"
      actions={
        <span className="admin-pill admin-pill--muted">
          <Sparkles aria-hidden="true" />
          {t("homepage.hero.badge")}
        </span>
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
            {t("hero.saved")}
          </p>
        ) : null}

        <TextField
          id="hero-eyebrow"
          name="eyebrow"
          labelKey="hero.field.eyebrow"
          defaultValue={hero.eyebrow}
          errorMessage={fieldError("eyebrow")}
        />

        <TextAreaField
          id="hero-headline"
          name="headline_lines"
          labelKey="hero.field.headline"
          hintKey="hero.field.headlineHint"
          rows={4}
          defaultValue={hero.headlineLines.join("\n")}
        />
        {fieldError("headlineLines") ? (
          <p className="admin-field__error" role="alert">
            {fieldError("headlineLines")}
          </p>
        ) : null}

        <TextAreaField
          id="hero-description"
          name="description"
          labelKey="hero.field.description"
          rows={3}
          defaultValue={hero.description}
        />
        {fieldError("description") ? (
          <p className="admin-field__error" role="alert">
            {fieldError("description")}
          </p>
        ) : null}

        <div className="admin-form__grid">
          <TextField
            id="hero-button-label"
            name="button_label"
            labelKey="hero.field.buttonLabel"
            defaultValue={hero.buttonLabel}
            errorMessage={fieldError("buttonLabel")}
          />
          <TextField
            id="hero-button-href"
            name="button_href"
            labelKey="hero.field.buttonHref"
            defaultValue={hero.buttonHref}
            errorMessage={fieldError("buttonHref")}
          />
        </div>

        <div className="admin-form__grid">
          <ImageUploader
            name="desktop_image_url"
            prefix="homepage"
            folder="hero"
            currentUrl={hero.desktopImageUrl}
            errorMessage={fieldError("desktopImage")}
          />
          <ImageUploader
            name="mobile_image_url"
            prefix="homepage"
            folder="hero"
            currentUrl={hero.mobileImageUrl}
            errorMessage={fieldError("mobileImage")}
          />
        </div>

        <ToggleField
          id="hero-published"
          name="is_published"
          labelKey="hero.field.published"
          descriptionKey="hero.field.publishedHint"
          defaultChecked={hero.isPublished}
        />

        {/* Previous URLs so a superseded upload can be cleaned up after commit. */}
        <input type="hidden" name="current_desktop_image_url" value={hero.desktopImageUrl} />
        <input type="hidden" name="current_mobile_image_url" value={hero.mobileImageUrl} />

        <div className="admin-form__footer">
          <button type="submit" className="admin-button admin-button--primary" disabled={isPending}>
            {isPending ? t("common.saving") : t("hero.save")}
          </button>
        </div>
      </form>
    </AdminCard>
  );
}
