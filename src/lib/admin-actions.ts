"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-data";
import { sendFollowerApprovedPromptEmail, sendPromptApprovedEmail, sendRejectionEmail } from "@/lib/email";
import { siteUrl } from "@/lib/env";
import { promptSlug } from "@/lib/slugs";

type AdminSupabase = Awaited<ReturnType<typeof requireAdmin>>["supabase"];
type ModeratedPrompt = {
  id: string;
  title: string;
  user_id: string;
};

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

function cleanStatus(value: string) {
  if (value === "approved" || value === "rejected") return value;
  return "pending";
}

function cleanRole(value: string) {
  if (value === "admin" || value === "creator") return value;
  return "user";
}

function cleanBadgeType(value: string) {
  if (value === "bronze" || value === "silver" || value === "gold" || value === "diamond") return value;
  return "none";
}

function cleanMoney(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : 0;
}

function validatePrompt(formData: FormData) {
  const title = asString(formData, "title");
  const promptText = asString(formData, "prompt_text");
  const category = asString(formData, "category");
  const aiModel = asString(formData, "ai_model");
  const imageUrl = asString(formData, "image_url");
  const price = asString(formData, "price");

  if (title.length < 3 || title.length > 160) return "Title must be between 3 and 160 characters.";
  if (promptText.length < 10) return "Prompt text must be at least 10 characters.";
  if (!category) return "Category is required.";
  if (!aiModel) return "AI model is required.";
  if (imageUrl && !imageUrl.startsWith("https://")) return "Image URL must be a valid HTTPS URL.";
  if (price && cleanMoney(price) < 0) return "Price must be zero or higher.";
  return null;
}

async function countAdmins(supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"]) {
  const { count } = await supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin");
  return count ?? 0;
}

async function notifyPromptApproved(supabase: AdminSupabase, prompt: ModeratedPrompt) {
  const promptUrl = `${siteUrl}/prompt/${promptSlug(prompt)}`;
  const { data: creator } = await supabase.from("profiles").select("id,email").eq("id", prompt.user_id).maybeSingle();

  if (creator?.email) {
    await sendPromptApprovedEmail(creator.email, prompt.title, promptUrl, prompt.id, prompt.user_id);
  }

  const { data: savedRows } = await supabase.from("saved_prompts").select("user_id").eq("prompt_id", prompt.id);
  const { data: followerRows } = await supabase.from("creator_follows").select("user_id").eq("creator_id", prompt.user_id);
  const recipientIds = Array.from(
    new Set([
      ...((savedRows ?? []) as Array<{ user_id: string }>).map((row) => row.user_id),
      ...((followerRows ?? []) as Array<{ user_id: string }>).map((row) => row.user_id)
    ])
  ).filter((userId) => userId !== prompt.user_id);

  if (!recipientIds.length) return;

  const { data: recipients } = await supabase.from("profiles").select("id,email").in("id", recipientIds);
  await Promise.all(
    ((recipients ?? []) as Array<{ id: string; email: string | null }>).map((recipient) =>
      recipient.email ? sendFollowerApprovedPromptEmail(recipient.email, prompt.title, prompt.id, recipient.id) : Promise.resolve()
    )
  );
}

async function notifyPromptRejected(supabase: AdminSupabase, prompt: ModeratedPrompt, reason: string) {
  const { data: creator } = await supabase.from("profiles").select("email").eq("id", prompt.user_id).maybeSingle();

  if (creator?.email) {
    await sendRejectionEmail(creator.email, prompt.title, reason, prompt.id, prompt.user_id);
  }
}

