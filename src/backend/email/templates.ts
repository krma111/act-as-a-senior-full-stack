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

export function paymentReceivedEmailTemplate({ orderId, packTitle, amount }: { orderId: string; packTitle: string; amount: string }) {
  return {
    subject: `Payment Received - Order ${orderId}`,
    text: `Your payment of ₹${amount} for "${packTitle}" (Order ${orderId}) has been received and is under review.`,
    html: shell(`
      <h1 style="margin:24px 0 12px;font-size:28px;line-height:1.15;color:#ffffff">Payment submission received</h1>
      <p style="margin:0;color:#b8c8bf;line-height:1.7">Thank you for your payment of <strong style="color:#fff">₹${escapeHtml(amount)}</strong> for <strong style="color:#fff">${escapeHtml(packTitle)}</strong>.</p>
      <div style="margin-top:18px;border-radius:16px;background:#0a1912;border:1px solid rgba(40,255,20,.2);padding:16px">
        <p style="margin:0;color:#8fa59a;font-size:13px"><strong style="color:#b8c8bf">Order ID:</strong> ${escapeHtml(orderId)}</p>
      </div>
      <p style="margin:18px 0 0;color:#8fa59a;font-size:14px;line-height:1.6">Your payment will be verified by our team. Once approved, your prompt pack access link will be sent to this email.</p>
    `)
  };
}

export function paymentAccessLinkEmailTemplate({ packName, accessLink }: { packName: string; accessLink: string }) {
  return {
    subject: `Your ${packName} Access Link is Ready`,
    text: `Your prompt pack "${packName}" is ready. Access it here: ${accessLink}`,
    html: shell(`
      <h1 style="margin:24px 0 12px;font-size:28px;line-height:1.15;color:#ffffff">Access granted</h1>
      <p style="margin:0;color:#b8c8bf;line-height:1.7">Your prompt pack <strong style="color:#fff">${escapeHtml(packName)}</strong> is ready.</p>
      <p style="margin:12px 0;color:#8fa59a;font-size:14px">Click the button below to access your unique pack link. This link is exclusive to you.</p>
      ${button("Access your pack", accessLink)}
    `)
  };
}

export function paymentAdminNotificationEmailTemplate({ orderId, userEmail, packTitle, amount, screenshotUrl }: { orderId: string; userEmail: string; packTitle: string; amount: string; screenshotUrl: string }) {
  return {
    subject: `New Payment Submitted - Order ${orderId}`,
    text: `New payment submission: Order ${orderId}, User: ${userEmail}, Pack: ${packTitle}, Amount: ₹${amount}. Review: ${screenshotUrl}`,
    html: shell(`
      <h1 style="margin:24px 0 12px;font-size:28px;line-height:1.15;color:#ffffff">New payment submission</h1>
      <div style="margin-top:18px;border-radius:16px;background:#0a1912;border:1px solid rgba(255,200,50,.2);padding:16px">
        <p style="margin:0 0 8px;color:#b8c8bf;font-size:14px"><strong>Order ID:</strong> ${escapeHtml(orderId)}</p>
        <p style="margin:0 0 8px;color:#b8c8bf;font-size:14px"><strong>User:</strong> ${escapeHtml(userEmail)}</p>
        <p style="margin:0 0 8px;color:#b8c8bf;font-size:14px"><strong>Pack:</strong> ${escapeHtml(packTitle)}</p>
        <p style="margin:0 0 8px;color:#b8c8bf;font-size:14px"><strong>Amount:</strong> ₹${escapeHtml(amount)}</p>
      </div>
      ${button("View screenshot", screenshotUrl)}
      ${button("Review payments", `/admin/payments`)}
    `)
  };
}
