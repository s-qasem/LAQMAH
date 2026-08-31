"use server";

import { revalidatePath, updateTag } from "next/cache";

import { getAdminActionClient } from "@/lib/supabase/admin-action";
import { PUBLIC_CONTACT_TAG } from "@/lib/supabase/contact-public";

export type ContactErrorCode = "email" | "url" | "hours" | "save" | "notAuthorized" | "notFound";

export type ContactField = "email" | "mapUrl" | "mapEmbedUrl" | "orderUrl" | "hours" | "form";
export type ContactErrors = Partial<Record<ContactField, ContactErrorCode>>;

export type ContactActionResult = { status: "success" } | { status: "error"; errors: ContactErrors };

const NOT_AUTHORIZED: ContactActionResult = { status: "error", errors: { form: "notAuthorized" } };

/** Deliberately permissive: any address with an @ and a dot after it. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function optionalText(form: FormData, key: string): string | null {
  const value = String(form.get(key) ?? "").trim();
  return value || null;
}

function optionalUrl(value: string | null): { ok: true; value: string | null } | { ok: false } {
  if (!value) return { ok: true, value: null };

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return { ok: false };
    return { ok: true, value };
  } catch {
    return { ok: false };
  }
}

/**
 * Saves the singleton `site_contact` row.
 *
 * Blank fields are stored as NULL rather than empty strings, so an unknown
 * value stays unknown instead of becoming an empty label on the public site.
 */
export async function updateContactAction(formData: FormData): Promise<ContactActionResult> {
  const errors: ContactErrors = {};

  const email = optionalText(formData, "email");
  // The seeded placeholder ("Email to be confirmed") is not an address, so only
  // validate once it starts to look like one.
  if (email && email.includes("@") && !EMAIL.test(email)) errors.email = "email";

  const mapUrl = optionalUrl(optionalText(formData, "map_url"));
  if (!mapUrl.ok) errors.mapUrl = "url";

  const mapEmbedUrl = optionalUrl(optionalText(formData, "map_embed_url"));
  if (!mapEmbedUrl.ok) errors.mapEmbedUrl = "url";

  const orderUrl = optionalUrl(optionalText(formData, "order_url"));
  if (!orderUrl.ok) errors.orderUrl = "url";

  if (Object.keys(errors).length > 0) return { status: "error", errors };

  const supabase = await getAdminActionClient();
  if (!supabase) return NOT_AUTHORIZED;

  const { data, error } = await supabase
    .from("site_contact")
    .update({
      address_en: optionalText(formData, "address_en"),
      address_ar: optionalText(formData, "address_ar"),
      phone: optionalText(formData, "phone"),
      email,
      map_url: mapUrl.ok ? mapUrl.value : null,
      map_embed_url: mapEmbedUrl.ok ? mapEmbedUrl.value : null,
      order_url: orderUrl.ok ? orderUrl.value : null,
      order_label_en: optionalText(formData, "order_label_en"),
      order_label_ar: optionalText(formData, "order_label_ar"),
    })
    .eq("id", "main")
    .select("id");

  if (error) return { status: "error", errors: { form: "save" } };
  if (!data || data.length === 0) return { status: "error", errors: { form: "notFound" } };

  revalidatePath("/admin/contact");
  // Publishes to /contact, the homepage Visit block and the site footer.
  updateTag(PUBLIC_CONTACT_TAG);

  return { status: "success" };
}

/**
 * Saves all seven weekday rows.
 *
 * An empty time input stays NULL: "unknown" and "closed" are different states,
 * and the seeded rows are genuinely unknown. A day marked closed keeps whatever
 * times it had rather than discarding them.
 */
export async function updateBusinessHoursAction(formData: FormData): Promise<ContactActionResult> {
  const supabase = await getAdminActionClient();
  if (!supabase) return NOT_AUTHORIZED;

  for (let day = 0; day <= 6; day += 1) {
    const opens = String(formData.get(`opens_${day}`) ?? "").trim() || null;
    const closes = String(formData.get(`closes_${day}`) ?? "").trim() || null;
    const isClosed = formData.get(`closed_${day}`) === "on";

    const { data, error } = await supabase
      .from("business_hours")
      .update({ opens, closes, is_closed: isClosed })
      .eq("day_of_week", day)
      .select("day_of_week");

    if (error) return { status: "error", errors: { hours: "save" } };
    if (!data || data.length === 0) return { status: "error", errors: { hours: "notFound" } };
  }

  revalidatePath("/admin/contact");
  // Publishes to /contact, the homepage Visit block and the site footer.
  updateTag(PUBLIC_CONTACT_TAG);

  return { status: "success" };
}
