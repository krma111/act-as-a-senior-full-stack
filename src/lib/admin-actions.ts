"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-data";

function asString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function asBoolean(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "true" || value === "on" || value === "1";
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

function cleanStatus(value: string) {
  if (value === "approved" || value === "rejected") return value;
  return "pending";
}

function cleanRole(value: string) {
  if (value === "admin" || value === "creator") return value;
  return "user";
}

function validatePrompt(formData: FormData) {
  const title = asString(formData, "title");
  const promptText = asString(formData, "prompt_text");
  const category = asString(formData, "category");
  const aiModel = asString(formData, "ai_model");
  const imageUrl = asString(formData, "image_url");

  if (title.length < 3 || title.length > 160) return "Title must be between 3 and 160 characters.";
  if (promptText.length < 10) return "Prompt text must be at least 10 characters.";
  if (!category) return "Category is required.";
  if (!aiModel) return "AI model is required.";
  if (!imageUrl.startsWith("https://")) return "Image URL must be a valid HTTPS URL.";
  return null;
}

async function countAdmins(supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"]) {
  const { count } = await supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin");
  return count ?? 0;
}

export async function approvePrompt(formData: FormData) {
  const { supabase } = await requireAdmin("/admin/prompts");
  const id = asString(formData, "id");
  const { error } = await supabase
    .from("prompts")
    .update({ status: "approved", rejection_reason: null, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) redirectWithMessage("/admin/prompts", "error", error.message);
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/prompts");
  redirectWithMessage("/admin/prompts", "message", "Prompt approved.");
}

export async function rejectPrompt(formData: FormData) {
  const { supabase } = await requireAdmin("/admin/prompts");
  const id = asString(formData, "id");
  const reason = asString(formData, "rejection_reason");
  if (reason.length < 3) redirectWithMessage("/admin/prompts", "error", "Rejection reason is required.");

  const { error } = await supabase
    .from("prompts")
    .update({ status: "rejected", rejection_reason: reason, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) redirectWithMessage("/admin/prompts", "error", error.message);
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/prompts");
  redirectWithMessage("/admin/prompts", "message", "Prompt rejected.");
}

export async function deletePrompt(formData: FormData) {
  const { supabase } = await requireAdmin("/admin/prompts");
  const id = asString(formData, "id");
  const { error } = await supabase.from("prompts").delete().eq("id", id);

  if (error) redirectWithMessage("/admin/prompts", "error", error.message);
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/prompts");
  redirectWithMessage("/admin/prompts", "message", "Prompt deleted.");
}

export async function toggleFeaturedPrompt(formData: FormData) {
  const { supabase } = await requireAdmin("/admin/prompts");
  const id = asString(formData, "id");
  const featured = asBoolean(formData, "featured");
  const { error } = await supabase.from("prompts").update({ featured, updated_at: new Date().toISOString() }).eq("id", id);

  if (error) redirectWithMessage("/admin/prompts", "error", error.message);
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/prompts");
  redirectWithMessage("/admin/prompts", "message", featured ? "Prompt marked featured." : "Prompt removed from featured.");
}

export async function updateAdminPrompt(formData: FormData) {
  const id = asString(formData, "id");
  const errorPath = `/admin/prompts/${id}/edit`;
  const validationError = validatePrompt(formData);
  if (!id) redirectWithMessage("/admin/prompts", "error", "Prompt not found.");
  if (validationError) redirectWithMessage(errorPath, "error", validationError);

  const { supabase } = await requireAdmin(errorPath);
  const status = cleanStatus(asString(formData, "status"));
  const rejectionReason = status === "rejected" ? asString(formData, "rejection_reason") || "Rejected by admin." : null;
  const { error } = await supabase
    .from("prompts")
    .update({
      title: asString(formData, "title"),
      description: asString(formData, "description") || null,
      prompt_text: asString(formData, "prompt_text"),
      negative_prompt: asString(formData, "negative_prompt") || null,
      image_url: asString(formData, "image_url"),
      category: asString(formData, "category").toLowerCase(),
      tags: tagsFrom(asString(formData, "tags")),
      ai_model: asString(formData, "ai_model"),
      aspect_ratio: asString(formData, "aspect_ratio") || "1:1",
      reference_required: asBoolean(formData, "reference_required"),
      difficulty: cleanDifficulty(asString(formData, "difficulty")),
      status,
      rejection_reason: rejectionReason,
      featured: asBoolean(formData, "featured"),
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) redirectWithMessage(errorPath, "error", error.message);
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/prompts");
  revalidatePath(errorPath);
  redirectWithMessage("/admin/prompts", "message", "Prompt updated.");
}

export async function updateUserRole(formData: FormData) {
  const adminContext = await requireAdmin("/admin/users");
  const { supabase, user: currentUser } = adminContext;
  const id = asString(formData, "id");
  const role = cleanRole(asString(formData, "role"));

  if (!id) redirectWithMessage("/admin/users", "error", "User not found.");
  if (id === currentUser.id && role !== "admin" && (await countAdmins(supabase)) <= 1) {
    redirectWithMessage("/admin/users", "error", "You cannot remove the last admin account.");
  }

  const { error } = await supabase.from("profiles").update({ role, updated_at: new Date().toISOString() }).eq("id", id);

  if (error) redirectWithMessage("/admin/users", "error", error.message);
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  redirectWithMessage("/admin/users", "message", "User role updated.");
}
