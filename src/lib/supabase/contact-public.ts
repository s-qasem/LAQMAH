import "server-only";

import { unstable_cache } from "next/cache";

import { createServerSupabaseClient } from "./server";

/**
 * The single public read adapter for contact details and opening hours.
 *
 * Every public surface — /contact, the homepage Visit block and the site footer
 * — reads through this one module. It is cached under a shared tag, so the
 * three of them resolve one query per revalidation window rather than each
 * hitting the database independently.
 *
 * Uses the anonymous client and the existing RLS. No session, no service-role
 * key.
 */

export const PUBLIC_CONTACT_TAG = "public-contact";

/** 0 = Monday … 6 = Sunday, matching `business_hours.day_of_week`. */
const WEEKDAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export type PublicBusinessHour = {
  dayOfWeek: number;
  dayName: string;
  opens: string | null;
  closes: string | null;
  isClosed: boolean;
};

/** Consecutive days sharing identical hours, e.g. "Monday–Thursday". */
export type PublicHoursGroup = {
  /** "Monday–Thursday" or "Sunday". */
  label: string;
  /** "10:00 AM–10:00 PM", or "Closed". */
  hours: string;
  /** "Monday–Thursday: 10:00 AM–10:00 PM" — the exact shape the site renders. */
  line: string;
};

export type PublicContact = {
  address: string | null;
  addressAr: string | null;
  phone: string | null;
  /** Derived from `phone`; null when there is no phone. */
  phoneHref: string | null;
  /** Null stays null: no fake address, no empty mailto. */
  email: string | null;
  emailHref: string | null;
  /** External destination for a "Get directions" link. */
  mapUrl: string | null;
  /** iframe source. Never derived from `mapUrl`; they are separate concepts. */
  mapEmbedUrl: string | null;
  orderUrl: string | null;
  orderLabel: string | null;
  hours: PublicBusinessHour[];
  hoursGroups: PublicHoursGroup[];
  /** Which source produced this payload, for reporting during development. */
  source: "supabase" | "fallback";
};

type ContactRow = {
  address_en: string | null;
  address_ar: string | null;
  phone: string | null;
  email: string | null;
  map_url: string | null;
  map_embed_url: string | null;
  order_url: string | null;
  order_label_en: string | null;
};

type HoursRow = {
  day_of_week: number;
  opens: string | null;
  closes: string | null;
  is_closed: boolean;
};

/**
 * "22:00:00" -> "10:00 PM".
 *
 * Postgres `time` arrives as HH:MM:SS. The site has always written times in
 * this form, so the output is formatting, not a new presentation choice.
 */
function formatTime(value: string): string {
  const [rawHour, rawMinute] = value.split(":");
  const hour = Number(rawHour);
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;

  return `${displayHour}:${rawMinute} ${suffix}`;
}

/**
 * Derives a `tel:` href from the displayed phone number.
 *
 * There is no `phone_href` column and adding one would be schema invention. A
 * ten-digit North American number takes the +1 country code, reproducing the
 * href the site already used; anything else falls back to the bare digits.
 */
function toPhoneHref(phone: string | null): string | null {
  if (!phone) return null;

  const digits = phone.replace(/\D/g, "");
  if (digits.length === 0) return null;

  return digits.length === 10 ? `tel:+1${digits}` : `tel:+${digits}`;
}

/** Groups consecutive days that share identical hours. */
function groupHours(hours: PublicBusinessHour[]): PublicHoursGroup[] {
  const groups: PublicHoursGroup[] = [];
  let run: PublicBusinessHour[] = [];

  const sameAs = (a: PublicBusinessHour, b: PublicBusinessHour) =>
    a.isClosed === b.isClosed && a.opens === b.opens && a.closes === b.closes;

  const flush = () => {
    if (run.length === 0) return;

    const first = run[0];
    const last = run[run.length - 1];
    const label = run.length === 1 ? first.dayName : `${first.dayName}–${last.dayName}`;

    // A closed day shows the site's "Closed" treatment rather than invented times.
    const hoursText =
      first.isClosed || !first.opens || !first.closes
        ? "Closed"
        : `${formatTime(first.opens)}–${formatTime(first.closes)}`;

    groups.push({ label, hours: hoursText, line: `${label}: ${hoursText}` });
    run = [];
  };

  for (const day of hours) {
    if (run.length > 0 && !sameAs(run[run.length - 1], day)) flush();
    run.push(day);
  }
  flush();

  return groups;
}

