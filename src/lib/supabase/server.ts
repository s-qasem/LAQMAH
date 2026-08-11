import "server-only";

import { createClient } from "@supabase/supabase-js";

import { supabaseConfig } from "./config";

export function createServerSupabaseClient() {
  return createClient(supabaseConfig.url, supabaseConfig.anonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
