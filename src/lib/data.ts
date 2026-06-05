import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import { creatorSlug, slugify } from "@/lib/slugs";
import type { Category, Profile, Prompt, SiteSettings } from "@/lib/types";

function sanitizeSearch(value: string) {
  return value.replace(/[%_{}()[\],"'\\]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function uuidFromSlug(value: string) {
  const match = value.match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  return match?.[0] ?? null;
}

type PromptRow = {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  image_url: string | null;
  prompt_text: string;
  negative_prompt: string | null;
  ai_model: string | null;
  aspect_ratio: string | null;
  category: string;
  tags: string[] | null;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  copy_count: number | null;
  view_count: number | null;
  featured: boolean | null;
  reference_required?: boolean | null;
  created_at: string;
  updated_at: string;
};

const promptSelect =
  "id,user_id,title,description,image_url,prompt_text,negative_prompt,ai_model,aspect_ratio,category,tags,status,rejection_reason,copy_count,view_count,featured,reference_required,created_at,updated_at";

const profileSelect =
  "id,email,full_name,display_name,avatar_url,role,manual_badge_override,manual_badge_type,manual_badge_assigned_by,manual_badge_assigned_at,created_at,updated_at";
const fallbackProfileSelect = "id,email,full_name,display_name,avatar_url,role,created_at,updated_at";

function categoryFromName(name: string): Category {
  const slug = slugify(name) || "uncategorized";
  return {
    id: slug,
    name,
    slug,
    description: null
  };
}

export function normalizePrompt(row: PromptRow, profile?: Profile | null): Prompt {
  const category = categoryFromName(row.category || "Uncategorized");

  return {
    id: row.id,
    user_id: row.user_id,
    category_id: null,
    title: row.title,
    description: row.description ?? null,
    prompt_text: row.prompt_text,
    negative_prompt: row.negative_prompt,
    image_url: row.image_url,
    ai_model: row.ai_model ?? "Image model",
    visibility: "public",
    aspect_ratio: row.aspect_ratio,
    category: category.name,
    reference_required: Boolean(row.reference_required),
    tags: Array.isArray(row.tags) ? row.tags : [],
    copy_count: row.copy_count ?? 0,
    like_count: 0,
    view_count: row.view_count ?? 0,
    featured: Boolean(row.featured),
    hidden: false,
    status: "approved",
    rejection_reason: null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    categories: category,
    users: profile ?? null
  };
}

async function profilesByIds(userIds: string[]) {
  const map = new Map<string, Profile>();
  if (!hasSupabaseEnv || !userIds.length) return map;

  const supabase = await createClient();
  const uniqueUserIds = Array.from(new Set(userIds));
  const profileResult = await supabase
    .from("profiles")
    .select(profileSelect)
    .in("id", uniqueUserIds);
  let data: unknown[] | null = profileResult.data;

  if (profileResult.error) {
    const fallback = await supabase.from("profiles").select(fallbackProfileSelect).in("id", uniqueUserIds);
    data = fallback.data as unknown[] | null;
  }

  const copyTotals = await creatorCopyTotals(uniqueUserIds);

  for (const profile of (data ?? []) as Profile[]) {
    map.set(profile.id, {
      ...profile,
      copy_total: copyTotals.get(profile.id) ?? 0
    });
  }
  return map;
}

async function creatorCopyTotals(userIds: string[]) {
  const totals = new Map<string, number>();
  if (!hasSupabaseEnv || !userIds.length) return totals;

  const supabase = await createClient();
  const { data } = await supabase.from("prompts").select("user_id,copy_count").in("user_id", userIds).eq("status", "approved");

  for (const row of (data ?? []) as Array<{ user_id: string; copy_count: number | null }>) {
    totals.set(row.user_id, (totals.get(row.user_id) ?? 0) + (Number(row.copy_count) || 0));
  }

  return totals;
}

async function attachProfiles(rows: PromptRow[]) {
  const profiles = await profilesByIds(rows.map((row) => row.user_id).filter(Boolean));
  return rows.map((row) => normalizePrompt(row, profiles.get(row.user_id) ?? null));
}

export async function getSiteSettings(): Promise<SiteSettings> {
  if (!hasSupabaseEnv) {
    return {
      id: 1,
      website_name: "PromptVault",
      logo_text: "PromptVault",
      hero_headline: "Discover and share powerful image prompts",
      hero_subheadline: "Browse approved creator prompts from the live vault.",
      footer_text: "Copyright 2026 PromptVault. All rights reserved.",
      admin_email: ""
    };
  }

  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();

  return {
    id: 1,
    website_name: data?.website_name ?? "PromptVault",
    logo_text: data?.logo_text ?? "PromptVault",
    hero_headline: data?.hero_headline ?? "Discover and share powerful image prompts",
    hero_subheadline: data?.hero_subheadline ?? "Browse approved creator prompts from the live vault.",
    footer_text: data?.footer_text ?? "Copyright 2026 PromptVault. All rights reserved.",
    admin_email: ""
  };
}

export async function getCategories(): Promise<Category[]> {
  if (!hasSupabaseEnv) return [];

  const supabase = await createClient();
  const { data } = await supabase.from("prompts").select("category").eq("status", "approved").order("category");
  const names = Array.from(new Set((data ?? []).map((row) => row.category).filter(Boolean)));
  return names.map(categoryFromName);
}

export async function getPrompts(options?: {
  search?: string;
  category?: string;
  aspectRatio?: string;
  featured?: boolean;
  limit?: number;
  order?: "latest" | "trending";
}) {
  if (!hasSupabaseEnv) return [];

  const search = options?.search ? sanitizeSearch(options.search) : "";
  const supabase = await createClient();
  let query = supabase
    .from("prompts")
    .select(promptSelect)
    .eq("status", "approved");

  if (options?.category) query = query.ilike("category", options.category.replace(/-/g, " "));
  if (options?.aspectRatio) query = query.eq("aspect_ratio", options.aspectRatio);
  if (options?.featured) query = query.eq("featured", true);
  if (search) {
    const tag = search.toLowerCase().replace(/[{}"',]/g, "");
    const orParts = [
      `title.ilike.%${search}%`,
      `prompt_text.ilike.%${search}%`,
      `ai_model.ilike.%${search}%`,
      `category.ilike.%${search}%`
    ];
    if (tag && !/\s/.test(tag)) orParts.push(`tags.ov.{${tag}}`);
    query = query.or(orParts.join(","));
  }

  query =
    options?.order === "trending"
      ? query.order("copy_count", { ascending: false }).order("view_count", { ascending: false })
      : query.order("created_at", { ascending: false });

  const { data, error } = await query.limit(options?.limit ?? 12);
  if (error) return [];
  return attachProfiles((data ?? []) as PromptRow[]);
}

export async function getPrompt(idOrSlug: string) {
  if (!hasSupabaseEnv) return null;

  const supabase = await createClient();
  const id = uuidFromSlug(idOrSlug) ?? (isUuid(idOrSlug) ? idOrSlug : null);

  if (id) {
    const { data, error } = await supabase
      .from("prompts")
      .select(promptSelect)
      .eq("id", id)
      .eq("status", "approved")
      .maybeSingle();
    if (error || !data) return null;
    const profiles = await profilesByIds([data.user_id]);
    return normalizePrompt(data as PromptRow, profiles.get(data.user_id) ?? null);
  }

  const { data, error } = await supabase
    .from("prompts")
    .select(promptSelect)
    .eq("status", "approved")
    .limit(100);
  if (error) return null;
  const match = ((data ?? []) as PromptRow[]).find((row) => slugify(row.title) === idOrSlug);
  if (!match) return null;
  const profiles = await profilesByIds([match.user_id]);
  return normalizePrompt(match, profiles.get(match.user_id) ?? null);
}

export async function getPromptsByCreator(username: string) {
  if (!hasSupabaseEnv) return { creator: null as Profile | null, prompts: [] as Prompt[] };

  const supabase = await createClient();
  const profileResult = await supabase
    .from("profiles")
    .select(profileSelect)
    .limit(500);
  let profiles: unknown[] | null = profileResult.data;

  if (profileResult.error) {
    const fallback = await supabase.from("profiles").select(fallbackProfileSelect).limit(500);
    profiles = fallback.data as unknown[] | null;
  }

  const creator = ((profiles ?? []) as Profile[]).find((profile) => {
    const candidates = [profile.id, creatorSlug(profile), slugify(profile.email?.split("@")[0] ?? "")];
    return candidates.includes(username);
  }) ?? null;

  if (!creator) return { creator: null, prompts: [] };

  const { data, error } = await supabase
    .from("prompts")
    .select(promptSelect)
    .eq("user_id", creator.id)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) return { creator, prompts: [] };
  const rows = (data ?? []) as PromptRow[];
  const copyTotal = rows.reduce((total, row) => total + (Number(row.copy_count) || 0), 0);
  const creatorWithTotals = creator ? { ...creator, copy_total: copyTotal, prompt_count: rows.length } : creator;
  return { creator: creatorWithTotals, prompts: rows.map((row) => normalizePrompt(row, creatorWithTotals)) };
}

export async function getCreatorLeaderboard() {
  if (!hasSupabaseEnv) return [];

  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("prompts")
    .select("user_id,copy_count")
    .eq("status", "approved");

  if (error) return [];

  const totals = new Map<string, { copy_total: number; prompt_count: number }>();
  for (const row of (rows ?? []) as Array<{ user_id: string; copy_count: number | null }>) {
    const current = totals.get(row.user_id) ?? { copy_total: 0, prompt_count: 0 };
    current.copy_total += Number(row.copy_count) || 0;
    current.prompt_count += 1;
    totals.set(row.user_id, current);
  }

  const profiles = await profilesByIds(Array.from(totals.keys()));
  return Array.from(profiles.values())
    .map((profile) => ({
      ...profile,
      copy_total: totals.get(profile.id)?.copy_total ?? 0,
      prompt_count: totals.get(profile.id)?.prompt_count ?? 0
    }))
    .sort((a, b) => (b.copy_total ?? 0) - (a.copy_total ?? 0))
    .slice(0, 50);
}


