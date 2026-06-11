"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hasSupabaseEnv, hasSupabaseServiceRoleKey } from "@/backend/env";
import { sendPromptPackDeliveryEmail } from "@/backend/email/send";
import { requireAdmin } from "@/backend/data/admin";
import { createAdminClient } from "@/backend/database/admin";
import { slugify } from "@/shared/constants/slugs";
import { promptPackCategories, supportedTools } from "@/backend/mvp-data";

const emailPattern = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const orderStatuses = new Set(["pending_payment", "paid", "delivered", "cancelled"]);
const packStatuses = new Set(["pending", "approved", "rejected"]);

type MvpSupabaseClient = {
  from: (table: string) => any;
};

type CreateOrderInput = {
  packId: string;
  buyerEmail: string;
};

function asString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function asNumber(value: string, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function csv(value: string, fallback: string[] = []) {
  const parts = value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
  return parts.length ? Array.from(new Set(parts)).slice(0, 12) : fallback;
}

function lines(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function redirectWithMessage(path: string, type: "message" | "error", message: string): never {
  redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}

function adminDb(): MvpSupabaseClient | null {
  if (!hasSupabaseEnv || !hasSupabaseServiceRoleKey()) return null;
  return createAdminClient() as unknown as MvpSupabaseClient;
}

export async function createOrderAction(input: CreateOrderInput) {
  const buyerEmail = input.buyerEmail.trim().toLowerCase();
  if (!emailPattern.test(buyerEmail)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const supabase = adminDb();
  if (!supabase) {
    return { ok: false, error: "Order service is not configured. Add SUPABASE_SERVICE_ROLE_KEY on the server." };
  }

  try {
    const { data: pack, error: packError } = await supabase
      .from("prompt_packs")
      .select("id,title,price,status,is_free")
      .eq("id", input.packId)
      .maybeSingle();

    if (packError || !pack || pack.status !== "approved") {
      return { ok: false, error: "This prompt pack is not available right now." };
    }

    if (pack.is_free || Number(pack.price) <= 0) {
      return { ok: false, error: "This is a free pack. Use the copy buttons instead." };
    }

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        buyer_email: buyerEmail,
        prompt_pack_id: pack.id,
        prompt_pack_title: pack.title,
        price: Number(pack.price) || 0,
        status: "pending_payment"
      })
      .select("id")
      .single();

    if (error || !order) {
      return { ok: false, error: error?.message ?? "Unable to create order." };
    }

    revalidatePath("/admin");
    revalidatePath("/admin/payments");

    return { ok: true, orderId: order.id as string, error: null };
  } catch (error) {
    console.error("[mvp-actions] createOrderAction failed", error);
    return { ok: false, error: "Unable to create order. Please try again." };
  }
}

export async function upsertMvpPack(formData: FormData) {
  const { supabase: rawSupabase } = await requireAdmin("/admin/packs");
  const supabase = rawSupabase as unknown as MvpSupabaseClient;
  const id = asString(formData, "id");
  const title = asString(formData, "title");
  const description = asString(formData, "description");
  const category = asString(formData, "category") || promptPackCategories[0];
  const price = Math.max(0, asNumber(asString(formData, "price"), 0));
  const isFree = formData.get("is_free") === "on" || price <= 0;
  const status = packStatuses.has(asString(formData, "status")) ? asString(formData, "status") : "pending";
  const slug = slugify(asString(formData, "slug") || title);
  const previewContent = lines(asString(formData, "preview_content"));
  const fullContent = asString(formData, "full_content");

  if (title.length < 3) redirectWithMessage("/admin/packs", "error", "Pack title is required.");
  if (!slug) redirectWithMessage("/admin/packs", "error", "Pack slug is required.");
  if (!category) redirectWithMessage("/admin/packs", "error", "Pack category is required.");
  if (!isFree && price <= 0) redirectWithMessage("/admin/packs", "error", "Paid packs need a price.");
  if (!isFree && fullContent.length < 20) redirectWithMessage("/admin/packs", "error", "Paid packs need full prompt content.");

  const payload = {
    title,
    slug,
    description: description || null,
    category,
    price: isFree ? 0 : price,
    is_free: isFree,
    is_paid: !isFree,
    tools_supported: csv(asString(formData, "tools_supported"), supportedTools),
    tech_stack: csv(asString(formData, "tech_stack")),
    what_user_gets: asString(formData, "what_user_gets") || null,
    preview_content: previewContent,
    full_content: fullContent,
    status,
    cover_image: asString(formData, "cover_image") || null,
    total_prompts: Math.max(previewContent.length, asNumber(asString(formData, "total_prompts"), previewContent.length)),
    sort_order: asNumber(asString(formData, "sort_order"), 0),
    updated_at: new Date().toISOString()
  };

  const result = id
    ? await supabase.from("prompt_packs").update(payload).eq("id", id).select("id").maybeSingle()
    : await supabase.from("prompt_packs").insert(payload).select("id").maybeSingle();

  if (result.error) redirectWithMessage("/admin/packs", "error", result.error.message);

  revalidatePath("/");
  revalidatePath("/packs");
  revalidatePath(`/packs/${slug}`);
  revalidatePath("/admin");
  revalidatePath("/admin/packs");
  redirectWithMessage("/admin/packs", "message", id ? "Prompt pack updated." : "Prompt pack created.");
}

export async function deleteMvpPack(formData: FormData) {
  const { supabase: rawSupabase } = await requireAdmin("/admin/packs");
  const supabase = rawSupabase as unknown as MvpSupabaseClient;
  const id = asString(formData, "id");
  if (!id) redirectWithMessage("/admin/packs", "error", "Pack ID is missing.");

  const { error } = await supabase.from("prompt_packs").delete().eq("id", id);
  if (error) redirectWithMessage("/admin/packs", "error", error.message);

  revalidatePath("/");
  revalidatePath("/packs");
  revalidatePath("/admin");
  revalidatePath("/admin/packs");
  redirectWithMessage("/admin/packs", "message", "Prompt pack deleted.");
}

export async function updateMvpOrderStatus(formData: FormData) {
  const { supabase: rawSupabase } = await requireAdmin("/admin/payments");
  const supabase = rawSupabase as unknown as MvpSupabaseClient;
  const id = asString(formData, "id");
  const status = asString(formData, "status");

  if (!id) redirectWithMessage("/admin/payments", "error", "Order ID is missing.");
  if (!orderStatuses.has(status)) redirectWithMessage("/admin/payments", "error", "Invalid order status.");

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id,buyer_email,prompt_pack_id,prompt_pack_title,status")
    .eq("id", id)
    .maybeSingle();

  if (orderError || !order) redirectWithMessage("/admin/payments", "error", orderError?.message ?? "Order not found.");

  const payload = {
    status,
    delivered_at: status === "delivered" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase.from("orders").update(payload).eq("id", id);
  if (error) redirectWithMessage("/admin/payments", "error", error.message);

  let message = `Order marked ${status.replace("_", " ")}.`;
  if (status === "delivered" && order.prompt_pack_id) {
    const { data: pack } = await supabase.from("prompt_packs").select("full_content").eq("id", order.prompt_pack_id).maybeSingle();
    const fullContent = typeof pack?.full_content === "string" ? pack.full_content : "";
    if (fullContent) {
      const delivery = await sendPromptPackDeliveryEmail(order.buyer_email, order.prompt_pack_title, fullContent, order.id);
      message = delivery.sent
        ? "Order marked delivered and email sent."
        : `Order marked delivered. Email not sent: ${delivery.reason}. Use the copy-ready template.`;
    } else {
      message = "Order marked delivered. Pack content is empty, so no email was sent.";
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/payments");
  redirectWithMessage("/admin/payments", "message", message);
}

export async function updateMvpSettings(formData: FormData) {
  const { supabase: rawSupabase } = await requireAdmin("/admin/settings");
  const supabase = rawSupabase as unknown as MvpSupabaseClient;
  const homepageTitle = asString(formData, "homepage_title");
  const homepageSubtitle = asString(formData, "homepage_subtitle");
  const adminEmail = asString(formData, "admin_email").toLowerCase();

  if (!emailPattern.test(adminEmail)) redirectWithMessage("/admin/settings", "error", "Admin email is invalid.");
  if (homepageTitle.length < 6) redirectWithMessage("/admin/settings", "error", "Homepage title is too short.");
  if (homepageSubtitle.length < 12) redirectWithMessage("/admin/settings", "error", "Homepage subtitle is too short.");

  const payload = {
    id: 1,
    admin_email: adminEmail,
    upi_id: asString(formData, "upi_id") || "promptvault@upi",
    qr_code_url: asString(formData, "qr_code_url") || null,
    homepage_title: homepageTitle,
    homepage_subtitle: homepageSubtitle,
    categories: lines(asString(formData, "categories")),
    website_name: asString(formData, "website_name") || "PromptVault",
    logo_text: asString(formData, "logo_text") || "PromptVault",
    hero_headline: homepageTitle,
    hero_subheadline: homepageSubtitle,
    footer_text: asString(formData, "footer_text") || "Copyright 2026 PromptVault. All rights reserved.",
    cta_text: "Explore Prompt Packs",
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase.from("site_settings").upsert(payload, { onConflict: "id" });
  if (error) redirectWithMessage("/admin/settings", "error", error.message);

  revalidatePath("/");
  revalidatePath("/packs");
  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  redirectWithMessage("/admin/settings", "message", "Site settings updated.");
}
