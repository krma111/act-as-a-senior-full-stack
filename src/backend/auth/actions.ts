"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/backend/env";
import { createClient } from "@/backend/database/server";

function asString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function redirectWithMessage(path: string, key: "message" | "error", message: string): never {
  redirect(`${path}?${key}=${encodeURIComponent(message)}`);
}

export async function logout() {
  if (hasSupabaseEnv) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  revalidatePath("/", "layout");
  redirect("/login?message=You%20have%20been%20logged%20out.");
}

export async function updateOwnProfile(formData: FormData) {
  if (!hasSupabaseEnv) {
    redirectWithMessage("/dashboard", "error", "Supabase Auth is not configured.");
  }

  const fullName = asString(formData, "full_name");
  const avatarUrl = asString(formData, "avatar_url");

  if (fullName && (fullName.length < 2 || fullName.length > 80)) {
    redirectWithMessage("/dashboard", "error", "Full name must be between 2 and 80 characters.");
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const metadataUpdate = await supabase.auth.updateUser({
    data: {
      full_name: fullName || null,
      display_name: fullName || null,
      avatar_url: avatarUrl || null
    }
  });

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: fullName || null,
      avatar_url: avatarUrl || null
    })
    .eq("id", user.id);

  if (metadataUpdate.error || profileError) {
    redirectWithMessage("/dashboard", "error", metadataUpdate.error?.message ?? profileError?.message ?? "Unable to update profile.");
  }

  revalidatePath("/", "layout");
  revalidatePath("/dashboard");
  redirect("/dashboard?message=Profile%20updated.");
}
