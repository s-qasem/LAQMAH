"use client";

import { LogOut, Menu, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

import { signOutAction } from "@/app/admin/actions";
import { adminNavLinks, adminNavigation, isNavGroup, type AdminNavLink } from "@/data/admin-nav";

import { useAdminLanguage } from "./AdminLanguageProvider";
import { LanguageToggle } from "./LanguageToggle";

const COLLAPSE_STORAGE_KEY = "lqmah-admin-sidebar-collapsed";

/**
 * The desktop collapse preference lives in localStorage rather than React state
 * so it survives a reload. `useSyncExternalStore` reads it without an effect,
 * and renders the expanded default on the server so hydration stays clean.
 */
const collapseListeners = new Set<() => void>();

function subscribeToCollapse(listener: () => void) {
  collapseListeners.add(listener);
  return () => {
    collapseListeners.delete(listener);
  };
}

function readCollapsed() {
  try {
    return window.localStorage.getItem(COLLAPSE_STORAGE_KEY) === "true";
  } catch {
    // Storage can be unavailable (private mode); the expanded default is fine.
    return false;
  }
}

function writeCollapsed(next: boolean) {
  try {
    window.localStorage.setItem(COLLAPSE_STORAGE_KEY, String(next));
  } catch {
    // Preference is a convenience only.
  }
  collapseListeners.forEach((listener) => listener());
}

type AdminShellProps = {
  userEmail: string;
  /** `next/font` variable class carrying the Arabic UI face, applied at the shell root. */
  fontClassName?: string;
  children: ReactNode;
};

/**
 * Persistent admin chrome: sidebar, top bar and mobile drawer. Rendered once by
 * the dashboard layout so no individual page repeats the navigation.
 */
export function AdminShell({ userEmail, fontClassName = "", children }: AdminShellProps) {
  const pathname = usePathname();
  const { dir, lang, t } = useAdminLanguage();
  const collapsed = useSyncExternalStore(subscribeToCollapse, readCollapsed, () => false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const drawerToggleRef = useRef<HTMLButtonElement>(null);

  // Longest-prefix match so /admin/menu/categories never also lights up /admin.
  const activeHref = adminNavLinks.reduce<string | null>((best, link) => {
    const matches = pathname === link.href || pathname.startsWith(`${link.href}/`);
    if (!matches) return best;
    return best && best.length >= link.href.length ? best : link.href;
  }, null);

  const activeLink = adminNavLinks.find((link) => link.href === activeHref);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  useEffect(() => {
    if (!drawerOpen) return;

    const focusable = drawerRef.current?.querySelectorAll<HTMLElement>("a[href],button:not([disabled])");
    focusable?.[0]?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDrawer();
        drawerToggleRef.current?.focus();
        return;
      }

      if (event.key === "Tab" && focusable?.length) {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen, closeDrawer]);

  const renderLink = (link: AdminNavLink, nested: boolean, onNavigate?: () => void) => {
    const active = activeHref === link.href;
    const Icon = link.icon;

    return (
      <Link
        key={link.href}
        href={link.href}
        className={`admin-nav__link${nested ? " admin-nav__link--nested" : ""}`}
        aria-current={active ? "page" : undefined}
        title={t(link.hintKey)}
        onClick={onNavigate}
      >
        <span className="admin-nav__indicator" aria-hidden="true" />
        <span className="admin-nav__icon" aria-hidden="true">
          <Icon />
        </span>
        <span className="admin-nav__label">{t(link.labelKey)}</span>
      </Link>
    );
  };

  /** Shared between the sidebar and the drawer; the drawer also closes on navigation. */
  const renderNavigation = (onNavigate?: () => void) => (
    <nav className="admin-nav" aria-label={t("shell.sections.aria")}>
      {adminNavigation.map((entry) => {
        if (!isNavGroup(entry)) return renderLink(entry, false, onNavigate);

        const GroupIcon = entry.icon;

        return (
          <div key={entry.labelKey} className="admin-nav__group">
            <p className="admin-nav__group-label">
              <span className="admin-nav__icon" aria-hidden="true">
                <GroupIcon />
              </span>
              <span className="admin-nav__label">{t(entry.labelKey)}</span>
            </p>
            {entry.children.map((child) => renderLink(child, true, onNavigate))}
          </div>
        );
      })}
    </nav>
  );

  const logoutButton = (
    <form action={signOutAction} className="admin-nav__logout-form">
      <button type="submit" className="admin-nav__link admin-nav__link--logout">
        <span className="admin-nav__icon" aria-hidden="true">
          <LogOut />
        </span>
        <span className="admin-nav__label">{t("shell.logout")}</span>
      </button>
    </form>
  );

  const renderBrand = (onNavigate?: () => void) => (
    <Link href="/admin" className="admin-brand" aria-label={t("shell.brand.aria")} onClick={onNavigate}>
      <span className="admin-brand__arabic" lang="ar" aria-hidden="true">
        لقمة
      </span>
      <span className="admin-brand__english">LQMAH</span>
    </Link>
  );

  return (
    <div
      className={`admin-layout ${fontClassName}`.trim()}
      dir={dir}
      lang={lang}
      data-collapsed={collapsed ? "true" : "false"}
    >
      <aside className="admin-sidebar" aria-label={t("shell.sidebar.aria")}>
        <div className="admin-sidebar__head">
          {renderBrand()}
          <button
            type="button"
            className="admin-icon-button admin-sidebar__collapse"
            onClick={() => writeCollapsed(!collapsed)}
            aria-pressed={collapsed}
            aria-label={t(collapsed ? "shell.sidebar.expand" : "shell.sidebar.collapse")}
            title={t(collapsed ? "shell.sidebar.expand" : "shell.sidebar.collapse")}
          >
            {collapsed ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
          </button>
        </div>

        <div className="admin-sidebar__scroll">{renderNavigation()}</div>

        <div className="admin-sidebar__foot">
          <p className="admin-sidebar__user" title={userEmail}>
            <span className="admin-sidebar__user-email">{userEmail}</span>
          </p>
          {logoutButton}
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            ref={drawerToggleRef}
            type="button"
            className="admin-icon-button admin-topbar__toggle"
            onClick={() => setDrawerOpen(true)}
            aria-expanded={drawerOpen}
            aria-controls="admin-drawer"
            aria-label={t("shell.nav.open")}
          >
            <Menu aria-hidden="true" />
          </button>

          <div className="admin-topbar__identity">
            <span className="admin-topbar__brand">{renderBrand()}</span>
            <span className="admin-topbar__current">{t(activeLink?.labelKey ?? "nav.dashboard")}</span>
          </div>

          <LanguageToggle />

          <form action={signOutAction} className="admin-topbar__logout">
            <button type="submit" className="admin-button admin-button--ghost">
              <LogOut aria-hidden="true" />
              <span>{t("shell.logout")}</span>
            </button>
          </form>
        </header>

        <main id="main-content" className="admin-content">
          {children}
        </main>
      </div>

      {drawerOpen ? (
        <div className="admin-drawer" role="presentation" onClick={closeDrawer}>
          <div
            ref={drawerRef}
            id="admin-drawer"
            className="admin-drawer__panel"
            role="dialog"
            aria-modal="true"
            aria-label={t("shell.sidebar.aria")}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-drawer__head">
              {renderBrand(closeDrawer)}
              <button
                type="button"
                className="admin-icon-button"
                onClick={closeDrawer}
                aria-label={t("shell.nav.close")}
              >
                <X aria-hidden="true" />
              </button>
            </div>

            <div className="admin-drawer__scroll">{renderNavigation(closeDrawer)}</div>

            <div className="admin-drawer__foot">
              <p className="admin-sidebar__user">
                <span className="admin-sidebar__user-email">{userEmail}</span>
              </p>
              {logoutButton}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
