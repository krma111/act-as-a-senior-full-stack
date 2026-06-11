"use server";

import { createClient } from "@/backend/database/server";
import { requireAdmin } from "@/backend/data/admin";
import { createAdminClient } from "@/backend/database/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAdminAction } from "@/backend/actions/admin";
import { sendEmail } from "@/backend/email/send";
import { paymentReceivedEmailTemplate, paymentAccessLinkEmailTemplate, paymentAdminNotificationEmailTemplate } from "@/backend/email/templates";
import { adminEmail, siteUrl } from "@/backend/env";

function asString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function generateOrderId(): string {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PV-UPI-${date}-${random}`;
}

function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function redirectWithMessage(path: string, type: "message" | "error", text: string): never {
  const encoded = encodeURIComponent(text);
  redirect(`${path}?${type}=${encoded}`);
}

export async function initiateUPIPayment(formData: FormData) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, message: "You must be logged in to make a purchase." };
  }

  const packId = asString(formData, "pack_id");
  const email = asString(formData, "email");

  if (!isValidUuid(packId)) {
    return { ok: false, message: "Invalid pack selection." };
  }

  if (!email || !email.includes("@")) {
    return { ok: false, message: "Enter a valid email address." };
  }

  const admin = createAdminClient();
  const { data: pack } = await admin
    .from("prompt_packs")
    .select("id,title,price,status")
    .eq("id", packId)
    .eq("status", "approved")
    .maybeSingle();

  if (!pack) {
    return { ok: false, message: "Pack not found or not available for purchase." };
  }

  const price = Number(pack.price) || 0;
  if (price <= 0) {
    return { ok: false, message: "This pack is free. No payment needed." };
  }

  const { data: existing } = await admin
    .from("user_pack_access")
    .select("id")
    .eq("user_id", user.id)
    .eq("pack_id", packId)
    .maybeSingle();

  if (existing) {
    return { ok: false, message: "You already own this pack." };
  }

  const orderId = generateOrderId();

  const { error: insertError } = await admin
    .from("payment_requests")
    .insert({
      user_id: user.id,
      pack_id: packId,
      order_id: orderId,
      user_email: email,
      amount: price,
      currency: "INR",
      status: "pending",
      whatsapp_proof_status: "missing",
      screenshot_status: "missing"
    });

  if (insertError) {
    return { ok: false, message: insertError.message };
  }

  return {
    ok: true,
    order_id: orderId,
    pack_title: pack.title,
    amount: price,
    email
  };
}

export async function submitPaymentScreenshot(formData: FormData) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, message: "Authentication required." };
  }

  const orderId = asString(formData, "order_id");
  if (!orderId) {
    return { ok: false, message: "Order ID missing." };
  }

  const file = formData.get("screenshot");
  if (!file || !(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Select a screenshot image to upload." };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { ok: false, message: "File too large. Maximum size is 5MB." };
  }

  const allowed = ["image/png", "image/jpeg", "image/webp", "image/jpg"];
  if (!allowed.includes(file.type)) {
    return { ok: false, message: "Only PNG, JPEG, and WebP images are allowed." };
  }

  const admin = createAdminClient();
  const { data: payment } = await admin
    .from("payment_requests")
    .select("id,order_id,user_id,status")
    .eq("order_id", orderId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!payment) {
    return { ok: false, message: "Payment request not found." };
  }

  if (payment.status !== "pending") {
    return { ok: false, message: "Payment already submitted or processed." };
  }

  const ext = file.name.split(".").pop() || "png";
  const filePath = `${user.id}/${orderId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("payment-screenshots")
    .upload(filePath, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    return { ok: false, message: `Upload failed: ${uploadError.message}` };
  }

  const { data: { publicUrl } } = supabase.storage
    .from("payment-screenshots")
    .getPublicUrl(filePath);

  const now = new Date().toISOString();
  const { error: updateError } = await admin
    .from("payment_requests")
    .update({
      screenshot_url: publicUrl,
      screenshot_status: "submitted",
      status: "submitted",
      updated_at: now
    })
    .eq("id", payment.id);

  if (updateError) {
    return { ok: false, message: updateError.message };
  }

  try {
    const email = asString(formData, "user_email") || "";
    if (email.includes("@")) {
      const packTitle = asString(formData, "pack_title") || "Prompt Pack";
      await sendEmail({
        to: email,
        ...paymentReceivedEmailTemplate({ orderId, packTitle, amount: asString(formData, "amount") || "0" }),
        eventType: "payment_submitted"
      });
    }

    if (adminEmail) {
      await sendEmail({
        to: adminEmail,
        ...paymentAdminNotificationEmailTemplate({
          orderId,
          userEmail: email,
          packTitle: asString(formData, "pack_title") || "Prompt Pack",
          amount: asString(formData, "amount") || "0",
          screenshotUrl: publicUrl
        }),
        eventType: "payment_admin_notify"
      });
    }
  } catch {
    // email failure should not block the payment flow
  }

  revalidatePath("/dashboard/my-packs");
  return { ok: true, message: "Payment screenshot submitted successfully." };
}

export async function approvePaymentWithAccess(prevState: unknown, formData: FormData) {
  const { supabase, user } = await requireAdmin("/admin/payments");

  const id = asString(formData, "id");
  const user_id = asString(formData, "user_id");
  const pack_id = asString(formData, "pack_id");
  const access_link = asString(formData, "access_link");
  const user_email = asString(formData, "user_email");
  const pack_name = asString(formData, "pack_name");

  if (!isValidUuid(id)) redirectWithMessage("/admin/payments", "error", "Invalid payment request.");

  if (!access_link || !access_link.startsWith("http")) {
    redirectWithMessage("/admin/payments", "error", "Enter a valid access link starting with http:// or https://");
  }

  const { data: request } = await supabase
    .from("payment_requests")
    .select("id,user_id,pack_id,status")
    .eq("id", id)
    .maybeSingle();

  if (!request) redirectWithMessage("/admin/payments", "error", "Payment request not found.");
  if (request.status === "approved" || request.status === "access_sent") {
    redirectWithMessage("/admin/payments", "error", "Payment already approved.");
  }

  const now = new Date().toISOString();

  const access = await supabase.from("user_pack_access").upsert(
    { user_id: request.user_id, pack_id: request.pack_id, granted_by: user.id, granted_at: now, created_at: now },
    { onConflict: "user_id,pack_id" }
  );

  if (access.error) redirectWithMessage("/admin/payments", "error", access.error.message);

  const { error: updateError } = await supabase
    .from("payment_requests")
    .update({
      status: "access_sent",
      access_link,
      access_sent_at: now,
      rejection_reason: null,
      reviewed_by: user.id,
      reviewed_at: now,
      updated_at: now
    })
    .eq("id", id);

  if (updateError) redirectWithMessage("/admin/payments", "error", updateError.message);

  await logAdminAction(supabase, user.id, "payment_approved_access_sent", "payment_requests", id, request, {
    status: "access_sent",
    pack_id,
    user_id,
    access_link
  });

  try {
    if (user_email?.includes("@")) {
      await sendEmail({
        to: user_email,
        ...paymentAccessLinkEmailTemplate({ packName: pack_name || "Prompt Pack", accessLink: access_link }),
        eventType: "payment_access_sent"
      });
    }
  } catch {
    // email failure should not block the approval
  }

  revalidatePath("/admin");
  revalidatePath("/admin/payments");
  redirectWithMessage("/admin/payments", "message", "Payment approved and access link sent.");
}

export async function rejectPaymentFromAdmin(formData: FormData) {
  const { supabase, user } = await requireAdmin("/admin/payments");

  const id = asString(formData, "id");
  const reason = asString(formData, "rejection_reason") || "Payment rejected by admin.";

  if (!isValidUuid(id)) redirectWithMessage("/admin/payments", "error", "Payment request not found.");

  const { error } = await supabase
    .from("payment_requests")
    .update({ status: "rejected", rejection_reason: reason, reviewed_by: user.id, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) redirectWithMessage("/admin/payments", "error", error.message);

  await logAdminAction(supabase, user.id, "payment_rejected", "payment_requests", id, null, { status: "rejected", rejection_reason: reason });

  revalidatePath("/admin");
  revalidatePath("/admin/payments");
  redirectWithMessage("/admin/payments", "message", "Payment request rejected.");
}
