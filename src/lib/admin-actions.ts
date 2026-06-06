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

function cleanInteger(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? Math.floor(amount) : 0;
}

function slugFrom(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function logAdminAction(
  supabase: AdminSupabase,
  adminUserId: string,
  actionType: string,
  targetTable: string,
  targetId: string,
  oldValue: unknown,
  newValue: unknown
) {
  await supabase.from("admin_logs").insert({
    admin_user_id: adminUserId,
    action_type: actionType,
    target_table: targetTable,
    target_id: targetId,
    old_value: oldValue ?? null,
    new_value: newValue ?? null
  });
}

async function readPromptSnapshot(supabase: AdminSupabase, id: string) {
  const { data } = await supabase.from("prompts").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

async function uploadAdminPromptImage(supabase: AdminSupabase, formData: FormData, promptId: string) {
  const file = formData.get("image_file");
  if (!(file instanceof File) || file.size === 0) return null;
  if (!file.type.startsWith("image/")) return { error: "Uploaded file must be an image.", url: null };
  if (file.size > 8 * 1024 * 1024) return { error: "Image upload must be 8MB or smaller.", url: null };

  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `admin/${promptId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("prompt-images").upload(path, file, {
    contentType: file.type,
    upsert: false
  });

  if (error) return { error: error.message, url: null };
  const { data } = supabase.storage.from("prompt-images").getPublicUrl(path);
  return { error: null, url: data.publicUrl };
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
  const { supabase, user } = await requireAdmin("/admin/prompts");
  const id = asString(formData, "id");
  const oldValue = await readPromptSnapshot(supabase, id);
  const { error } = await supabase
    .from("prompts")
    .update({ status: "approved", rejection_reason: null, deleted_at: null, deleted_by: null, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) redirectWithMessage("/admin/prompts", "error", error.message);

  const { data: prompt } = await supabase.from("prompts").select("id,title,user_id").eq("id", id).maybeSingle();
  if (prompt) {
    await notifyPromptApproved(supabase, prompt);
  }
  await logAdminAction(supabase, user.id, "prompt_approved", "prompts", id, oldValue, { status: "approved" });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/prompts");
  redirectWithMessage("/admin/prompts", "message", "Prompt approved.");
}

export async function rejectPrompt(formData: FormData) {
  const { supabase, user } = await requireAdmin("/admin/prompts");
  const id = asString(formData, "id");
  const reason = asString(formData, "rejection_reason");
  if (reason.length < 3) redirectWithMessage("/admin/prompts", "error", "Rejection reason is required.");

  const oldValue = await readPromptSnapshot(supabase, id);
  const { data: prompt } = await supabase.from("prompts").select("id,title,user_id").eq("id", id).maybeSingle();
  const { error } = await supabase
    .from("prompts")
    .update({ status: "rejected", rejection_reason: reason, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) redirectWithMessage("/admin/prompts", "error", error.message);
  if (prompt) await notifyPromptRejected(supabase, prompt, reason);
  await logAdminAction(supabase, user.id, "prompt_rejected", "prompts", id, oldValue, { status: "rejected", rejection_reason: reason });
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/prompts");
  redirectWithMessage("/admin/prompts", "message", "Prompt rejected.");
}

export async function deletePrompt(formData: FormData) {
  const { supabase, user } = await requireAdmin("/admin/prompts");
  const id = asString(formData, "id");
  const oldValue = await readPromptSnapshot(supabase, id);
  const { error } = await supabase
    .from("prompts")
    .update({ deleted_at: new Date().toISOString(), deleted_by: user.id, featured: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) redirectWithMessage("/admin/prompts", "error", error.message);
  await logAdminAction(supabase, user.id, "prompt_deleted", "prompts", id, oldValue, { deleted_at: "now", deleted_by: user.id });
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/prompts");
  redirectWithMessage("/admin/prompts", "message", "Prompt deleted.");
}

export async function restorePrompt(formData: FormData) {
  const { supabase, user } = await requireAdmin("/admin/prompts");
  const id = asString(formData, "id");
  const oldValue = await readPromptSnapshot(supabase, id);
  const { error } = await supabase.from("prompts").update({ deleted_at: null, deleted_by: null, updated_at: new Date().toISOString() }).eq("id", id);

  if (error) redirectWithMessage("/admin/prompts", "error", error.message);
  await logAdminAction(supabase, user.id, "prompt_restored", "prompts", id, oldValue, { deleted_at: null, deleted_by: null });
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/prompts");
  redirectWithMessage("/admin/prompts?status=deleted", "message", "Prompt restored.");
}

export async function toggleFeaturedPrompt(formData: FormData) {
  const { supabase, user } = await requireAdmin("/admin/prompts");
  const id = asString(formData, "id");
  const featured = asBoolean(formData, "featured");
  const oldValue = await readPromptSnapshot(supabase, id);
  const { error } = await supabase.from("prompts").update({ featured, updated_at: new Date().toISOString() }).eq("id", id);

  if (error) redirectWithMessage("/admin/prompts", "error", error.message);
  await logAdminAction(supabase, user.id, featured ? "prompt_featured" : "prompt_unfeatured", "prompts", id, oldValue, { featured });
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

  const { supabase, user } = await requireAdmin(errorPath);
  const status = cleanStatus(asString(formData, "status"));
  const rejectionReason = status === "rejected" ? asString(formData, "rejection_reason") || "Rejected by admin." : null;
  const imageUpload = await uploadAdminPromptImage(supabase, formData, id);
  if (imageUpload?.error) redirectWithMessage(errorPath, "error", imageUpload.error);
  const currentPrompt = await readPromptSnapshot(supabase, id);
  const imageUrl = imageUpload?.url ?? (asString(formData, "image_url") || null);
  const { error } = await supabase
    .from("prompts")
    .update({
      title: asString(formData, "title"),
      description: asString(formData, "description") || null,
      prompt_text: asString(formData, "prompt_text"),
      negative_prompt: asString(formData, "negative_prompt") || null,
      image_url: imageUrl,
      creator_name: asString(formData, "creator_name") || null,
      category: asString(formData, "category").toLowerCase(),
      tags: tagsFrom(asString(formData, "tags")),
      ai_model: asString(formData, "ai_model"),
      aspect_ratio: asString(formData, "aspect_ratio") || "1:1",
      reference_required: asBoolean(formData, "reference_required"),
      status,
      rejection_reason: rejectionReason,
      featured: asBoolean(formData, "featured"),
      price: cleanMoney(asString(formData, "price")),
      copy_count: cleanInteger(asString(formData, "copy_count")),
      save_count: cleanInteger(asString(formData, "save_count")),
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) redirectWithMessage(errorPath, "error", error.message);
  if (currentPrompt && "status" in currentPrompt && currentPrompt.status !== status) {
    const prompt = {
      id,
      title: asString(formData, "title"),
      user_id: String(currentPrompt.user_id)
    };
    if (status === "approved") await notifyPromptApproved(supabase, prompt);
    if (status === "rejected") await notifyPromptRejected(supabase, prompt, rejectionReason ?? "Rejected by admin.");
  }
  await logAdminAction(supabase, user.id, "prompt_updated", "prompts", id, currentPrompt, {
    title: asString(formData, "title"),
    status,
    featured: asBoolean(formData, "featured")
  });
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

  const { data: oldValue } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  const { error } = await supabase.from("profiles").update({ role, updated_at: new Date().toISOString() }).eq("id", id);

  if (error) redirectWithMessage("/admin/users", "error", error.message);
  await logAdminAction(supabase, currentUser.id, "user_role_changed", "profiles", id, oldValue, { role });
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

  const { data: oldValue } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
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
  await logAdminAction(supabase, currentUser.id, manualOverride ? "creator_crown_assigned" : "creator_crown_removed", "profiles", id, oldValue, {
    manual_badge_override: manualOverride,
    manual_badge_type: badgeType
  });
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  redirectWithMessage("/admin/users", "message", manualOverride ? "Creator crown updated." : "Manual crown override removed.");
}

export async function updateUserBan(formData: FormData) {
  const { supabase, user: currentUser } = await requireAdmin("/admin/users");
  const id = asString(formData, "id");
  const shouldBan = asBoolean(formData, "ban");
  const reason = asString(formData, "ban_reason") || null;

  if (!id) redirectWithMessage("/admin/users", "error", "User not found.");
  if (id === currentUser.id && shouldBan) redirectWithMessage("/admin/users", "error", "You cannot ban your own admin account.");

  const { data: oldValue } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  const payload = shouldBan
    ? { status: "banned", banned_at: new Date().toISOString(), banned_by: currentUser.id, ban_reason: reason, updated_at: new Date().toISOString() }
    : { status: "active", banned_at: null, banned_by: null, ban_reason: null, updated_at: new Date().toISOString() };

  const { error } = await supabase.from("profiles").update(payload).eq("id", id);
  if (error) redirectWithMessage("/admin/users", "error", error.message);
  await logAdminAction(supabase, currentUser.id, shouldBan ? "user_banned" : "user_unbanned", "profiles", id, oldValue, payload);
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  redirectWithMessage("/admin/users", "message", shouldBan ? "User banned." : "User unbanned.");
}

export async function updateSiteSettings(formData: FormData) {
  const { supabase, user } = await requireAdmin("/admin/settings");
  const { data: oldValue } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
  const payload = {
    id: 1,
    website_name: asString(formData, "website_name") || "PromptVault",
    logo_text: asString(formData, "logo_text") || "PromptVault",
    hero_headline: asString(formData, "hero_headline") || "Discover and share powerful AI image prompts",
    hero_subheadline: asString(formData, "hero_subheadline") || "Browse battle-tested prompts, save favorites, and publish your best image generations.",
    footer_text: asString(formData, "footer_text") || "Copyright 2026 PromptVault. All rights reserved.",
    cta_text: asString(formData, "cta_text") || "Start exploring prompts",
    empty_state_title: asString(formData, "empty_state_title") || "No prompts yet",
    empty_state_message: asString(formData, "empty_state_message") || "Approved prompts will appear here.",
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase.from("site_settings").upsert(payload, { onConflict: "id" });

  if (error) redirectWithMessage("/admin/settings", "error", error.message);
  await logAdminAction(supabase, user.id, "settings_updated", "site_settings", "1", oldValue, payload);
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  redirectWithMessage("/admin/settings", "message", "Site content updated.");
}

export async function upsertCategory(formData: FormData) {
  const { supabase, user } = await requireAdmin("/admin/categories");
  const id = asString(formData, "id");
  const name = asString(formData, "name");
  const slug = slugFrom(asString(formData, "slug") || name);
  const payload = {
    name,
    slug,
    description: asString(formData, "description") || null,
    sort_order: cleanInteger(asString(formData, "sort_order")),
    is_active: asBoolean(formData, "is_active"),
    updated_at: new Date().toISOString()
  };

  if (name.length < 2) redirectWithMessage("/admin/categories", "error", "Category name is required.");
  if (!slug) redirectWithMessage("/admin/categories", "error", "Category slug is required.");

  const { data: oldValue } = id ? await supabase.from("categories").select("*").eq("id", id).maybeSingle() : { data: null };
  const result = id
    ? await supabase.from("categories").update(payload).eq("id", id).select("id").maybeSingle()
    : await supabase.from("categories").insert({ ...payload, created_at: new Date().toISOString() }).select("id").maybeSingle();

  if (result.error) redirectWithMessage("/admin/categories", "error", result.error.message);
  await logAdminAction(supabase, user.id, id ? "category_updated" : "category_created", "categories", result.data?.id ?? id, oldValue, payload);
  revalidatePath("/");
  revalidatePath("/admin/categories");
  redirectWithMessage("/admin/categories", "message", id ? "Category updated." : "Category created.");
}

export async function toggleCategory(formData: FormData) {
  const { supabase, user } = await requireAdmin("/admin/categories");
  const id = asString(formData, "id");
  const isActive = asBoolean(formData, "is_active");
  const { data: oldValue } = await supabase.from("categories").select("*").eq("id", id).maybeSingle();
  const { error } = await supabase.from("categories").update({ is_active: isActive, updated_at: new Date().toISOString() }).eq("id", id);

  if (error) redirectWithMessage("/admin/categories", "error", error.message);
  await logAdminAction(supabase, user.id, isActive ? "category_restored" : "category_disabled", "categories", id, oldValue, { is_active: isActive });
  revalidatePath("/");
  revalidatePath("/admin/categories");
  redirectWithMessage("/admin/categories", "message", isActive ? "Category restored." : "Category disabled.");
}

export async function upsertTag(formData: FormData) {
  const { supabase, user } = await requireAdmin("/admin/tags");
  const id = asString(formData, "id");
  const name = asString(formData, "name").toLowerCase();
  const slug = slugFrom(asString(formData, "slug") || name);
  const payload = {
    name,
    slug,
    description: asString(formData, "description") || null,
    is_active: asBoolean(formData, "is_active"),
    updated_at: new Date().toISOString()
  };

  if (name.length < 2) redirectWithMessage("/admin/tags", "error", "Tag name is required.");
  if (!slug) redirectWithMessage("/admin/tags", "error", "Tag slug is required.");

  const { data: oldValue } = id ? await supabase.from("tags").select("*").eq("id", id).maybeSingle() : { data: null };
  const result = id
    ? await supabase.from("tags").update(payload).eq("id", id).select("id").maybeSingle()
    : await supabase.from("tags").insert({ ...payload, created_at: new Date().toISOString() }).select("id").maybeSingle();

  if (result.error) redirectWithMessage("/admin/tags", "error", result.error.message);
  await logAdminAction(supabase, user.id, id ? "tag_updated" : "tag_created", "tags", result.data?.id ?? id, oldValue, payload);
  revalidatePath("/");
  revalidatePath("/admin/tags");
  redirectWithMessage("/admin/tags", "message", id ? "Tag updated." : "Tag created.");
}

export async function toggleTag(formData: FormData) {
  const { supabase, user } = await requireAdmin("/admin/tags");
  const id = asString(formData, "id");
  const isActive = asBoolean(formData, "is_active");
  const { data: oldValue } = await supabase.from("tags").select("*").eq("id", id).maybeSingle();
  const { error } = await supabase.from("tags").update({ is_active: isActive, updated_at: new Date().toISOString() }).eq("id", id);

  if (error) redirectWithMessage("/admin/tags", "error", error.message);
  await logAdminAction(supabase, user.id, isActive ? "tag_restored" : "tag_disabled", "tags", id, oldValue, { is_active: isActive });
  revalidatePath("/");
  revalidatePath("/admin/tags");
  redirectWithMessage("/admin/tags", "message", isActive ? "Tag restored." : "Tag disabled.");
}


export async function approvePack(formData: FormData) {
  const { supabase, user } = await requireAdmin("/admin/packs");
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
  await logAdminAction(supabase, user.id, "pack_approved", "prompt_packs", id, pack, { status: "approved" });
  revalidatePath("/admin");
  revalidatePath("/admin/packs");
  redirectWithMessage("/admin/packs", "message", "Pack approved.");
}

export async function rejectPack(formData: FormData) {
  const { supabase, user } = await requireAdmin("/admin/packs");
  const id = asString(formData, "id");
  const reason = asString(formData, "rejection_reason") || "Rejected by admin.";

  if (!id) redirectWithMessage("/admin/packs", "error", "Pack not found.");

  const { data: oldValue } = await supabase.from("prompt_packs").select("*").eq("id", id).maybeSingle();
  const { error } = await supabase
    .from("prompt_packs")
    .update({ status: "rejected", rejection_reason: reason, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) redirectWithMessage("/admin/packs", "error", error.message);
  await logAdminAction(supabase, user.id, "pack_rejected", "prompt_packs", id, oldValue, { status: "rejected", rejection_reason: reason });
  revalidatePath("/admin");
  revalidatePath("/admin/packs");
  redirectWithMessage("/admin/packs", "message", "Pack rejected.");
}

export async function deletePack(formData: FormData) {
  const { supabase, user } = await requireAdmin("/admin/packs");
  const id = asString(formData, "id");
  if (!id) redirectWithMessage("/admin/packs", "error", "Pack not found.");

  const { data: oldValue } = await supabase.from("prompt_packs").select("*").eq("id", id).maybeSingle();
  const { error } = await supabase.from("prompt_packs").delete().eq("id", id);

  if (error) redirectWithMessage("/admin/packs", "error", error.message);
  await logAdminAction(supabase, user.id, "pack_deleted", "prompt_packs", id, oldValue, null);
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
  await logAdminAction(supabase, user.id, "payment_approved", "payment_requests", id, request, { status: "approved", pack_id: request.pack_id, user_id: request.user_id });
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
  await logAdminAction(supabase, user.id, "payment_rejected", "payment_requests", id, null, { status: "rejected", rejection_reason: reason });
  revalidatePath("/admin");
  revalidatePath("/admin/payments");
  redirectWithMessage("/admin/payments", "message", "Payment request rejected.");
}
