import type { Metadata } from "next";
import { Aref_Ruqaa, Cormorant_Garamond, Inter } from "next/font/google";

import { AnimationProvider } from "@/components/animations/AnimationProvider";
import { SmoothScrollProvider } from "@/components/animations/SmoothScrollProvider";
import { Navbar } from "@/components/navigation/Navbar";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SITE_URL } from "@/lib/site-url";

import "./globals.css";
import "../styles/site.css";

const headingFont = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const arabicFont = Aref_Ruqaa({
  weight: "400",
  subsets: ["arabic"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  // Resolves relative metadata URLs against the real production origin.
  metadataBase: new URL(SITE_URL),
  title: {
    default: "LQMAH",
    template: "%s | LQMAH",
  },
  description: "LQMAH Cafe & Bakery: crafted drinks, fresh desserts, and a warm place to stay awhile.",
  openGraph: { title: "LQMAH Cafe & Bakery", description: "More than coffee. A place to gather, sip, and stay awhile.", type: "website" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${headingFont.variable} ${bodyFont.variable} ${arabicFont.variable}`}
    >
      <body>
        <AnimationProvider>
          <SmoothScrollProvider>
            <a className="skip-link" href="#main-content">Skip to content</a>
            <Navbar />
            {children}
            <SiteFooter />
          </SmoothScrollProvider>
        </AnimationProvider>
      </body>
    </html>
  );
}
