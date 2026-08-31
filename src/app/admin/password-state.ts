/**
 * Shared form state for the password screens.
 *
 * Deliberately a plain module, not a `"use server"` one: Next.js allows a
 * server-actions file to export async functions only, so a value like
 * `initialPasswordState` cannot live beside the actions that use it. Types are
 * erased before that rule is applied, but the constant is real at runtime and
 * broke the whole admin action manifest.
 */

export type PasswordState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

export const initialPasswordState: PasswordState = { status: "idle", message: null };

/** Supabase's own minimum is 6; 8 is required here. */
export const MIN_PASSWORD_LENGTH = 8;
