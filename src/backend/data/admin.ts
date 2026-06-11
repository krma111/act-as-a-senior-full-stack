import { redirect } from "next/navigation";
import { getAuthSessionState } from "@/backend/auth/session";
import type { Category, Profile, SiteSettings, TagRecord } from "@/shared/types";

export type AdminPromptStatus = "pending" | "approved" | "rejected";
export type AdminPromptFilter = AdminPromptStatus | "all" | "featured" | "deleted";
export type AdminRole = "admin" | "creator" | "user";
export type PackStatus = "pending" | "approved" | "rejected";
export type PaymentStatus = "pending" | "submitted" | "approved" | "access_sent" | "rejected";

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
  status: AdminPromptStatus;
  rejection_reason: string | null;
  copy_count: number;
  view_count: number;
  save_count: number;
  price: number | null;
  featured: boolean;
  visibility?: string;
  hidden?: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
  creator_name_override: string | null;
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
  deletedPrompts: number;
  totalUsers: number;
  totalCreators: number;
  totalCopies: number;
  totalSaves: number;
  totalPaidPacks: number;
  totalPaymentRequests: number;
  totalApprovedSales: number;
};

type PromptRow = Omit<AdminPrompt, "creator_email" | "creator_name" | "creator_name_override" | "status" | "price"> & {
  status: string;
  price?: number | string | null;
  creator_name?: string | null;
};
type AdminPromptCounts = {
  all: number;
  pending: number;
  approved: number;
  rejected: number;
  featured: number;
  deleted: number;
};

export type AdminPack = {
  id: string;
  creator_id: string | null;
  creator_name_row: string | null;
  title: string;
  description: string | null;
  cover_image: string | null;
  price: number;
  is_paid: boolean;
  status: PackStatus;
  rejection_reason: string | null;
  total_prompts: number;
  created_at: string;
  updated_at: string;
  creator_email: string | null;
  creator_name: string | null;
};

export type AdminPaymentRequest = {
  id: string;
  user_id: string;
  pack_id: string;
  order_id: string | null;
  user_email: string | null;
  amount: number;
  currency: string;
  whatsapp_proof_url: string | null;
  whatsapp_proof_status: string | null;
  screenshot_url: string | null;
  screenshot_status: string | null;
  access_link: string | null;
  access_sent_at: string | null;
  status: PaymentStatus;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  pack_name: string | null;
};

export type AdminLog = {
  id: string;
  admin_user_id: string | null;
  action_type: string;
  target_table: string;
  target_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  created_at: string;
  admin_email?: string | null;
};

type PackRow = {
  id: string;
  creator_id: string | null;
  creator_name: string | null;
  title: string;
  description: string | null;
  cover_image: string | null;
  price: number | string | null;
  is_paid: boolean | null;
  status: string | null;
  rejection_reason?: string | null;
  total_prompts: number | null;
  created_at: string;
  updated_at: string;
};
type PaymentRow = Omit<AdminPaymentRequest, "user_email" | "pack_name">;

const profileSelect =
  "id,email,full_name,display_name,avatar_url,role,status,banned_at,banned_by,ban_reason,manual_badge_override,manual_badge_type,manual_badge_assigned_by,manual_badge_assigned_at,created_at,updated_at";
const fallbackProfileSelect = "id,email,full_name,display_name,avatar_url,role,created_at,updated_at";
const promptSelect =
  "id,user_id,title,description,prompt_text,negative_prompt,image_url,category,tags,ai_model,aspect_ratio,reference_required,status,rejection_reason,copy_count,view_count,save_count,price,featured,deleted_at,deleted_by,creator_name,created_at,updated_at";

type AdminContext = Awaited<ReturnType<typeof getAuthSessionState>> & {
  supabase: NonNullable<Awaited<ReturnType<typeof getAuthSessionState>>["supabase"]>;
  user: NonNullable<Awaited<ReturnType<typeof getAuthSessionState>>["user"]>;
  profile: NonNullable<Awaited<ReturnType<typeof getAuthSessionState>>["profile"]>;
  adminDatabaseError: string | null;
};

