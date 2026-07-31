"use client";

import { CakeSlice, Coffee, GlassWater, Sandwich, Search, Snowflake, Star, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { menuCategories, menuProducts, normalizeCategory, type MenuCategory, type MenuProduct } from "@/data/menu";
import { MediaFallback } from "./MediaFallback";
import { MenuCategoryExperience } from "./MenuCategoryExperience";

const categoryIcons = { Popular: Star, "Hot Drinks": Coffee, "Cold Drinks": Snowflake, "Fresh Juices": GlassWater, Sandwiches: Sandwich, Desserts: CakeSlice } as const;

type ProductDetailsPanelProps = {
  product: MenuProduct;
  closeRef: React.RefObject<HTMLButtonElement | null>;
  panelRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
};

function ProductDetailsPanel({ product, closeRef, panelRef, onClose }: ProductDetailsPanelProps) {
  const reduceMotion = useReducedMotion();
  const transition = reduceMotion ? { duration: 0 } : { duration: .45, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <motion.div className="dialog-backdrop" role="presentation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0 : .3 }} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <motion.section ref={panelRef} className="menu-product-drawer" role="dialog" aria-modal="true" aria-labelledby="product-title" initial={{ x: reduceMotion ? 0 : "100%" }} animate={{ x: 0 }} exit={{ x: reduceMotion ? 0 : "100%" }} transition={transition}>
        <div className="product-dialog__topbar"><span>{product.category}</span><button ref={closeRef} className="dialog-close" onClick={onClose} aria-label="Close product details"><X /></button></div>
        <div className="product-dialog__scroll">
          <header className="product-dialog__header"><p className="eyebrow">Product Details</p><h2 id="product-title">{product.name}</h2><i aria-hidden="true" /></header>
          <motion.div className="product-dialog__media" initial={{ opacity: 0, scale: reduceMotion ? 1 : .97 }} animate={{ opacity: 1, scale: 1 }} transition={{ ...transition, delay: reduceMotion ? 0 : .12 }}><MediaFallback src={product.image} alt={product.name} fit="contain" sizes="(max-width: 600px) 100vw, 520px" /></motion.div>
          <div className="product-dialog__intro"><p>{product.description}</p><p className="availability">Price available in store</p><p className="availability">Available in store</p></div>
        </div>
      </motion.section>
    </motion.div>
  );
}

export function MenuExplorer() {
  const params = useSearchParams();
  const router = useRouter();
  const [category, setCategory] = useState<MenuCategory>(() => normalizeCategory(params.get("category")));
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MenuProduct | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const products = menuProducts.filter((item) => (category === "Popular" ? item.featured : item.category === category) && item.name.toLowerCase().includes(query.toLowerCase()));

  const selectCategory = (nextCategory: MenuCategory) => {
    setCategory(nextCategory);
    const nextParams = new URLSearchParams(params.toString());
    nextParams.set("category", nextCategory);
    router.replace(`/menu?${nextParams.toString()}`, { scroll: false });
  };

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
    <div className="menu-tools menu-tools--hot"><div className="category-nav" role="tablist" aria-label="Menu categories">{menuCategories.map((item) => { const Icon = categoryIcons[item]; return <button key={item} role="tab" aria-selected={category === item} onClick={() => selectCategory(item)}><Icon aria-hidden="true" /><span>{item === "Fresh Juices" ? "Juices" : item}</span></button>; })}</div><label className="search-field"><Search /><span className="sr-only">Search menu</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the menu" /></label></div>
    <MenuCategoryExperience category={category} products={products} onSelect={(product, trigger) => { triggerRef.current = trigger; setSelected(product); }} />
    {!products.length ? <div className="empty-state empty-state--dark"><p>No items match this search.</p><button className="button button--outline" onClick={() => setQuery("")}>Clear search</button></div> : null}
    <AnimatePresence onExitComplete={() => triggerRef.current?.focus()}>{selected ? <ProductDetailsPanel key={selected.id} product={selected} closeRef={closeRef} panelRef={panelRef} onClose={() => setSelected(null)} /> : null}</AnimatePresence>
  </div>;
}
