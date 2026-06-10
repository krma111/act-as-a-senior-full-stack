"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-data";
import type { GeneratedPromptDraft } from "@/lib/admin-ai-create";
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

function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function runAdminSideEffect(label: string, action: () => Promise<void>) {
  try {
    await action();
  } catch (error) {
    console.error(`[admin-actions] ${label} failed`, error);
  }
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

function cleanDraftTags(tags: unknown) {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((tag) => String(tag).trim().toLowerCase().replace(/[^a-z0-9- ]/g, "").replace(/\s+/g, "-"))
    .filter(Boolean)
    .slice(0, 5);
}

function normalizeGeneratedDraft(value: unknown): GeneratedPromptDraft | null {
  if (!value || typeof value !== "object") return null;
  const draft = value as Partial<GeneratedPromptDraft>;
  const title = typeof draft.title === "string" ? draft.title.trim() : "";
  const prompt = typeof draft.prompt === "string" ? draft.prompt.trim() : "";
  const category = typeof draft.category === "string" ? draft.category.trim().toLowerCase() : "";
  const aspectRatio = typeof draft.aspectRatio === "string" ? draft.aspectRatio.trim() : "1:1";
  const imageUrl = typeof draft.imageUrl === "string" ? draft.imageUrl.trim() : "";

  if (title.length < 3 || prompt.length < 10 || !category) return null;

  return {
    title: title.slice(0, 160),
    prompt,
    description: typeof draft.description === "string" ? draft.description.trim().slice(0, 500) : "",
    tags: cleanDraftTags(draft.tags),
    category,
    aspectRatio: aspectRatio || "1:1",
    imageUrl,
    status: "pending"
  };
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
  await runAdminSideEffect(`admin log ${actionType}`, async () => {
    const { error } = await supabase.from("admin_logs").insert({
      admin_user_id: adminUserId,
      action_type: actionType,
      target_table: targetTable,
      target_id: targetId,
      old_value: oldValue ?? null,
      new_value: newValue ?? null
    });

    if (error) throw new Error(error.message);
  });
}

async function readPromptSnapshot(supabase: AdminSupabase, id: string) {
  if (!isValidUuid(id)) return null;

  try {
    const { data, error } = await supabase.from("prompts").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return data ?? null;
  } catch (error) {
    console.error("[admin-actions] Prompt snapshot lookup failed", error);
    return null;
  }
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
  await runAdminSideEffect("approval notifications", async () => {
    const promptUrl = `${siteUrl}/prompt/${promptSlug(prompt)}`;
    const { data: creator, error: creatorError } = await supabase.from("profiles").select("id,email").eq("id", prompt.user_id).maybeSingle();
    if (creatorError) throw new Error(creatorError.message);

    if (creator?.email) {
      await sendPromptApprovedEmail(creator.email, prompt.title, promptUrl, prompt.id, prompt.user_id);
    }

    const [savedResult, followerResult] = await Promise.all([
      supabase.from("saved_prompts").select("user_id").eq("prompt_id", prompt.id),
      supabase.from("creator_follows").select("user_id").eq("creator_id", prompt.user_id)
    ]);

    if (savedResult.error) console.error("[admin-actions] Saved prompt notification lookup failed", savedResult.error.message);
    if (followerResult.error) console.error("[admin-actions] Creator follower notification lookup failed", followerResult.error.message);

    const recipientIds = Array.from(
      new Set([
        ...((savedResult.data ?? []) as Array<{ user_id: string }>).map((row) => row.user_id),
        ...((followerResult.data ?? []) as Array<{ user_id: string }>).map((row) => row.user_id)
      ])
    ).filter((userId) => userId !== prompt.user_id);

    if (!recipientIds.length) return;

    const { data: recipients, error: recipientsError } = await supabase.from("profiles").select("id,email").in("id", recipientIds);
    if (recipientsError) throw new Error(recipientsError.message);

    await Promise.allSettled(
      ((recipients ?? []) as Array<{ id: string; email: string | null }>).map((recipient) =>
        recipient.email ? sendFollowerApprovedPromptEmail(recipient.email, prompt.title, prompt.id, recipient.id) : Promise.resolve()
      )
    );
  });
}

async function notifyPromptRejected(supabase: AdminSupabase, prompt: ModeratedPrompt, reason: string) {
  await runAdminSideEffect("rejection notification", async () => {
    const { data: creator, error } = await supabase.from("profiles").select("email").eq("id", prompt.user_id).maybeSingle();
    if (error) throw new Error(error.message);

    if (creator?.email) {
      await sendRejectionEmail(creator.email, prompt.title, reason, prompt.id, prompt.user_id);
    }
  });
}

export async function createAdminPrompt(formData: FormData) {
  const { supabase, user } = await requireAdmin("/admin/prompts/new");
  const errorPath = "/admin/prompts/new";
  const validationError = validatePrompt(formData);
  if (validationError) redirectWithMessage(errorPath, "error", validationError);

  const status = cleanStatus(asString(formData, "status"));
  const imageUpload = await uploadAdminPromptImage(supabase, formData, crypto.randomUUID());

  const { data, error } = await supabase
    .from("prompts")
    .insert({
      user_id: user.id,
      title: asString(formData, "title"),
      description: asString(formData, "description") || null,
      prompt_text: asString(formData, "prompt_text"),
      negative_prompt: asString(formData, "negative_prompt") || null,
      image_url: imageUpload?.url ?? (asString(formData, "image_url") || null),
      creator_name: asString(formData, "creator_name") || null,
      category: asString(formData, "category").toLowerCase(),
      tags: tagsFrom(asString(formData, "tags")),
      ai_model: asString(formData, "ai_model"),
      aspect_ratio: asString(formData, "aspect_ratio") || "1:1",
      reference_required: asBoolean(formData, "reference_required"),
      status,
      rejection_reason: status === "rejected" ? asString(formData, "rejection_reason") || null : null,
      featured: asBoolean(formData, "featured"),
      visibility: asString(formData, "visibility") === "private" ? "private" : "public",
      hidden: asBoolean(formData, "hidden"),
      price: cleanMoney(asString(formData, "price")),
      updated_at: new Date().toISOString()
    })
    .select("id")
    .single();

  if (error) redirectWithMessage(errorPath, "error", error.message);
  await logAdminAction(supabase, user.id, "prompt_created", "prompts", data.id, null, { title: asString(formData, "title"), status });
  revalidatePath("/");
  revalidatePath("/admin/prompts");
  redirectWithMessage("/admin/prompts", "message", "Prompt created.");
}

export async function approvePrompt(formData: FormData) {
  const { supabase, user } = await requireAdmin("/admin/prompts");
  const id = asString(formData, "id");
  if (!isValidUuid(id)) redirectWithMessage("/admin/prompts", "error", "Prompt not found.");

  const oldValue = await readPromptSnapshot(supabase, id);
  const { error } = await supabase
    .from("prompts")
    .update({ status: "approved", rejection_reason: null, deleted_at: null, deleted_by: null, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) redirectWithMessage("/admin/prompts", "error", error.message);

  const { data: prompt, error: promptError } = await supabase.from("prompts").select("id,title,user_id").eq("id", id).maybeSingle();
  if (promptError) {
    console.error("[admin-actions] Approved prompt reload failed", promptError.message);
  }
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
  if (!isValidUuid(id)) redirectWithMessage("/admin/prompts", "error", "Prompt not found.");
  if (reason.length < 3) redirectWithMessage("/admin/prompts", "error", "Rejection reason is required.");

  const oldValue = await readPromptSnapshot(supabase, id);
  const { data: prompt, error: promptError } = await supabase.from("prompts").select("id,title,user_id").eq("id", id).maybeSingle();
  if (promptError) {
    console.error("[admin-actions] Rejected prompt reload failed", promptError.message);
  }
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
  if (!isValidUuid(id)) redirectWithMessage("/admin/prompts", "error", "Prompt not found.");

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
  if (!isValidUuid(id)) redirectWithMessage("/admin/prompts", "error", "Prompt not found.");

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
  if (!isValidUuid(id)) redirectWithMessage("/admin/prompts", "error", "Prompt not found.");

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
  if (!isValidUuid(id)) redirectWithMessage("/admin/prompts", "error", "Prompt not found.");
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
      visibility: asString(formData, "visibility") === "private" ? "private" : "public",
      hidden: asBoolean(formData, "hidden"),
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

export async function saveGeneratedPromptDrafts(drafts: GeneratedPromptDraft[]) {
  const { supabase, user, profile } = await requireAdmin("/admin/ai-create");
  const normalizedDrafts = drafts.map(normalizeGeneratedDraft).filter((draft): draft is GeneratedPromptDraft => Boolean(draft));

  if (!normalizedDrafts.length) {
    return { ok: false, message: "No valid generated drafts selected.", insertedCount: 0 };
  }

  const now = new Date().toISOString();
  const rows = normalizedDrafts.map((draft) => ({
    user_id: user.id,
    title: draft.title,
    description: draft.description || null,
    prompt_text: draft.prompt,
    negative_prompt: null,
    image_url: draft.imageUrl || null,
    creator_name: profile.full_name ?? profile.display_name ?? profile.email?.split("@")[0] ?? "Admin",
    category: draft.category,
    tags: draft.tags,
    ai_model: "PromptVault Mock Generator",
    aspect_ratio: draft.aspectRatio,
    reference_required: false,
    status: "pending",
    rejection_reason: null,
    featured: false,
    updated_at: now
  }));

  const { data, error } = await supabase.from("prompts").insert(rows).select("id");

  if (error) {
    return { ok: false, message: error.message, insertedCount: 0 };
  }

  await logAdminAction(supabase, user.id, "ai_drafts_saved", "prompts", "bulk", null, {
    count: data?.length ?? rows.length,
    status: "pending"
  });

  revalidatePath("/admin");
  revalidatePath("/admin/prompts");
  revalidatePath("/admin/submissions");

  return {
    ok: true,
    message: `${data?.length ?? rows.length} generated draft${(data?.length ?? rows.length) === 1 ? "" : "s"} saved as pending prompts.`,
    insertedCount: data?.length ?? rows.length
  };
}

export async function updateUserRole(formData: FormData) {
  const adminContext = await requireAdmin("/admin/users");
  const { supabase, user: currentUser } = adminContext;
  const id = asString(formData, "id");
  const role = cleanRole(asString(formData, "role"));

  if (!isValidUuid(id)) redirectWithMessage("/admin/users", "error", "User not found.");
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

  if (!isValidUuid(id)) redirectWithMessage("/admin/users", "error", "User not found.");

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

  if (!isValidUuid(id)) redirectWithMessage("/admin/users", "error", "User not found.");
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

export async function resolveReport(formData: FormData) {
  const { supabase, user } = await requireAdmin("/admin/reports");
  const id = asString(formData, "id");
  if (!isValidUuid(id)) redirectWithMessage("/admin/reports", "error", "Report not found.");
  const { data: oldValue } = await supabase.from("reports").select("*").eq("id", id).maybeSingle();
  const { error } = await supabase.from("reports").update({ status: "resolved", updated_at: new Date().toISOString() }).eq("id", id);
  if (error) redirectWithMessage("/admin/reports", "error", error.message);
  await logAdminAction(supabase, user.id, "report_resolved", "reports", id, oldValue, { status: "resolved" });
  revalidatePath("/admin/reports");
  redirectWithMessage("/admin/reports", "message", "Report resolved.");
}

export async function dismissReport(formData: FormData) {
  const { supabase, user } = await requireAdmin("/admin/reports");
  const id = asString(formData, "id");
  if (!isValidUuid(id)) redirectWithMessage("/admin/reports", "error", "Report not found.");
  const { data: oldValue } = await supabase.from("reports").select("*").eq("id", id).maybeSingle();
  const { error } = await supabase.from("reports").update({ status: "dismissed", updated_at: new Date().toISOString() }).eq("id", id);
  if (error) redirectWithMessage("/admin/reports", "error", error.message);
  await logAdminAction(supabase, user.id, "report_dismissed", "reports", id, oldValue, { status: "dismissed" });
  revalidatePath("/admin/reports");
  redirectWithMessage("/admin/reports", "message", "Report dismissed.");
}

export async function reopenReport(formData: FormData) {
  const { supabase, user } = await requireAdmin("/admin/reports");
  const id = asString(formData, "id");
  if (!isValidUuid(id)) redirectWithMessage("/admin/reports", "error", "Report not found.");
  const { data: oldValue } = await supabase.from("reports").select("*").eq("id", id).maybeSingle();
  const { error } = await supabase.from("reports").update({ status: "open", updated_at: new Date().toISOString() }).eq("id", id);
  if (error) redirectWithMessage("/admin/reports", "error", error.message);
  await logAdminAction(supabase, user.id, "report_reopened", "reports", id, oldValue, { status: "open" });
  revalidatePath("/admin/reports");
  redirectWithMessage("/admin/reports", "message", "Report reopened.");
}

export async function hideReportedPrompt(formData: FormData) {
  const { supabase, user } = await requireAdmin("/admin/reports");
  const id = asString(formData, "id");
  const promptId = asString(formData, "prompt_id");
  if (!isValidUuid(id) || !isValidUuid(promptId)) redirectWithMessage("/admin/reports", "error", "Invalid report or prompt.");
  const oldValue = await readPromptSnapshot(supabase, promptId);
  const { error: promptError } = await supabase.from("prompts").update({ hidden: true, updated_at: new Date().toISOString() }).eq("id", promptId);
  if (promptError) redirectWithMessage("/admin/reports", "error", promptError.message);
  const { error: reportError } = await supabase.from("reports").update({ status: "resolved", updated_at: new Date().toISOString() }).eq("id", id);
  if (reportError) redirectWithMessage("/admin/reports", "error", reportError.message);
  await logAdminAction(supabase, user.id, "prompt_hidden_report_resolved", "prompts", promptId, oldValue, { hidden: true });
  revalidatePath("/");
  revalidatePath("/admin/prompts");
  revalidatePath("/admin/reports");
  redirectWithMessage("/admin/reports", "message", "Prompt hidden and report resolved.");
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

  const normalizedId = isValidUuid(id) ? id : "";
  const { data: oldValue } = normalizedId ? await supabase.from("categories").select("*").eq("id", normalizedId).maybeSingle() : { data: null };
  const result = normalizedId
    ? await supabase.from("categories").update(payload).eq("id", normalizedId).select("id").maybeSingle()
    : await supabase.from("categories").insert({ ...payload, created_at: new Date().toISOString() }).select("id").maybeSingle();

  if (result.error) redirectWithMessage("/admin/categories", "error", result.error.message);
  await logAdminAction(supabase, user.id, normalizedId ? "category_updated" : "category_created", "categories", result.data?.id ?? normalizedId, oldValue, payload);
  revalidatePath("/");
  revalidatePath("/admin/categories");
  redirectWithMessage("/admin/categories", "message", id ? "Category updated." : "Category created.");
}

export async function toggleCategory(formData: FormData) {
  const { supabase, user } = await requireAdmin("/admin/categories");
  const id = asString(formData, "id");
  const isActive = asBoolean(formData, "is_active");
  if (!isValidUuid(id)) redirectWithMessage("/admin/categories", "error", "Category not found.");

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

  const normalizedId = isValidUuid(id) ? id : "";
  const { data: oldValue } = normalizedId ? await supabase.from("tags").select("*").eq("id", normalizedId).maybeSingle() : { data: null };
  const result = normalizedId
    ? await supabase.from("tags").update(payload).eq("id", normalizedId).select("id").maybeSingle()
    : await supabase.from("tags").insert({ ...payload, created_at: new Date().toISOString() }).select("id").maybeSingle();

  if (result.error) redirectWithMessage("/admin/tags", "error", result.error.message);
  await logAdminAction(supabase, user.id, normalizedId ? "tag_updated" : "tag_created", "tags", result.data?.id ?? normalizedId, oldValue, payload);
  revalidatePath("/");
  revalidatePath("/admin/tags");
  redirectWithMessage("/admin/tags", "message", id ? "Tag updated." : "Tag created.");
}

export async function toggleTag(formData: FormData) {
  const { supabase, user } = await requireAdmin("/admin/tags");
  const id = asString(formData, "id");
  const isActive = asBoolean(formData, "is_active");
  if (!isValidUuid(id)) redirectWithMessage("/admin/tags", "error", "Tag not found.");

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

  if (!isValidUuid(id)) redirectWithMessage("/admin/packs", "error", "Pack not found.");
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

  if (!isValidUuid(id)) redirectWithMessage("/admin/packs", "error", "Pack not found.");

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
  if (!isValidUuid(id)) redirectWithMessage("/admin/packs", "error", "Pack not found.");

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

  if (!isValidUuid(id)) redirectWithMessage("/admin/payments", "error", "Payment request is incomplete.");

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
  if (!isValidUuid(id)) redirectWithMessage("/admin/payments", "error", "Payment request not found.");

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
