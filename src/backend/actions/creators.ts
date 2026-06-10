"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/backend/database/server";
import { hasSupabaseEnv } from "@/backend/env";
import { sendSubmissionReceivedEmail } from "@/backend/email/send";
import { normalizePromptTags } from "@/shared/validation/prompt-tags";

const maxImageSizeBytes = 8 * 1024 * 1024;

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

function isMissingTableError(message?: string | null) {
  const value = (message ?? "").toLowerCase();
  return value.includes("schema cache") || value.includes("could not find the table") || value.includes("does not exist");
}

function tagsFrom(value: string) {
  return normalizePromptTags(value);
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

async function ensureCreatorProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  errorPath: string
) {
  const { error } = await supabase.rpc("ensure_creator_profile");
  if (error) {
    redirectWithMessage(errorPath, "error", `Creator profile setup failed: ${error.message}`);
  }
}

async function uploadPromptImage(formData: FormData, userId: string, errorPath: string, currentImageUrl?: string | null) {
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    if (currentImageUrl) return currentImageUrl;
    return null;
  }

  if (!file.type.startsWith("image/")) redirectWithMessage(errorPath, "error", "Upload a valid image file.");
  if (file.size > maxImageSizeBytes) redirectWithMessage(errorPath, "error", "Images must be smaller than 8 MB.");

  const supabase = await createClient();
  const extension = (file.name.split(".").pop() ?? "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const filePath = `${userId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("prompt-images").upload(filePath, file, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false
  });

  if (error) redirectWithMessage(errorPath, "error", error.message);

  const { data } = supabase.storage.from("prompt-images").getPublicUrl(filePath);
  return data.publicUrl;
}

function promptPayload(formData: FormData, userId: string, imageUrl: string | null) {
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
    status: "pending",
    rejection_reason: null,
    featured: false,
    updated_at: new Date().toISOString()
  };
}

export async function createCreatorPrompt(formData: FormData) {
  const validationError = validatePromptForm(formData);
  if (validationError) redirectWithMessage("/dashboard/upload", "error", validationError);

  const { supabase, user } = await requireCreatorSession("/dashboard/upload");
  await ensureCreatorProfile(supabase, "/dashboard/upload");
  const imageUrl = await uploadPromptImage(formData, user.id, "/dashboard/upload");
  const { data, error } = await supabase
    .from("prompts")
    .insert(promptPayload(formData, user.id, imageUrl))
    .select("id,title")
    .single();

  if (error) redirectWithMessage("/dashboard/upload", "error", error.message);

  if (user.email && data?.id) {
    await sendSubmissionReceivedEmail(user.email, data.title, data.id, user.id);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/prompts");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/my-prompts");
  redirect("/dashboard/upload/success");
}

export async function updateCreatorPrompt(formData: FormData) {
  const id = asString(formData, "id");
  if (!id) redirectWithMessage("/dashboard/my-prompts", "error", "Prompt not found.");

  const validationError = validatePromptForm(formData);
  if (validationError) redirectWithMessage(`/dashboard/edit/${id}`, "error", validationError);

  const { supabase, user } = await requireCreatorSession(`/dashboard/edit/${id}`);
  await ensureCreatorProfile(supabase, `/dashboard/edit/${id}`);

  const { data: current, error: currentError } = await supabase
    .from("prompts")
    .select("id,user_id,image_url")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (currentError || !current) redirectWithMessage("/dashboard/my-prompts", "error", "Prompt not found.");

  const imageUrl = await uploadPromptImage(formData, user.id, `/dashboard/edit/${id}`, current.image_url);
  const { error } = await supabase
    .from("prompts")
    .update(promptPayload(formData, user.id, imageUrl))
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) redirectWithMessage(`/dashboard/edit/${id}`, "error", error.message);

  revalidatePath("/admin");
  revalidatePath("/admin/prompts");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/my-prompts");
  revalidatePath(`/dashboard/edit/${id}`);
  redirectWithMessage("/dashboard/my-prompts", "message", "Prompt updated and moved back to pending review.");
}

export async function createCreatorPack(formData: FormData) {
  const title = asString(formData, "title");
  const description = asString(formData, "description");
  const coverImage = asString(formData, "cover_image");
  const price = Number(asString(formData, "price") || "0");
  const totalPrompts = Number(asString(formData, "total_prompts") || "0");

  if (title.length < 3 || title.length > 160) redirectWithMessage("/dashboard/packs/new", "error", "Pack title must be between 3 and 160 characters.");
  if (description.length > 500) redirectWithMessage("/dashboard/packs/new", "error", "Description must be 500 characters or less.");
  if (coverImage && !coverImage.startsWith("https://")) redirectWithMessage("/dashboard/packs/new", "error", "Cover image must be a valid HTTPS URL.");
  if (!Number.isFinite(price) || price < 0) redirectWithMessage("/dashboard/packs/new", "error", "Price must be zero or higher.");
  if (!Number.isInteger(totalPrompts) || totalPrompts < 0) redirectWithMessage("/dashboard/packs/new", "error", "Total prompts must be zero or higher.");
  if (price > 0 && totalPrompts < 5) redirectWithMessage("/dashboard/packs/new", "error", "Paid packs must include at least 5 prompts.");

  const { supabase, user } = await requireCreatorSession("/dashboard/packs/new");
  await ensureCreatorProfile(supabase, "/dashboard/packs/new");
  const { error } = await supabase.from("prompt_packs").insert({
    creator_id: user.id,
    creator_name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Creator",
    title,
    description: description || null,
    cover_image: coverImage || null,
    price,
    is_paid: price > 0,
    status: "pending",
    total_prompts: totalPrompts,
    updated_at: new Date().toISOString()
  });

  if (error) {
    const message = isMissingTableError(error.message)
      ? "Prompt pack database is not initialized yet. Apply the latest Supabase migration and try again."
      : error.message;
    redirectWithMessage("/dashboard/packs/new", "error", message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/admin/packs");
  redirectWithMessage("/dashboard", "message", "Pack submitted for admin review.");
}
