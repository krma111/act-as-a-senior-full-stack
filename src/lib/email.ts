import { emailFrom, hasEmailProviderEnv, hasSupabaseServiceRoleKey, resendApiKey, siteUrl } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

type EmailStatus = "sent" | "failed" | "skipped";

type SendEmailInput = {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  eventType: string;
  promptId?: string | null;
  recipientUserId?: string | null;
};

function recipientsFrom(value: string | string[]) {
  return (Array.isArray(value) ? value : [value]).map((item) => item.trim()).filter(Boolean);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function logEmailEvent(input: SendEmailInput, status: EmailStatus, error?: string | null) {
  if (!hasSupabaseServiceRoleKey) return;

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
  } catch {
    // Email event logging must never break the primary user/admin action.
  }
}

export async function sendEmail(input: SendEmailInput) {
  const to = recipientsFrom(input.to);
  if (!to.length) {
    await logEmailEvent(input, "skipped", "No recipient email.");
    return { sent: false, reason: "No recipient email." };
  }

  if (!hasEmailProviderEnv) {
    await logEmailEvent(input, "skipped", "Email provider is not configured.");
    return { sent: false, reason: "Email provider is not configured." };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: emailFrom,
        to,
        subject: input.subject,
        text: input.text,
        html: input.html
      })
    });

    if (!response.ok) {
      const error = await response.text();
      await logEmailEvent(input, "failed", error);
      return { sent: false, reason: error };
    }

    await logEmailEvent(input, "sent");
    return { sent: true, reason: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email request failed.";
    await logEmailEvent(input, "failed", message);
    return { sent: false, reason: message };
  }
}

export async function sendSubmissionReceivedEmail(to: string, title: string, promptId: string, userId: string) {
  const safeTitle = escapeHtml(title);

  return sendEmail({
    to,
    subject: "Submission Received",
    text: `Your prompt "${title}" has been submitted successfully and is under review.`,
    html: `<p>Your prompt <strong>${safeTitle}</strong> has been submitted successfully and is under review.</p>`,
    eventType: "submission_received",
    promptId,
    recipientUserId: userId
  });
}

export async function sendPromptApprovedEmail(to: string, title: string, promptUrl: string, promptId: string, userId: string) {
  const approvalDate = new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date());
  const safeTitle = escapeHtml(title);
  const safeUrl = escapeHtml(promptUrl);

  return sendEmail({
    to,
    subject: "Your Prompt Has Been Approved",
    text: `Your prompt "${title}" was approved on ${approvalDate}. View it here: ${promptUrl}`,
    html: `<p>Your prompt <strong>${safeTitle}</strong> was approved on ${approvalDate}.</p><p><a href="${safeUrl}">View approved prompt</a></p>`,
    eventType: "prompt_approved_creator",
    promptId,
    recipientUserId: userId
  });
}

export async function sendFollowerApprovedPromptEmail(to: string, title: string, promptId: string, userId: string) {
  const promptUrl = `${siteUrl}/prompts/${promptId}`;
  const safeTitle = escapeHtml(title);
  const safeUrl = escapeHtml(promptUrl);

  return sendEmail({
    to,
    subject: "New Prompt Approved on PromptVault",
    text: `A prompt you follow or saved has been approved: "${title}". View it here: ${promptUrl}`,
    html: `<p>A prompt you follow or saved has been approved: <strong>${safeTitle}</strong>.</p><p><a href="${safeUrl}">View prompt</a></p>`,
    eventType: "prompt_approved_user",
    promptId,
    recipientUserId: userId
  });
}
