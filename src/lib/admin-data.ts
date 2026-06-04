import { redirect } from "next/navigation";
import { getAuthSessionState } from "@/lib/auth/session";
import type { Profile, SiteSettings } from "@/lib/types";

export type AdminPromptStatus = "pending" | "approved" | "rejected";
export type AdminRole = "admin" | "creator" | "user";

export type AdminPrompt = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  prompt_text: string;
  negative_prompt: string | null;
  image_url: string | null;
  category: string;
  tags: string[];
  ai_model: string | null;
  aspect_ratio: string | null;
  reference_required: boolean;
  difficulty: "beginner" | "intermediate" | "advanced";
  status: AdminPromptStatus;
  rejection_reason: string | null;
  copy_count: number;
  view_count: number;
  featured: boolean;
  created_at: string;
  updated_at: string;
  creator_email: string | null;
  creator_name: string | null;
};

export type AdminStats = {
  totalPrompts: number;
  pendingPrompts: number;
  approvedPrompts: number;
  rejectedPrompts: number;
  featuredPrompts: number;
  totalUsers: number;
  totalCopies: number;
  totalSaves: number;
};

type PromptRow = Omit<AdminPrompt, "creator_email" | "creator_name">;

function sanitizeStatus(value?: string): AdminPromptStatus | "all" {
  if (value === "pending" || value === "approved" || value === "rejected") return value;
  return "all";
}

function normalizeRole(value: string): AdminRole {
  if (value === "admin" || value === "creator") return value;
  return "user";
}

export async function requireAdmin(nextPath = "/admin") {
  const { supabase, user, profile } = await getAuthSessionState();

  if (!supabase || !user || !profile) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  if (profile.role !== "admin") {
    redirect("/dashboard?error=Admin%20access%20required.");
  }

  return { supabase, user, profile };
}

export async function getAdminStats() {
  const { supabase } = await requireAdmin("/admin");

  const [
    totalPrompts,
    pendingPrompts,
    approvedPrompts,
    rejectedPrompts,
    featuredPrompts,
    totalUsers,
    savedPrompts,
    promptCopies
  ] = await Promise.all([
    supabase.from("prompts").select("id", { count: "exact", head: true }),
    supabase.from("prompts").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("prompts").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("prompts").select("id", { count: "exact", head: true }).eq("status", "rejected"),
    supabase.from("prompts").select("id", { count: "exact", head: true }).eq("featured", true),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("saved_prompts").select("id", { count: "exact", head: true }),
    supabase.from("prompts").select("copy_count")
  ]);

  return {
    totalPrompts: totalPrompts.count ?? 0,
    pendingPrompts: pendingPrompts.count ?? 0,
    approvedPrompts: approvedPrompts.count ?? 0,
    rejectedPrompts: rejectedPrompts.count ?? 0,
    featuredPrompts: featuredPrompts.count ?? 0,
    totalUsers: totalUsers.count ?? 0,
    totalCopies: (promptCopies.data ?? []).reduce((total, row) => total + (Number(row.copy_count) || 0), 0),
    totalSaves: savedPrompts.count ?? 0
  } satisfies AdminStats;
}

export async function getAdminSiteSettings() {
  const { supabase } = await requireAdmin("/admin");
  const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();

  return {
    id: 1,
    website_name: data?.website_name ?? "PromptVault",
    logo_text: data?.logo_text ?? "PromptVault",
    hero_headline: data?.hero_headline ?? "Discover and share powerful AI image prompts",
    hero_subheadline: data?.hero_subheadline ?? "Browse battle-tested prompts, save favorites, and publish your best image generations.",
    footer_text: data?.footer_text ?? "Copyright 2026 PromptVault. All rights reserved.",
    admin_email: ""
  } satisfies SiteSettings;
}

export async function getAdminPrompts(status?: string) {
  const { supabase } = await requireAdmin("/admin/prompts");
  const activeStatus = sanitizeStatus(status);
  let query = supabase
    .from("prompts")
    .select(
      "id,user_id,title,description,prompt_text,negative_prompt,image_url,category,tags,ai_model,aspect_ratio,reference_required,difficulty,status,rejection_reason,copy_count,view_count,featured,created_at,updated_at"
    )
    .order("created_at", { ascending: false });

  if (activeStatus !== "all") query = query.eq("status", activeStatus);

  const { data, error } = await query;
  if (error) return { prompts: [] as AdminPrompt[], error: error.message, activeStatus };

  const rows = (data ?? []) as PromptRow[];
  const userIds = Array.from(new Set(rows.map((prompt) => prompt.user_id).filter(Boolean)));
  const profilesById = new Map<string, Profile>();

  if (userIds.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id,email,full_name,display_name,avatar_url,role,created_at,updated_at")
      .in("id", userIds);

    for (const profile of (profiles ?? []) as Profile[]) {
      profilesById.set(profile.id, profile);
    }
  }

  return {
    prompts: rows.map((prompt) => {
      const creator = profilesById.get(prompt.user_id);
      return {
        ...prompt,
        tags: Array.isArray(prompt.tags) ? prompt.tags : [],
        creator_email: creator?.email ?? null,
        creator_name: creator?.full_name ?? creator?.display_name ?? null
      };
    }),
    error: null,
    activeStatus
  };
}

export async function getAdminPromptById(id: string) {
  const { supabase } = await requireAdmin(`/admin/prompts/${id}/edit`);
  const { data, error } = await supabase
    .from("prompts")
    .select(
      "id,user_id,title,description,prompt_text,negative_prompt,image_url,category,tags,ai_model,aspect_ratio,reference_required,difficulty,status,rejection_reason,copy_count,view_count,featured,created_at,updated_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return { ...(data as PromptRow), tags: Array.isArray(data.tags) ? data.tags : [] } as PromptRow;
}

export async function getAdminUsers() {
  const { supabase } = await requireAdmin("/admin/users");
  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,full_name,display_name,avatar_url,role,created_at,updated_at")
    .order("created_at", { ascending: false });

  if (error) return { users: [] as Profile[], error: error.message };

  return {
    users: ((data ?? []) as Profile[]).map((user) => ({ ...user, role: normalizeRole(user.role) })),
    error: null
  };
}
