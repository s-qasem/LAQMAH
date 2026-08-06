import { Hero } from "@/components/ui/Hero";
import { HomepageScrollReset } from "@/components/ui/HomepageScrollReset";
import { HomeSections } from "@/components/ui/HomeSections";
import { IntroOverlay } from "@/components/ui/IntroOverlay";

export default function Home() {
  return (
    <>
      <HomepageScrollReset />
      <IntroOverlay />
      <main id="main-content">
        <Hero />
        <HomeSections />
      </main>
    </>
  );
}
