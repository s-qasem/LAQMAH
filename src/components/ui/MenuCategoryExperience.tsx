"use client";

import { Plus } from "lucide-react";
import type { MenuCategory, MenuProduct } from "@/data/menu";
import { images } from "@/data/images";
import { MediaFallback } from "./MediaFallback";

type CategoryHero = {
  eyebrow: string;
  heading: readonly string[];
  body: string;
  image: string;
};

const categoryHeroes: Record<MenuCategory, CategoryHero> = {
  Popular: {
    eyebrow: "House Favorites",
    heading: ["The LQMAH Favorites.", "Loved for a Reason."],
    body: "A curated selection of the drinks, desserts, and bites our guests return for again and again.",
    image: images.desserts.cookie,
  },
  "Hot Drinks": {
    eyebrow: "Crafted Daily",
    heading: ["Crafted Daily.", "Served with Passion."],
    body: "From focused espresso to silky steamed milk, every cup is prepared with care for a warm LQMAH moment.",
    image: images.coffee.latte,
  },
  "Cold Drinks": {
    eyebrow: "Chilled to Perfection",
    heading: ["Cool, Smooth.", "Made to Refresh."],
    body: "Refreshing iced drinks, layered flavors, and carefully crafted finishes for every kind of craving.",
    image: images.drinks.icedCoffee,
  },
  "Fresh Juices": {
    eyebrow: "Freshly Blended",
    heading: ["Fresh Fruit.", "Bright Flavor."],
    body: "Vibrant juices blended from fresh ingredients and served with the signature LQMAH touch.",
    image: images.drinks.cocktail,
  },
  Sandwiches: {
    eyebrow: "Made Fresh",
    heading: ["Crafted for Every Bite."],
    body: "Warm, satisfying sandwiches prepared with fresh ingredients and balanced flavor.",
    image: images.sandwiches.club,
  },
  Desserts: {
    eyebrow: "Sweetly Crafted",
    heading: ["Made to Indulge."],
    body: "Handcrafted desserts, rich textures, and memorable finishes made for sharing—or keeping to yourself.",
    image: images.desserts.sanSebastianCake,
  },
};

type MenuCategoryExperienceProps = {
  category: MenuCategory;
  products: MenuProduct[];
  onSelect: (product: MenuProduct, trigger: HTMLButtonElement) => void;
};

export function MenuCategoryExperience({ category, products, onSelect }: MenuCategoryExperienceProps) {
  const hero = categoryHeroes[category];

  return <>
    <section className="hot-coffee-hero" aria-labelledby="category-hero-title">
      <div className="hot-coffee-hero__background" aria-hidden="true"><MediaFallback src={images.intro} alt="" sizes="100vw" /></div>
      <div className="hot-coffee-hero__shade" aria-hidden="true" />
      <div className="hot-coffee-hero__inner">
        <div className="hot-coffee-hero__copy">
          <p className="eyebrow">{hero.eyebrow}</p>
          <h2 id="category-hero-title">{hero.heading.map((line, index) => <span key={line}>{line}{index < hero.heading.length - 1 ? <br /> : null}</span>)}</h2>
          <p>{hero.body}</p>
          <div className="hot-coffee-hero__actions"><a className="button button--gold" href="#menu-collection">Explore Menu</a></div>
        </div>
        <div className={`hot-coffee-hero__visual${category === "Cold Drinks" ? " hot-coffee-hero__visual--cold" : ""}`} aria-hidden="true">
          {category === "Hot Drinks" ? <div className="hot-coffee-hero__steam"><span /><span /></div> : null}
          <MediaFallback src={hero.image} alt="" fit="contain" sizes="(max-width: 760px) 70vw, 42vw" />
        </div>
      </div>
    </section>
    <section id="menu-collection" className="coffee-collection" aria-label={`${category} products`}>
      {products.length ? <div className="coffee-card-grid">{products.map((product) => <button key={product.id} type="button" className="coffee-card" onClick={(event) => onSelect(product, event.currentTarget)} aria-label={`View details for ${product.name}`}>
        <span className="coffee-card__media"><MediaFallback src={product.image} alt={product.name} fit="contain" sizes="(max-width: 520px) 44vw, (max-width: 960px) 30vw, 18vw" /></span>
        <span className="coffee-card__content"><strong>{product.name}</strong><span>{product.description}</span><small>Price available in store</small></span>
        <span className="coffee-card__plus" aria-hidden="true"><Plus /></span>
      </button>)}</div> : null}
    </section>
  </>;
}
