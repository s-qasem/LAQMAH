import type { Metadata } from "next";
import { Clock3, MapPin, Phone, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { PageHero } from "@/components/layout/PageHero";
import { getPublicContact } from "@/lib/supabase/contact-public";
// Inactive customer route retained for future development; intentionally excluded
// from navigation and the sitemap until online ordering is ready to launch.
export const metadata: Metadata = { title: "Order Online", description: "Online ordering for LQMAH is being prepared.", robots: { index: false, follow: false } };
export default async function OrderPage() {
  // Same cached adapter /contact, the homepage Visit block and the footer read.
  const contact = await getPublicContact();

  return <main id="main-content"><PageHero eyebrow="Ordering, Thoughtfully Prepared" title="YOUR FAVORITES ARE COMING CLOSER" description="Online ordering is being prepared. No checkout or payment is active yet." /><section className="page-section section--cream"><Container><div className="order-options"><article><ShoppingBag /><h2>Browse Menu</h2><p>Explore the full LQMAH menu before visiting.</p><Link className="text-link" href="/menu">Open menu</Link></article>{contact.phone ? <article><Phone /><h2>Call To Order</h2><p>Speak with the LQMAH team directly.</p><span>{contact.phoneHref ? <a href={contact.phoneHref}>{contact.phone}</a> : contact.phone}</span></article> : null}<article><MapPin /><h2>Visit Us</h2><p>Enjoy the complete LQMAH atmosphere in person.</p><Link className="text-link" href="/contact">Visit information</Link></article></div><div className="coming-soon"><Clock3 /><div><p className="eyebrow">Coming Soon</p><h2>Pickup & Delivery</h2><p>Future-ready ordering options will connect here once operations and payment systems are approved.</p></div></div></Container></section></main>;
}
