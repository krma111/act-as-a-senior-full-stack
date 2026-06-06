import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl, hasSupabaseEnv } from "@/lib/env";

const authPages = new Set(["/login", "/signup", "/forgot-password"]);

function clearSupabaseCookies(request: NextRequest, response: NextResponse) {
  request.cookies
    .getAll()
    .filter((cookie) => cookie.name.startsWith("sb-"))
    .forEach((cookie) => response.cookies.delete(cookie.name));
}

export async function updateSession(request: NextRequest) {
  const fallbackResponse = NextResponse.next({ request });
  if (!hasSupabaseEnv) return fallbackResponse;

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
    } = await supabase.auth.getUser();

    const { pathname, search } = request.nextUrl;

    if (error) {
      clearSupabaseCookies(request, response);
      if (pathname.startsWith("/dashboard")) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/login";
        loginUrl.search = "";
        loginUrl.searchParams.set("next", `${pathname}${search}`);
        return NextResponse.redirect(loginUrl);
      }
      return response;
    }

    if (!user && pathname.startsWith("/dashboard")) {
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
  } catch {
    clearSupabaseCookies(request, fallbackResponse);
    return fallbackResponse;
  }
}
