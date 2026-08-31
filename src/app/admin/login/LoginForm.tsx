"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { signInAction, type LoginState } from "../actions";

const initialLoginState: LoginState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="button button--primary admin-auth__submit" disabled={pending}>
      {pending ? "Signing in…" : "Sign In"}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(signInAction, initialLoginState);

  return (
    <form action={formAction} className="admin-auth__form" noValidate>
      <div className="admin-field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          spellCheck={false}
          required
          aria-describedby={state.error ? "login-error" : undefined}
        />
      </div>

      <div className="admin-field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-describedby={state.error ? "login-error" : undefined}
        />
      </div>

      <p id="login-error" className="admin-auth__error" role="alert" aria-live="polite">
        {state.error}
      </p>

      <SubmitButton />

      <p className="admin-auth__aside">
        <Link href="/admin/forgot-password">Forgot password?</Link>
      </p>
    </form>
  );
}
