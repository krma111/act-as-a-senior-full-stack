import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { sendWelcomeEmailIfNeeded } from "@/backend/email/send";
import { getSupabaseAnonKey, getSupabaseUrl, hasSupabaseEnv } from "@/backend/env";
import { getErrorMessage, withTimeout } from "@/backend/utils/timeout";

export async function POST(request: Request) {
  if (!hasSupabaseEnv) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Authenticated session required." }, { status: 401 });
  }

  const supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      persistSession: false
    },
    global: {
      headers: {
        Authorization: authorization
      }
    }
  });

  const {
    data: { user },
    error
  } = await withTimeout(supabase.auth.getUser(), 4000, "welcome auth lookup").catch((error) => ({
    data: { user: null },
    error: { message: getErrorMessage(error, "Authenticated session required.") }
  }));

  if (error || !user?.email) {
    return NextResponse.json({ error: "Authenticated session required." }, { status: 401 });
  }

  const name =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name
        : user.email.split("@")[0];

  const result = await withTimeout(sendWelcomeEmailIfNeeded(user.email, name, user.id), 6000, "welcome email").catch((error) => ({
    sent: false,
    reason: getErrorMessage(error, "Welcome email timed out.")
  }));
  return NextResponse.json(result);
}
