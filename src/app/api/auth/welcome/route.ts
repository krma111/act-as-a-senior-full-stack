import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { sendWelcomeEmailIfNeeded } from "@/lib/email";
import { getSupabaseAnonKey, getSupabaseUrl, hasSupabaseEnv } from "@/lib/env";

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
  } = await supabase.auth.getUser();

  if (error || !user?.email) {
    return NextResponse.json({ error: "Authenticated session required." }, { status: 401 });
  }

  const name =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name
        : user.email.split("@")[0];

  const result = await sendWelcomeEmailIfNeeded(user.email, name, user.id);
  return NextResponse.json(result);
}
