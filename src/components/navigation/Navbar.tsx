"use client";

import { Menu, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Container } from "@/components/layout/Container";
import { navigation } from "@/data/site";

export function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const overHero = pathname === "/" && !isScrolled && !isOpen;

  useEffect(() => {
    const update = () => setIsScrolled(window.scrollY > 24);
    update(); window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

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
    <header className={`navbar ${overHero ? "navbar--hero" : "navbar--solid"}`}>
      <Container className="navbar__inner">
        <Link href="/" className="navbar__brand" aria-label="LQMAH home">
          <span className="navbar__brand-arabic" lang="ar" aria-hidden="true">لقمة</span>
          <span className="navbar__brand-english" aria-hidden="true">LQMAH</span>
        </Link>
        <nav aria-label="Primary navigation" className="navbar__desktop">
          {navigation.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href.split("#")[0]);
            return <Link key={item.label} href={item.href} aria-current={active ? "page" : undefined}>{item.label}</Link>;
          })}
        </nav>
        <Link href="/order" className="button navbar__order">Order Online</Link>
        <Link href="/order" className="navbar__order-short" aria-label="Order online"><ShoppingBag /></Link>
        <button ref={toggleRef} type="button" className="navbar__toggle" aria-expanded={isOpen} aria-controls="mobile-nav" aria-label={isOpen ? "Close menu" : "Open menu"} onClick={() => setIsOpen((value) => !value)}>{isOpen ? <X /> : <Menu />}</button>
      </Container>
      {isOpen ? <nav ref={panelRef} id="mobile-nav" className="mobile-nav" aria-label="Mobile navigation">
        <p className="eyebrow">Navigate</p>
        {navigation.map((item) => <Link key={item.label} href={item.href} onClick={() => setIsOpen(false)}>{item.label}</Link>)}
        <Link href="/order" className="button button--primary" onClick={() => setIsOpen(false)}>Order Online</Link>
      </nav> : null}
    </header>
  );
}
