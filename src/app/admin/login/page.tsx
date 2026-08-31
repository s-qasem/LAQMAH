import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getAdminUser } from "@/lib/supabase/server-auth";

import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  if (await getAdminUser()) redirect("/admin");

  return (
    <main id="main-content" className="admin-auth">
      <section className="admin-auth__card" aria-labelledby="admin-login-heading">
        <div className="admin-auth__brand">
          <span className="admin-auth__brand-arabic" lang="ar" aria-hidden="true">
            لقمة
          </span>
          <span className="admin-auth__brand-english">LQMAH</span>
        </div>

        <h1 id="admin-login-heading" className="admin-auth__title">
          Admin Login
        </h1>
        <p className="admin-auth__subtitle">Sign in to manage LQMAH website content.</p>

        <LoginForm />
      </section>
    </main>
  );
}