function isMissingTableError(message?: string | null) {
  const value = (message ?? "").toLowerCase();
  return value.includes("schema cache") || value.includes("could not find the table") || value.includes("does not exist");
}

async function withRetry<T>(label: string, operation: () => Promise<T>, fallback: T, attempts = 2): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.error(`[admin-data] ${label} failed on attempt ${attempt}`, error);
    }
  }

  console.error(`[admin-data] ${label} returned fallback after retries`, lastError);
  return fallback;
}

function sanitizePromptFilter(value?: string): AdminPromptFilter {
  if (value === "pending" || value === "approved" || value === "rejected" || value === "featured" || value === "deleted") return value;
  return "all";
}

function sanitizeModerationStatus(value?: string): AdminPromptStatus | "all" {
  if (value === "pending" || value === "approved" || value === "rejected") return value;
  return "all";
}

function normalizePromptStatus(value?: string | null): AdminPromptStatus {
  if (value === "approved" || value === "rejected") return value;
  return "pending";
}

function emptyAdminStats(): AdminStats {
  return {
    totalPrompts: 0,
    pendingPrompts: 0,
    approvedPrompts: 0,
    rejectedPrompts: 0,
    featuredPrompts: 0,
    deletedPrompts: 0,
    totalUsers: 0,
    totalCreators: 0,
    totalCopies: 0,
    totalSaves: 0,
    totalPaidPacks: 0,
    totalPaymentRequests: 0,
    totalApprovedSales: 0
  };
}

function normalizeRole(value: string): AdminRole {
  if (value === "admin" || value === "creator") return value;
  return "user";
}

function normalizeProfile(profile: Profile): Profile {
  return {
    ...profile,
    role: normalizeRole(profile.role),
    status: profile.status === "banned" ? "banned" : "active"
  };
}

function normalizePrompt(row: PromptRow, creator?: Profile | null): AdminPrompt {
  return {
    ...row,
    status: normalizePromptStatus(row.status),
    tags: Array.isArray(row.tags) ? row.tags : [],
    copy_count: Number(row.copy_count) || 0,
    view_count: Number(row.view_count) || 0,
    save_count: Number(row.save_count) || 0,
    price: row.price === null || row.price === undefined ? 0 : Number(row.price) || 0,
    featured: Boolean(row.featured),
    reference_required: Boolean(row.reference_required),
    deleted_at: row.deleted_at ?? null,
    deleted_by: row.deleted_by ?? null,
    creator_name_override: row.creator_name ?? null,
    creator_email: creator?.email ?? null,
    creator_name: row.creator_name ?? creator?.full_name ?? creator?.display_name ?? null
  };
}

export async function requireAdmin(nextPath = "/admin") {
  const { supabase, user, profile } = await getAuthSessionState();

  if (!supabase || !user || !profile) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  if (profile.status === "banned") {
    redirect("/dashboard?error=Account%20blocked.");
  }

  if (profile.role !== "admin") {
    redirect("/dashboard?error=Admin%20access%20required.");
  }

  return {
    supabase,
    user,
    profile,
    adminDatabaseError: null
  } satisfies AdminContext;
}

