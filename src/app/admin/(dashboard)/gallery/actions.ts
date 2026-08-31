"use server";

import { revalidatePath, updateTag } from "next/cache";

import { isAcceptableImageValue } from "@/lib/menu-images";
import { getAdminActionClient } from "@/lib/supabase/admin-action";
import { PUBLIC_GALLERY_TAG } from "@/lib/supabase/gallery-public";
import { deleteMenuImageIfManaged } from "@/lib/supabase/menu-storage";
import { deriveSlug } from "@/lib/supabase/menu-categories";
import { listGalleryImages } from "@/lib/supabase/site-content";

export type GalleryErrorCode =
  | "altRequired"
  | "categoryRequired"
  | "imageRequired"
  | "imageInvalid"
  | "duplicate"
  | "save"
  | "delete"
  | "notAuthorized"
  | "notFound";

export type GalleryField = "altEn" | "altAr" | "category" | "image" | "form";
export type GalleryErrors = Partial<Record<GalleryField, GalleryErrorCode>>;

export type GalleryActionResult = { status: "success" } | { status: "error"; errors: GalleryErrors };

const TABLE = "gallery_images";
const UNIQUE_VIOLATION = "23505";
const NOT_AUTHORIZED: GalleryActionResult = { status: "error", errors: { form: "notAuthorized" } };

/** Gallery objects live under this prefix; nothing else may be deleted here. */
const PREFIX = "gallery";

function revalidateGallery() {
  revalidatePath("/admin/gallery");
  revalidatePath("/admin");
  // Publishes add / edit / replace / hide / reorder / delete to the public
  // gallery. `updateTag` is the Server-Action form and applies immediately.
  updateTag(PUBLIC_GALLERY_TAG);
}

type ParsedImage = {
  category: string;
  imageUrl: string;
  altEn: string;
  altAr: string | null;
  displayOrder: number;
  isVisible: boolean;
  slug: string;
};

function parse(form: FormData): { ok: true; value: ParsedImage } | { ok: false; errors: GalleryErrors } {
  const errors: GalleryErrors = {};

  const category = String(form.get("category") ?? "").trim();
  const altEn = String(form.get("alt_en") ?? "").trim();
  const altAr = String(form.get("alt_ar") ?? "").trim();
  const imageUrl = String(form.get("image_url") ?? "").trim();
  const rawOrder = String(form.get("display_order") ?? "").trim();
  const submittedSlug = String(form.get("slug") ?? "").trim().toLowerCase();

  if (!category) errors.category = "categoryRequired";
  if (!altEn) errors.altEn = "altRequired";

  if (!imageUrl) errors.image = "imageRequired";
  // A gallery image may be a seeded bundle path or an uploaded Storage URL.
  else if (!isAcceptableImageValue(imageUrl)) errors.image = "imageInvalid";

  const slug = submittedSlug || deriveSlug(altEn) || deriveSlug(category);
  if (!slug) errors.altEn = "altRequired";

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const order = Number(rawOrder);

  return {
    ok: true,
    value: {
      category,
      imageUrl,
      altEn,
      altAr: altAr || null,
      displayOrder: Number.isInteger(order) && order >= 0 && order <= 9999 ? order : 0,
      isVisible: form.get("is_visible") === "on",
      slug,
    },
  };
}

function toRow(value: ParsedImage) {
  return {
    slug: value.slug,
    category: value.category,
    image_url: value.imageUrl,
    alt_en: value.altEn,
    alt_ar: value.altAr,
    display_order: value.displayOrder,
    is_visible: value.isVisible,
  };
}

export async function createGalleryImageAction(formData: FormData): Promise<GalleryActionResult> {
  const parsed = parse(formData);
  if (!parsed.ok) return { status: "error", errors: parsed.errors };

  const supabase = await getAdminActionClient();
  if (!supabase) return NOT_AUTHORIZED;

  const { data, error } = await supabase.from(TABLE).insert(toRow(parsed.value)).select("id");

  if (error) {
    await deleteMenuImageIfManaged(supabase, parsed.value.imageUrl, PREFIX);
    if (error.code === UNIQUE_VIOLATION) return { status: "error", errors: { altEn: "duplicate" } };
    return { status: "error", errors: { form: "save" } };
  }

  if (!data || data.length === 0) {
    await deleteMenuImageIfManaged(supabase, parsed.value.imageUrl, PREFIX);
    return NOT_AUTHORIZED;
  }

  revalidateGallery();

  return { status: "success" };
}

