"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, Clock, Coffee, Crown, Dices, GalleryVerticalEnd, MapPin, Trophy } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

import { Container } from "@/components/layout/Container";
import { images } from "@/data/images";
import { featuredProducts, menuCategories } from "@/data/menu";
import { business, testimonials } from "@/data/site";
import { MediaFallback } from "./MediaFallback";
import { ChocolateSequenceScene } from "./ChocolateSequenceScene";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const atmosphereFeatures = [
  { label: "Chess", Icon: Crown },
  { label: "Card Games", Icon: GalleryVerticalEnd },
  { label: "Dominoes", Icon: Dices },
  { label: "Live Sports", Icon: Trophy },
  { label: "Great Coffee", Icon: Coffee },
] as const;

const homepageCategoryImages = {
  Sandwiches: images.sandwiches.grilledChicken,
  Desserts: images.desserts.cookie,
} as const;

const lqmahLocation = {
  directionsUrl: "https://maps.app.goo.gl/DFKXSAyDmfVc6RmW6",
  embedUrl: "https://www.google.com/maps?q=42.2820387,-83.175805&z=16&output=embed",
} as const;

export function HomeSections() {
  const welcomeRef = useRef<HTMLElement>(null);
  const dessertRef = useRef<HTMLElement>(null);
  const [featured, setFeatured] = useState(0);

  useGSAP(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    gsap.to("[data-dessert-image]", { scale: 1.06, xPercent: -2, ease: "none", scrollTrigger: { trigger: dessertRef.current, start: "top top", end: "bottom bottom", scrub: 1 } });
  }, { scope: dessertRef });

  useGSAP(() => {
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

  const product = featuredProducts[featured];

  return <>
    <section ref={welcomeRef} id="welcome" className="welcome-banner" aria-labelledby="welcome-title">
      <div className="welcome-banner__image" data-welcome-image>
        <MediaFallback src={images.intro} alt="LQMAH café interior with pastry counter, seating, and warm lighting" sizes="100vw" position="center 47%" />
      </div>
      <div className="welcome-banner__shade" aria-hidden="true" />
      <Container className="welcome-banner__content">
        <h2 id="welcome-title" data-welcome-heading>COFFEE. CONVERSATION.<br />EVERY MATCH.</h2>
        <ul className="welcome-banner__features" aria-label="LQMAH atmosphere features">
          {atmosphereFeatures.map(({ label, Icon }) => (
            <li key={label} data-welcome-feature><Icon aria-hidden="true" strokeWidth={1.35} /><span>{label}</span></li>
          ))}
        </ul>
      </Container>
    </section>

    <section ref={dessertRef} className="dessert-scene" aria-labelledby="dessert-title">
      <div className="dessert-sticky">
        <div className="dessert-visual" data-dessert-image>
          {/* Add sequencePath/frameCount or videoSrc when production animation assets are delivered. */}
          <ChocolateSequenceScene fallbackSrc={images.signatureDessert} alt="Clean cheesecake beneath a chocolate pot beside a white coffee cup and chess pieces" />
        </div>
        <div className="dessert-shade" />
        <Container className="dessert-copy"><p className="eyebrow">The Signature Scene</p><h2 id="dessert-title">CRAFTED DAILY.<br />SERVED WITH PASSION.</h2><p className="arabic-accent" lang="ar">محضّرة يومياً بشغف</p><p>Premium ingredients, careful preparation, and flavors made to be remembered.</p><Link className="button button--light" href="/menu?category=Desserts">Discover Our Desserts</Link></Container>
      </div>
    </section>

    <section id="menu" className="section section--dark">
      <Container><div className="section-heading"><p className="eyebrow">Made For Every Mood</p><h2>EXPLORE OUR MENU</h2><Link className="text-link text-link--light" href="/menu">View full menu <ArrowRight /></Link></div>
        <div className="category-rail">{menuCategories.slice(1).map((category, index) => { const item = featuredProducts.find((entry) => entry.category === category) ?? featuredProducts[index % featuredProducts.length]; const categoryImage = category in homepageCategoryImages ? homepageCategoryImages[category as keyof typeof homepageCategoryImages] : item.image; return <Link key={category} className="category-panel" href={`/menu?category=${encodeURIComponent(category)}`}><MediaFallback src={categoryImage} alt={category in homepageCategoryImages ? `${category} category` : item.name} sizes="(max-width: 768px) 80vw, 30vw" /><span>0{index + 1}</span><h3>{category}</h3><p>{category === "Desserts" ? "Handcrafted finishes worth lingering over." : "Carefully prepared for the rhythm of your day."}</p></Link>; })}</div>
      </Container>
    </section>

    <section className="section section--cream featured-products-section">
      <Container><div className="featured-products__intro"><p className="eyebrow">House Favorites</p></div>
        <div className="featured-showcase"><MediaFallback key={product.id} className="featured-image" src={product.image} alt={product.name} sizes="(max-width: 768px) 100vw, 65vw" fit="cover" /><div className="featured-detail"><p className="eyebrow">{product.category}</p><h3>{product.name}</h3><p>{product.description}</p><p className="availability">Price available in store</p><div className="product-tabs" role="tablist" aria-label="Featured products">{featuredProducts.map((item, index) => <button key={item.id} role="tab" aria-selected={featured === index} onClick={() => setFeatured(index)}>{item.name}</button>)}</div></div></div>
      </Container>
    </section>

    <section className="section atmosphere-section">
      <Container className="atmosphere-grid"><div className="section-copy"><p className="eyebrow">Room For The Moment</p><h2>MORE THAN<br />A CAFE</h2><p>Whether you are here for a quiet coffee, a game with friends, a study session, or your favorite match, LQMAH makes room for the moment.</p></div>{images.atmosphere.map((src, index) => <figure key={src} className={`atmosphere-shot atmosphere-shot--${index + 1}`}><MediaFallback src={src} alt={["Chess with coffee", "Friends gathering at the cafe", "Live sports atmosphere"][index]} sizes="(max-width: 768px) 100vw, 40vw" /><figcaption>{["Play", "Gather", "Stay"][index]}</figcaption></figure>)}</Container>
    </section>

    <section className="interior-story"><MediaFallback src={images.interior[0]} alt="Comfortable LQMAH seating and warm lighting" /><div className="interior-overlay" /><Container className="interior-copy"><p className="eyebrow">The Atmosphere</p><h2>DESIGNED<br />TO MAKE YOU STAY</h2><p>Warm light, considered details, and comfortable tables create a setting that feels refined without losing its welcome.</p></Container></section>

    <section id="reviews" className="section section--burgundy"><Container><div className="section-heading"><p className="eyebrow">Real Guest Reviews</p><h2>WHAT OUR<br />GUESTS SAY</h2></div><div className="reviews-grid">{testimonials.map((review) => <blockquote key={review.name}><div aria-label={`${review.rating} out of 5 stars`}>★★★★★</div><p>“{review.review}”</p><footer><strong>{review.name}</strong><span>{review.date}</span><span><a href={lqmahLocation.directionsUrl} target="_blank" rel="noopener noreferrer">{review.source}</a></span></footer></blockquote>)}</div></Container></section>

    <section id="contact" className="section section--cream"><Container className="visit-grid"><div className="section-copy"><p className="eyebrow">Visit LQMAH</p><h2>COME FIND<br />YOUR FAVORITE TABLE</h2><div className="visit-details"><p><MapPin />LQMAH</p><p><Clock />{business.hours[0]}</p></div><div className="button-row"><Link className="button button--primary" href="/contact">Contact Us</Link><a className="button button--outline" href={lqmahLocation.directionsUrl} target="_blank" rel="noopener noreferrer" aria-label="Get directions to LQMAH on Google Maps">Get Directions</a></div></div><div className="map-placeholder"><iframe src={lqmahLocation.embedUrl} title="LQMAH location on Google Maps" loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div></Container></section>

    <section className="final-cta"><Container><p className="arabic-accent" lang="ar">أهلاً بكم</p><h2>YOUR TABLE<br />IS WAITING</h2><p>Come for the coffee. Stay for the atmosphere.</p><div className="button-row"><Link className="button button--light" href="/menu">Explore Menu</Link></div></Container></section>
  </>;
}
