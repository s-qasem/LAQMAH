"use client";

import { useState, type FormEvent } from "react";

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const data = new FormData(event.currentTarget); const next: Record<string, string> = {};
    for (const field of ["name", "email", "subject", "message"]) if (!String(data.get(field) ?? "").trim()) next[field] = "This field is required.";
    if (String(data.get("email")).trim() && !/^\S+@\S+\.\S+$/.test(String(data.get("email")))) next.email = "Enter a valid email address.";
    setErrors(next); if (!Object.keys(next).length) setSent(true);
  };
  if (sent) return <div className="form-success" role="status"><h2>Thank you.</h2><p>This is a demo confirmation. No message was sent because email delivery is not connected yet.</p><button className="button button--primary" onClick={() => setSent(false)}>Send another message</button></div>;
  return <form className="contact-form" noValidate onSubmit={submit}>
    <div className="field-row"><Field label="Name" name="name" error={errors.name} /><Field label="Email" name="email" type="email" error={errors.email} /></div>
    <div className="field-row"><Field label="Phone (optional)" name="phone" type="tel" /><Field label="Subject" name="subject" error={errors.subject} /></div>
    <label>Message<textarea name="message" rows={6} aria-invalid={!!errors.message} aria-describedby={errors.message ? "message-error" : undefined} />{errors.message ? <span id="message-error" className="field-error">{errors.message}</span> : null}</label>
    <p className="form-note">Demo form only. Email delivery is not connected.</p><button className="button button--primary" type="submit">Send Inquiry</button>
  </form>;
}

function Field({ label, name, type = "text", error }: { label: string; name: string; type?: string; error?: string }) {
  const id = `${name}-error`; return <label>{label}<input name={name} type={type} aria-invalid={!!error} aria-describedby={error ? id : undefined} />{error ? <span id={id} className="field-error">{error}</span> : null}</label>;
}
