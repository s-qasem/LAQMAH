import { ExternalLink } from "lucide-react";
import Link from "next/link";

import { business, navigation, socials } from "@/data/site";
import { Container } from "./Container";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Container className="footer-grid">
        <div><Link href="/" className="footer-brand">LQMAH</Link><p>Cafe & Bakery</p><p className="arabic-accent" lang="ar">لقمة</p></div>
        <div><h2>Explore</h2>{navigation.map((item) => <Link key={item.label} href={item.href}>{item.label}</Link>)}</div>
        <div><h2>Visit</h2><p>{business.address}</p><p>{business.hours[0]}</p><p>{business.phone}</p></div>
        <div><h2>Follow</h2><div className="social-row">{socials.map((item) => <a key={item.label} href={item.href} aria-label={item.label}><ExternalLink /></a>)}</div></div>
      </Container>
      <Container className="footer-bottom"><span>© {new Date().getFullYear()} LQMAH Cafe & Bakery</span><span>Business details pending confirmation.</span></Container>
    </footer>
  );
}