export async function getAdminStats() {
  const { supabase } = await requireAdmin("/admin");

  return withRetry("getAdminStats", async () => {
    const [
      totalPrompts,
      pendingPrompts,
      approvedPrompts,
      rejectedPrompts,
      featuredPrompts,
      deletedPrompts,
      totalUsers,
      totalCreators,
      savedPrompts,
      promptCopies,
      paidPacks,
      paymentRequests,
      approvedSales
    ] = await Promise.all([
      supabase.from("prompts").select("id", { count: "exact", head: true }).is("deleted_at", null),
      supabase.from("prompts").select("id", { count: "exact", head: true }).eq("status", "pending").is("deleted_at", null),
      supabase.from("prompts").select("id", { count: "exact", head: true }).eq("status", "approved").is("deleted_at", null),
      supabase.from("prompts").select("id", { count: "exact", head: true }).eq("status", "rejected").is("deleted_at", null),
      supabase.from("prompts").select("id", { count: "exact", head: true }).eq("featured", true).is("deleted_at", null),
      supabase.from("prompts").select("id", { count: "exact", head: true }).not("deleted_at", "is", null),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "creator"),
      supabase.from("saved_prompts").select("id", { count: "exact", head: true }),
      supabase.from("prompts").select("copy_count"),
      supabase.from("prompt_packs").select("id", { count: "exact", head: true }).gt("price", 0),
      supabase.from("payment_requests").select("id", { count: "exact", head: true }),
      supabase.from("payment_requests").select("id", { count: "exact", head: true }).eq("status", "approved")
    ]);

    return {
      totalPrompts: totalPrompts.count ?? 0,
      pendingPrompts: pendingPrompts.count ?? 0,
      approvedPrompts: approvedPrompts.count ?? 0,
      rejectedPrompts: rejectedPrompts.count ?? 0,
      featuredPrompts: featuredPrompts.count ?? 0,
      deletedPrompts: deletedPrompts.count ?? 0,
      totalUsers: totalUsers.count ?? 0,
      totalCreators: totalCreators.count ?? 0,
      totalCopies: (promptCopies.data ?? []).reduce((total, row) => total + (Number(row.copy_count) || 0), 0),
      totalSaves: savedPrompts.count ?? 0,
      totalPaidPacks: paidPacks.error ? 0 : paidPacks.count ?? 0,
      totalPaymentRequests: paymentRequests.error ? 0 : paymentRequests.count ?? 0,
      totalApprovedSales: approvedSales.error ? 0 : approvedSales.count ?? 0
    } satisfies AdminStats;
  }, emptyAdminStats());
}

export async function getAdminSiteSettings() {
  const { supabase } = await requireAdmin("/admin/settings");
  return withRetry("getAdminSiteSettings", async () => {
    const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();

    return {
      id: 1,
      website_name: data?.website_name ?? "PromptVault",
      logo_text: data?.logo_text ?? "PromptVault",
      hero_headline: data?.hero_headline ?? "Discover and share powerful image prompts",
      hero_subheadline: data?.hero_subheadline ?? "Browse approved creator prompts from the live vault.",
      footer_text: data?.footer_text ?? "Copyright 2026 PromptVault. All rights reserved.",
      admin_email: "",
      cta_text: data?.cta_text ?? "Start exploring prompts",
      empty_state_title: data?.empty_state_title ?? "No prompts yet",
      empty_state_message: data?.empty_state_message ?? "Approved prompts will appear here.",
      featured_prompt_ids: Array.isArray(data?.featured_prompt_ids) ? data.featured_prompt_ids : [],
      trending_prompt_ids: Array.isArray(data?.trending_prompt_ids) ? data.trending_prompt_ids : []
    } satisfies SiteSettings;
  }, {
    id: 1,
    website_name: "PromptVault",
    logo_text: "PromptVault",
    hero_headline: "Discover and share powerful image prompts",
    hero_subheadline: "Browse approved creator prompts from the live vault.",
    footer_text: "Copyright 2026 PromptVault. All rights reserved.",
    admin_email: "",
    cta_text: "Start exploring prompts",
    empty_state_title: "No prompts yet",
    empty_state_message: "Approved prompts will appear here.",
    featured_prompt_ids: [],
    trending_prompt_ids: []
  });
}

