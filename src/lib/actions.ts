"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { adminEmail, hasSupabaseEnv, isPreviewMode, siteUrl } from "@/lib/env";
import { clearPreviewUser } from "@/lib/preview-auth";
import { isValidEmail, normalizeEmail } from "@/lib/auth/validation";

function asString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function tagsFrom(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim().toLowerCase().replace(/[^a-z0-9- ]/g, "").replace(/\s+/g, "-"))
    .filter(Boolean)
    .slice(0, 12);
}

function redirectWithMessage(path: string, message: string): never {
  redirect(`${path}?message=${encodeURIComponent(message)}`);
}

function validatePromptPayload(formData: FormData) {
  const title = asString(formData, "title");
  const promptText = asString(formData, "prompt_text");
  const aiModel = asString(formData, "ai_model");

  if (title.length < 3 || title.length > 120) return "Title must be between 3 and 120 characters.";
  if (promptText.length < 10) return "Prompt text must be at least 10 characters.";
  if (!aiModel) return "Choose the AI model used.";
  return null;
}

export async function signUp(formData: FormData) {
  const email = normalizeEmail(asString(formData, "email"));
  const password = asString(formData, "password");
  const displayName = asString(formData, "display_name");
  const role = email.toLowerCase() === adminEmail.toLowerCase() ? "admin" : "user";

  if (!hasSupabaseEnv) redirectWithMessage("/signup", "Supabase is not configured.");
  if (!isValidEmail(email)) redirectWithMessage("/signup", "Invalid email");
  if (password.length < 8) redirectWithMessage("/signup", "Password must be at least 8 characters.");

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
      data: { display_name: displayName, role }
    }
  });

  if (error) redirectWithMessage("/signup", error.message);
  redirect("/dashboard");
}

export async function login(formData: FormData) {
  const email = normalizeEmail(asString(formData, "email"));
  const password = asString(formData, "password");

  if (!hasSupabaseEnv) redirectWithMessage("/login", "Supabase is not configured.");
  if (!isValidEmail(email)) redirectWithMessage("/login", "Invalid email");
  if (password.length < 8) redirectWithMessage("/login", "Password must be at least 8 characters.");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) redirectWithMessage("/login", error.message);
  redirect("/dashboard");
}