/**
 * The values the public site displays correctly today, taken from
 * `src/app/contact/page.tsx` — NOT the stale placeholders in `src/data/site.ts`.
 * Used only when the database cannot be read.
 */
function buildFallbackContact(): PublicContact {
  const hours: PublicBusinessHour[] = WEEKDAY_NAMES.map((dayName, dayOfWeek) => ({
    dayOfWeek,
    dayName,
    // Friday and Saturday close an hour later.
    opens: "10:00:00",
    closes: dayOfWeek === 4 || dayOfWeek === 5 ? "23:00:00" : "22:00:00",
    isClosed: false,
  }));

  return {
    address: "3065 Oakwood Blvd Ste D, Melvindale, MI 48122",
    addressAr: null,
    phone: "(313) 722-4149",
    phoneHref: "tel:+13137224149",
    email: null,
    emailHref: null,
    mapUrl: "https://maps.app.goo.gl/DFKXSAyDmfVc6RmW6",
    mapEmbedUrl: "https://www.google.com/maps?q=42.2820387,-83.175805&z=16&output=embed",
    orderUrl: null,
    orderLabel: null,
    hours,
    hoursGroups: groupHours(hours),
    source: "fallback",
  };
}

async function readContactFromSupabase(): Promise<PublicContact | null> {
  const supabase = createServerSupabaseClient();

  const [contactResult, hoursResult] = await Promise.all([
    supabase
      .from("site_contact")
      .select("address_en, address_ar, phone, email, map_url, map_embed_url, order_url, order_label_en")
      .eq("id", "main")
      .maybeSingle(),
    supabase
      .from("business_hours")
      .select("day_of_week, opens, closes, is_closed")
      .order("day_of_week", { ascending: true }),
  ]);

  if (contactResult.error || hoursResult.error || !contactResult.data) {
    console.error(
      "[public-contact] Supabase read failed, falling back to the local contact values:",
      contactResult.error?.message ?? hoursResult.error?.message ?? "no site_contact row",
    );
    return null;
  }

  const row = contactResult.data as ContactRow;

  const hours: PublicBusinessHour[] = ((hoursResult.data ?? []) as HoursRow[])
    .filter((entry) => entry.day_of_week >= 0 && entry.day_of_week <= 6)
    .map((entry) => ({
      dayOfWeek: entry.day_of_week,
      dayName: WEEKDAY_NAMES[entry.day_of_week],
      opens: entry.opens,
      closes: entry.closes,
      isClosed: entry.is_closed,
    }));

  return {
    address: row.address_en,
    addressAr: row.address_ar,
    phone: row.phone,
    phoneHref: toPhoneHref(row.phone),
    // A null email stays null: no placeholder, no empty mailto.
    email: row.email,
    emailHref: row.email ? `mailto:${row.email}` : null,
    mapUrl: row.map_url,
    mapEmbedUrl: row.map_embed_url,
    orderUrl: row.order_url,
    orderLabel: row.order_label_en,
    hours,
    hoursGroups: groupHours(hours),
    source: "supabase",
  };
}

const getCachedPublicContact = unstable_cache(
  async (): Promise<PublicContact> => (await readContactFromSupabase()) ?? buildFallbackContact(),
  ["public-contact"],
  { revalidate: 60, tags: [PUBLIC_CONTACT_TAG] },
);

/** Contact details and ordered opening hours for every public surface. */
export async function getPublicContact(): Promise<PublicContact> {
  try {
    return await getCachedPublicContact();
  } catch (error) {
    console.error("[public-contact] Unexpected failure, falling back to the local contact values:", error);
    return buildFallbackContact();
  }
}