export async function getAdminPrompts(status?: string, userId?: string) {
  const { supabase } = await requireAdmin("/admin/prompts");
  const activeStatus = sanitizePromptFilter(status);

  const countQueries = [
    supabase.from("prompts").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("prompts").select("id", { count: "exact", head: true }).eq("status", "pending").is("deleted_at", null),
    supabase.from("prompts").select("id", { count: "exact", head: true }).eq("status", "approved").is("deleted_at", null),
    supabase.from("prompts").select("id", { count: "exact", head: true }).eq("status", "rejected").is("deleted_at", null),
    supabase.from("prompts").select("id", { count: "exact", head: true }).eq("featured", true).is("deleted_at", null),
    supabase.from("prompts").select("id", { count: "exact", head: true }).not("deleted_at", "is", null),
  ];
  const [allC, pendingC, approvedC, rejectedC, featuredC, deletedC] = await Promise.all(countQueries);
  const counts: AdminPromptCounts = {
    all: allC.count ?? 0,
    pending: pendingC.count ?? 0,
    approved: approvedC.count ?? 0,
    rejected: rejectedC.count ?? 0,
    featured: featuredC.count ?? 0,
    deleted: deletedC.count ?? 0,
  };

  let query = supabase.from("prompts").select(promptSelect).order("created_at", { ascending: false });

  if (activeStatus === "featured") query = query.eq("featured", true).is("deleted_at", null);
  else if (activeStatus === "deleted") query = query.not("deleted_at", "is", null);
  else if (activeStatus !== "all") query = query.eq("status", activeStatus).is("deleted_at", null);

  if (activeStatus === "all") query = query.is("deleted_at", null).neq("status", "rejected");
  if (userId) query = query.eq("user_id", userId);

  const { data, error } = await query;
  if (error) {
    return {
      prompts: [] as AdminPrompt[],
      error: error.message,
      activeStatus,
      counts,
      diagnostics: {
        renderedCount: 0,
        pendingCount: counts.pending,
        usingServiceRole: true,
        serviceWarning: null
      }
    };
  }

  const rows = (data ?? []) as PromptRow[];
  const userIds = Array.from(new Set(rows.map((prompt) => prompt.user_id).filter(Boolean)));
  const profilesById = await profilesByIds(supabase, userIds);
  const prompts = rows.map((prompt) => normalizePrompt(prompt, profilesById.get(prompt.user_id) ?? null));

  return {
    prompts,
    error: null,
    activeStatus,
    counts,
    diagnostics: {
      renderedCount: prompts.length,
      pendingCount: counts.pending,
      usingServiceRole: true,
      serviceWarning: null
    }
  };
}

export async function getAdminPromptById(id: string) {
  const { supabase } = await requireAdmin(`/admin/prompts/${id}/edit`);
  const { data, error } = await supabase.from("prompts").select(promptSelect).eq("id", id).maybeSingle();

  if (error || !data) return null;
  const row = data as PromptRow;
  const profiles = await profilesByIds(supabase, [row.user_id]);
  return normalizePrompt(row, profiles.get(row.user_id) ?? null);
}

export async function getAdminUsers() {
  const { supabase } = await requireAdmin("/admin/users");
  const usersResult = await supabase.from("profiles").select(profileSelect).order("created_at", { ascending: false });
  let data: unknown[] | null = usersResult.data;
  let error = usersResult.error;

  if (error) {
    const fallback = await supabase.from("profiles").select(fallbackProfileSelect).order("created_at", { ascending: false });
    data = fallback.data as unknown[] | null;
    error = fallback.error;
  }

  if (error) return { users: [] as Profile[], error: error.message };

  const userIds = ((data ?? []) as Profile[]).map((user) => user.id);
  const copyTotals = await creatorCopyTotals(supabase, userIds);

  return {
    users: ((data ?? []) as Profile[]).map((user) => ({
      ...normalizeProfile(user),
      copy_total: copyTotals.get(user.id)?.copy_total ?? 0,
      prompt_count: copyTotals.get(user.id)?.prompt_count ?? 0
    })),
    error: null
  };
}

async function creatorCopyTotals(supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"], userIds: string[]) {
  return withRetry("creatorCopyTotals", async () => {
    const totals = new Map<string, { copy_total: number; prompt_count: number }>();
    if (!userIds.length) return totals;

    const { data } = await supabase.from("prompts").select("user_id,copy_count,deleted_at").in("user_id", userIds);
    for (const row of (data ?? []) as Array<{ user_id: string; copy_count: number | null; deleted_at?: string | null }>) {
      if (row.deleted_at) continue;
      const current = totals.get(row.user_id) ?? { copy_total: 0, prompt_count: 0 };
      current.copy_total += Number(row.copy_count) || 0;
      current.prompt_count += 1;
      totals.set(row.user_id, current);
    }

    return totals;
  }, new Map<string, { copy_total: number; prompt_count: number }>());
}

