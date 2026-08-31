"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { Container } from "@/components/layout/Container";
import { navigation } from "@/data/site";
import { beginFragmentNavigation, scrollToFragment } from "@/lib/scroll-to-fragment";

/** Dispatched after the URL fragment is rewritten without a navigation. */
const HASH_EVENT = "lqmah:hashchange";

/**
 * The address bar fragment, as a subscribable store.
 *
 * usePathname() excludes it, and a fragment written with replaceState fires no
 * browser event, so the value is read from location on every render and the
 * component is woken by the events that can change it behind React's back.
 */
function subscribeToHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  window.addEventListener("popstate", onChange);
  window.addEventListener(HASH_EVENT, onChange);

  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(HASH_EVENT, onChange);
  };
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  // Re-read on every render, so a route change refreshes it too.
  const hash = useSyncExternalStore(subscribeToHash, () => window.location.hash, () => "");
  // A fragment link clicked from another route, held until that route commits.
  const pendingRef = useRef<{ route: string; fragment: string } | null>(null);
  const overHero = pathname === "/" && !isScrolled && !isOpen;

  /**
   * A link is active when both its route and its fragment match the address
   * bar. Written generically rather than special-cased, so any future homepage
   * section link highlights correctly too.
   *
   * "/" is only active with no fragment, so Home stops claiming the highlight
   * while the visitor is at /#reviews.
   */
  const isActive = (href: string) => {
    const [route, fragment] = href.split("#");
    if (pathname !== (route || "/")) return false;

    return fragment ? hash === `#${fragment}` : hash === "";
  };

  useEffect(() => {
    const update = () => setIsScrolled(window.scrollY > 24);
    update(); window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  /**
   * Fragment links are handled in two different ways.
   *
   * Same route: nothing is intercepted. The browser and Lenis already scroll
   * smoothly to the section, which has always worked.
   *
   * Different route: this owns the whole sequence. Navigating to "/#reviews"
   * left two mechanisms free to move the page — Next scrolling to the fragment
   * during route commit, before the homepage had settled, and (once that was
   * disabled) no repositioning at all, so the homepage simply inherited the
   * previous route's scroll offset. Both are avoided by navigating to the bare
   * route, scrolling once the target has stopped moving, and only then writing
   * the fragment into the URL.
   */
  const handleNavClick = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    const [route, fragment] = href.split("#");
    const targetRoute = route || "/";

    setIsOpen(false);

    if (!fragment || pathname === targetRoute) return;

    event.preventDefault();
    beginFragmentNavigation();
    pendingRef.current = { route: targetRoute, fragment };
    // No fragment in the pushed URL, so nothing else tries to scroll.
    router.push(targetRoute, { scroll: false });
  };

  /**
   * Runs after the pending route has actually committed, so the target is in
   * the mounted DOM. The Navbar lives in the layout and is never unmounted by
   * the transition, which is why it can observe the arrival from outside.
   */
  useEffect(() => {
    const pending = pendingRef.current;
    if (!pending || pathname !== pending.route) return;

    pendingRef.current = null;

    // The fragment is written first: replaceState never scrolls, and doing it
    // now means the address bar and the active link are correct immediately
    // rather than after the section has been positioned.
    window.history.replaceState(null, "", `${pending.route}#${pending.fragment}`);
    window.dispatchEvent(new Event(HASH_EVENT));

    return scrollToFragment(pending.fragment);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    const focusable = panelRef.current?.querySelectorAll<HTMLElement>("a,button");
    focusable?.[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setIsOpen(false); toggleRef.current?.focus(); }
      if (event.key === "Tab" && focusable?.length) {
        const first = focusable[0]; const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [isOpen]);

  return (
    <header className={`navbar ${overHero ? "navbar--hero" : "navbar--solid"}${isOpen ? " navbar--menu-open" : ""}`}>
      <Container className="navbar__inner">
        <Link href="/" className="navbar__brand" aria-label="LQMAH home">
          <span className="navbar__brand-arabic" lang="ar" aria-hidden="true">لقمة</span>
          <span className="navbar__brand-english" aria-hidden="true">LQMAH</span>
        </Link>
        <nav aria-label="Primary navigation" className="navbar__desktop">
          {navigation.map((item) => {
            const active = isActive(item.href);
            // scroll={false} on a fragment link: Next would otherwise scroll to
            // the target during route commit, before the homepage has settled.
            return <Link key={item.label} href={item.href} scroll={!item.href.includes("#")} onClick={(event) => handleNavClick(event, item.href)} aria-current={active ? "page" : undefined}>{item.label}</Link>;
          })}
        </nav>
        <button ref={toggleRef} type="button" className="navbar__toggle" aria-expanded={isOpen} aria-controls="mobile-nav" aria-label={isOpen ? "Close menu" : "Open menu"} onClick={() => setIsOpen((value) => !value)}>{isOpen ? <X /> : <Menu />}</button>
      </Container>
      {isOpen ? <nav ref={panelRef} id="mobile-nav" className="mobile-nav" aria-label="Mobile navigation">
        {navigation.map((item) => <Link key={item.label} href={item.href} scroll={!item.href.includes("#")} aria-current={isActive(item.href) ? "page" : undefined} onClick={(event) => handleNavClick(event, item.href)}>{item.label}</Link>)}
      </nav> : null}
    </header>
  );
}
