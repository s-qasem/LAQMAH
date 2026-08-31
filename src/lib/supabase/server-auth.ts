import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient, User } from "@supabase/supabase-js";

import { supabaseConfig } from "./config";

/**
 * Cookie-backed Supabase client for Server Components, Server Actions and
 * Route Handlers. Unlike `createServerSupabaseClient` (used for public,
 * cacheable content reads) this client carries the signed-in admin session.
 *
 * Always create a fresh client per request; never share it across requests.
 */
export async function createAuthSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseConfig.url, supabaseConfig.anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot write cookies. The proxy refreshes the
          // session on every /admin request, so this is safe to ignore.
        }
      },
    },
  });
}

/**
 * Asks the database whether the current session is on the admin allowlist.
 *
 * The check runs through the `public.is_admin()` SECURITY DEFINER function, so
 * the app never needs to read `admin_users` directly and the allowlist stays
 * invisible to the client. Any error is treated as "not authorized".
 */
export async function isCurrentUserAdmin(supabase: SupabaseClient): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_admin");

  if (error) return false;

  return data === true;
}

export type AdminAccess = {
  /** The signed-in user, or null when there is no valid session. */
  user: User | null;
  /** True only when that user is also on the admin allowlist. */
  isAuthorized: boolean;
};

/**
 * Full access picture for the admin area.
 *
 * Callers that need to tell "signed out" apart from "signed in but not an
 * admin" should use this; everything else can use `getAdminUser()`.
 */
export async function getAdminAccess(): Promise<AdminAccess> {
  const supabase = await createAuthSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) return { user: null, isAuthorized: false };

  return { user: data.user, isAuthorized: await isCurrentUserAdmin(supabase) };
}

/**
 * Returns the signed-in user only when they are an authorized admin.
 *
 * Authentication alone is not enough: a valid session that is not on the
 * `admin_users` allowlist resolves to `null`, exactly like a signed-out
 * request. Row Level Security enforces the same rule at the data layer.
 */
export async function getAdminUser(): Promise<User | null> {
  const { user, isAuthorized } = await getAdminAccess();

  return isAuthorized ? user : null;
}