export async function logout() {
  if (isPreviewMode) {
    await clearPreviewUser();
    redirect("/");
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function createPrompt(formData: FormData) {
  const validationError = validatePromptPayload(formData);
  if (validationError) redirectWithMessage("/prompts/new", validationError);

  const file = formData.get("image");
  let imageUrl: string | null = null;

  // Make image optional - only process if file exists
  if (file instanceof File && file.size > 0) {
    if (!file.type.startsWith("image/")) redirectWithMessage("/prompts/new", "Upload a valid image file.");
    if (file.size > 8 * 1024 * 1024) redirectWithMessage("/prompts/new", "Images must be smaller than 8 MB.");

    if (isPreviewMode) {
      redirect(`/login?message=${encodeURIComponent("Supabase is not configured.")}`);
    }

    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) redirect("/login?next=/prompts/new");

    const extension = (file.name.split(".").pop() ?? "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
    const filePath = `${user.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("prompt-images")
      .upload(filePath, file, { upsert: false, contentType: file.type });

    if (uploadError) redirectWithMessage("/prompts/new", uploadError.message);

    const { data: publicUrl } = supabase.storage.from("prompt-images").getPublicUrl(filePath);
    imageUrl = publicUrl.publicUrl;
  } else {
    // If no image provided, set imageUrl to null
    imageUrl = null;
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/prompts/new");

  const { data, error } = await supabase
    .from("prompts")
    .insert({
      user_id: user.id,
      title: asString(formData, "title"),
      prompt_text: asString(formData, "prompt_text"),
      negative_prompt: asString(formData, "negative_prompt") || null,
      image_url: imageUrl,
      category_id: asString(formData, "category_id") || null,
      tags: tagsFrom(asString(formData, "tags")),
      ai_model: asString(formData, "ai_model"),
      visibility: asString(formData, "visibility") === "private" ? "private" : "public",
      status: "pending"
    })
    .select("id")
    .single();

  if (error) redirectWithMessage("/prompts/new", error.message);
  revalidatePath("/");
  redirect(`/prompts/${data.id}`);
}

export async function deleteOwnPrompt(formData: FormData) {
  const supabase = await createClient();
  const id = asString(formData, "id");
  await supabase.from("prompts").delete().eq("id", id);
  revalidatePath("/");
  redirect("/dashboard");
}

export async function updatePrompt(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = asString(formData, "id");
  const validationError = validatePromptPayload(formData);
  if (validationError) redirectWithMessage(`/prompts/${id}/edit`, validationError);

  const { data: viewer } = await supabase.from("users").select("role").eq("id", user.id).single();
  const query = supabase
    .from("prompts")
    .update({
      title: asString(formData, "title"),
      prompt_text: asString(formData, "prompt_text"),
      negative_prompt: asString(formData, "negative_prompt") || null,
      category_id: asString(formData, "category_id") || null,
      tags: tagsFrom(asString(formData, "tags")),
      ai_model: asString(formData, "ai_model"),
      visibility: asString(formData, "visibility") === "private" ? "private" : "public",
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  const { error } = viewer?.role === "admin" ? await query : await query.eq("user_id", user.id);

  if (error) redirectWithMessage(`/prompts/${id}/edit`, error.message);
  revalidatePath(`/prompts/${id}`);
  revalidatePath("/dashboard");
  redirect(`/prompts/${id}`);
}

export async function toggleFavorite(promptId: string) {
  if (isPreviewMode) {
    return { error: "Supabase is not configured." };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { error: "Login required" };

  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("prompt_id", promptId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("favorites").delete().eq("id", existing.id);
    await supabase.rpc("sync_prompt_like_count", { prompt_uuid: promptId });
    revalidatePath(`/prompts/${promptId}`);
    return { favorited: false };
  }

  const { error } = await supabase.from("favorites").insert({ prompt_id: promptId, user_id: user.id });
  await supabase.rpc("sync_prompt_like_count", { prompt_uuid: promptId });
  revalidatePath(`/prompts/${promptId}`);
  return error ? { error: error.message } : { favorited: true };
}

export async function incrementCopyCount(promptId: string) {
  if (isPreviewMode) {
    revalidatePath(`/prompts/${promptId}`);
    return;
  }

  const supabase = await createClient();
  await supabase.rpc("increment_prompt_copy_count", { prompt_uuid: promptId });
  revalidatePath(`/prompts/${promptId}`);
}

export async function reportPrompt(formData: FormData) {
  if (isPreviewMode) {
    const promptId = asString(formData, "prompt_id");
    redirect(`/prompts/${promptId}?message=${encodeURIComponent("Supabase is not configured.")}`);
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const promptId = asString(formData, "prompt_id");
  await supabase.from("reports").insert({
    prompt_id: promptId,
    user_id: user.id,
    reason: asString(formData, "reason") || "Reported by user"
  });
  revalidatePath(`/prompts/${promptId}`);
  redirect(`/prompts/${promptId}?message=${encodeURIComponent("Thanks. The report was sent to the admins.")}`);
}

export async function assertAdmin() {
  if (isPreviewMode) {
    redirect("/login?message=Supabase%20is%20not%20configured.");
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data } = await supabase.from("users").select("role,email").eq("id", user.id).single();
  if (data?.role !== "admin" || data.email?.toLowerCase() !== adminEmail.toLowerCase()) redirect("/");
  return user;
}

export async function saveSiteSettings(formData: FormData) {
  await assertAdmin();
  if (isPreviewMode) {
    revalidatePath("/");
    redirect("/admin?message=Preview settings saved.");
  }
  const admin = createAdminClient();
  await admin.from("site_settings").upsert({
    id: 1,
    website_name: asString(formData, "website_name"),
    logo_text: asString(formData, "logo_text"),
    hero_headline: asString(formData, "hero_headline"),
    hero_subheadline: asString(formData, "hero_subheadline"),
    footer_text: asString(formData, "footer_text"),
    admin_email: adminEmail
  });
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function upsertCategory(formData: FormData) {
  await assertAdmin();
  if (isPreviewMode) {
    revalidatePath("/");
    redirect("/admin?message=Preview category saved.");
  }
  const admin = createAdminClient();
  const id = asString(formData, "id");
  const payload = {
    name: asString(formData, "name"),
    slug: asString(formData, "slug").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, ""),
    description: asString(formData, "description") || null
  };
  if (id) await admin.from("categories").update(payload).eq("id", id);
  else await admin.from("categories").insert(payload);
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function deleteCategory(formData: FormData) {
  await assertAdmin();
  if (isPreviewMode) redirect("/admin?message=Preview category deleted.");
  const admin = createAdminClient();
  await admin.from("categories").delete().eq("id", asString(formData, "id"));
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function adminDeletePrompt(formData: FormData) {
  await assertAdmin();
  if (isPreviewMode) redirect("/admin?message=Preview prompt deleted.");
  const admin = createAdminClient();
  await admin.from("prompts").delete().eq("id", asString(formData, "id"));
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function adminTogglePromptFlag(formData: FormData) {
  await assertAdmin();
  if (isPreviewMode) redirect("/admin?message=Preview prompt updated.");
  const admin = createAdminClient();
  const id = asString(formData, "id");
  const field = asString(formData, "field");
  const value = asString(formData, "value") === "true";
  if (field !== "featured" && field !== "hidden") return;
  await admin.from("prompts").update({ [field]: value }).eq("id", id);
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function adminUpdateReport(formData: FormData) {
  await assertAdmin();
  if (isPreviewMode) redirect("/admin?message=Preview report updated.");
  const admin = createAdminClient();
  const id = asString(formData, "id");
  const status = asString(formData, "status") === "resolved" ? "resolved" : "open";
  await admin.from("reports").update({ status }).eq("id", id);
  revalidatePath("/admin");
}

export async function adminHideReportedPrompt(formData: FormData) {
  await assertAdmin();
  if (isPreviewMode) redirect("/admin?message=Preview reported prompt hidden.");
  const admin = createAdminClient();
  const promptId = asString(formData, "prompt_id");
  const reportId = asString(formData, "report_id");
  await admin.from("prompts").update({ hidden: true }).eq("id", promptId);
  if (reportId) await admin.from("reports").update({ status: "resolved" }).eq("id", reportId);
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function updateProfile(formData: FormData) {
  if (isPreviewMode) {
    redirectWithMessage("/dashboard", "Supabase is not configured.");
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const displayName = asString(formData, "display_name");
  if (displayName.length < 2 || displayName.length > 80) {
    redirectWithMessage("/dashboard", "Display name must be between 2 and 80 characters.");
  }

  const { error } = await supabase.from("users").update({ display_name: displayName }).eq("id", user.id);
  if (error) redirectWithMessage("/dashboard", error.message);

  revalidatePath("/dashboard");
  redirect(`/dashboard?message=${encodeURIComponent("Profile updated.")}`);
}
