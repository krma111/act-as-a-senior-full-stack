type TemplateInput = {
  name?: string | null;
  title?: string | null;
  promptUrl?: string | null;
  rejectionReason?: string | null;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function shell(content: string) {
  return `
    <div style="margin:0;background:#020403;padding:32px 16px;font-family:Arial,sans-serif;color:#f8fff8">
      <div style="margin:0 auto;max-width:560px;border:1px solid rgba(40,255,20,.28);border-radius:24px;background:#07120c;padding:32px;box-shadow:0 0 32px rgba(40,255,20,.14)">
        <div style="display:inline-grid;height:44px;width:44px;place-items:center;border-radius:14px;background:#28ff14;color:#021006;font-weight:900">P</div>
        ${content}
        <p style="margin-top:32px;color:#8fa59a;font-size:13px;line-height:1.6">PromptVault<br />Professional prompt discovery for creators.</p>
      </div>
    </div>
  `;
}

function isValidEmailUrl(url: string) {
  return url.startsWith("http://") || url.startsWith("https://");
}

function button(label: string, href: string) {
  const safeHref = isValidEmailUrl(href) ? href : "";
  return `<a href="${escapeHtml(safeHref)}" style="display:inline-block;margin-top:18px;border-radius:999px;background:#28ff14;color:#021006;padding:12px 18px;text-decoration:none;font-weight:800">${escapeHtml(label)}</a>`;
}

export function welcomeEmailTemplate({ name }: TemplateInput) {
  const displayName = name?.trim() || "creator";

  return {
    subject: "Welcome to PromptVault",
    text: `Welcome to PromptVault, ${displayName}. Your account is ready.`,
    html: shell(`
      <h1 style="margin:24px 0 12px;font-size:28px;line-height:1.15;color:#ffffff">Welcome to PromptVault</h1>
      <p style="margin:0;color:#b8c8bf;line-height:1.7">Hi ${escapeHtml(displayName)}, your account is ready. You can now save prompts, submit creator prompts, and build your prompt vault.</p>
    `)
  };
}

export function submissionReceivedEmailTemplate({ title }: TemplateInput) {
  const safeTitle = title?.trim() || "your prompt";

  return {
    subject: "Submission Received",
    text: `Your prompt "${safeTitle}" has been submitted successfully and is under review.`,
    html: shell(`
      <h1 style="margin:24px 0 12px;font-size:28px;line-height:1.15;color:#ffffff">Submission received</h1>
      <p style="margin:0;color:#b8c8bf;line-height:1.7">Your prompt <strong style="color:#fff">${escapeHtml(safeTitle)}</strong> has been submitted successfully and is under review.</p>
    `)
  };
}

export function approvalEmailTemplate({ title, promptUrl }: TemplateInput) {
  const safeTitle = title?.trim() || "your prompt";
  const approvalDate = new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date());

  return {
    subject: "Your Prompt Has Been Approved",
    text: `Your prompt "${safeTitle}" was approved on ${approvalDate}.${promptUrl ? ` View it here: ${promptUrl}` : ""}`,
    html: shell(`
      <h1 style="margin:24px 0 12px;font-size:28px;line-height:1.15;color:#ffffff">Your prompt is approved</h1>
      <p style="margin:0;color:#b8c8bf;line-height:1.7">Your prompt <strong style="color:#fff">${escapeHtml(safeTitle)}</strong> was approved on ${escapeHtml(approvalDate)}.</p>
      ${promptUrl ? button("View approved prompt", promptUrl) : ""}
    `)
  };
}

export function rejectionEmailTemplate({ title, rejectionReason }: TemplateInput) {
  const safeTitle = title?.trim() || "your prompt";
  const reason = rejectionReason?.trim() || "No rejection reason was provided.";

  return {
    subject: "Your Prompt Was Not Approved",
    text: `Your prompt "${safeTitle}" was not approved. Reason: ${reason}`,
    html: shell(`
      <h1 style="margin:24px 0 12px;font-size:28px;line-height:1.15;color:#ffffff">Prompt not approved</h1>
      <p style="margin:0;color:#b8c8bf;line-height:1.7">Your prompt <strong style="color:#fff">${escapeHtml(safeTitle)}</strong> was not approved.</p>
      <div style="margin-top:18px;border-radius:16px;background:#1f1010;border:1px solid rgba(255,80,80,.28);padding:16px;color:#ffd7d7">${escapeHtml(reason)}</div>
    `)
  };
}

export function followerApprovedPromptEmailTemplate({ title, promptUrl }: TemplateInput) {
  const safeTitle = title?.trim() || "a saved prompt";

  return {
    subject: "New Prompt Approved on PromptVault",
    text: `A prompt you follow or saved has been approved: "${safeTitle}".${promptUrl ? ` View it here: ${promptUrl}` : ""}`,
    html: shell(`
      <h1 style="margin:24px 0 12px;font-size:28px;line-height:1.15;color:#ffffff">A saved prompt is live</h1>
      <p style="margin:0;color:#b8c8bf;line-height:1.7">A prompt you follow or saved has been approved: <strong style="color:#fff">${escapeHtml(safeTitle)}</strong>.</p>
      ${promptUrl ? button("View prompt", promptUrl) : ""}
    `)
  };
}
