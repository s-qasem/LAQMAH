import type { Metadata } from "next";
import Link from "next/link";

import { createAuthSupabaseClient } from "@/lib/supabase/server-auth";

import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata: Metadata = {
  title: "Set New Password",
  robots: { index: false, follow: false },
};

/**
 * Reached from the Supabase recovery email, by way of the auth callback which
 * has already exchanged the one-time code for a session.
 *
 * If that session is missing the link was invalid, already used, or expired, so
 * the page says so and offers to send another rather than showing a form that
 * cannot work.
 */
export default async function ResetPasswordPage() {
  const supabase = await createAuthSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main id="main-content" className="admin-auth">
      <section className="admin-auth__card" aria-labelledby="admin-reset-heading">
        <div className="admin-auth__brand">
          <span className="admin-auth__brand-arabic" lang="ar" aria-hidden="true">
            لقمة
          </span>
          <span className="admin-auth__brand-english">LQMAH</span>
        </div>

        <h1 id="admin-reset-heading" className="admin-auth__title">
          Set New Password
        </h1>

        {user ? (
          <>
            <p className="admin-auth__subtitle">Choose a new password for {user.email}.</p>
            <ResetPasswordForm />
          </>
        ) : (
          <>
            <p className="admin-auth__subtitle">
              This reset link is invalid or has expired. Reset links can only be used once.
            </p>
            <p className="admin-auth__aside">
              <Link className="button button--primary admin-auth__submit" href="/admin/forgot-password">
                Request a New Link
              </Link>
            </p>
            <p className="admin-auth__aside">
              <Link href="/admin/login">Back to sign in</Link>
            </p>
          </>
        )}
      </section>
    </main>
  );
}
