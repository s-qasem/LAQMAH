"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { requestPasswordResetAction } from "../password-actions";
import { initialPasswordState } from "../password-state";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="button button--primary admin-auth__submit" disabled={pending}>
      {pending ? "Sending…" : "Send Reset Link"}
    </button>
  );
}

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(requestPasswordResetAction, initialPasswordState);

  return (
    <form action={formAction} className="admin-auth__form" noValidate>
      <div className="admin-field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="username" spellCheck={false} required />
      </div>

      {state.message ? (
        <p
          className={state.status === "success" ? "admin-auth__notice" : "admin-auth__error"}
          role={state.status === "success" ? "status" : "alert"}
          aria-live="polite"
        >
          {state.message}
        </p>
      ) : null}

      <SubmitButton />

      <p className="admin-auth__aside">
        <Link href="/admin/login">Back to sign in</Link>
      </p>
    </form>
  );
}
