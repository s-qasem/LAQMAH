import { Hero } from "@/components/ui/Hero";
import { HomepageScrollReset } from "@/components/ui/HomepageScrollReset";
import { HomeSections } from "@/components/ui/HomeSections";
import { IntroOverlay } from "@/components/ui/IntroOverlay";
import { getHomepageHero } from "@/data/hero";
import { getPublicMenu } from "@/lib/supabase/menu-public";
import { getPublicContact } from "@/lib/supabase/contact-public";
import { getPublicHomepage } from "@/lib/supabase/homepage-public";
import { getPublicReviews } from "@/lib/supabase/reviews-public";

export default async function Home() {
  const [heroContent, menu, reviews, contact, homepage] = await Promise.all([
    getHomepageHero(),
    getPublicMenu(),
    getPublicReviews(),
    getPublicContact(),
    getPublicHomepage(),
  ]);

  return (
    <>
      <HomepageScrollReset />
      <IntroOverlay />
      <main id="main-content">
        <Hero content={heroContent} />
        <HomeSections
          categories={menu.categories}
          products={menu.products}
          reviews={reviews.reviews}
          contact={contact}
          homepage={homepage}
        />
      </main>
    </>
  );
}
