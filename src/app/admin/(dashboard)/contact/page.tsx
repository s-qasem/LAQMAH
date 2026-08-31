import type { Metadata } from "next";

import { AdminPageHeader, AdminText } from "@/components/admin";
import { getSiteContact, listBusinessHours } from "@/lib/supabase/site-content";

import { ContactManager } from "./ContactManager";

export const metadata: Metadata = { title: "Contact & Hours", robots: { index: false, follow: false } };

export default async function AdminContactPage() {
  const [contact, hours] = await Promise.all([getSiteContact(), listBusinessHours()]);

  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrowKey="page.eyebrow.content"
        titleKey="page.contact.title"
        descriptionKey="page.contact.description"
      />

      {contact ? (
        <ContactManager contact={contact} hours={hours} />
      ) : (
        <p className="admin-form__error" role="alert">
          <AdminText tKey="contact.unavailable" />
        </p>
      )}
    </div>
  );
}
