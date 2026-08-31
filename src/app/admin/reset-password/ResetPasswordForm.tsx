"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";

import { updatePasswordAction } from "../password-actions";
import { initialPasswordState } from "../password-state";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="button button--primary admin-auth__submit" disabled={pending}>
      {pending ? "Saving…" : "Set New Password"}
    </button>
  );
}

export function ResetPasswordForm() {
  const [state, formAction] = useActionState(updatePasswordAction, initialPasswordState);
  const router = useRouter();

  // On success the recovery session has served its purpose; send the admin to
  // sign in with the new password.
  useEffect(() => {
    if (state.status !== "success") return;

    const timer = window.setTimeout(() => router.replace("/admin/login"), 1800);

    return () => window.clearTimeout(timer);
  }, [state.status, router]);

  if (state.status === "success") {
    return (
      <div className="admin-auth__form">
        <p className="admin-auth__notice" role="status">
          {state.message} Redirecting to sign in…
        </p>
        <p className="admin-auth__aside">
          <Link href="/admin/login">Go to sign in now</Link>
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="admin-auth__form" noValidate>
      <div className="admin-field">
        <label htmlFor="password">New password</label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </div>

      <div className="admin-field">
        <label htmlFor="confirm_password">Confirm new password</label>
        <input
          id="confirm_password"
          name="confirm_password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>

      {state.message ? (
        <p className="admin-auth__error" role="alert" aria-live="polite">
          {state.message}
        </p>
      ) : null}

      <SubmitButton />

      <p className="admin-auth__aside">
        <Link href="/admin/forgot-password">Request a new reset link</Link>
      </p>
    </form>
  );
}
