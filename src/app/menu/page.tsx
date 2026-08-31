import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/layout/Container";
import { MenuExplorer } from "@/components/ui/MenuExplorer";
import { getPublicMenu } from "@/lib/supabase/menu-public";

export const metadata: Metadata = { title: "Menu", description: "Explore LQMAH drinks, fresh juices, sandwiches, and desserts." };

export default async function MenuPage() {
  // Fetched on the server so the client never waterfalls a request.
  const menu = await getPublicMenu();

  return <main id="main-content"><Container className="page-section menu-page-section--hot"><Suspense fallback={<p>Loading menu…</p>}><MenuExplorer categories={menu.categories} products={menu.products} /></Suspense></Container></main>;
}
