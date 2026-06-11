import "server-only";

import { Resend } from "resend";
import { hasEmailProviderEnv, hasSupabaseServiceRoleKey, getResendApiKey, siteUrl } from "@/backend/env";
import {
  approvalEmailTemplate,
  followerApprovedPromptEmailTemplate,
  rejectionEmailTemplate,
  submissionReceivedEmailTemplate,
  welcomeEmailTemplate
} from "@/backend/email/templates";
import { createAdminClient } from "@/backend/database/admin";

const emailFrom = (process.env.EMAIL_FROM?.trim() ?? "") || 'PromptVault <noreply@promptvault.com>';
const maxAttempts = 3;

type EmailStatus = "sent" | "failed" | "skipped";

type SendEmailInput = {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  eventType: string;
  promptId?: string | null;
  recipientUserId?: string | null;
  idempotencyKey?: string;
};

function recipientsFrom(value: string | string[]) {
  return (Array.isArray(value) ? value : [value]).map((item) => item.trim()).filter(Boolean);
}

function getResendClient() {
  if (!hasEmailProviderEnv()) return null;
  return new Resend(getResendApiKey());
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function logEmailEvent(input: SendEmailInput, status: EmailStatus, error?: string | null) {
  if (!hasSupabaseServiceRoleKey()) return;

  try {
    const supabase = createAdminClient();
    await supabase.from("email_events").insert({
      recipient_email: recipientsFrom(input.to).join(","),
      recipient_user_id: input.recipientUserId ?? null,
      prompt_id: input.promptId ?? null,
      event_type: input.eventType,
      subject: input.subject,
      status,
      provider: "resend",
      error_message: error ?? null,
      sent_at: status === "sent" ? new Date().toISOString() : null
    });
  } catch (error) {
    console.error("Email event logging failed", error);
  }
}

async function hasSentEmailEvent(eventType: string, recipientUserId?: string | null, recipientEmail?: string | null) {
  if (!hasSupabaseServiceRoleKey()) return false;

  try {
    const supabase = createAdminClient();
    let query = supabase.from("email_events").select("id").eq("event_type", eventType).eq("status", "sent").limit(1);

    if (recipientUserId) {
      query = query.eq("recipient_user_id", recipientUserId);
    } else if (recipientEmail) {
      query = query.eq("recipient_email", recipientEmail);
    } else {
      return false;
    }

    const { data } = await query.maybeSingle();
    return Boolean(data);
  } catch (error) {
    console.error("Email event lookup failed", error);
    return false;
  }
}

async function sendEmailWithRetry(client: Resend, input: SendEmailInput) {
  let lastError: string | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const { error } = await Promise.race([
        client.emails.send(
          {
            from: emailFrom,
            to: recipientsFrom(input.to),
            subject: input.subject,
            text: input.text,
            html: input.html
          },
          input.idempotencyKey
            ? {
                idempotencyKey: input.idempotencyKey
              }
            : undefined
        ),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Email send timed out")), 10000)
        )
      ]);

      if (!error) return null;
      lastError = error.message;
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Email request failed.";
    }

    if (attempt < maxAttempts) {
      await wait(400 * attempt);
    }
  }

  return lastError ?? "Email request failed.";
}

export async function sendEmail(input: SendEmailInput) {
  const to = recipientsFrom(input.to);
  if (!to.length) {
    await logEmailEvent(input, "skipped", "No recipient email.");
    return { sent: false, reason: "No recipient email." };
  }

  const client = getResendClient();
  if (!client) {
    const reason = "Missing required environment variable: RESEND_API_KEY";
    await logEmailEvent(input, "skipped", reason);
    console.error(reason);
    return { sent: false, reason };
  }

  const error = await sendEmailWithRetry(client, input);
  if (error) {
    await logEmailEvent(input, "failed", error);
    console.error("Resend email failed", { eventType: input.eventType, error });
    return { sent: false, reason: error };
  }

  await logEmailEvent(input, "sent");
  return { sent: true, reason: null };
}

