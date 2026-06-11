import "server-only";

import { unstable_noStore as noStore } from "next/cache";
import { hasSupabaseEnv, hasSupabaseServiceRoleKey } from "@/backend/env";
import { createAdminClient } from "@/backend/database/admin";
import { createPublicClient } from "@/backend/database/public";
import { getErrorMessage, withTimeout } from "@/backend/utils/timeout";

export const promptPackCategories = [
  "Full App Build Prompts",
  "SaaS Startup Prompts",
  "Bug Fix Prompts",
  "Supabase Prompts",
  "Admin Dashboard Prompts",
  "UI/UX Upgrade Prompts",
  "Vercel Deployment Prompts",
  "Authentication Prompts",
  "SEO Prompts",
  "AI Agent Prompts",
  "Landing Page Prompts",
  "Database Schema Prompts"
];

export const supportedTools = ["Codex", "Cursor", "Lovable", "Replit", "Bolt", "Claude", "ChatGPT"];

export type MvpSiteSettings = {
  id: number;
  admin_email: string;
  upi_id: string;
  qr_code_url: string | null;
  homepage_title: string;
  homepage_subtitle: string;
  categories: string[];
  website_name: string;
  logo_text: string;
  footer_text: string;
};

export type PublicPromptPack = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string;
  price: number;
  is_free: boolean;
  is_paid: boolean;
  tools_supported: string[];
  tech_stack: string[];
  what_user_gets: string | null;
  preview_content: string[];
  status: string;
  cover_image: string | null;
  total_prompts: number;
  created_at: string;
  updated_at: string;
};

export type AdminPromptPack = PublicPromptPack & {
  full_content: string;
  sort_order: number;
};

export type MvpOrderStatus = "pending_payment" | "paid" | "delivered" | "cancelled";

export type MvpOrder = {
  id: string;
  buyer_email: string;
  prompt_pack_id: string | null;
  prompt_pack_title: string;
  price: number;
  status: MvpOrderStatus;
  created_at: string;
  updated_at: string;
  delivered_at: string | null;
  pack_full_content?: string | null;
};

export type MvpAdminStats = {
  totalPacks: number;
  freePacks: number;
  paidPacks: number;
  totalOrders: number;
  pendingOrders: number;
  paidOrders: number;
  deliveredOrders: number;
  revenue: number;
};

const defaultSettings: MvpSiteSettings = {
  id: 1,
  admin_email: "cdubey159@gmail.com",
  upi_id: "promptvault@upi",
  qr_code_url: null,
  homepage_title: "Copy-ready coding prompts for vibe coders.",
  homepage_subtitle:
    "Build apps, fix bugs, create dashboards, connect Supabase, improve UI, and deploy faster using powerful AI coding prompt packs.",
  categories: promptPackCategories,
  website_name: "PromptVault",
  logo_text: "PromptVault",
  footer_text: "Copyright 2026 PromptVault. All rights reserved."
};

type MvpSupabaseClient = {
  from: (table: string) => any;
};

function getPublicDatabase(): MvpSupabaseClient | null {
  if (!hasSupabaseEnv) return null;
  return createPublicClient() as unknown as MvpSupabaseClient;
}

function getAdminDatabase(): MvpSupabaseClient | null {
  if (!hasSupabaseEnv || !hasSupabaseServiceRoleKey()) return null;
  return createAdminClient() as unknown as MvpSupabaseClient;
}

function cleanArray(value: unknown, fallback: string[] = []) {
  return Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : fallback;
}

function normalizePack(row: Record<string, unknown>): PublicPromptPack {
  const price = Number(row.price) || 0;
  const isFree = typeof row.is_free === "boolean" ? row.is_free : price <= 0;

  return {
    id: String(row.id),
    title: String(row.title ?? "Untitled prompt pack"),
    slug: String(row.slug ?? row.id),
    description: typeof row.description === "string" ? row.description : null,
    category: String(row.category ?? "Full App Build Prompts"),
    price,
    is_free: isFree,
    is_paid: typeof row.is_paid === "boolean" ? row.is_paid : !isFree,
    tools_supported: cleanArray(row.tools_supported, supportedTools),
    tech_stack: cleanArray(row.tech_stack),
    what_user_gets: typeof row.what_user_gets === "string" ? row.what_user_gets : null,
    preview_content: cleanArray(row.preview_content),
    status: String(row.status ?? "pending"),
    cover_image: typeof row.cover_image === "string" && row.cover_image.trim() ? row.cover_image : null,
    total_prompts: Number(row.total_prompts) || cleanArray(row.preview_content).length,
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? new Date().toISOString())
  };
}

