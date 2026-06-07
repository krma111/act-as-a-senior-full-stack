import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseEnv } from "@/lib/env";

function hasSupabaseSessionCookie(request: NextRequest) {
  return request.cookies.getAll().some((cookie) => cookie.name.startsWith("sb-"));
}

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request });
  if (!hasSupabaseEnv) return response;

  const { pathname, search } = request.nextUrl;
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isAdminRoute = pathname.startsWith("/admin");
  const hasSessionCookie = hasSupabaseSessionCookie(request);

  // Never run remote auth checks in middleware. Vercel edge middleware has a
  // tight timeout, and Server Components/Actions already validate auth before
  // reading or mutating protected data.
  if ((isDashboardRoute || isAdminRoute) && !hasSessionCookie) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}
