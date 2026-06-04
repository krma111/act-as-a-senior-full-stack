import { createClient } from "@/lib/supabase/server";
import { demoCategories, demoPrompts, demoSettings } from "@/lib/demo-data";
import { isPreviewMode } from "@/lib/env";
import type { Category, Prompt, SiteSettings } from "@/lib/types";

function sanitizeSearch(value: string) {
  return value.replace(/[%_{}()[\],"'\\]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

type PromptRow = {
  id: string;
  user_id: string;
  title: string;
  image_url: string | null;
  prompt_text: string;
  negative_prompt: string | null;
  ai_model: string | null;
  aspect_ratio: string | null;
  category: string;
  tags: string[];
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  copy_count: number;
  view_count: number;
  featured: boolean;
  created_at: string;
  updated_at: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function categoryFromName(name: string): Category {
  return {
    id: slugify(name) || "uncategorized",
    name,
    slug: slugify(name) || "uncategorized",
    description: null
  };
}

function normalizePrompt(row: PromptRow): Prompt {
  const category = categoryFromName(row.category || "Uncategorized");

  return {
    id: row.id,
    user_id: row.user_id,
    category_id: null,
    title: row.title,
    prompt_text: row.prompt_text,
    negative_prompt: row.negative_prompt,
    image_url: row.image_url,
    ai_model: row.ai_model ?? "Image model",
    visibility: row.status === "approved" ? "public" : "private",
    aspect_ratio: row.aspect_ratio,
    category: category.name,
    tags: Array.isArray(row.tags) ? row.tags : [],
    copy_count: row.copy_count ?? 0,
    like_count: 0,
    view_count: row.view_count ?? 0,
    featured: Boolean(row.featured),
    hidden: row.status !== "approved",
    status: row.status,
    rejection_reason: row.rejection_reason,
    created_at: row.created_at,
    updated_at: row.updated_at,
    categories: category,
    users: null
  };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  if (isPreviewMode) return demoSettings;

  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();

  return {
    id: 1,
    website_name: data?.website_name ?? "PromptVault",
    logo_text: data?.logo_text ?? "PromptVault",
    hero_headline: data?.hero_headline ?? "Discover and share powerful AI image prompts",
    hero_subheadline: data?.hero_subheadline ?? "Browse battle-tested prompts, save favorites, and publish your best image generations.",
    footer_text: data?.footer_text ?? "Copyright 2026 PromptVault. All rights reserved.",
    admin_email: ""
  };
}

export async function getCategories(): Promise<Category[]> {
  if (isPreviewMode) return demoCategories;

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
  if (isPreviewMode) {
    const search = options?.search ? sanitizeSearch(options.search).toLowerCase() : "";
    const filtered = demoPrompts
      .filter((prompt) => !options?.category || prompt.categories?.slug === options.category)
      .filter((prompt) => !options?.aspectRatio || prompt.aspect_ratio === options.aspectRatio)
      .filter((prompt) => !options?.featured || prompt.featured)
      .filter((prompt) => {
        if (!search) return true;
        return [
          prompt.title,
          prompt.prompt_text,
          prompt.ai_model,
          prompt.categories?.name ?? "",
          prompt.tags.join(" ")
        ].join(" ").toLowerCase().includes(search);
      })
      .sort((a, b) => {
        if (options?.order === "trending") return b.like_count + b.copy_count - (a.like_count + a.copy_count);
        return Date.parse(b.created_at) - Date.parse(a.created_at);
      });

    return filtered.slice(0, options?.limit ?? 12);
  }

  const search = options?.search ? sanitizeSearch(options.search) : "";

  const supabase = await createClient();
  let query = supabase
    .from("prompts")
    .select("*")
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

  const { data } = await query.limit(options?.limit ?? 12);
  return ((data ?? []) as PromptRow[]).map(normalizePrompt);
}

export async function getPrompt(id: string) {
  if (isPreviewMode) return demoPrompts.find((prompt) => prompt.id === id) ?? null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("prompts")
    .select("*")
    .eq("id", id)
    .single();
  return data ? normalizePrompt(data as PromptRow) : null;
}
