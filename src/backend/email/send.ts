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
  if (!hasSupabaseServiceRoleKey) return false;

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
