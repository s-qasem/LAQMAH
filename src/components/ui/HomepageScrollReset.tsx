"use client";

import { useEffect } from "react";

import { isFragmentNavigationPending, scrollToFragment } from "@/lib/scroll-to-fragment";

/**
 * Homepage scroll position on arrival.
 *
 * Only two cases are handled here, and neither of them is a link click:
 *
 *   - A direct load or refresh of "/#reviews", where the fragment comes from
 *     the address bar rather than from navigation.
 *   - A plain visit to "/", which starts at the top.
 *
 * A fragment link clicked on another route is owned by the navbar, which
 * navigates to the bare route and positions the section once it has settled.
 * This component stands aside for that case so the two never fight.
 */
export function HomepageScrollReset() {
  useEffect(() => {
    const hash = window.location.hash;

    // A legacy anchor that should never survive a load.
    if (hash === "#welcome") {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }

    // The navigation layer is already on its way to a section.
    if (isFragmentNavigationPending()) return;

    const fragment = hash.length > 1 && hash !== "#welcome" ? hash.slice(1) : "";

    if (!fragment) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      return;
    }

    return scrollToFragment(fragment);
  }, []);

  return null;
}
