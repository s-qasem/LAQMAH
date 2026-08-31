"use client";

import { Search, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { getLenis } from "@/components/animations/SmoothScrollProvider";
import { POPULAR_PRESENTATION, categoryPresentation, formatMenuPrice } from "@/data/menu-presentation";
import type { PublicCategory, PublicProduct } from "@/lib/supabase/menu-public";

import { MediaFallback } from "./MediaFallback";
import { MenuCategoryExperience } from "./MenuCategoryExperience";

const POPULAR_SLUG = "popular";

type ProductDetailsPanelProps = {
  product: PublicProduct;
  categoryLabel: string;
  closeRef: React.RefObject<HTMLButtonElement | null>;
  panelRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
};

function ProductDetailsPanel({ product, categoryLabel, closeRef, panelRef, onClose }: ProductDetailsPanelProps) {
  const reduceMotion = useReducedMotion();
  const transition = reduceMotion ? { duration: 0 } : { duration: .45, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <motion.div className="dialog-backdrop" role="presentation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0 : .3 }} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <motion.section ref={panelRef} className="menu-product-drawer" role="dialog" aria-modal="true" aria-labelledby="product-title" initial={{ x: reduceMotion ? 0 : "100%" }} animate={{ x: 0 }} exit={{ x: reduceMotion ? 0 : "100%" }} transition={transition}>
        <div className="product-dialog__topbar"><span>{categoryLabel}</span><button ref={closeRef} className="dialog-close" onClick={onClose} aria-label="Close product details"><X /></button></div>
        <div className="product-dialog__scroll">
          <header className="product-dialog__header"><p className="eyebrow">Product Details</p><h2 id="product-title">{product.name}</h2><i aria-hidden="true" /></header>
          <motion.div className="product-dialog__media" initial={{ opacity: 0, scale: reduceMotion ? 1 : .97 }} animate={{ opacity: 1, scale: 1 }} transition={{ ...transition, delay: reduceMotion ? 0 : .12 }}><MediaFallback src={product.image} alt={product.name} fit="contain" sizes="(max-width: 600px) 100vw, 520px" /></motion.div>
          <div className="product-dialog__intro"><p>{product.description}</p><p className="availability">{formatMenuPrice(product.price)}</p><p className="availability">Available in store</p></div>
        </div>
      </motion.section>
    </motion.div>
  );
}

type MenuExplorerProps = {
  categories: PublicCategory[];
  products: PublicProduct[];
};

export function MenuExplorer({ categories, products: allProducts }: MenuExplorerProps) {
  const params = useSearchParams();
  const router = useRouter();

  /**
   * Accepts the English label (what the homepage rail has always linked with)
   * or the slug, so existing links keep working. Anything unknown lands on
   * Popular, exactly as before.
   */
  const resolveParam = (value: string | null) => {
    if (!value) return POPULAR_SLUG;
    let normalized = value.replace(/\+/g, " ");
    try {
      normalized = decodeURIComponent(normalized);
    } catch {
      // Malformed percent-encoding is treated as an unknown category.
    }
    const needle = normalized.trim().toLowerCase();
    const match = categories.find((entry) => entry.name.toLowerCase() === needle || entry.slug === needle);
    return match?.slug ?? POPULAR_SLUG;
  };

  const [category, setCategory] = useState<string>(() => resolveParam(params.get("category")));
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<PublicProduct | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const toolsRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  // Seeded with the initial category so the first render never scrolls.
  const previousCategory = useRef(category);

  // Popular is a computed view over featured products, never a category row.
  const products = allProducts.filter((item) => (category === POPULAR_SLUG ? item.featured : item.categorySlug === category) && item.name.toLowerCase().includes(query.toLowerCase()));

  const activeCategory = categories.find((entry) => entry.slug === category);
  const activeLabel = category === POPULAR_SLUG ? "Popular" : activeCategory?.name ?? "Popular";

  const tabs = [{ slug: POPULAR_SLUG, name: "Popular" }, ...categories.map((entry) => ({ slug: entry.slug, name: entry.name }))];

  const selectCategory = (nextSlug: string, nextName: string) => {
    setCategory(nextSlug);
    const nextParams = new URLSearchParams(params.toString());
    // Keeps the URL shape identical to the previous implementation.
    nextParams.set("category", nextName);
    router.replace(`/menu?${nextParams.toString()}`, { scroll: false });
  };

  /**
   * Switching category replaces the products in place, so the window keeps the
   * scroll position from the previous category and the visitor lands partway
   * down the new one. Move to the start of the new category's content instead.
   *
   * Deliberately scoped to a genuine category change: the initial render — a
   * direct /menu?category=... link included — and every search keystroke leave
   * the position alone, and re-selecting the active category is a no-op.
   */
  useEffect(() => {
    if (previousCategory.current === category) return;
    previousCategory.current = category;

    const target = heroRef.current;
    if (!target) return;

    // The navbar is fixed and the category bar sticks directly beneath it, so
    // the hero would otherwise come to rest underneath both.
    const navbar = document.querySelector<HTMLElement>(".navbar");
    const offset =
      (navbar?.getBoundingClientRect().height ?? 0) + (toolsRef.current?.getBoundingClientRect().height ?? 0);

    const immediate = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lenis = getLenis();

    if (lenis) {
      // The instance that owns the scroll position, so nothing double-animates.
      lenis.scrollTo(target, { offset: -offset, immediate });
      return;
    }

    // Only reached if smooth scrolling is unavailable.
    window.scrollTo({
      top: target.getBoundingClientRect().top + window.scrollY - offset,
      behavior: immediate ? "auto" : "smooth",
    });
  }, [category]);

  useEffect(() => {
    if (!selected) return;
    document.body.style.overflow = "hidden";
    const focusFrame = requestAnimationFrame(() => closeRef.current?.focus());
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
      if (event.key === "Tab") {
        const focusable = panelRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])');
        if (!focusable?.length) return;
        const first = focusable[0]; const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", close);
    return () => { cancelAnimationFrame(focusFrame); document.body.style.overflow = ""; window.removeEventListener("keydown", close); };
  }, [selected]);

  return <div className="menu-explorer menu-explorer--hot">
    <div ref={toolsRef} className="menu-tools menu-tools--hot"><div className="category-nav" role="tablist" aria-label="Menu categories">{tabs.map((item) => { const presentation = item.slug === POPULAR_SLUG ? POPULAR_PRESENTATION : categoryPresentation(item.slug); const Icon = presentation.icon; return <button key={item.slug} role="tab" aria-selected={category === item.slug} onClick={() => selectCategory(item.slug, item.name)}><Icon aria-hidden="true" /><span>{presentation.shortLabel ?? item.name}</span></button>; })}</div><label className="search-field"><Search /><span className="sr-only">Search menu</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the menu" /></label></div>
    <MenuCategoryExperience heroRef={heroRef} categorySlug={category} categoryLabel={activeLabel} products={products} onSelect={(product, trigger) => { triggerRef.current = trigger; setSelected(product); }} />
    {!products.length ? <div className="empty-state empty-state--dark"><p>No items match this search.</p><button className="button button--outline" onClick={() => setQuery("")}>Clear search</button></div> : null}
    <AnimatePresence onExitComplete={() => triggerRef.current?.focus()}>{selected ? <ProductDetailsPanel key={selected.id} product={selected} categoryLabel={categories.find((entry) => entry.slug === selected.categorySlug)?.name ?? activeLabel} closeRef={closeRef} panelRef={panelRef} onClose={() => setSelected(null)} /> : null}</AnimatePresence>
  </div>;
}