async function profilesByIds(supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"], userIds: string[]) {
  return withRetry("profilesByIds", async () => {
    const profilesById = new Map<string, Profile>();
    if (!userIds.length) return profilesById;

    const profileResult = await supabase.from("profiles").select(profileSelect).in("id", userIds);
    let profiles: unknown[] | null = profileResult.data;

    if (profileResult.error) {
      const fallback = await supabase.from("profiles").select(fallbackProfileSelect).in("id", userIds);
      profiles = fallback.data as unknown[] | null;
    }

    for (const profile of (profiles ?? []) as Profile[]) profilesById.set(profile.id, normalizeProfile(profile));
    return profilesById;
  }, new Map<string, Profile>());
}

function normalizePackStatus(value?: string | null): PackStatus {
  if (value === "approved" || value === "rejected") return value;
  return "pending";
}

function normalizePaymentStatus(value?: string | null): PaymentStatus {
  if (value === "approved" || value === "rejected" || value === "submitted" || value === "access_sent") return value as PaymentStatus;
  return "pending";
}

export async function getAdminCategories() {
  const { supabase } = await requireAdmin("/admin/categories");
  const { data, error } = await supabase
    .from("categories")
    .select("id,name,slug,description,sort_order,is_active")
    .order("sort_order")
    .order("name");

  if (isMissingTableError(error?.message)) return { categories: [] as Category[], error: null };
  if (error) return { categories: [] as Category[], error: error.message };
  return { categories: (data ?? []) as Category[], error: null };
}

export async function getAdminTags() {
  const { supabase } = await requireAdmin("/admin/tags");
  const { data, error } = await supabase.from("tags").select("id,name,slug,description,is_active,created_at,updated_at").order("name");

  if (isMissingTableError(error?.message)) return { tags: [] as TagRecord[], error: null };
  if (error) return { tags: [] as TagRecord[], error: error.message };
  return { tags: (data ?? []) as TagRecord[], error: null };
}

