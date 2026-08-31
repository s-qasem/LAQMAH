import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { supabaseConfig } from "@/lib/supabase/config";

const LOGIN_PATH = "/admin/login";
const DASHBOARD_PATH = "/admin";

/**
 * Runs only on /admin routes (see `config.matcher`), so the public LQMAH site
 * is untouched. It refreshes the Supabase session cookies and performs the
 * optimistic auth redirect before the route renders.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseConfig.url, supabaseConfig.anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }

        response = NextResponse.next({ request });

        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }

        for (const [key, value] of Object.entries(headers)) {
          response.headers.set(key, value);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isLoginRoute = pathname === LOGIN_PATH;

  if (!user && !isLoginRoute) {
    return redirectWithSession(request, response, LOGIN_PATH);
  }

  if (user && isLoginRoute) {
    return redirectWithSession(request, response, DASHBOARD_PATH);
  }

  return response;
}

function redirectWithSession(request: NextRequest, source: NextResponse, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";

  const redirectResponse = NextResponse.redirect(url);

  for (const cookie of source.cookies.getAll()) {
    redirectResponse.cookies.set(cookie);
  }

  return redirectResponse;
}

export const config = {
  matcher: ["/admin/:path*"],
};
