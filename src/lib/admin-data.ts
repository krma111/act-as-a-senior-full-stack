import { redirect } from "next/navigation";
import { getAuthSessionState } from "@/lib/auth/session";
import { hasSupabaseServiceRoleKey } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile, SiteSettings } from "@/lib/types";

export type AdminPromptStatus = "pending" | "approved" | "rejected";
export type AdminRole = "admin" | "creator" | "user";
export type PackStatus = "pending" | "approved" | "rejected";
export type PaymentStatus = "pending" | "approved" | "rejected";

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
  price: number | null;
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
  totalCreators: number;
  totalCopies: number;
  totalSaves: number;
  totalPaidPacks: number;
  totalPaymentRequests: number;
  totalApprovedSales: number;
};

type PromptRow = Omit<AdminPrompt, "creator_email" | "creator_name"> & { price?: number | null };
type AdminPromptRpcRow = Omit<AdminPrompt, "status" | "price"> & {
  status: string;
  price?: number | string | null;
};
type AdminPromptCounts = {
  all: number;
  pending: number;
  approved: number;
  rejected: number;
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
  amount: number;
  currency: string;
  whatsapp_proof_url: string | null;
  whatsapp_proof_status: string | null;
  status: PaymentStatus;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  user_email: string | null;
  pack_name: string | null;
};

type PackRow = {
  id: string;
  creator_id: string | null;
  creator_name: string | null;
  title: string;
  description: string | null;
  cover_image: string | null;
  price: number | null;
  is_paid: boolean | null;
  status: string | null;
  rejection_reason?: string | null;
  total_prompts: number | null;
  created_at: string;
  updated_at: string;
};
type PaymentRow = Omit<AdminPaymentRequest, "user_email" | "pack_name">;

const adminServiceError =
  "Admin database service is not configured. Add SUPABASE_SERVICE_ROLE_KEY in Vercel Production environment variables.";

const profileSelect =
  "id,email,full_name,display_name,avatar_url,role,manual_badge_override,manual_badge_type,manual_badge_assigned_by,manual_badge_assigned_at,created_at,updated_at";
const fallbackProfileSelect = "id,email,full_name,display_name,avatar_url,role,created_at,updated_at";

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

function sanitizeStatus(value?: string): AdminPromptStatus | "all" {
  if (value === "pending" || value === "approved" || value === "rejected") return value;
  return "all";
}

function normalizePromptStatus(value: string): AdminPromptStatus {
  if (value === "approved" || value === "rejected") return value;
  return "pending";
}

function emptyPromptCounts(): AdminPromptCounts {
  return { all: 0, pending: 0, approved: 0, rejected: 0 };
}

