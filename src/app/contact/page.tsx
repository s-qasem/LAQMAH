import type { Metadata } from "next";
import { Clock, MapPin, Phone } from "lucide-react";

import { Container } from "@/components/layout/Container";
import { PageHero } from "@/components/layout/PageHero";
import { ContactForm } from "@/components/ui/ContactForm";

const lqmahContact = {
  name: "LQMAH",
  address: "3065 Oakwood Blvd Ste D, Melvindale, MI 48122",
  phone: "(313) 722-4149",
  phoneHref: "tel:+13137224149",
  directionsUrl: "https://maps.app.goo.gl/DFKXSAyDmfVc6RmW6",
  mapEmbedUrl: "https://www.google.com/maps?q=42.2820387,-83.175805&z=16&output=embed",
  hours: [
    "Monday–Thursday: 10:00 AM–10:00 PM",
    "Friday–Saturday: 10:00 AM–11:00 PM",
    "Sunday: 10:00 AM–10:00 PM",
  ],
} as const;

export const metadata: Metadata = {
  title: "Contact",
  description: "Plan a visit or contact LQMAH Cafe & Bakery.",
};

export default function ContactPage() {
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
              <p>
                <MapPin />
                <a href={lqmahContact.directionsUrl} target="_blank" rel="noopener noreferrer">
                  {lqmahContact.address}
                </a>
              </p>
              <p style={{ paddingBottom: "18px" }}>
                <Phone />
                <a href={lqmahContact.phoneHref}>{lqmahContact.phone}</a>
              </p>
              <p>
                <Clock />
                <span>
                  {lqmahContact.hours.map((hours) => (
                    <span key={hours}>{hours}<br /></span>
                  ))}
                </span>
              </p>
            </div>
            <div className="map-placeholder">
              <iframe
                src={lqmahContact.mapEmbedUrl}
                title={`${lqmahContact.name} location on Google Maps`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
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
