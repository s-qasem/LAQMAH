import type { ReactElement } from "react";
import Link from "next/link";

import { navigation } from "@/data/site";
import { getPublicContact } from "@/lib/supabase/contact-public";
import { getPublicSocial } from "@/lib/supabase/social-public";
import { Container } from "./Container";

export async function SiteFooter() {
  // Same cached entry the contact page reads; no second query.
  const [contact, social] = await Promise.all([getPublicContact(), getPublicSocial()]);
  return (
    <footer className="site-footer">
      <Container className="footer-grid">
        <div><Link href="/" className="footer-brand">LQMAH</Link><p>Cafe & Bakery</p><p className="arabic-accent" lang="ar">لقمة</p></div>
        <div><h2>Explore</h2>{navigation.map((item) => <Link key={item.label} href={item.href}>{item.label}</Link>)}</div>
        <div><h2>Visit</h2>{contact.address ? <p>{contact.mapUrl ? <a href={contact.mapUrl} target="_blank" rel="noopener noreferrer">{contact.address}</a> : contact.address}</p> : null}{contact.hoursGroups.length ? <p>{contact.hoursGroups.map((group, index) => <span key={group.label}>{group.line}{index < contact.hoursGroups.length - 1 ? <br /> : null}</span>)}</p> : null}{contact.phone ? <p>{contact.phoneHref ? <a href={contact.phoneHref}>{contact.phone}</a> : contact.phone}</p> : null}</div>
        {social.links.length ? <div><h2>Follow</h2><div className="social-row">{social.links.map((link) => { const Icon = socialIconFor(link.platform); return <a key={link.platform} href={link.url} target="_blank" rel="noopener noreferrer" aria-label={`Follow LQMAH on ${link.label}`}><Icon /><span>{link.handle ?? link.label}</span></a>; })}</div></div> : null}
      </Container>
      <Container className="footer-bottom"><span>© {new Date().getFullYear()} LQMAH Cafe & Bakery</span><span className="footer-credit">Designed &amp; Developed by <a href="https://wa.me/905352973229" target="_blank" rel="noopener noreferrer">ArtiCode</a></span></Container>
    </footer>
  );
}

function socialIconFor(platform: string) {
  return SOCIAL_ICONS[platform] ?? ExternalLinkIcon;
}

const SOCIAL_ICONS: Record<string, () => ReactElement> = {
  instagram: InstagramIcon,
  tiktok: TikTokIcon,
  facebook: FacebookIcon,
};

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

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M15 3h-2.5A3.5 3.5 0 0 0 9 6.5V9H7v3h2v9h3v-9h2.5l.5-3H12V6.5a1 1 0 0 1 1-1h2V3Z" />
    </svg>
  );
}

/** Restrained generic mark for a platform added later with no icon of its own. */
function ExternalLinkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M14 4h6v6" />
      <path d="M20 4 11 13" />
      <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </svg>
  );
}
