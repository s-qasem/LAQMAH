import type { Metadata } from "next";
import type { ReactNode } from "react";

import "../../styles/admin.css";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="admin-shell">{children}</div>;
}
