import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { PageHero } from "@/components/layout/PageHero";
import { GalleryExplorer } from "@/components/ui/GalleryExplorer";
export const metadata: Metadata = { title: "Gallery", description: "Explore the exterior, interior, drinks, desserts, and atmosphere of LQMAH." };
export default function GalleryPage() { return <main id="main-content"><PageHero eyebrow="A Sense Of Place" title="LQMAH IN MOMENTS" description="A visual collection ready for approved LQMAH photography." /><Container className="page-section"><GalleryExplorer /></Container></main>; }
