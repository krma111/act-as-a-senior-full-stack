import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseAnonKey, getSupabaseUrl, hasSupabaseEnv, siteUrl } from "@/lib/env";

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

function callbackHashHandler(origin: string, next: string) {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();
  const dashboardUrl = `${origin}${next}`;
  const loginUrl = `${origin}/login`;

  return new NextResponse(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Confirming PromptVault account</title>
    <style>
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #020403; color: #fff; font-family: Arial, sans-serif; }
      main { width: min(90vw, 420px); padding: 32px; border: 1px solid rgba(40, 255, 20, .25); border-radius: 28px; background: rgba(8, 20, 14, .86); box-shadow: 0 0 50px rgba(40, 255, 20, .18); text-align: center; }
      .mark { width: 48px; height: 48px; display: grid; place-items: center; margin: 0 auto 18px; border-radius: 16px; background: #28ff14; color: #031006; font-weight: 900; }
      p { color: #a9b8af; line-height: 1.6; }
    </style>
  </head>
  <body>
    <main>
      <div class="mark">P</div>
      <h1>Confirming your account</h1>
      <p>Please wait while PromptVault finishes your secure sign-in.</p>
    </main>
    <script type="module">
      import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

      const loginUrl = ${JSON.stringify(loginUrl)};
      const dashboardUrl = ${JSON.stringify(dashboardUrl)};
      const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const error = params.get("error_description") || params.get("error");

      if (error) {
        window.location.replace(loginUrl + "?error=" + encodeURIComponent(error));
      } else if (accessToken && refreshToken) {
        const supabase = createClient(${JSON.stringify(supabaseUrl)}, ${JSON.stringify(supabaseAnonKey)}, {
          auth: { persistSession: true, detectSessionInUrl: false }
        });
        const result = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        if (result.error) {
          window.location.replace(loginUrl + "?error=" + encodeURIComponent(result.error.message));
        } else {
          window.location.replace(dashboardUrl);
        }
      } else {
        window.location.replace(loginUrl + "?error=" + encodeURIComponent("Missing authentication code. Please try again."));
      }
    </script>
  </body>
</html>`,
    {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store"
      }
    }
  );
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const authError = searchParams.get("error_description") ?? searchParams.get("error");
  const code = searchParams.get("code");
  const next = searchParams.get("next")?.startsWith("/") ? searchParams.get("next")! : "/dashboard";
  const redirectOrigin = origin || siteUrl;

  if (authError) {
    return NextResponse.redirect(`${redirectOrigin}/login?error=${encodeURIComponent(authError)}`);
  }

  if (!hasSupabaseEnv) {
    return NextResponse.redirect(`${redirectOrigin}/login?error=${encodeURIComponent("Supabase is not configured")}`);
  }

  if (!code) {
    return callbackHashHandler(redirectOrigin, next);
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
    return NextResponse.redirect(`${redirectOrigin}/login?error=${encodeURIComponent(error.message)}`);
  }

  return NextResponse.redirect(`${redirectOrigin}${next}`);
}
