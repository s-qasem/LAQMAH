"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { supabaseConfig } from "./config";

let browserClient: SupabaseClient | undefined;

export function createBrowserSupabaseClient() {
  browserClient ??= createClient(supabaseConfig.url, supabaseConfig.anonKey);

  return browserClient;
}