export async function sendWelcomeEmail(to: string, name?: string | null, userId?: string | null) {
  const template = welcomeEmailTemplate({ name });

  return sendEmail({
    to,
    ...template,
    eventType: "welcome",
    recipientUserId: userId ?? null,
    idempotencyKey: userId ? `welcome-${userId}` : `welcome-${to.toLowerCase()}`
  });
}

export async function sendWelcomeEmailIfNeeded(to: string, name?: string | null, userId?: string | null) {
  if (await hasSentEmailEvent("welcome", userId, to)) {
    return { sent: false, reason: "Welcome email already sent." };
  }

  return sendWelcomeEmail(to, name, userId);
}

export async function sendSubmissionReceivedEmail(to: string, title: string, promptId: string, userId: string) {
  const template = submissionReceivedEmailTemplate({ title });

  return sendEmail({
    to,
    ...template,
    eventType: "submission_received",
    promptId,
    recipientUserId: userId,
    idempotencyKey: `submission-received-${promptId}-${userId}`
  });
}

export async function sendApprovalEmail(to: string, title: string, promptUrl: string, promptId: string, userId: string) {
  const template = approvalEmailTemplate({ title, promptUrl });

  return sendEmail({
    to,
    ...template,
    eventType: "prompt_approved_creator",
    promptId,
    recipientUserId: userId,
    idempotencyKey: `prompt-approved-${promptId}-${userId}`
  });
}

export async function sendPromptApprovedEmail(to: string, title: string, promptUrl: string, promptId: string, userId: string) {
  return sendApprovalEmail(to, title, promptUrl, promptId, userId);
}

export async function sendRejectionEmail(to: string, title: string, rejectionReason: string, promptId: string, userId: string) {
  const template = rejectionEmailTemplate({ title, rejectionReason });

  return sendEmail({
    to,
    ...template,
    eventType: "prompt_rejected_creator",
    promptId,
    recipientUserId: userId,
    idempotencyKey: `prompt-rejected-${promptId}-${userId}`
  });
}

export async function sendFollowerApprovedPromptEmail(to: string, title: string, promptId: string, userId: string) {
  const promptUrl = `${siteUrl}/prompts/${promptId}`;
  const template = followerApprovedPromptEmailTemplate({ title, promptUrl });

  return sendEmail({
    to,
    ...template,
    eventType: "prompt_approved_user",
    promptId,
    recipientUserId: userId,
    idempotencyKey: `prompt-approved-user-${promptId}-${userId}`
  });
}

export async function sendPromptPackDeliveryEmail(to: string, packTitle: string, fullContent: string, orderId: string) {
  const safeTitle = packTitle.trim() || "PromptVault prompt pack";
  const text = [
    `Thank you for your PromptVault purchase.`,
    ``,
    `Your prompt pack is ready: ${safeTitle}`,
    ``,
    fullContent,
    ``,
    `Order ID: ${orderId}`
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;background:#050806;color:#f8fafc;padding:32px">
      <div style="max-width:720px;margin:0 auto;border:1px solid rgba(34,255,0,.25);border-radius:24px;background:rgba(255,255,255,.06);padding:28px">
        <p style="margin:0 0 12px;color:#22ff00;font-size:12px;letter-spacing:.22em;text-transform:uppercase">PromptVault Delivery</p>
        <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2">Your prompt pack is ready</h1>
        <p style="margin:0 0 20px;color:#b8c8bf">Thank you for your purchase. Here is your full prompt pack:</p>
        <h2 style="margin:0 0 12px;font-size:20px">${safeTitle}</h2>
        <pre style="white-space:pre-wrap;word-break:break-word;background:#020402;border:1px solid rgba(255,255,255,.12);border-radius:18px;padding:18px;color:#e8ffe4;line-height:1.6">${fullContent.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char] ?? char))}</pre>
        <p style="margin:20px 0 0;color:#8fa59a;font-size:13px">Order ID: ${orderId}</p>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: `Your PromptVault pack: ${safeTitle}`,
    text,
    html,
    eventType: "prompt_pack_delivered",
    idempotencyKey: `prompt-pack-delivered-${orderId}`
  });
}
