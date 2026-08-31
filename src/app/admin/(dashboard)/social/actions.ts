"use server";

import { revalidatePath, updateTag } from "next/cache";

import { getAdminActionClient } from "@/lib/supabase/admin-action";
import { PUBLIC_SOCIAL_TAG } from "@/lib/supabase/social-public";
import { deriveSlug } from "@/lib/supabase/menu-categories";

export type SocialErrorCode =
  | "labelRequired"
  | "platformRequired"
  | "url"
  | "duplicate"
  | "save"
  | "delete"
  | "notAuthorized"
  | "notFound";

export type SocialField = "label" | "platform" | "url" | "form";
export type SocialErrors = Partial<Record<SocialField, SocialErrorCode>>;

export type SocialActionResult = { status: "success" } | { status: "error"; errors: SocialErrors };

const TABLE = "social_links";
const UNIQUE_VIOLATION = "23505";
const NOT_AUTHORIZED: SocialActionResult = { status: "error", errors: { form: "notAuthorized" } };

function revalidateSocial() {
  revalidatePath("/admin/social");
  // Publishes add / edit / hide / reorder / delete to the footer social row.
  // Reordering runs through updateSocialLinkAction, so it is covered too.
  updateTag(PUBLIC_SOCIAL_TAG);
}

type ParsedLink = {
  platform: string;
  label: string;
  url: string | null;
  displayOrder: number;
  isVisible: boolean;
};

function parse(form: FormData): { ok: true; value: ParsedLink } | { ok: false; errors: SocialErrors } {
  const errors: SocialErrors = {};

  const label = String(form.get("label") ?? "").trim();
  const rawUrl = String(form.get("url") ?? "").trim();
  const submittedPlatform = String(form.get("platform") ?? "").trim().toLowerCase();
  const rawOrder = Number(String(form.get("display_order") ?? "").trim());

  if (!label) errors.label = "labelRequired";

  // Platform is the stable machine key; derived from the label when adding.
  const platform = submittedPlatform || deriveSlug(label);
  if (!platform) errors.platform = "platformRequired";

  let url: string | null = null;

  if (rawUrl) {
    try {
      const parsed = new URL(rawUrl);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") errors.url = "url";
      else url = rawUrl;
    } catch {
      errors.url = "url";
    }
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      platform,
      label,
      url,
      displayOrder: Number.isInteger(rawOrder) && rawOrder >= 0 && rawOrder <= 9999 ? rawOrder : 0,
      isVisible: form.get("is_visible") === "on",
    },
  };
}

function toRow(value: ParsedLink) {
  return {
    platform: value.platform,
    label: value.label,
    url: value.url,
    display_order: value.displayOrder,
    is_visible: value.isVisible,
  };
}

export async function createSocialLinkAction(formData: FormData): Promise<SocialActionResult> {
  const parsed = parse(formData);
  if (!parsed.ok) return { status: "error", errors: parsed.errors };

  const supabase = await getAdminActionClient();
  if (!supabase) return NOT_AUTHORIZED;

  const { data, error } = await supabase.from(TABLE).insert(toRow(parsed.value)).select("id");

  if (error) {
    if (error.code === UNIQUE_VIOLATION) return { status: "error", errors: { label: "duplicate" } };
    return { status: "error", errors: { form: "save" } };
  }

  if (!data || data.length === 0) return NOT_AUTHORIZED;

  revalidateSocial();

  return { status: "success" };
}

export async function updateSocialLinkAction(id: string, formData: FormData): Promise<SocialActionResult> {
  const parsed = parse(formData);
  if (!parsed.ok) return { status: "error", errors: parsed.errors };

  const supabase = await getAdminActionClient();
  if (!supabase) return NOT_AUTHORIZED;

  const { data, error } = await supabase.from(TABLE).update(toRow(parsed.value)).eq("id", id).select("id");

  if (error) {
    if (error.code === UNIQUE_VIOLATION) return { status: "error", errors: { label: "duplicate" } };
    return { status: "error", errors: { form: "save" } };
  }

  if (!data || data.length === 0) return { status: "error", errors: { form: "notFound" } };

  revalidateSocial();

  return { status: "success" };
}

export async function deleteSocialLinkAction(id: string): Promise<SocialActionResult> {
  const supabase = await getAdminActionClient();
  if (!supabase) return NOT_AUTHORIZED;

  const { data, error } = await supabase.from(TABLE).delete().eq("id", id).select("id");

  if (error) return { status: "error", errors: { form: "delete" } };
  if (!data || data.length === 0) return { status: "error", errors: { form: "notFound" } };

  revalidateSocial();

  return { status: "success" };
}

export async function setSocialVisibilityAction(id: string, isVisible: boolean): Promise<SocialActionResult> {
  const supabase = await getAdminActionClient();
  if (!supabase) return NOT_AUTHORIZED;

  const { data, error } = await supabase.from(TABLE).update({ is_visible: isVisible }).eq("id", id).select("id");

  if (error) return { status: "error", errors: { form: "save" } };
  if (!data || data.length === 0) return { status: "error", errors: { form: "notFound" } };

  revalidateSocial();

  return { status: "success" };
}
