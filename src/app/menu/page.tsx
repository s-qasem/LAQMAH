import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/layout/Container";
import { PageHero } from "@/components/layout/PageHero";
import { MenuExplorer } from "@/components/ui/MenuExplorer";
export const metadata: Metadata = { title: "Menu", description: "Explore LQMAH drinks, fresh juices, sandwiches, and desserts." };
export default function MenuPage() { return <main id="main-content"><PageHero eyebrow="Crafted For Your Moment" title="THE LQMAH MENU" description="A considered collection of cafe favorites. Final pricing is available in store." /><Container className="page-section menu-page-section--hot"><Suspense fallback={<p>Loading menu…</p>}><MenuExplorer /></Suspense></Container></main>; }