export async function updateGalleryImageAction(id: string, formData: FormData): Promise<GalleryActionResult> {
  const parsed = parse(formData);
  if (!parsed.ok) return { status: "error", errors: parsed.errors };

  const supabase = await getAdminActionClient();
  if (!supabase) return NOT_AUTHORIZED;

  const savedImageUrl = String(formData.get("current_image_url") ?? "") || null;
  const replaced = parsed.value.imageUrl === savedImageUrl ? null : savedImageUrl;

  const { data, error } = await supabase.from(TABLE).update(toRow(parsed.value)).eq("id", id).select("id");

  if (error) {
    if (replaced) await deleteMenuImageIfManaged(supabase, parsed.value.imageUrl, PREFIX);
    if (error.code === UNIQUE_VIOLATION) return { status: "error", errors: { altEn: "duplicate" } };
    return { status: "error", errors: { form: "save" } };
  }

  if (!data || data.length === 0) {
    if (replaced) await deleteMenuImageIfManaged(supabase, parsed.value.imageUrl, PREFIX);
    return { status: "error", errors: { form: "notFound" } };
  }

  // Seeded `/public` paths never match the prefix guard, so replacing a seeded
  // image leaves the original bundle file untouched.
  await deleteMenuImageIfManaged(supabase, replaced, PREFIX);

  revalidateGallery();

  return { status: "success" };
}

export async function deleteGalleryImageAction(id: string): Promise<GalleryActionResult> {
  const supabase = await getAdminActionClient();
  if (!supabase) return NOT_AUTHORIZED;

  const { data, error } = await supabase.from(TABLE).delete().eq("id", id).select("id, image_url");

  if (error) return { status: "error", errors: { form: "delete" } };
  if (!data || data.length === 0) return { status: "error", errors: { form: "notFound" } };

  await deleteMenuImageIfManaged(supabase, (data[0] as { image_url: string | null }).image_url, PREFIX);

  revalidateGallery();

  return { status: "success" };
}

export async function setGalleryVisibilityAction(id: string, isVisible: boolean): Promise<GalleryActionResult> {
  const supabase = await getAdminActionClient();
  if (!supabase) return NOT_AUTHORIZED;

  const { data, error } = await supabase.from(TABLE).update({ is_visible: isVisible }).eq("id", id).select("id");

  if (error) return { status: "error", errors: { form: "save" } };
  if (!data || data.length === 0) return { status: "error", errors: { form: "notFound" } };

  revalidateGallery();

  return { status: "success" };
}

/**
 * Moves an image one position. Rewrites the whole list as a 1-based sequence
 * rather than swapping two values, so ordering stays correct even when rows
 * share an order.
 */
export async function moveGalleryImageAction(id: string, direction: "up" | "down"): Promise<GalleryActionResult> {
  const supabase = await getAdminActionClient();
  if (!supabase) return NOT_AUTHORIZED;

  const listed = await listGalleryImages();
  if (!listed.ok) return { status: "error", errors: { form: "save" } };

  const ordered = listed.images;
  const index = ordered.findIndex((image) => image.id === id);
  if (index === -1) return { status: "error", errors: { form: "notFound" } };

  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= ordered.length) return { status: "success" };

  const reordered = [...ordered];
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

  const changed = reordered
    .map((image, position) => ({ id: image.id, display_order: position + 1 }))
    .filter((row, position) => reordered[position].displayOrder !== row.display_order);

  for (const row of changed) {
    const { data, error } = await supabase
      .from(TABLE)
      .update({ display_order: row.display_order })
      .eq("id", row.id)
      .select("id");

    if (error) return { status: "error", errors: { form: "save" } };
    if (!data || data.length === 0) return { status: "error", errors: { form: "notFound" } };
  }

  revalidateGallery();

  return { status: "success" };
}
