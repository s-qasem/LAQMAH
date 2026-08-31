"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";

import { useAdminLanguage } from "./AdminLanguageProvider";

type AdminDrawerProps = {
  open: boolean;
  onClose: () => void;
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
};

/**
 * Right-side editor panel for add / edit forms.
 *
 * Slides in from the inline-end edge, so it flips to the left automatically
 * under `dir="rtl"`. Behaviour matches `AdminModal` — focus trap, Escape to
 * close, backdrop dismiss, body scroll lock — and on narrow screens the CSS
 * lays it out as a full-height sheet instead of a side panel.
 */
export function AdminDrawer({ open, onClose, eyebrow, title, description, children, footer }: AdminDrawerProps) {
  const { t } = useAdminLanguage();
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;

    const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
      "a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled])",
    );
    focusable?.[0]?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
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
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="admin-drawer-editor" role="presentation" onClick={onClose}>
      <div
        ref={panelRef}
        className="admin-drawer-editor__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="admin-drawer-editor__header">
          <div>
            {eyebrow ? <p className="admin-drawer-editor__eyebrow">{eyebrow}</p> : null}
            <h2 id={titleId} className="admin-drawer-editor__title">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="admin-drawer-editor__description">
                {description}
              </p>
            ) : null}
          </div>

          <button type="button" className="admin-icon-button" onClick={onClose} aria-label={t("editor.close")}>
            <X aria-hidden="true" />
          </button>
        </header>

        {/* data-lenis-prevent keeps a smooth-scroll library from swallowing the
            wheel here if one is ever enabled on the admin. */}
        <div className="admin-drawer-editor__body" data-lenis-prevent>
          {children}
        </div>

        {footer ? <footer className="admin-drawer-editor__footer">{footer}</footer> : null}
      </div>
    </div>
  );
}
