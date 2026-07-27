import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { PageHero } from "@/components/layout/PageHero";
import { ContactForm } from "@/components/ui/ContactForm";
import { business } from "@/data/site";
export const metadata: Metadata = { title: "Contact", description: "Plan a visit or contact LQMAH Cafe & Bakery." };
export default function ContactPage() { return <main id="main-content"><PageHero eyebrow="Come Stay Awhile" title="VISIT LQMAH" description="Final location and business details will be published once confirmed." /><section className="page-section"><Container className="contact-layout"><div><div className="contact-details"><p><MapPin />{business.address}</p><p><Phone />{business.phone}</p><p><Mail />{business.email}</p><p><Clock />{business.hours[0]}</p></div><div className="map-placeholder"><MapPin /><span>Map integration ready</span><small>Final address required</small></div></div><div><p className="eyebrow">Send An Inquiry</p><h2>LET&apos;S TALK</h2><ContactForm /></div></Container></section></main>; }
