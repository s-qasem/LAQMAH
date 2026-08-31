"use client";

import { Clock, MapPin } from "lucide-react";
import { useState, useTransition } from "react";

import { AdminCard, TextAreaField, TextField, ToggleField, useAdminLanguage } from "@/components/admin";
import type { AdminTranslationKey } from "@/data/admin-i18n";
import type { BusinessHour, SiteContact } from "@/lib/supabase/site-content";

import {
  updateBusinessHoursAction,
  updateContactAction,
  type ContactErrorCode,
  type ContactErrors,
} from "./actions";

const ERROR_KEYS: Record<ContactErrorCode, AdminTranslationKey> = {
  email: "contact.error.email",
  url: "contact.error.url",
  hours: "contact.error.hours",
  save: "contact.error.save",
  notAuthorized: "contact.error.notAuthorized",
  notFound: "contact.error.notFound",
};

/** 0 = Monday … 6 = Sunday, matching the `business_hours` primary key. */
const DAY_KEYS: AdminTranslationKey[] = [
  "contact.day.monday",
  "contact.day.tuesday",
  "contact.day.wednesday",
  "contact.day.thursday",
  "contact.day.friday",
  "contact.day.saturday",
  "contact.day.sunday",
];

type ContactManagerProps = {
  contact: SiteContact;
  hours: BusinessHour[];
};

/**
 * Contact details and opening hours, backed by `site_contact` and
 * `business_hours`.
 *
 * Two independent forms so saving hours cannot fail because of an unrelated
 * validation error in the contact block, and vice versa.
 */
