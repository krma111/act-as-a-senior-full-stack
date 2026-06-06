import type { User } from "@supabase/supabase-js";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type LooseProfileRow = {
  id?: string;
  email?: string | null;
  full_name?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  role?: string | null;
  status?: string | null;
  banned_at?: string | null;
  banned_by?: string | null;
  ban_reason?: string | null;
  manual_badge_override?: boolean | null;
  manual_badge_type?: string | null;
  manual_badge_assigned_by?: string | null;
  manual_badge_assigned_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type AuthSessionState = {
  supabase: SupabaseServerClient | null;
  user: User | null;
  profile: Profile | null;
};

export type DashboardSavedPrompt = {
  id: string;
  title: string;
  image_url: string;
  category: string | null;
  tags: string[];
  href: string;
  saved_at: string;
};

function fallbackDisplayName(user: User, row?: LooseProfileRow | null) {
  return (
    row?.full_name ??
    row?.display_name ??
    (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null) ??
    (typeof user.user_metadata?.display_name === "string" ? user.user_metadata.display_name : null) ??
    user.email?.split("@")[0] ??
    "PromptVault user"
  );
}

function normalizeRole(role?: string | null): Profile["role"] {
  if (role === "admin" || role === "creator") return role;
  return "user";
}

function normalizeProfile(user: User, row?: LooseProfileRow | null): Profile {
  const fullName = fallbackDisplayName(user, row);

  return {
    id: user.id,
    email: row?.email ?? user.email ?? "",
    full_name: fullName,
    display_name: row?.display_name ?? fullName,
    avatar_url:
      row?.avatar_url ??
      (typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null) ??
      null,
    role: normalizeRole(row?.role),
    status: row?.status === "banned" ? "banned" : "active",
    banned_at: row?.banned_at ?? null,
    banned_by: row?.banned_by ?? null,
    ban_reason: row?.ban_reason ?? null,
    manual_badge_override: Boolean(row?.manual_badge_override),
    manual_badge_type:
      row?.manual_badge_type === "bronze" ||
      row?.manual_badge_type === "silver" ||
      row?.manual_badge_type === "gold" ||
      row?.manual_badge_type === "diamond"
        ? row.manual_badge_type
        : "none",
    manual_badge_assigned_by: row?.manual_badge_assigned_by ?? null,
    manual_badge_assigned_at: row?.manual_badge_assigned_at ?? null,
    created_at: row?.created_at ?? user.created_at ?? new Date().toISOString(),
    updated_at: row?.updated_at ?? row?.created_at ?? user.updated_at ?? user.created_at ?? new Date().toISOString()
  };
}

async function readProfileFromTable(supabase: SupabaseServerClient, table: "profiles" | "users", userId: string) {
  const { data, error } = await supabase.from(table).select("*").eq("id", userId).maybeSingle();
  if (error) return null;
  return data as LooseProfileRow | null;
}

export async function getProfileForUser(supabase: SupabaseServerClient, user: User) {
  const current = (await readProfileFromTable(supabase, "profiles", user.id)) ?? (await readProfileFromTable(supabase, "users", user.id));
  return normalizeProfile(user, current);
}

export async function getAuthSessionState(): Promise<AuthSessionState> {
  if (!hasSupabaseEnv) {
    return { supabase: null, user: null, profile: null };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, profile: null };
  }

  const profile = await getProfileForUser(supabase, user);
  return { supabase, user, profile };
}

async function getSavedPromptsFromNewSchema(supabase: SupabaseServerClient, userId: string): Promise<DashboardSavedPrompt[] | null> {
  const { data, error } = await supabase
    .from("saved_prompts")
    .select("created_at, prompt_id, prompts(id, title, image_url, category, tags)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return null;

  return (data ?? [])
    .map((item) => {
      const prompt = Array.isArray(item.prompts) ? item.prompts[0] : item.prompts;
      if (!prompt?.id || !prompt.title || !prompt.image_url) return null;

      return {
        id: prompt.id,
        title: prompt.title,
        image_url: prompt.image_url,
        category: prompt.category ?? null,
        tags: Array.isArray(prompt.tags) ? prompt.tags : [],
        href: `/prompts/${prompt.id}`,
        saved_at: item.created_at ?? new Date().toISOString()
      } satisfies DashboardSavedPrompt;
    })
    .filter((item): item is DashboardSavedPrompt => Boolean(item));
}

async function getSavedPromptsFromLegacySchema(supabase: SupabaseServerClient, userId: string): Promise<DashboardSavedPrompt[]> {
  const { data, error } = await supabase
    .from("favorites")
    .select("created_at, prompts(id, title, image_url, tags, categories(name))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return [];

  return (data ?? [])
    .map((item) => {
      const prompt = (Array.isArray(item.prompts) ? item.prompts[0] : item.prompts) as
        | {
            id?: string;
            title?: string;
            image_url?: string;
            categories?: { name?: string } | Array<{ name?: string }>;
            tags?: string[];
          }
        | null;
      if (!prompt?.id || !prompt.title || !prompt.image_url) return null;
      const category = Array.isArray(prompt.categories) ? prompt.categories[0]?.name ?? null : prompt.categories?.name ?? null;

      return {
        id: prompt.id,
        title: prompt.title,
        image_url: prompt.image_url,
        category,
        tags: Array.isArray(prompt.tags) ? prompt.tags : [],
        href: `/prompts/${prompt.id}`,
        saved_at: item.created_at ?? new Date().toISOString()
      } satisfies DashboardSavedPrompt;
    })
    .filter((item): item is DashboardSavedPrompt => Boolean(item));
}

export async function getSavedPromptsForDashboard(supabase: SupabaseServerClient, userId: string) {
  return (await getSavedPromptsFromNewSchema(supabase, userId)) ?? (await getSavedPromptsFromLegacySchema(supabase, userId));
}
