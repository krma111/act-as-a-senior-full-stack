import "server-only";
import { createClient } from "@/backend/database/server";
import { createAdminClient } from "@/backend/database/admin";

export type UserPurchase = {
  id: string;
  order_id: string | null;
  pack_id: string;
  pack_name: string | null;
  amount: number;
  currency: string;
  screenshot_url: string | null;
  screenshot_status: string | null;
  status: string;
  access_link: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type PackListing = {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  price: number;
  total_prompts: number | null;
  creator_name: string | null;
};

export async function getApprovedPacks(): Promise<PackListing[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("prompt_packs")
    .select("id,title,description,cover_image,price,total_prompts,creator_name")
    .eq("status", "approved")
    .gt("price", 0)
    .order("created_at", { ascending: false });

  return ((data ?? []) as PackListing[]).map((pack) => ({
    ...pack,
    price: Number(pack.price) || 0,
    total_prompts: pack.total_prompts ?? 0
  }));
}

export async function getPackById(packId: string): Promise<PackListing | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("prompt_packs")
    .select("id,title,description,cover_image,price,total_prompts,creator_name")
    .eq("id", packId)
    .eq("status", "approved")
    .maybeSingle();

  if (!data) return null;
  return {
    ...data as PackListing,
    price: Number((data as PackListing).price) || 0,
    total_prompts: (data as PackListing).total_prompts ?? 0
  };
}

export async function getUserPurchases(userId: string): Promise<UserPurchase[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payment_requests")
    .select("id,order_id,pack_id,amount,currency,screenshot_url,screenshot_status,status,access_link,rejection_reason,created_at,updated_at")
    .eq("user_id", userId)
    .in("status", ["submitted", "approved", "access_sent", "rejected"])
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as UserPurchase[];
  const packIds = Array.from(new Set(rows.map((r) => r.pack_id).filter(Boolean)));
  const packNames = new Map<string, string>();

  if (packIds.length) {
    const admin = createAdminClient();
    const { data: packs } = await admin.from("prompt_packs").select("id,title").in("id", packIds);
    for (const pack of (packs ?? []) as Array<{ id: string; title: string }>) {
      packNames.set(pack.id, pack.title);
    }
  }

  return rows.map((r) => ({
    ...r,
    amount: Number(r.amount) || 0,
    pack_name: packNames.get(r.pack_id) ?? null
  }));
}

export async function getPaymentRequestByOrderId(orderId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("payment_requests")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();
  return data ?? null;
}

export async function getProfileEmail(userId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle();
  return (data as { email: string | null } | null)?.email ?? null;
}
