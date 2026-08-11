import { Hero } from "@/components/ui/Hero";
import { HomepageScrollReset } from "@/components/ui/HomepageScrollReset";
import { HomeSections } from "@/components/ui/HomeSections";
import { IntroOverlay } from "@/components/ui/IntroOverlay";
import { getHomepageHero } from "@/data/hero";

export default async function Home() {
  const heroContent = await getHomepageHero();

  return (
    <>
      <HomepageScrollReset />
      <IntroOverlay />
      <main id="main-content">
        <Hero content={heroContent} />
        <HomeSections />
      </main>
    </>
  );
}
