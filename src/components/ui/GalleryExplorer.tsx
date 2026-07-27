"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { galleryImages } from "@/data/images";
import { MediaFallback } from "./MediaFallback";

const categories = ["All", "Exterior", "Interior", "Drinks", "Desserts", "Atmosphere"];

export function GalleryExplorer() {
  const [category, setCategory] = useState("All");
  const [active, setActive] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const filtered = galleryImages.filter((image) => category === "All" || image.category === category);
  useEffect(() => {
    if (active === null) return;
    closeRef.current?.focus(); document.body.style.overflow = "hidden";
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") setActive(null); if (event.key === "ArrowRight") setActive((active + 1) % filtered.length); if (event.key === "ArrowLeft") setActive((active - 1 + filtered.length) % filtered.length); };
    window.addEventListener("keydown", key); return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", key); };
  }, [active, filtered.length]);
  const image = active === null ? null : filtered[active];
  return <><div className="gallery-filters" role="tablist" aria-label="Gallery categories">{categories.map((item) => <button key={item} role="tab" aria-selected={category === item} onClick={() => { setCategory(item); setActive(null); }}>{item}</button>)}</div><div className="gallery-grid">{filtered.map((item, index) => <button key={item.id} onClick={() => setActive(index)} aria-label={`Open ${item.alt}`}><MediaFallback src={item.src} alt={item.alt} sizes="(max-width: 768px) 100vw, 40vw" /><span>{item.category}</span></button>)}</div>{image ? <div className="lightbox" role="dialog" aria-modal="true" aria-label="Gallery image"><button ref={closeRef} onClick={() => setActive(null)} aria-label="Close lightbox"><X /></button><button onClick={() => setActive((active! - 1 + filtered.length) % filtered.length)} aria-label="Previous image"><ChevronLeft /></button><MediaFallback src={image.src} alt={image.alt} /><button onClick={() => setActive((active! + 1) % filtered.length)} aria-label="Next image"><ChevronRight /></button><p>{image.alt}</p></div> : null}</>;
}
