import { Noto_Sans_Arabic } from "next/font/google";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AdminLanguageProvider, AdminShell } from "@/components/admin";
import { getAdminAccess } from "@/lib/supabase/server-auth";

import { AdminUnauthorized } from "./AdminUnauthorized";

/**
 * Arabic UI face for the dashboard only.
 *
 * Loaded here rather than in the root layout so the public site's typography is
 * untouched: the `--font-arabic-ui` variable exists only inside the admin
 * dashboard tree, and `admin.css` applies it only when the interface language
 * is Arabic. The display face used by the LQMAH wordmark (`--font-arabic`,
 * Aref Ruqaa) is a separate variable and is not affected.
 */
const arabicUiFont = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic-ui",
  display: "swap",
});

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Route-group layout for every signed-in admin screen. The login route lives
 * outside this group so it keeps its standalone card layout.
 *
 * Access has two gates. `src/proxy.ts` still guards `/admin/:path*` on every
 * request, redirecting requests without a session. This layout then checks
 * authorization: a valid session that is not on the `admin_users` allowlist
 * gets the unauthorized screen instead of the dashboard, and `children` is
 * never rendered into the output for it. Row Level Security enforces the same
 * allowlist at the data layer.
 */
export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const { user, isAuthorized } = await getAdminAccess();

  if (!user) redirect("/admin/login");

  return (
    <AdminLanguageProvider>
      {isAuthorized ? (
        <AdminShell userEmail={user.email ?? ""} fontClassName={arabicUiFont.variable}>
          {children}
        </AdminShell>
      ) : (
        <AdminUnauthorized email={user.email ?? ""} />
      )}
    </AdminLanguageProvider>
  );
}