function countsFromRpcRows(rows: Array<{ status?: string | null; count?: number | string | null }>): AdminPromptCounts {
  const counts = emptyPromptCounts();

  for (const row of rows) {
    const status = normalizePromptStatus(row.status ?? "pending");
    const count = Number(row.count) || 0;
    counts[status] += count;
    counts.all += count;
  }

  return counts;
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

  return {
    supabase: hasSupabaseServiceRoleKey ? createAdminClient() : supabase,
    user,
    profile,
    adminDatabaseError: hasSupabaseServiceRoleKey ? null : adminServiceError
  } satisfies AdminContext;
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
    totalCreators,
    savedPrompts,
    promptCopies,
    paidPacks,
    paymentRequests,
    approvedSales
  ] = await Promise.all([
    supabase.from("prompts").select("id", { count: "exact", head: true }),
    supabase.from("prompts").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("prompts").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("prompts").select("id", { count: "exact", head: true }).eq("status", "rejected"),
    supabase.from("prompts").select("id", { count: "exact", head: true }).eq("featured", true),
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
    totalUsers: totalUsers.count ?? 0,
    totalCreators: totalCreators.count ?? 0,
    totalCopies: (promptCopies.data ?? []).reduce((total, row) => total + (Number(row.copy_count) || 0), 0),
    totalSaves: savedPrompts.count ?? 0,
    totalPaidPacks: paidPacks.error ? 0 : paidPacks.count ?? 0,
    totalPaymentRequests: paymentRequests.error ? 0 : paymentRequests.count ?? 0,
    totalApprovedSales: approvedSales.error ? 0 : approvedSales.count ?? 0
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
  const { supabase, adminDatabaseError } = await requireAdmin("/admin/prompts");
  const activeStatus = sanitizeStatus(status);

  if (adminDatabaseError) {
    const [countResult, promptResult] = await Promise.all([
      supabase.rpc("admin_prompt_counts"),
      supabase.rpc("admin_list_prompts", { filter_status: activeStatus === "all" ? null : activeStatus })
    ]);
    const counts = countsFromRpcRows((countResult.data ?? []) as Array<{ status?: string | null; count?: number | string | null }>);

    if (countResult.error || promptResult.error) {
      return {
        prompts: [] as AdminPrompt[],
        error: countResult.error?.message ?? promptResult.error?.message ?? "Admin prompt query failed.",
        activeStatus,
        counts,
        diagnostics: {
          renderedCount: 0,
          pendingCount: counts.pending,
          usingServiceRole: false,
          serviceWarning: "Admin session query failed. Check Supabase admin RPC migration."
        }
      };
    }

    const rows = (promptResult.data ?? []) as AdminPromptRpcRow[];
    const prompts = rows.map((prompt) => ({
      ...prompt,
      status: normalizePromptStatus(prompt.status),
      tags: Array.isArray(prompt.tags) ? prompt.tags : [],
      price: Number(prompt.price) || 0,
      creator_email: prompt.creator_email ?? null,
      creator_name: prompt.creator_name ?? null
    }));

    return {
      prompts,
      error: null,
      activeStatus,
      counts,
      diagnostics: {
        renderedCount: prompts.length,
        pendingCount: counts.pending,
        usingServiceRole: false,
        serviceWarning: null
      }
    };
  }

  const [allCount, pendingCount, approvedCount, rejectedCount] = await Promise.all([
    supabase.from("prompts").select("id", { count: "exact", head: true }),
    supabase.from("prompts").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("prompts").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("prompts").select("id", { count: "exact", head: true }).eq("status", "rejected")
  ]);
  const counts = {
    all: allCount.count ?? 0,
    pending: pendingCount.count ?? 0,
    approved: approvedCount.count ?? 0,
    rejected: rejectedCount.count ?? 0
  };

  let query = supabase
    .from("prompts")
    .select(
      "id,user_id,title,description,prompt_text,negative_prompt,image_url,category,tags,ai_model,aspect_ratio,reference_required,status,rejection_reason,copy_count,view_count,price,featured,created_at,updated_at"
    )
    .order("created_at", { ascending: false });

  if (activeStatus !== "all") query = query.eq("status", activeStatus);

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
  const profilesById = new Map<string, Profile>();

  if (userIds.length) {
    const profileResult = await supabase
      .from("profiles")
      .select(profileSelect)
      .in("id", userIds);
    let profiles: unknown[] | null = profileResult.data;

    if (profileResult.error) {
      const fallback = await supabase.from("profiles").select(fallbackProfileSelect).in("id", userIds);
      profiles = fallback.data as unknown[] | null;
    }

    for (const profile of (profiles ?? []) as Profile[]) {
      profilesById.set(profile.id, profile);
    }
  }

  const prompts = rows.map((prompt) => {
      const creator = profilesById.get(prompt.user_id);
      return {
        ...prompt,
        tags: Array.isArray(prompt.tags) ? prompt.tags : [],
        creator_email: creator?.email ?? null,
        creator_name: creator?.full_name ?? creator?.display_name ?? null
      };
    });

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
  const { data, error } = await supabase
    .from("prompts")
    .select(
      "id,user_id,title,description,prompt_text,negative_prompt,image_url,category,tags,ai_model,aspect_ratio,reference_required,status,rejection_reason,copy_count,view_count,price,featured,created_at,updated_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return { ...(data as PromptRow), tags: Array.isArray(data.tags) ? data.tags : [] } as PromptRow;
}

export async function getAdminUsers() {
  const { supabase } = await requireAdmin("/admin/users");
  const usersResult = await supabase
    .from("profiles")
    .select(profileSelect)
    .order("created_at", { ascending: false });
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
      ...user,
      role: normalizeRole(user.role),
      copy_total: copyTotals.get(user.id)?.copy_total ?? 0,
      prompt_count: copyTotals.get(user.id)?.prompt_count ?? 0
    })),
    error: null
  };
}

async function creatorCopyTotals(supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"], userIds: string[]) {
  const totals = new Map<string, { copy_total: number; prompt_count: number }>();
  if (!userIds.length) return totals;

  const { data } = await supabase.from("prompts").select("user_id,copy_count").in("user_id", userIds).eq("status", "approved");
  for (const row of (data ?? []) as Array<{ user_id: string; copy_count: number | null }>) {
    const current = totals.get(row.user_id) ?? { copy_total: 0, prompt_count: 0 };
    current.copy_total += Number(row.copy_count) || 0;
    current.prompt_count += 1;
    totals.set(row.user_id, current);
  }

  return totals;
}


async function profilesByIds(supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"], userIds: string[]) {
  const profilesById = new Map<string, Profile>();
  if (!userIds.length) return profilesById;

  const profileResult = await supabase
    .from("profiles")
    .select(profileSelect)
    .in("id", userIds);
  let profiles: unknown[] | null = profileResult.data;
  const error = profileResult.error;

  if (error) {
    const fallback = await supabase.from("profiles").select(fallbackProfileSelect).in("id", userIds);
    profiles = fallback.data as unknown[] | null;
  }

  for (const profile of (profiles ?? []) as Profile[]) profilesById.set(profile.id, profile);
  return profilesById;
}

function normalizePackStatus(value?: string | null): PackStatus {
  if (value === "approved" || value === "rejected") return value;
  return "pending";
}

function normalizePaymentStatus(value?: string | null): PaymentStatus {
  if (value === "approved" || value === "rejected") return value;
  return "pending";
}

export async function getAdminPacks(status?: string) {
  const { supabase } = await requireAdmin("/admin/packs");
  const activeStatus = sanitizeStatus(status);
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

export async function getAdminPaymentRequests(status?: string) {
  const { supabase } = await requireAdmin("/admin/payments");
  const activeStatus = sanitizeStatus(status);
  let query = supabase
    .from("payment_requests")
    .select("id,user_id,pack_id,amount,currency,whatsapp_proof_url,whatsapp_proof_status,status,rejection_reason,created_at,updated_at")
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
      user_email: profiles.get(request.user_id)?.email ?? null,
      pack_name: packNames.get(request.pack_id) ?? null
    })),
    error: null,
    activeStatus
  };
}
