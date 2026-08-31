"use client";

import { Plus } from "lucide-react";

import { images } from "@/data/images";
import { categoryPresentation, formatMenuPrice } from "@/data/menu-presentation";
import type { PublicProduct } from "@/lib/supabase/menu-public";

import { MediaFallback } from "./MediaFallback";

type MenuCategoryExperienceProps = {
  /**
   * Start of this category's content. MenuExplorer scrolls here when the
   * visitor switches category, so the new category starts at its first row.
   */
  heroRef?: React.Ref<HTMLElement>;
  /** Category slug, or "popular" for the computed tab. */
  categorySlug: string;
  /** English label, used for the section's accessible name. */
  categoryLabel: string;
  products: PublicProduct[];
  onSelect: (product: PublicProduct, trigger: HTMLButtonElement) => void;
};

export function MenuCategoryExperience({
  heroRef,
  categorySlug,
  categoryLabel,
  products,
  onSelect,
}: MenuCategoryExperienceProps) {
  // Hero copy and artwork stay design-owned, keyed by slug, with a neutral
  // fallback for any category added later through the admin.
  const presentation = categoryPresentation(categorySlug);
  const hero = presentation.hero;

  return <>
    <section ref={heroRef} className="hot-coffee-hero" aria-labelledby="category-hero-title">
      <div className="hot-coffee-hero__background" aria-hidden="true"><MediaFallback src={images.intro} alt="" sizes="100vw" /></div>
      <div className="hot-coffee-hero__shade" aria-hidden="true" />
      <div className="hot-coffee-hero__inner">
        <div className="hot-coffee-hero__copy">
          <p className="eyebrow">{hero.eyebrow}</p>
          <h2 id="category-hero-title">{hero.heading.map((line, index) => <span key={line}>{line}{index < hero.heading.length - 1 ? <br /> : null}</span>)}</h2>
          <p>{hero.body}</p>
          <div className="hot-coffee-hero__actions"><a className="button button--gold" href="#menu-collection">Explore Menu</a></div>
        </div>
        <div className={`hot-coffee-hero__visual${presentation.heroModifier === "cold" ? " hot-coffee-hero__visual--cold" : ""}`} aria-hidden="true">
          {presentation.heroModifier === "hot" ? <div className="hot-coffee-hero__steam"><span /><span /></div> : null}
          <MediaFallback src={hero.image} alt="" fit="contain" sizes="(max-width: 760px) 70vw, 42vw" />
        </div>
      </div>
    </section>
    <section id="menu-collection" className="coffee-collection" aria-label={`${categoryLabel} products`}>
      {products.length ? <div className="coffee-card-grid">{products.map((product) => <button key={product.id} type="button" className="coffee-card" onClick={(event) => onSelect(product, event.currentTarget)} aria-label={`View details for ${product.name}`}>
        <span className="coffee-card__media"><MediaFallback src={product.image} alt={product.name} fit="contain" sizes="(max-width: 520px) 44vw, (max-width: 960px) 30vw, 18vw" /></span>
        <span className="coffee-card__content"><strong>{product.name}</strong><span>{product.description}</span><small>{formatMenuPrice(product.price)}</small></span>
        <span className="coffee-card__plus" aria-hidden="true"><Plus /></span>
      </button>)}</div> : null}
    </section>
  </>;
}
