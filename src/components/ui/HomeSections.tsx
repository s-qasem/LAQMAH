"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, Clock, Coffee, Crown, Dices, GalleryVerticalEnd, MapPin, Trophy } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

import { Container } from "@/components/layout/Container";
import { images } from "@/data/images";
import { categoryPresentation, formatMenuPrice, railImageFor } from "@/data/menu-presentation";
import type { PublicCategory, PublicProduct } from "@/lib/supabase/menu-public";
import type { PublicContact } from "@/lib/supabase/contact-public";
import type { HomepageSection, PublicHomepage } from "@/lib/supabase/homepage-public";
import type { PublicReview } from "@/lib/supabase/reviews-public";
import { MediaFallback } from "./MediaFallback";
import { ChocolateSequenceScene } from "./ChocolateSequenceScene";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// Hard-coded by decision: the five chips are part of the banner's fixed
// five-column grid, not editable content.
const atmosphereFeatures = [
  { label: "Chess", Icon: Crown },
  { label: "Card Games", Icon: GalleryVerticalEnd },
  { label: "Dominoes", Icon: Dices },
  { label: "Live Sports", Icon: Trophy },
  { label: "Great Coffee", Icon: Coffee },
] as const;

/**
 * Heading lines render inside one h2, exactly as before: a single line when
 * there is no second, otherwise the two separated by a break.
 */
function headingContent(section: HomepageSection) {
  return section.headingLine2 ? (
    <>
      {section.headingLine1}
      <br />
      {section.headingLine2}
    </>
  ) : (
    section.headingLine1
  );
}

/**
 * Filled stars follow the stored rating instead of a fixed five glyphs.
 *
 * The row keeps its five-glyph width and its existing gold styling, and the
 * accessible label is derived from the same clamped value the visitor sees, so
 * the two can no longer disagree. Ratings outside 0-5, or a non-numeric value,
 * are clamped rather than producing a broken row.
 */
function ReviewStars({ rating }: { rating: number }) {
  const filled = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));

  return (
    <div aria-label={`${filled} out of 5 stars`}>
      {"★".repeat(filled)}
      {"☆".repeat(5 - filled)}
    </div>
  );
}

type HomeSectionsProps = {
  categories: PublicCategory[];
  products: PublicProduct[];
  reviews: PublicReview[];
  contact: PublicContact;
  homepage: PublicHomepage;
};

