import type { Metadata } from "next";
import { Clock, MapPin, Phone } from "lucide-react";

import { Container } from "@/components/layout/Container";
import { PageHero } from "@/components/layout/PageHero";
import { ContactForm } from "@/components/ui/ContactForm";
import { getPublicContact } from "@/lib/supabase/contact-public";

export const metadata: Metadata = {
  title: "Contact",
  description: "Plan a visit or contact LQMAH Cafe & Bakery.",
};

export default async function ContactPage() {
  // One shared cached adapter; the footer reads the same entry.
  const contact = await getPublicContact();

  return (
    <main id="main-content">
      <PageHero
        eyebrow="Come Stay Awhile"
        title="VISIT LQMAH"
        description="Visit LQMAH in Melvindale for coffee, desserts, and good company."
      />
      <section id="contact" className="page-section">
        <Container className="contact-layout">
          <div>
            <div className="contact-details">
              {contact.address ? (
                <p>
                  <MapPin />
                  {/* map_url is the external destination; never the embed source. */}
                  {contact.mapUrl ? (
                    <a href={contact.mapUrl} target="_blank" rel="noopener noreferrer">
                      {contact.address}
                    </a>
                  ) : (
                    <span>{contact.address}</span>
                  )}
                </p>
              ) : null}
              {contact.phone ? (
                <p style={{ paddingBottom: "18px" }}>
                  <Phone />
                  {contact.phoneHref ? <a href={contact.phoneHref}>{contact.phone}</a> : <span>{contact.phone}</span>}
                </p>
              ) : null}
              {contact.hoursGroups.length ? (
                <p>
                  <Clock />
                  <span>
                    {contact.hoursGroups.map((group) => (
                      <span key={group.label}>{group.line}<br /></span>
                    ))}
                  </span>
                </p>
              ) : null}
            </div>
            {contact.mapEmbedUrl ? (
              <div className="map-placeholder">
                <iframe
                  src={contact.mapEmbedUrl}
                  title="LQMAH location on Google Maps"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            ) : null}
          </div>
          <div>
            <p className="eyebrow">Send An Inquiry</p>
            <h2>LET&apos;S TALK</h2>
            <ContactForm />
          </div>
        </Container>
      </section>
    </main>
  );
}
