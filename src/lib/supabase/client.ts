"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { supabaseConfig } from "./config";

let browserClient: SupabaseClient | undefined;

/**
 * Browser Supabase client that shares the admin session.
 *
 * Uses `createBrowserClient` from `@supabase/ssr` rather than the plain
 * `createClient`, because the session lives in cookies written by the server
 * helper (`createServerClient`). Those cookies are not httpOnly, so this client
 * reads the same session and Storage RLS evaluates the request as the signed-in
 * admin — `public.is_admin()` still gates every write.
 *
 * Only the publishable key is used; no service-role key is ever sent to the
 * browser.
 */
export function createBrowserSupabaseClient() {
  browserClient ??= createBrowserClient(supabaseConfig.url, supabaseConfig.anonKey);

  return browserClient;
}