export function HomeSections({ categories, products, reviews, contact, homepage }: HomeSectionsProps) {
  // Popular/featured is a computed view, exactly as before.
  const featuredProducts = products.filter((item) => item.featured);
  const welcomeRef = useRef<HTMLElement>(null);
  const dessertRef = useRef<HTMLElement>(null);
  const [featured, setFeatured] = useState(0);

  // A null section was unpublished by an administrator, so it renders nothing.
  const { sections, atmosphereImages } = homepage;
  const welcome = sections.welcome;
  const signature = sections.signature_scene;
  const menuSection = sections.menu;
  const featuredSection = sections.featured;
  const atmosphere = sections.atmosphere;
  const interiorStory = sections.interior_story;
  const reviewsSection = sections.reviews;
  const visit = sections.visit;
  const finalCta = sections.final_cta;

  useGSAP(() => {
    // The Signature Scene can be unpublished, in which case there is nothing to
    // animate and no trigger element for ScrollTrigger to measure.
    if (!dessertRef.current) return;

    const media = gsap.matchMedia();

    media.add("(max-width: 900px) and (prefers-reduced-motion: no-preference)", () => {
      gsap.to("[data-dessert-image]", { scale: 1.06, xPercent: -2, ease: "none", scrollTrigger: { trigger: dessertRef.current, start: "top top", end: "bottom bottom", scrub: 1 } });
    });

    return () => media.revert();
  }, { scope: dessertRef });

  useGSAP(() => {
    // Same guard for the Welcome Banner.
    if (!welcomeRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timeline = gsap.timeline({
      scrollTrigger: { trigger: welcomeRef.current, start: "top 78%", once: true },
      defaults: { ease: "power3.out" },
    });

    timeline
      .fromTo("[data-welcome-image]", { clipPath: "inset(0 0 100% 0)", scale: 1.04 }, { clipPath: "inset(0 0 0% 0)", scale: 1, duration: 1.25 })
      .fromTo("[data-welcome-heading]", { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: .8 }, .25)
      .fromTo("[data-welcome-feature]", { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: .65, stagger: .1 }, .48);

    gsap.to("[data-welcome-image]", {
      yPercent: 3,
      ease: "none",
      scrollTrigger: { trigger: welcomeRef.current, start: "top bottom", end: "bottom top", scrub: 1.2 },
    });
  }, { scope: welcomeRef });

  const product = featuredProducts[Math.min(featured, Math.max(featuredProducts.length - 1, 0))];

  return <>
    {welcome ? <section ref={welcomeRef} id="welcome" className="welcome-banner" aria-labelledby="welcome-title">
      <div className="welcome-banner__image" data-welcome-image>
        <MediaFallback src={welcome.imageUrl ?? images.intro} alt={welcome.imageAlt ?? ""} sizes="100vw" position="center 47%" />
      </div>
      <div className="welcome-banner__shade" aria-hidden="true" />
      <Container className="welcome-banner__content">
        <h2 id="welcome-title" data-welcome-heading>{headingContent(welcome)}</h2>
        <ul className="welcome-banner__features" aria-label="LQMAH atmosphere features">
          {atmosphereFeatures.map(({ label, Icon }) => (
            <li key={label} data-welcome-feature><Icon aria-hidden="true" strokeWidth={1.35} /><span>{label}</span></li>
          ))}
        </ul>
      </Container>
    </section> : null}

    {signature ? <section ref={dessertRef} className="dessert-scene" aria-labelledby="dessert-title">
      <div className="dessert-sticky">
        <div className="dessert-visual" data-dessert-image>
          {/* The video file itself stays hard-coded by decision; only its poster is managed. */}
          <ChocolateSequenceScene fallbackSrc={signature.imageUrl ?? images.signatureDessert} videoSrc="/menu/videos/signature-scene2.mp4" alt={signature.imageAlt ?? ""} />
        </div>
        <div className="dessert-shade" />
        <Container className="dessert-copy">{signature.eyebrow ? <p className="eyebrow">{signature.eyebrow}</p> : null}<h2 id="dessert-title">{headingContent(signature)}</h2>{signature.arabicAccent ? <p className="arabic-accent" lang="ar">{signature.arabicAccent}</p> : null}{signature.body ? <p>{signature.body}</p> : null}{signature.ctaLabel && signature.ctaHref ? <Link className="button button--light" href={signature.ctaHref}>{signature.ctaLabel}</Link> : null}</Container>
      </div>
    </section> : null}

    {menuSection ? <section id="menu" className="section section--dark">
      <Container><div className="section-heading">{menuSection.eyebrow ? <p className="eyebrow">{menuSection.eyebrow}</p> : null}<h2>{headingContent(menuSection)}</h2>{menuSection.ctaLabel && menuSection.ctaHref ? <Link className="text-link text-link--light" href={menuSection.ctaHref}>{menuSection.ctaLabel} <ArrowRight /></Link> : null}</div>
        <div className="category-rail">{categories.map((category, index) => { const item = featuredProducts.find((entry) => entry.categorySlug === category.slug) ?? featuredProducts[index % Math.max(featuredProducts.length, 1)]; const categoryImage = railImageFor(category.slug, category.imageUrl, item?.image); return <Link key={category.slug} className="category-panel" href={`/menu?category=${encodeURIComponent(category.name)}`}><MediaFallback src={categoryImage} alt={`${category.name} category`} sizes="(max-width: 768px) 80vw, 30vw" /><span>0{index + 1}</span><h3>{category.name}</h3><p>{categoryPresentation(category.slug).blurb}</p></Link>; })}</div>
      </Container>
    </section> : null}

    {product && featuredSection ? <section className="section section--cream featured-products-section">
      <Container><div className="featured-products__intro">{featuredSection.eyebrow ? <p className="eyebrow">{featuredSection.eyebrow}</p> : null}</div>
        <div className="featured-showcase"><MediaFallback key={product.id} className="featured-image" src={product.image} alt={product.name} sizes="(max-width: 768px) 100vw, 65vw" fit="cover" /><div className="featured-detail"><p className="eyebrow">{categories.find((entry) => entry.slug === product.categorySlug)?.name ?? ""}</p><h3>{product.name}</h3><p>{product.description}</p><p className="availability">{formatMenuPrice(product.price)}</p><div className="product-tabs" role="tablist" aria-label="Featured products">{featuredProducts.map((item, index) => <button key={item.id} role="tab" aria-selected={featured === index} onClick={() => setFeatured(index)}>{item.name}</button>)}</div></div></div>
      </Container>
    </section> : null}

    {atmosphere ? <section className="section atmosphere-section">
      <Container className="atmosphere-grid"><div className="section-copy">{atmosphere.eyebrow ? <p className="eyebrow">{atmosphere.eyebrow}</p> : null}<h2>{headingContent(atmosphere)}</h2>{atmosphere.body ? <p>{atmosphere.body}</p> : null}</div>{atmosphereImages.map((image) => <figure key={image.position} className={`atmosphere-shot atmosphere-shot--${image.position}`}><MediaFallback src={image.imageUrl} alt={image.altText} sizes="(max-width: 768px) 100vw, 40vw" /><figcaption>{image.caption}</figcaption></figure>)}</Container>
    </section> : null}

    {interiorStory ? <section className="interior-story"><MediaFallback src={interiorStory.imageUrl ?? images.interior[0]} alt={interiorStory.imageAlt ?? ""} /><div className="interior-overlay" /><Container className="interior-copy">{interiorStory.eyebrow ? <p className="eyebrow">{interiorStory.eyebrow}</p> : null}<h2>{headingContent(interiorStory)}</h2>{interiorStory.body ? <p>{interiorStory.body}</p> : null}</Container></section> : null}

    {reviewsSection ? <section id="reviews" className="section section--burgundy"><Container><div className="section-heading">{reviewsSection.eyebrow ? <p className="eyebrow">{reviewsSection.eyebrow}</p> : null}<h2>{headingContent(reviewsSection)}</h2></div><div className="reviews-grid">{reviews.map((review) => <blockquote key={review.id}><ReviewStars rating={review.rating} /><p>“{review.review}”</p><footer><strong>{review.name}</strong><span>{review.date}</span><span>{contact.mapUrl ? <a href={contact.mapUrl} target="_blank" rel="noopener noreferrer">{review.source}</a> : review.source}</span></footer></blockquote>)}</div></Container></section> : null}

    {visit ? <section id="contact" className="section section--cream"><Container className="visit-grid"><div className="section-copy">{visit.eyebrow ? <p className="eyebrow">{visit.eyebrow}</p> : null}<h2>{headingContent(visit)}</h2><div className="visit-details"><p><MapPin />LQMAH</p>{contact.hoursGroups.length ? <p><Clock /><span>{contact.hoursGroups.map((group, index) => <span key={group.label}>{group.line}{index < contact.hoursGroups.length - 1 ? <br /> : null}</span>)}</span></p> : null}</div><div className="button-row">{visit.ctaLabel ? <Link className="button button--primary" href="/contact">{visit.ctaLabel}</Link> : null}{contact.mapUrl && visit.ctaSecondaryLabel ? <a className="button button--outline" href={contact.mapUrl} target="_blank" rel="noopener noreferrer" aria-label="Get directions to LQMAH on Google Maps">{visit.ctaSecondaryLabel}</a> : null}</div></div>{contact.mapEmbedUrl ? <div className="map-placeholder"><iframe src={contact.mapEmbedUrl} title="LQMAH location on Google Maps" loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div> : null}</Container></section> : null}

    {finalCta ? <section className="final-cta"><Container>{finalCta.arabicAccent ? <p className="arabic-accent" lang="ar">{finalCta.arabicAccent}</p> : null}<h2>{headingContent(finalCta)}</h2>{finalCta.body ? <p>{finalCta.body}</p> : null}<div className="button-row">{finalCta.ctaLabel && finalCta.ctaHref ? <Link className="button button--light" href={finalCta.ctaHref}>{finalCta.ctaLabel}</Link> : null}</div></Container></section> : null}
  </>;
}
