import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createAuthSupabaseClient, isCurrentUserAdmin } from "./server-auth";

/**
 * Cookie-backed client for a Server Action, or null when the caller is not an
 * allowlisted admin.
 *
 * Returns null rather than redirecting: `redirect()` throws NEXT_REDIRECT,
 * which would reject the awaited call inside a client transition and leave the
 * button looking like it did nothing. Callers surface a visible error instead.
 *
 * RLS remains the real boundary — this only turns an unauthorized call into a
 * readable message.
 */
export async function getAdminActionClient(): Promise<SupabaseClient | null> {
  const supabase = await createAuthSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) return null;
  if (!(await isCurrentUserAdmin(supabase))) return null;

  return supabase;
}
