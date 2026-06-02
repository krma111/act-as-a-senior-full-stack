import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseAnonKey, getSupabaseUrl, hasSupabaseEnv, siteUrl } from "@/lib/env";

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const authError = searchParams.get("error_description") ?? searchParams.get("error");
  const code = searchParams.get("code");
  const next = searchParams.get("next")?.startsWith("/") ? searchParams.get("next")! : "/dashboard";

  if (authError) {
    return NextResponse.redirect(`${origin || siteUrl}/login?error=${encodeURIComponent(authError)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin || siteUrl}/login?error=${encodeURIComponent("Missing authentication code. Please try again.")}`);
  }

  if (!hasSupabaseEnv) {
    return NextResponse.redirect(`${origin || siteUrl}/login?error=${encodeURIComponent("Supabase is not configured")}`);
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
      }
    }
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin || siteUrl}/login?error=${encodeURIComponent(error.message)}`);
  }

  return NextResponse.redirect(`${origin || siteUrl}${next}`);
}
