"use client";

import { CakeSlice, Coffee, GlassWater, Minus, Plus, Sandwich, Search, Snowflake, Star, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { menuCategories, menuProducts, normalizeCategory, type MenuCategory, type MenuProduct } from "@/data/menu";
import { MediaFallback } from "./MediaFallback";
import { MenuCategoryExperience } from "./MenuCategoryExperience";

const placeholderSizes = ["Small", "Medium", "Large"] as const;
const placeholderMilks = ["Whole Milk", "Oat Milk", "Almond Milk"] as const;
const placeholderExtras = ["Extra Shot", "Vanilla Syrup", "Caramel Syrup", "Hazelnut Syrup"] as const;
const categoryIcons = { Popular: Star, "Hot Drinks": Coffee, "Cold Drinks": Snowflake, "Fresh Juices": GlassWater, Sandwiches: Sandwich, Desserts: CakeSlice } as const;

type ProductDetailsPanelProps = {
  product: MenuProduct;
  closeRef: React.RefObject<HTMLButtonElement | null>;
  panelRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
};

function ProductDetailsPanel({ product, closeRef, panelRef, onClose }: ProductDetailsPanelProps) {
  const reduceMotion = useReducedMotion();
  const [size, setSize] = useState<(typeof placeholderSizes)[number]>("Medium");
  const [milk, setMilk] = useState<(typeof placeholderMilks)[number]>("Whole Milk");
  const [extras, setExtras] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const transition = reduceMotion ? { duration: 0 } : { duration: .45, ease: [0.22, 1, 0.36, 1] as const };

  const toggleExtra = (extra: string) => setExtras((current) => current.includes(extra) ? current.filter((item) => item !== extra) : [...current, extra]);

  return (
    <motion.div className="dialog-backdrop" role="presentation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0 : .3 }} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <motion.section ref={panelRef} className="menu-product-drawer" role="dialog" aria-modal="true" aria-labelledby="product-title" initial={{ x: reduceMotion ? 0 : "100%" }} animate={{ x: 0 }} exit={{ x: reduceMotion ? 0 : "100%" }} transition={transition}>
        <div className="product-dialog__topbar"><span>{product.category}</span><button ref={closeRef} className="dialog-close" onClick={onClose} aria-label="Close product details"><X /></button></div>
        <div className="product-dialog__scroll">
          <header className="product-dialog__header"><p className="eyebrow">Product Details</p><h2 id="product-title">{product.name}</h2><i aria-hidden="true" /></header>
          <motion.div className="product-dialog__media" initial={{ opacity: 0, scale: reduceMotion ? 1 : .97 }} animate={{ opacity: 1, scale: 1 }} transition={{ ...transition, delay: reduceMotion ? 0 : .12 }}><MediaFallback src={product.image} alt={product.name} fit="contain" sizes="(max-width: 600px) 100vw, 520px" /></motion.div>
          <div className="product-dialog__intro"><p>{product.description}</p><p className="availability">Price available in store</p></div>
          <motion.div className="product-options" initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: reduceMotion ? 0 : .08, delayChildren: reduceMotion ? 0 : .18 } } }}>
            <p className="product-options__note">Customization preview — temporary options for future ordering.</p>
            <motion.fieldset variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}><legend>Choose Size</legend><div className="option-grid option-grid--three">{placeholderSizes.map((option) => <label key={option} className="option-control"><input type="radio" name="size" value={option} checked={size === option} onChange={() => setSize(option)} /><span>{option}</span></label>)}</div></motion.fieldset>
            <motion.fieldset variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}><legend>Milk Options</legend><div className="option-grid">{placeholderMilks.map((option) => <label key={option} className="option-control"><input type="radio" name="milk" value={option} checked={milk === option} onChange={() => setMilk(option)} /><span>{option}</span></label>)}</div></motion.fieldset>
            <motion.fieldset variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}><legend>Add Extras</legend><div className="option-grid">{placeholderExtras.map((option) => <label key={option} className="option-control"><input type="checkbox" value={option} checked={extras.includes(option)} onChange={() => toggleExtra(option)} /><span>{option}</span></label>)}</div></motion.fieldset>
            <motion.fieldset variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}><legend>Quantity</legend><div className="quantity-control"><button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} disabled={quantity === 1} aria-label="Decrease quantity"><Minus /></button><output aria-live="polite" aria-label={`Quantity: ${quantity}`}>{quantity}</output><button type="button" onClick={() => setQuantity((value) => value + 1)} aria-label="Increase quantity"><Plus /></button></div></motion.fieldset>
          </motion.div>
        </div>
        <footer className="product-dialog__footer"><button className="product-dialog__cta" disabled>Add to Order <span>Coming Soon</span></button></footer>
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