function normalizeAdminPack(row: Record<string, unknown>): AdminPromptPack {
  return {
    ...normalizePack(row),
    full_content: typeof row.full_content === "string" ? row.full_content : "",
    sort_order: Number(row.sort_order) || 0
  };
}

export async function getMvpSiteSettings(): Promise<MvpSiteSettings> {
  const supabase = getPublicDatabase();
  if (!supabase) return defaultSettings;

  try {
    const { data, error } = await withTimeout(
      supabase.from("site_settings").select("*").eq("id", 1).maybeSingle(),
      4500,
      "site settings query"
    );
    if (error || !data) return defaultSettings;

    return {
      ...defaultSettings,
      admin_email: data.admin_email ?? defaultSettings.admin_email,
      upi_id: data.upi_id ?? defaultSettings.upi_id,
      qr_code_url: data.qr_code_url ?? null,
      homepage_title: data.homepage_title ?? data.hero_headline ?? defaultSettings.homepage_title,
      homepage_subtitle: data.homepage_subtitle ?? data.hero_subheadline ?? defaultSettings.homepage_subtitle,
      categories: cleanArray(data.categories, defaultSettings.categories),
      website_name: data.website_name ?? defaultSettings.website_name,
      logo_text: data.logo_text ?? defaultSettings.logo_text,
      footer_text: data.footer_text ?? defaultSettings.footer_text
    };
  } catch (error) {
    console.error("[mvp-data] Failed to load site settings", error);
    return defaultSettings;
  }
}

export async function getPublicPromptPacks(options?: { category?: string; search?: string; free?: "free" | "paid"; limit?: number }): Promise<PublicPromptPack[]> {
  const supabase = getPublicDatabase();
  if (!supabase) return [] as PublicPromptPack[];

  try {
    let query = supabase
      .from("prompt_packs")
      .select("id,title,slug,description,category,price,is_free,is_paid,tools_supported,tech_stack,what_user_gets,preview_content,status,cover_image,total_prompts,created_at,updated_at")
      .eq("status", "approved")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (options?.category) query = query.eq("category", options.category);
    if (options?.free === "free") query = query.eq("is_free", true);
    if (options?.free === "paid") query = query.eq("is_free", false);

    const { data, error } = await withTimeout(query.limit(options?.limit ?? 100), 6000, "public prompt packs query");
    if (error) {
      console.error("[mvp-data] Failed to load prompt packs", error);
      return [];
    }

    const search = options?.search?.trim().toLowerCase();
    const rows = (data ?? []) as Record<string, unknown>[];
    const packs = rows.map((row) => normalizePack(row));
    if (!search) return packs;

    return packs.filter((pack) =>
      [pack.title, pack.description, pack.category, pack.tools_supported.join(" "), pack.tech_stack.join(" ")]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search)
    );
  } catch (error) {
    console.error("[mvp-data] Failed to load prompt packs", error);
    return [];
  }
}

export async function getPublicPromptPack(slug: string): Promise<PublicPromptPack | null> {
  const supabase = getPublicDatabase();
  if (!supabase) return null;

  try {
    const { data, error } = await withTimeout(
      supabase
        .from("prompt_packs")
        .select("id,title,slug,description,category,price,is_free,is_paid,tools_supported,tech_stack,what_user_gets,preview_content,status,cover_image,total_prompts,created_at,updated_at")
        .eq("slug", slug)
        .eq("status", "approved")
        .maybeSingle(),
      5000,
      "public prompt pack detail query"
    );

    if (error || !data) return null;
    return normalizePack(data as Record<string, unknown>);
  } catch (error) {
    console.error("[mvp-data] Failed to load prompt pack", error);
    return null;
  }
}

export async function getAdminPromptPacks(filter?: string): Promise<{ packs: AdminPromptPack[]; error: string | null }> {
  noStore();
  const supabase = getAdminDatabase();
  if (!supabase) return { packs: [] as AdminPromptPack[], error: "Admin database service is not configured." };

  try {
    let query = supabase
      .from("prompt_packs")
      .select("id,title,slug,description,category,price,is_free,is_paid,tools_supported,tech_stack,what_user_gets,preview_content,full_content,status,cover_image,total_prompts,sort_order,created_at,updated_at")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (filter && filter !== "all") query = query.eq("status", filter);

    const { data, error } = await withTimeout(query, 7000, "admin prompt packs query");
    if (error) return { packs: [] as AdminPromptPack[], error: error.message };
    const rows = (data ?? []) as Record<string, unknown>[];
    return { packs: rows.map((row) => normalizeAdminPack(row)), error: null };
  } catch (error) {
    const message = getErrorMessage(error, "Failed to load prompt packs.");
    console.error("[mvp-data] Admin packs failed", error);
    return { packs: [] as AdminPromptPack[], error: message };
  }
}

