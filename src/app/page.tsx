import { Hero } from "@/components/ui/Hero";
import { HomeSections } from "@/components/ui/HomeSections";
import { IntroOverlay } from "@/components/ui/IntroOverlay";

export default function Home() {
  return (
    <>
      <IntroOverlay />
      <main id="main-content">
        <Hero />
        <HomeSections />
      </main>
    </>
  );
}
