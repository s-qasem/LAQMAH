import { NextResponse, type NextRequest } from "next/server";

import { createAuthSupabaseClient } from "@/lib/supabase/server-auth";

/**
 * Landing point for the Supabase recovery email.
 *
 * The link carries a one-time `code`, which is exchanged here for a session
 * before forwarding to the form that sets the new password. Doing the exchange
 * in a route handler keeps the page itself simple: by the time it renders, the
 * session either exists or it does not.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/admin/reset-password";

  // Only same-site paths, so the callback cannot be used as an open redirect.
  const destination = next.startsWith("/") ? next : "/admin/reset-password";

  if (!code) {
    return NextResponse.redirect(`${origin}${destination}?error=missing`);
  }

  const supabase = await createAuthSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}${destination}?error=invalid`);
  }

  return NextResponse.redirect(`${origin}${destination}`);
}
