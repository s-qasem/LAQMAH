import { ShieldAlert } from "lucide-react";

import { signOutAction } from "@/app/admin/actions";
import { AdminText } from "@/components/admin";

/**
 * Shown when a request carries a valid session whose user is not on the
 * `admin_users` allowlist. Renders no navigation and no page content — the
 * layout never passes `children` through to this branch.
 */
export function AdminUnauthorized({ email }: { email: string }) {
  return (
    <main id="main-content" className="admin-auth">
      <section className="admin-auth__card" aria-labelledby="admin-unauthorized-heading">
        <p className="admin-unauthorized__icon" aria-hidden="true">
          <ShieldAlert />
        </p>

        <h1 id="admin-unauthorized-heading" className="admin-auth__title">
          <AdminText tKey="unauthorized.title" />
        </h1>

        <p className="admin-auth__subtitle">
          <AdminText tKey="unauthorized.body" vars={{ email }} />
        </p>

        <p className="admin-auth__subtitle">
          <AdminText tKey="unauthorized.hint" />
        </p>

        <form action={signOutAction}>
          <button type="submit" className="button button--primary admin-auth__submit">
            <AdminText tKey="shell.logout" />
          </button>
        </form>
      </section>
    </main>
  );
}