export async function getAdminOrders(filter?: string): Promise<{ orders: MvpOrder[]; error: string | null }> {
  noStore();
  const supabase = getAdminDatabase();
  if (!supabase) return { orders: [] as MvpOrder[], error: "Admin database service is not configured." };

  try {
    let query = supabase
      .from("orders")
      .select("id,buyer_email,prompt_pack_id,prompt_pack_title,price,status,created_at,updated_at,delivered_at")
      .order("created_at", { ascending: false });

    if (filter && filter !== "all") query = query.eq("status", filter);

    const { data, error } = await withTimeout(query, 7000, "admin orders query");
    if (error) return { orders: [] as MvpOrder[], error: error.message };

    const orderRowsRaw = (data ?? []) as Record<string, unknown>[];
    const orders: MvpOrder[] = orderRowsRaw.map((row) => ({
      id: String(row.id),
      buyer_email: String(row.buyer_email),
      prompt_pack_id: row.prompt_pack_id ? String(row.prompt_pack_id) : null,
      prompt_pack_title: String(row.prompt_pack_title),
      price: Number(row.price) || 0,
      status: String(row.status ?? "pending_payment") as MvpOrderStatus,
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
      delivered_at: row.delivered_at ? String(row.delivered_at) : null
    }));

    const packIds = Array.from(new Set(orders.map((order) => order.prompt_pack_id).filter((id): id is string => Boolean(id))));
    const contentByPack = new Map<string, string>();
    if (packIds.length) {
      const { data: packs } = await withTimeout(
        supabase.from("prompt_packs").select("id,full_content").in("id", packIds),
        5000,
        "admin order pack content query"
      );
      for (const pack of ((packs ?? []) as Record<string, unknown>[])) {
        contentByPack.set(String(pack.id), typeof pack.full_content === "string" ? pack.full_content : "");
      }
    }

    return {
      orders: orders.map((order) => ({ ...order, pack_full_content: order.prompt_pack_id ? contentByPack.get(order.prompt_pack_id) ?? null : null })),
      error: null
    };
  } catch (error) {
    const message = getErrorMessage(error, "Failed to load orders.");
    console.error("[mvp-data] Admin orders failed", error);
    return { orders: [] as MvpOrder[], error: message };
  }
}

export async function getMvpAdminStats(): Promise<MvpAdminStats> {
  noStore();
  const supabase = getAdminDatabase();
  if (!supabase) {
    return {
      totalPacks: 0,
      freePacks: 0,
      paidPacks: 0,
      totalOrders: 0,
      pendingOrders: 0,
      paidOrders: 0,
      deliveredOrders: 0,
      revenue: 0
    };
  }

  try {
    const [packs, orders] = await withTimeout(
      Promise.all([
        supabase.from("prompt_packs").select("id,is_free,price,status"),
        supabase.from("orders").select("id,status,price")
      ]),
      7000,
      "admin stats queries"
    );
    const packRows = (packs.data ?? []) as Array<{ is_free?: boolean; price?: number | string; status?: string }>;
    const orderRows = (orders.data ?? []) as Array<{ status?: string; price?: number | string }>;

    return {
      totalPacks: packRows.length,
      freePacks: packRows.filter((pack) => pack.is_free).length,
      paidPacks: packRows.filter((pack) => !pack.is_free).length,
      totalOrders: orderRows.length,
      pendingOrders: orderRows.filter((order) => order.status === "pending_payment").length,
      paidOrders: orderRows.filter((order) => order.status === "paid").length,
      deliveredOrders: orderRows.filter((order) => order.status === "delivered").length,
      revenue: orderRows
        .filter((order) => order.status === "paid" || order.status === "delivered")
        .reduce((sum: number, order) => sum + (Number(order.price) || 0), 0)
    };
  } catch (error) {
    console.error("[mvp-data] Admin stats failed", error);
    return {
      totalPacks: 0,
      freePacks: 0,
      paidPacks: 0,
      totalOrders: 0,
      pendingOrders: 0,
      paidOrders: 0,
      deliveredOrders: 0,
      revenue: 0
    };
  }
}

export async function getAdminFullPackContent(packId: string) {
  const supabase = getAdminDatabase();
  if (!supabase) return null;
  try {
    const { data, error } = await withTimeout(
      supabase.from("prompt_packs").select("full_content").eq("id", packId).maybeSingle(),
      5000,
      "admin full pack content query"
    );
    if (error || !data) return null;
    return typeof data.full_content === "string" ? data.full_content : null;
  } catch (error) {
    console.error("[mvp-data] Admin full pack content failed", error);
    return null;
  }
}