export function ContactManager({ contact, hours }: ContactManagerProps) {
  const { t } = useAdminLanguage();
  const [contactErrors, setContactErrors] = useState<ContactErrors>({});
  const [hoursError, setHoursError] = useState<ContactErrorCode | null>(null);
  const [savedBlock, setSavedBlock] = useState<"contact" | "hours" | null>(null);
  const [isPending, startTransition] = useTransition();

  const byDay = (day: number) => hours.find((entry) => entry.dayOfWeek === day);

  const submitContact = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await updateContactAction(formData);

      if (result.status === "error") {
        setSavedBlock(null);
        setContactErrors(result.errors);
        return;
      }

      setContactErrors({});
      setSavedBlock("contact");
    });
  };

  const submitHours = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await updateBusinessHoursAction(formData);

      if (result.status === "error") {
        setSavedBlock(null);
        setHoursError(result.errors.hours ?? result.errors.form ?? "save");
        return;
      }

      setHoursError(null);
      setSavedBlock("hours");
    });
  };

  const fieldError = (field: keyof ContactErrors) => {
    const code = contactErrors[field];
    return code ? t(ERROR_KEYS[code]) : null;
  };

  return (
    <>
      <AdminCard
        titleKey="contact.location.title"
        descriptionKey="contact.location.description"
        actions={
          <span className="admin-pill admin-pill--muted">
            <MapPin aria-hidden="true" />
            {t("contact.location.badge")}
          </span>
        }
      >
        <form className="admin-form" onSubmit={submitContact} noValidate>
          {fieldError("form") ? (
            <p className="admin-form__error" role="alert">
              {fieldError("form")}
            </p>
          ) : null}

          {savedBlock === "contact" ? (
            <p className="admin-form__notice" role="status">
              {t("contact.saved")}
            </p>
          ) : null}

          <TextAreaField
            id="contact-address-en"
            name="address_en"
            labelKey="contact.field.addressEn"
            rows={3}
            defaultValue={contact.addressEn ?? ""}
          />

          <TextAreaField
            id="contact-address-ar"
            name="address_ar"
            labelKey="contact.field.addressAr"
            rows={3}
            defaultValue={contact.addressAr ?? ""}
            lang="ar"
            dir="rtl"
            optional
          />

          <div className="admin-form__grid">
            <TextField
              id="contact-phone"
              name="phone"
              labelKey="contact.field.phone"
              defaultValue={contact.phone ?? ""}
              optional
            />
            <TextField
              id="contact-email"
              name="email"
              labelKey="contact.field.email"
              defaultValue={contact.email ?? ""}
              optional
              errorMessage={fieldError("email")}
            />
            <TextField
              id="contact-map"
              name="map_url"
              labelKey="contact.field.map"
              hintKey="contact.field.mapHint"
              placeholder="https://"
              defaultValue={contact.mapUrl ?? ""}
              optional
              errorMessage={fieldError("mapUrl")}
            />
            <TextField
              id="contact-embed"
              name="map_embed_url"
              labelKey="contact.field.embed"
              placeholder="https://"
              defaultValue={contact.mapEmbedUrl ?? ""}
              optional
              errorMessage={fieldError("mapEmbedUrl")}
            />
            <TextField
              id="order-primary"
              name="order_url"
              labelKey="contact.order.primary"
              placeholder="https://"
              defaultValue={contact.orderUrl ?? ""}
              optional
              errorMessage={fieldError("orderUrl")}
            />
            <TextField
              id="order-label-en"
              name="order_label_en"
              labelKey="contact.field.orderLabelEn"
              defaultValue={contact.orderLabelEn ?? ""}
              optional
            />
            <TextField
              id="order-label-ar"
              name="order_label_ar"
              labelKey="contact.field.orderLabelAr"
              defaultValue={contact.orderLabelAr ?? ""}
              lang="ar"
              dir="rtl"
              optional
            />
          </div>

          <div className="admin-form__footer">
            <button type="submit" className="admin-button admin-button--primary" disabled={isPending}>
              {isPending ? t("common.saving") : t("contact.save")}
            </button>
          </div>
        </form>
      </AdminCard>

      <AdminCard
        titleKey="contact.hours.title"
        descriptionKey="contact.hours.description"
        actions={
          <span className="admin-pill admin-pill--muted">
            <Clock aria-hidden="true" />
            {t("contact.hours.badge")}
          </span>
        }
      >
        <form className="admin-form" onSubmit={submitHours} noValidate>
          {hoursError ? (
            <p className="admin-form__error" role="alert">
              {t(ERROR_KEYS[hoursError])}
            </p>
          ) : null}

          {savedBlock === "hours" ? (
            <p className="admin-form__notice" role="status">
              {t("contact.saved")}
            </p>
          ) : null}

          <ul className="admin-hours">
            {DAY_KEYS.map((dayKey, day) => {
              const entry = byDay(day);

              return (
                <li key={dayKey} className="admin-hours__row">
                  <p className="admin-hours__day">{t(dayKey)}</p>

                  <div className="admin-hours__times">
                    <label className="admin-inline-field" htmlFor={`hours-${day}-open`}>
                      <span>{t("contact.hours.opens")}</span>
                      <input
                        id={`hours-${day}-open`}
                        name={`opens_${day}`}
                        type="time"
                        defaultValue={entry?.opens ?? ""}
                      />
                    </label>

                    <label className="admin-inline-field" htmlFor={`hours-${day}-close`}>
                      <span>{t("contact.hours.closes")}</span>
                      <input
                        id={`hours-${day}-close`}
                        name={`closes_${day}`}
                        type="time"
                        defaultValue={entry?.closes ?? ""}
                      />
                    </label>
                  </div>

                  <ToggleField
                    id={`hours-${day}-closed`}
                    name={`closed_${day}`}
                    labelKey="contact.hours.closed"
                    defaultChecked={entry?.isClosed ?? false}
                  />
                </li>
              );
            })}
          </ul>

          <div className="admin-form__footer">
            <button type="submit" className="admin-button admin-button--primary" disabled={isPending}>
              {isPending ? t("common.saving") : t("contact.hours.save")}
            </button>
          </div>
        </form>
      </AdminCard>
    </>
  );
}
