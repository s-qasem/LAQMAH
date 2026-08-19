import Link from "next/link";

import { navigation } from "@/data/site";
import { Container } from "./Container";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Container className="footer-grid">
        <div><Link href="/" className="footer-brand">LQMAH</Link><p>Cafe & Bakery</p><p className="arabic-accent" lang="ar">لقمة</p></div>
        <div><h2>Explore</h2>{navigation.map((item) => <Link key={item.label} href={item.href}>{item.label}</Link>)}</div>
        <div><h2>Visit</h2><p><a href="https://maps.app.goo.gl/DFKXSAyDmfVc6RmW6" target="_blank" rel="noopener noreferrer">3065 Oakwood Blvd Ste D, Melvindale, MI 48122</a></p><p>Monday–Thursday: 10:00 AM–10:00 PM<br />Friday–Saturday: 10:00 AM–11:00 PM<br />Sunday: 10:00 AM–10:00 PM</p><p><a href="tel:+13137224149">(313) 722-4149</a></p></div>
        <div><h2>Follow</h2><div className="social-row"><a href="https://www.instagram.com/lqmah_bakery/" target="_blank" rel="noopener noreferrer" aria-label="Follow LQMAH on Instagram"><InstagramIcon /><span>@lqmah_bakery</span></a><a href="https://www.tiktok.com/@lqmah_bakery" target="_blank" rel="noopener noreferrer" aria-label="Follow LQMAH on TikTok"><TikTokIcon /><span>@lqmah_bakery</span></a></div></div>
      </Container>
      <Container className="footer-bottom"><span>© {new Date().getFullYear()} LQMAH Cafe & Bakery</span><span className="footer-credit">Designed &amp; Developed by <a href="https://wa.me/905352973229" target="_blank" rel="noopener noreferrer">ArtiCode</a></span></Container>
    </footer>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect width="18" height="18" x="3" y="3" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M14.5 3c.2 1.8 1.2 3.3 3 4.1.8.4 1.6.5 2.5.5v3.2a9.3 9.3 0 0 1-5.5-1.8v6.1a5.9 5.9 0 1 1-5-5.8v3.3a2.7 2.7 0 1 0 1.8 2.5V3h3.2Z" />
    </svg>
  );
}
