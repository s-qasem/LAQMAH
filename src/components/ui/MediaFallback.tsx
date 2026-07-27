"use client";

import Image from "next/image";
import { useState } from "react";

type MediaFallbackProps = {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  fit?: "cover" | "contain";
  position?: string;
};

export function MediaFallback({ src, alt, className = "", priority = false, sizes = "100vw", fit = "cover", position = "center" }: MediaFallbackProps) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`media-fallback ${className}`} data-missing={failed || undefined} data-fit={fit}>
      {!failed ? <Image src={src} alt={alt} fill priority={priority} sizes={sizes} style={{ objectFit: fit, objectPosition: position }} onError={() => setFailed(true)} /> : null}
      {failed ? <span aria-hidden="true" className="media-fallback__mark">LQMAH</span> : null}
    </div>
  );
}
