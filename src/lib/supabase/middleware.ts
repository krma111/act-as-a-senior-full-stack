import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl, hasSupabaseEnv } from "@/lib/env";

const authPages = new Set(["/login", "/signup", "/forgot-password"]);
const AUTH_TIMEOUT_MS = 1800;

function clearSupabaseCookies(request: NextRequest, response: NextResponse) {
  request.cookies
    .getAll()
    .filter((cookie) => cookie.name.startsWith("sb-"))
    .forEach((cookie) => response.cookies.delete(cookie.name));
}

function hasSupabaseSessionCookie(request: NextRequest) {
  return request.cookies.getAll().some((cookie) => cookie.name.startsWith("sb-"));
}

function getUserWithTimeout<T>(promise: Promise<T>) {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Supabase auth middleware timeout")), AUTH_TIMEOUT_MS)
    )
  ]);
}

export async function updateSession(request: NextRequest) {
  const fallbackResponse = NextResponse.next({ request });
  if (!hasSupabaseEnv) return fallbackResponse;

  const { pathname, search } = request.nextUrl;
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isAdminRoute = pathname.startsWith("/admin");
  const isAuthPage = authPages.has(pathname);

  // Public pages should never wait on Supabase Auth in middleware. Server
  // components still perform their own auth checks for protected data.
  if (!isDashboardRoute && !isAdminRoute && !isAuthPage) {
    return fallbackResponse;
  }

  // Logged-out auth pages do not need a remote auth check.
  if (isAuthPage && !hasSupabaseSessionCookie(request)) {
    return fallbackResponse;
  }

  let response = NextResponse.next({ request });

  try {
    const supabase = createServerClient(
      getSupabaseUrl(),
      getSupabaseAnonKey(),
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          }
        }
      }
    );

    const {
      data: { user },
      error
    } = await getUserWithTimeout(supabase.auth.getUser());

    if (error) {
      clearSupabaseCookies(request, response);
      if (isDashboardRoute || isAdminRoute) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/login";
        loginUrl.search = "";
        loginUrl.searchParams.set("next", `${pathname}${search}`);
        return NextResponse.redirect(loginUrl);
      }
      return response;
    }

    if (!user && (isDashboardRoute || isAdminRoute)) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.search = "";
      loginUrl.searchParams.set("next", `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }

    if (user && authPages.has(pathname)) {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = "/dashboard";
      dashboardUrl.search = "";
      return NextResponse.redirect(dashboardUrl);
    }

    return response;
  } catch (error) {
    console.error("[supabase-middleware] Auth check failed", error);
    clearSupabaseCookies(request, fallbackResponse);
    return fallbackResponse;
  }
}
