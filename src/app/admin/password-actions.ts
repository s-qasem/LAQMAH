"use server";

import { headers } from "next/headers";

import { createAuthSupabaseClient } from "@/lib/supabase/server-auth";

import { MIN_PASSWORD_LENGTH, type PasswordState } from "./password-state";

/**
 * Password management, built entirely on Supabase Auth.
 *
 * No password is ever stored, hashed or compared by this application, and no
 * custom password table exists. Supabase owns the credential; these actions
 * only ask it to send a recovery email or to update the signed-in user.
 */

/**
 * The origin this request arrived on, so a reset email sent from localhost
 * returns to localhost and one sent from production returns to production.
 * Hard-coding the production origin would break local testing.
 */
async function requestOrigin(): Promise<string> {
  const store = await headers();
  const origin = store.get("origin");

  if (origin) return origin;

  const host = store.get("host") ?? "localhost:3000";
  const protocol = store.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");

  return `${protocol}://${host}`;
}

/**
 * Sends the Supabase recovery email.
 *
 * The response is deliberately identical whether or not an account exists, so
 * this cannot be used to discover which addresses are registered.
 */
export async function requestPasswordResetAction(
  _prevState: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email || !email.includes("@")) {
    return { status: "error", message: "Enter a valid email address." };
  }

  const supabase = await createAuthSupabaseClient();
  const origin = await requestOrigin();

  // The link lands on the callback, which exchanges the code for a recovery
  // session before forwarding to the form.
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/admin/auth/callback?next=/admin/reset-password`,
  });

  // Any Supabase error is swallowed on purpose: reporting it would leak whether
  // the address is registered.
  return {
    status: "success",
    message: "If an account exists for this email, a password reset link has been sent.",
  };
}

/**
 * Sets a new password for the current session.
 *
 * Used by both the recovery flow and the signed-in change form: in each case
 * Supabase has already established the session, so no old password is required
 * and none is asked for.
 */
export async function updatePasswordAction(
  _prevState: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirm_password") ?? "");

  if (password.length < MIN_PASSWORD_LENGTH) {
    return { status: "error", message: `Use at least ${MIN_PASSWORD_LENGTH} characters.` };
  }

  if (password !== confirmation) {
    return { status: "error", message: "The two passwords do not match." };
  }

  const supabase = await createAuthSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "error",
      message: "This reset link has expired. Request a new one and try again.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { status: "error", message: "Could not update the password. Please try again." };
  }

  return { status: "success", message: "Your password has been updated." };
}
