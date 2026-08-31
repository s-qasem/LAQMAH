import type { Metadata } from "next";

import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <main id="main-content" className="admin-auth">
      <section className="admin-auth__card" aria-labelledby="admin-forgot-heading">
        <div className="admin-auth__brand">
          <span className="admin-auth__brand-arabic" lang="ar" aria-hidden="true">
            لقمة
          </span>
          <span className="admin-auth__brand-english">LQMAH</span>
        </div>

        <h1 id="admin-forgot-heading" className="admin-auth__title">
          Reset Password
        </h1>
        <p className="admin-auth__subtitle">
          Enter your admin email and we will send a link to set a new password.
        </p>

        <ForgotPasswordForm />
      </section>
    </main>
  );
}