export async function getAdminLogs() {
  const { supabase } = await requireAdmin("/admin/logs");
  const { data, error } = await supabase
    .from("admin_logs")
    .select("id,admin_user_id,action_type,target_table,target_id,old_value,new_value,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (isMissingTableError(error?.message)) return { logs: [] as AdminLog[], error: null };
  if (error) return { logs: [] as AdminLog[], error: error.message };

  const rows = (data ?? []) as AdminLog[];
  const profiles = await profilesByIds(supabase, rows.map((row) => row.admin_user_id).filter((id): id is string => Boolean(id)));

  return {
    logs: rows.map((row) => ({ ...row, admin_email: row.admin_user_id ? profiles.get(row.admin_user_id)?.email ?? null : null })),
    error: null
  };
}

export async function getAdminPacks(status?: string) {
  const { supabase } = await requireAdmin("/admin/packs");
  const activeStatus = sanitizeModerationStatus(status);
  let query = supabase
    .from("prompt_packs")
    .select("id,creator_id,creator_name,title,description,cover_image,price,is_paid,status,rejection_reason,total_prompts,created_at,updated_at")
    .order("created_at", { ascending: false });

  if (activeStatus !== "all") query = query.eq("status", activeStatus);

  const { data, error } = await query;
  if (isMissingTableError(error?.message)) return { packs: [] as AdminPack[], error: null, activeStatus };
  if (error) return { packs: [] as AdminPack[], error: error.message, activeStatus };

  const rows = (data ?? []) as PackRow[];
  const creatorIds = Array.from(new Set(rows.map((pack) => pack.creator_id).filter((id): id is string => Boolean(id))));
  const profiles = await profilesByIds(supabase, creatorIds);

  return {
    packs: rows.map((pack) => {
      const creator = pack.creator_id ? profiles.get(pack.creator_id) : null;
      return {
        ...pack,
        price: Number(pack.price) || 0,
        is_paid: Boolean(pack.is_paid),
        status: normalizePackStatus(pack.status),
        rejection_reason: pack.rejection_reason ?? null,
        creator_email: creator?.email ?? null,
        creator_name: pack.creator_name ?? creator?.full_name ?? creator?.display_name ?? null,
        creator_name_row: pack.creator_name ?? null,
        total_prompts: Number(pack.total_prompts) || 0
      };
    }),
    error: null,
    activeStatus
  };
}

export type AdminReport = {
  id: string;
  prompt_id: string;
  user_id: string;
  reason: string;
  status: string;
  created_at: string;
  prompt_title: string | null;
  prompt_hidden: boolean;
  reporter_email: string | null;
};

export async function getAdminReports(status?: string) {
  const { supabase } = await requireAdmin("/admin/reports");
  const activeStatus = status === "open" || status === "resolved" || status === "dismissed" ? status : "all";
  let query = supabase
    .from("reports")
    .select("id,prompt_id,user_id,reason,status,created_at,prompts!inner(title),profiles!inner(email)")
    .order("created_at", { ascending: false });

  if (activeStatus !== "all") query = query.eq("status", activeStatus);

  const { data, error } = await query;
  if (error) return { reports: [] as AdminReport[], error: error.message, activeStatus };

  const rows = (data ?? []) as unknown as Array<Record<string, unknown>>;

  function pluck<T>(value: unknown, fallback: T): T { return (value ?? fallback) as T; }

  return {
    reports: rows.map((row) => {
      const prompts = pluck<Record<string, unknown> | null>(row.prompts, null);
      const profiles = pluck<Record<string, unknown> | null>(row.profiles, null);
      return {
        id: String(row.id ?? ""),
        prompt_id: String(row.prompt_id ?? ""),
        user_id: String(row.user_id ?? ""),
        reason: String(row.reason ?? ""),
        status: String(row.status ?? "open"),
        created_at: String(row.created_at ?? ""),
        prompt_title: prompts ? String(prompts.title ?? "") : null,
        prompt_hidden: false,
        reporter_email: profiles ? String(profiles.email ?? "") : null
      };
    }),
    error: null,
    activeStatus
  };
}

export async function getAdminPaymentRequests(status?: string) {
  const { supabase } = await requireAdmin("/admin/payments");
  const activeStatus = sanitizeModerationStatus(status);
  let query = supabase
    .from("payment_requests")
    .select("id,user_id,pack_id,order_id,user_email,amount,currency,whatsapp_proof_url,whatsapp_proof_status,screenshot_url,screenshot_status,access_link,access_sent_at,status,rejection_reason,created_at,updated_at")
    .order("created_at", { ascending: false });

  if (activeStatus !== "all") query = query.eq("status", activeStatus);

  const { data, error } = await query;
  if (error) return { requests: [] as AdminPaymentRequest[], error: error.message, activeStatus };

  const rows = (data ?? []) as PaymentRow[];
  const userIds = Array.from(new Set(rows.map((request) => request.user_id).filter(Boolean)));
  const packIds = Array.from(new Set(rows.map((request) => request.pack_id).filter(Boolean)));
  const profiles = await profilesByIds(supabase, userIds);
  const packNames = new Map<string, string>();

  if (packIds.length) {
    const { data: packs } = await supabase.from("prompt_packs").select("id,title").in("id", packIds);
    for (const pack of (packs ?? []) as Array<{ id: string; title: string }>) packNames.set(pack.id, pack.title);
  }

  return {
    requests: rows.map((request) => ({
      ...request,
      amount: Number(request.amount) || 0,
      currency: request.currency || "USD",
      status: normalizePaymentStatus(request.status),
      whatsapp_proof_status: request.whatsapp_proof_status ?? (request.whatsapp_proof_url ? "submitted" : "missing"),
      screenshot_status: request.screenshot_status ?? (request.screenshot_url ? "submitted" : "missing"),
      user_email: profiles.get(request.user_id)?.email ?? null,
      pack_name: packNames.get(request.pack_id) ?? null
    })),
    error: null,
    activeStatus
  };
}
