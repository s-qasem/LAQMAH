"use client";

import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";

type SmoothScrollProviderProps = {
  children: ReactNode;
};

let activeLenis: Lenis | null = null;

/**
 * The running Lenis instance, or null where smooth scrolling is off (the admin)
 * or before the provider has mounted.
 *
 * Exposed so a component can scroll through the same instance that owns the
 * scroll position. Calling `window.scrollTo({ behavior: "smooth" })` while
 * Lenis is running starts a second, competing animation against its rAF loop.
 */
export function getLenis(): Lenis | null {
  return activeLenis;
}

export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  const pathname = usePathname();

  /**
   * Smooth scrolling is a public-site flourish and is deliberately not applied
   * to the admin dashboard.
   *
   * Lenis binds a `wheel` listener at the document level and drives scrolling
   * itself. Inside the admin that swallows the wheel before it reaches a nested
   * scroll container, so the editor drawers and dialogs could only be scrolled
   * by dragging their scrollbar. Momentum scrolling is also the wrong feel for a
   * management interface.
   *
   * Public routes are unaffected: their pathname never starts with /admin, so
   * Lenis initialises exactly as before.
   */
  const enabled = !pathname.startsWith("/admin");

  useEffect(() => {
    if (!enabled) return;

    const lenis = new Lenis({
      autoRaf: true,
      anchors: true,
    });

    activeLenis = lenis;

    return () => {
      activeLenis = null;
      lenis.destroy();
    };
  }, [enabled]);

  return children;
}