export async function approvePrompt(formData: FormData) {
  const { supabase } = await requireAdmin("/admin/prompts");
  const id = asString(formData, "id");
  const { error } = await supabase
    .from("prompts")
    .update({ status: "approved", rejection_reason: null, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) redirectWithMessage("/admin/prompts", "error", error.message);

  const { data: prompt } = await supabase.from("prompts").select("id,title,user_id").eq("id", id).maybeSingle();
  if (prompt) {
    await notifyPromptApproved(supabase, prompt);
  }

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

  const { data: prompt } = await supabase.from("prompts").select("id,title,user_id").eq("id", id).maybeSingle();
  const { error } = await supabase
    .from("prompts")
    .update({ status: "rejected", rejection_reason: reason, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) redirectWithMessage("/admin/prompts", "error", error.message);
  if (prompt) await notifyPromptRejected(supabase, prompt, reason);
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
  const { data: currentPrompt } = await supabase.from("prompts").select("id,title,user_id,status").eq("id", id).maybeSingle();
  const { error } = await supabase
    .from("prompts")
    .update({
      title: asString(formData, "title"),
      description: asString(formData, "description") || null,
      prompt_text: asString(formData, "prompt_text"),
      negative_prompt: asString(formData, "negative_prompt") || null,
      image_url: asString(formData, "image_url") || null,
      category: asString(formData, "category").toLowerCase(),
      tags: tagsFrom(asString(formData, "tags")),
      ai_model: asString(formData, "ai_model"),
      aspect_ratio: asString(formData, "aspect_ratio") || "1:1",
      reference_required: asBoolean(formData, "reference_required"),
      status,
      rejection_reason: rejectionReason,
      featured: asBoolean(formData, "featured"),
      price: cleanMoney(asString(formData, "price")),
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) redirectWithMessage(errorPath, "error", error.message);
  if (currentPrompt && currentPrompt.status !== status) {
    const prompt = {
      id: currentPrompt.id,
      title: asString(formData, "title"),
      user_id: currentPrompt.user_id
    };
    if (status === "approved") await notifyPromptApproved(supabase, prompt);
    if (status === "rejected") await notifyPromptRejected(supabase, prompt, rejectionReason ?? "Rejected by admin.");
  }
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

export async function updateUserBadge(formData: FormData) {
  const { supabase, user: currentUser } = await requireAdmin("/admin/users");
  const id = asString(formData, "id");
  const badgeType = cleanBadgeType(asString(formData, "manual_badge_type"));
  const manualOverride = badgeType !== "none";

  if (!id) redirectWithMessage("/admin/users", "error", "User not found.");

  const { error } = await supabase
    .from("profiles")
    .update({
      manual_badge_override: manualOverride,
      manual_badge_type: badgeType,
      manual_badge_assigned_by: manualOverride ? currentUser.id : null,
      manual_badge_assigned_at: manualOverride ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) redirectWithMessage("/admin/users", "error", error.message);
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  redirectWithMessage("/admin/users", "message", manualOverride ? "Creator crown updated." : "Manual crown override removed.");
}

export async function updateSiteSettings(formData: FormData) {
  const { supabase } = await requireAdmin("/admin");
  const payload = {
    id: 1,
    website_name: asString(formData, "website_name") || "PromptVault",
    logo_text: asString(formData, "logo_text") || "PromptVault",
    hero_headline: asString(formData, "hero_headline") || "Discover and share powerful AI image prompts",
    hero_subheadline: asString(formData, "hero_subheadline") || "Browse battle-tested prompts, save favorites, and publish your best image generations.",
    footer_text: asString(formData, "footer_text") || "Copyright 2026 PromptVault. All rights reserved.",
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase.from("site_settings").upsert(payload, { onConflict: "id" });

  if (error) redirectWithMessage("/admin", "error", error.message);
  revalidatePath("/");
  revalidatePath("/admin");
  redirectWithMessage("/admin", "message", "Site content updated.");
}


export async function approvePack(formData: FormData) {
  const { supabase } = await requireAdmin("/admin/packs");
  const id = asString(formData, "id");

  if (!id) redirectWithMessage("/admin/packs", "error", "Pack not found.");
  const { data: pack, error: packError } = await supabase
    .from("prompt_packs")
    .select("id,price,is_paid,total_prompts")
    .eq("id", id)
    .maybeSingle();

  if (packError || !pack) redirectWithMessage("/admin/packs", "error", packError?.message ?? "Pack not found.");

  const promptCount = Number(pack.total_prompts) || 0;
  const price = Number(pack.price) || 0;
  if (price > 0 && promptCount < 5) {
    redirectWithMessage("/admin/packs", "error", "Paid packs must include at least 5 prompts before approval.");
  }

  const { error } = await supabase
    .from("prompt_packs")
    .update({ status: "approved", rejection_reason: null, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) redirectWithMessage("/admin/packs", "error", error.message);
  revalidatePath("/admin");
  revalidatePath("/admin/packs");
  redirectWithMessage("/admin/packs", "message", "Pack approved.");
}

export async function rejectPack(formData: FormData) {
  const { supabase } = await requireAdmin("/admin/packs");
  const id = asString(formData, "id");
  const reason = asString(formData, "rejection_reason") || "Rejected by admin.";

  if (!id) redirectWithMessage("/admin/packs", "error", "Pack not found.");

  const { error } = await supabase
    .from("prompt_packs")
    .update({ status: "rejected", rejection_reason: reason, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) redirectWithMessage("/admin/packs", "error", error.message);
  revalidatePath("/admin");
  revalidatePath("/admin/packs");
  redirectWithMessage("/admin/packs", "message", "Pack rejected.");
}

export async function deletePack(formData: FormData) {
  const { supabase } = await requireAdmin("/admin/packs");
  const id = asString(formData, "id");
  if (!id) redirectWithMessage("/admin/packs", "error", "Pack not found.");

  const { error } = await supabase.from("prompt_packs").delete().eq("id", id);

  if (error) redirectWithMessage("/admin/packs", "error", error.message);
  revalidatePath("/admin");
  revalidatePath("/admin/packs");
  redirectWithMessage("/admin/packs", "message", "Pack deleted.");
}

export async function approvePaymentRequest(formData: FormData) {
  const { supabase, user } = await requireAdmin("/admin/payments");
  const id = asString(formData, "id");

  if (!id) redirectWithMessage("/admin/payments", "error", "Payment request is incomplete.");

  const { data: request, error: requestError } = await supabase
    .from("payment_requests")
    .select("id,user_id,pack_id,status")
    .eq("id", id)
    .maybeSingle();

  if (requestError || !request) {
    redirectWithMessage("/admin/payments", "error", requestError?.message ?? "Payment request not found.");
  }

  if (request.status !== "pending") {
    redirectWithMessage("/admin/payments", "error", "Only pending payment requests can be approved.");
  }

  const now = new Date().toISOString();
  const access = await supabase.from("user_pack_access").upsert(
    { user_id: request.user_id, pack_id: request.pack_id, granted_by: user.id, granted_at: now, created_at: now },
    { onConflict: "user_id,pack_id" }
  );

  if (access.error) redirectWithMessage("/admin/payments", "error", access.error.message);

  const { error } = await supabase
    .from("payment_requests")
    .update({ status: "approved", rejection_reason: null, reviewed_by: user.id, reviewed_at: now, updated_at: now })
    .eq("id", id);

  if (error) redirectWithMessage("/admin/payments", "error", error.message);
  revalidatePath("/admin");
  revalidatePath("/admin/payments");
  redirectWithMessage("/admin/payments", "message", "Payment approved and pack access granted.");
}

export async function rejectPaymentRequest(formData: FormData) {
  const { supabase, user } = await requireAdmin("/admin/payments");
  const id = asString(formData, "id");
  const reason = asString(formData, "rejection_reason") || "Payment rejected by admin.";
  if (!id) redirectWithMessage("/admin/payments", "error", "Payment request not found.");

  const { error } = await supabase
    .from("payment_requests")
    .update({ status: "rejected", rejection_reason: reason, reviewed_by: user.id, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) redirectWithMessage("/admin/payments", "error", error.message);
  revalidatePath("/admin");
  revalidatePath("/admin/payments");
  redirectWithMessage("/admin/payments", "message", "Payment request rejected.");
}
