import { createClient } from "@/lib/supabase/server";
import { demoCategories, demoPrompts, demoSettings } from "@/lib/demo-data";
import { isPreviewMode } from "@/lib/env";
import type { Category, Prompt, SiteSettings } from "@/lib/types";

function sanitizeSearch(value: string) {
  return value.replace(/[%_{}()[\],"'\\]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

export async function getSiteSettings(): Promise<SiteSettings> {
  if (isPreviewMode) return demoSettings;

  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("*").eq("id", 1).single();
  return (
    data ?? {
      id: 1,
      website_name: "PromptHub",
      logo_text: "PromptHub",
      hero_headline: "Discover and share powerful AI image prompts",
      hero_subheadline: "Browse battle-tested prompts, save favorites, and publish your best image generations.",
      footer_text: "PromptHub is a free community library for AI image prompt creators.",
      admin_email: ""
    }
  );
}

export async function getCategories(): Promise<Category[]> {
  if (isPreviewMode) return demoCategories;

  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("*").order("name");
  return data ?? [];
}

export async function getPrompts(options?: {
  search?: string;
  category?: string;
  featured?: boolean;
  limit?: number;
  order?: "latest" | "trending";
}) {
  if (isPreviewMode) {
    const search = options?.search ? sanitizeSearch(options.search).toLowerCase() : "";
    const filtered = demoPrompts
      .filter((prompt) => !options?.category || prompt.categories?.slug === options.category)
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

  const supabase = await createClient();
  let categoryId: string | null = null;
  if (options?.category) {
    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", options.category)
      .maybeSingle();
    categoryId = category?.id ?? null;
  }

  const search = options?.search ? sanitizeSearch(options.search) : "";
  let matchingCategoryIds: string[] = [];
  if (search) {
    const { data: categoryMatches } = await supabase
      .from("categories")
      .select("id")
      .or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
    matchingCategoryIds = (categoryMatches ?? []).map((category) => category.id);
  }

  let query = supabase
    .from("prompts")
    .select("*, categories(*), users(*)")
    .eq("visibility", "public")
    .eq("hidden", false);

  if (options?.category) query = categoryId ? query.eq("category_id", categoryId) : query.eq("category_id", "00000000-0000-0000-0000-000000000000");
  if (options?.featured) query = query.eq("featured", true);
  if (search) {
    const tag = search.toLowerCase().replace(/[{}"',]/g, "");
    const orParts = [
      `title.ilike.%${search}%`,
      `prompt_text.ilike.%${search}%`,
      `ai_model.ilike.%${search}%`
    ];
    if (tag && !/\s/.test(tag)) orParts.push(`tags.ov.{${tag}}`);
    if (matchingCategoryIds.length) orParts.push(`category_id.in.(${matchingCategoryIds.join(",")})`);
    query = query.or(orParts.join(","));
  }

  query =
    options?.order === "trending"
      ? query.order("like_count", { ascending: false }).order("copy_count", { ascending: false })
      : query.order("created_at", { ascending: false });

  const { data } = await query.limit(options?.limit ?? 12);
  return (data ?? []) as Prompt[];
}

export async function getPrompt(id: string) {
  if (isPreviewMode) return demoPrompts.find((prompt) => prompt.id === id) ?? null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("prompts")
    .select("*, categories(*), users(*)")
    .eq("id", id)
    .single();
  return data as Prompt | null;
}
