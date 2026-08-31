"use client";

import Image from "next/image";
import { useState } from "react";

import { imageSrcFor } from "@/lib/menu-images";

import { useAdminLanguage } from "./AdminLanguageProvider";

type AdminThumbProps = {
  url: string | null;
  /** Describes what the thumbnail shows, for assistive technology. */
  label: string;
  /** `tile` for the category card banner, `row` for the compact list thumbnail. */
  variant?: "tile" | "row";
};

/**
 * Image preview for category and product records.
 *
 * Handles both stored shapes through the single rule in `menu-images.ts`: the
 * seeded menu's root-relative bundle paths and the uploader's absolute Storage
 * URLs. The LQMAH mark appears only when there is no image, when the value is
 * not renderable, or when the file genuinely fails to load.
 */
export function AdminThumb({ url, label, variant = "tile" }: AdminThumbProps) {
  const { t } = useAdminLanguage();
  const [failed, setFailed] = useState(false);

  const src = imageSrcFor(url);
  const showImage = src !== null && !failed;

  return (
    <div
      className={`admin-thumb admin-thumb--${variant}`}
      data-empty={showImage ? undefined : "true"}
      role={showImage ? undefined : "img"}
      aria-label={showImage ? undefined : t("categories.noImage")}
    >
      {showImage ? (
        <Image
          src={src}
          alt={label}
          fill
          sizes={variant === "row" ? "68px" : "(max-width: 48em) 100vw, 17rem"}
          style={{ objectFit: "cover" }}
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="admin-thumb__mark" aria-hidden="true">
          LQMAH
        </span>
      )}
    </div>
  );
}
