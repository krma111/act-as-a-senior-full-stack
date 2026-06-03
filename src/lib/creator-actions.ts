"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";

function asString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function asBoolean(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "on" || value === "true" || value === "1";
}

function redirectWithMessage(path: string, type: "message" | "error", message: string): never {
  redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}

function tagsFrom(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim().toLowerCase().replace(/[^a-z0-9- ]/g, "").replace(/\s+/g, "-"))
    .filter(Boolean)
    .slice(0, 16);
}

function cleanDifficulty(value: string) {
  if (value === "beginner" || value === "advanced") return value;
  return "intermediate";
}

function cleanAspectRatio(value: string) {
  return value || "1:1";
}

function validatePromptForm(formData: FormData) {
  const title = asString(formData, "title");
  const description = asString(formData, "description");
  const promptText = asString(formData, "prompt_text");
  const category = asString(formData, "category");
  const aiModel = asString(formData, "ai_model");

  if (title.length < 3 || title.length > 160) return "Title must be between 3 and 160 characters.";
  if (description.length > 500) return "Description must be 500 characters or less.";
  if (promptText.length < 10) return "Prompt text must be at least 10 characters.";
  if (!category) return "Category is required.";
  if (!aiModel) return "AI model is required.";
  return null;
}

async function requireCreatorSession(nextPath: string) {
  if (!hasSupabaseEnv) redirectWithMessage("/login", "error", "Supabase is not configured.");

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return { supabase, user };
}

async function ensureCreatorProfile(user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }) {
  const admin = createAdminClient();
  const fullName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.display_name === "string"
      ? user.user_metadata.display_name
      : user.email?.split("@")[0] ?? "Creator";

  await admin.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? null,
      display_name: fullName,
      role: "creator",
      updated_at: new Date().toISOString()
    },
    { onConflict: "id" }
  );
}

async function uploadPromptImage(formData: FormData, userId: string, currentImageUrl?: string | null) {
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    if (currentImageUrl) return currentImageUrl;
    redirectWithMessage("/dashboard/upload", "error", "Image upload is required.");
  }

  if (!file.type.startsWith("image/")) redirectWithMessage("/dashboard/upload", "error", "Upload a valid image file.");
  if (file.size > 8 * 1024 * 1024) redirectWithMessage("/dashboard/upload", "error", "Images must be smaller than 8 MB.");

  const supabase = await createClient();
  const extension = (file.name.split(".").pop() ?? "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const filePath = `${userId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("prompt-images").upload(filePath, file, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false
  });

  if (error) redirectWithMessage("/dashboard/upload", "error", error.message);

  const { data } = supabase.storage.from("prompt-images").getPublicUrl(filePath);
  return data.publicUrl;
}

function promptPayload(formData: FormData, userId: string, imageUrl: string) {
  return {
    user_id: userId,
    title: asString(formData, "title"),
    description: asString(formData, "description") || null,
    prompt_text: asString(formData, "prompt_text"),
    image_url: imageUrl,
    category: asString(formData, "category").toLowerCase(),
    tags: tagsFrom(asString(formData, "tags")),
    ai_model: asString(formData, "ai_model"),
    aspect_ratio: cleanAspectRatio(asString(formData, "aspect_ratio")),
    reference_required: asBoolean(formData, "reference_required"),
    difficulty: cleanDifficulty(asString(formData, "difficulty")),
    status: "pending",
    rejection_reason: null,
    featured: false,
    updated_at: new Date().toISOString()
  };
}

export async function createCreatorPrompt(formData: FormData) {
  const validationError = validatePromptForm(formData);
  if (validationError) redirectWithMessage("/dashboard/upload", "error", validationError);

  const { user } = await requireCreatorSession("/dashboard/upload");
  await ensureCreatorProfile(user);
  const imageUrl = await uploadPromptImage(formData, user.id);

  const admin = createAdminClient();
  const { error } = await admin.from("prompts").insert(promptPayload(formData, user.id, imageUrl));

  if (error) redirectWithMessage("/dashboard/upload", "error", error.message);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/my-prompts");
  redirectWithMessage("/dashboard/my-prompts", "message", "Prompt submitted for approval.");
}

export async function updateCreatorPrompt(formData: FormData) {
  const id = asString(formData, "id");
  if (!id) redirectWithMessage("/dashboard/my-prompts", "error", "Prompt not found.");

  const validationError = validatePromptForm(formData);
  if (validationError) redirectWithMessage(`/dashboard/edit/${id}`, "error", validationError);

  const { user } = await requireCreatorSession(`/dashboard/edit/${id}`);
  await ensureCreatorProfile(user);

  const admin = createAdminClient();
  const { data: current, error: currentError } = await admin
    .from("prompts")
    .select("id,user_id,image_url")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (currentError || !current) redirectWithMessage("/dashboard/my-prompts", "error", "Prompt not found.");

  const imageUrl = await uploadPromptImage(formData, user.id, current.image_url);
  const { error } = await admin
    .from("prompts")
    .update(promptPayload(formData, user.id, imageUrl))
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) redirectWithMessage(`/dashboard/edit/${id}`, "error", error.message);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/my-prompts");
  revalidatePath(`/dashboard/edit/${id}`);
  redirectWithMessage("/dashboard/my-prompts", "message", "Prompt updated and moved back to pending review.");
}
