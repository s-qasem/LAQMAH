"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";

import { useAdminLanguage } from "./AdminLanguageProvider";

type AdminModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
};

/**
 * Shared dialog used by every management screen for add / edit forms.
 * Traps focus, closes on Escape or backdrop click, and locks body scroll —
 * mirroring the behaviour of the public mobile navigation panel.
 */
export function AdminModal({ open, onClose, title, description, children, footer }: AdminModalProps) {
  const { t } = useAdminLanguage();
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    const focusable = panel?.querySelectorAll<HTMLElement>(
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
    <div className="admin-modal" role="presentation" onClick={onClose}>
      <div
        ref={panelRef}
        className="admin-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="admin-modal__header">
          <div>
            <h2 id={titleId} className="admin-modal__title">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="admin-modal__description">
                {description}
              </p>
            ) : null}
          </div>

          <button type="button" className="admin-icon-button" onClick={onClose} aria-label={t("common.closeDialog")}>
            <X aria-hidden="true" />
          </button>
        </header>

        <div className="admin-modal__body" data-lenis-prevent>
          {children}
        </div>

        {footer ? <footer className="admin-modal__footer">{footer}</footer> : null}
      </div>
    </div>
  );
}
