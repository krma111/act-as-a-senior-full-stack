import Link from "next/link";
import { Mail, ShoppingBag } from "lucide-react";
import { AdminSubmitButton } from "@/frontend/components/admin-action-button";
import { AdminFlashToast } from "@/frontend/components/admin-flash-toast";
import { AdminTabs } from "@/frontend/components/admin-tabs";
import { CopyTextButton } from "@/frontend/components/copy-text-button";
import { MotionMain, MotionSection } from "@/frontend/components/motion-primitives";
import { updateMvpOrderStatus } from "@/backend/mvp-actions";
import { getAdminOrders, getMvpSiteSettings, type MvpOrder } from "@/backend/mvp-data";
import { requireAdmin } from "@/backend/data/admin";

export const dynamic = "force-dynamic";

const filters = ["all", "pending_payment", "paid", "delivered", "cancelled"];
const orderStatuses = ["pending_payment", "paid", "delivered", "cancelled"];

function statusClass(status: string) {
  if (status === "delivered") return "border-brand/30 bg-brand/10 text-brand";
  if (status === "paid") return "border-sky-500/30 bg-sky-500/10 text-sky-100";
  if (status === "cancelled") return "border-red-500/30 bg-red-500/10 text-red-100";
  return "border-amber-500/30 bg-amber-500/10 text-amber-100";
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatPrice(value: number) {
  return `INR ${Math.round(value).toLocaleString("en-IN")}`;
}

function emailTemplate(order: MvpOrder) {
  return [
    `Subject: Your PromptVault pack: ${order.prompt_pack_title}`,
    "",
    "Hi,",
    "",
    `Thank you for your payment. Here is your PromptVault prompt pack: ${order.prompt_pack_title}`,
    "",
    order.pack_full_content || "[Pack content is empty or unavailable. Copy it from the prompt pack editor.]",
    "",
    `Order ID: ${order.id}`,
    "",
    "Regards,",
    "PromptVault"
  ].join("\n");
}

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; message?: string; error?: string }> }) {
  const params = await searchParams;
  await requireAdmin("/admin/payments");
  const [settings, orderResult] = await Promise.all([getMvpSiteSettings(), getAdminOrders(params.status)]);

  return (
    <MotionMain className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <AdminTabs active="Orders" />
      <AdminFlashToast message={params.message} error={params.error ?? orderResult.error ?? undefined} />
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Admin console</p>
          <h1 className="hero-title mt-2 text-3xl font-black">Buyer orders</h1>
          <p className="mt-2 text-sm text-slate-400">Manual UPI payment requests from the no-login checkout flow.</p>
        </div>
        <div className="flex w-full flex-wrap gap-2 lg:w-auto lg:justify-end">
          <Link href="/admin" className="btn-ghost max-w-full px-3 text-xs sm:text-sm">Admin home</Link>
          {filters.map((filter) => (
            <Link key={filter} href={filter === "all" ? "/admin/payments" : `/admin/payments?status=${filter}`} className={(params.status ?? "all") === filter ? "btn-primary max-w-full px-3 text-xs sm:text-sm" : "btn-ghost max-w-full px-3 text-xs sm:text-sm"}>
              {filter.replace("_", " ")}
            </Link>
          ))}
        </div>
      </div>

      {(params.message || params.error || orderResult.error) && (
        <div className={`mb-6 rounded-2xl border p-4 text-sm ${params.error || orderResult.error ? "border-red-500/30 bg-red-500/10 text-red-100" : "border-brand/30 bg-brand/10 text-brand"}`}>
          {params.error ?? orderResult.error ?? params.message}
        </div>
      )}

      {!orderResult.orders.length ? (
        <MotionSection className="card-surface rounded-[32px] p-10 text-center">
          <ShoppingBag className="mx-auto h-10 w-10 text-brand" />
          <p className="mt-4 text-xl font-bold text-white">No orders found.</p>
          <p className="mt-2 text-sm text-slate-400">Orders appear here when a buyer submits email from a premium pack checkout.</p>
        </MotionSection>
      ) : (
        <MotionSection className="grid min-w-0 gap-5">
          {orderResult.orders.map((order) => (
            <article key={order.id} className="card-surface min-w-0 rounded-[32px] p-5 sm:p-6">
              <div className="flex min-w-0 flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${statusClass(order.status)}`}>{order.status.replace("_", " ")}</span>
                  <h2 className="mt-3 break-words text-xl font-bold text-white">{order.prompt_pack_title}</h2>
                  <p className="mt-1 break-words text-sm text-slate-400">{order.buyer_email} - {formatDate(order.created_at)}</p>
                  <div className="mt-4 grid gap-2 text-sm text-slate-300 sm:grid-cols-3">
                    <span className="rounded-xl bg-white/[0.04] p-3">Amount: {formatPrice(order.price)}</span>
                    <span className="rounded-xl bg-white/[0.04] p-3">Order: {order.id.slice(0, 8)}</span>
                    <span className="rounded-xl bg-white/[0.04] p-3">Delivered: {order.delivered_at ? formatDate(order.delivered_at) : "No"}</span>
                  </div>
                </div>

                <div className="grid w-full min-w-0 gap-3 xl:max-w-[380px] xl:flex-none">
                  <form action={updateMvpOrderStatus} className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <input type="hidden" name="id" value={order.id} />
                    <select className="field" name="status" defaultValue={order.status}>
                      {orderStatuses.map((status) => <option key={status} value={status}>{status.replace("_", " ")}</option>)}
                    </select>
                    <AdminSubmitButton className="btn-primary w-full justify-center sm:w-auto" pendingText="Updating...">Update</AdminSubmitButton>
                  </form>
                  <CopyTextButton text={order.pack_full_content || ""} label="Copy full prompt content" className="btn-ghost justify-center" />
                  <CopyTextButton text={emailTemplate(order)} label="Copy email template" className="btn-ghost justify-center" />
                  <a
                    href={`mailto:${order.buyer_email}?subject=${encodeURIComponent(`Your PromptVault pack: ${order.prompt_pack_title}`)}&body=${encodeURIComponent(emailTemplate(order))}`}
                    className="btn-ghost justify-center"
                  >
                    <Mail className="h-4 w-4" /> Open email draft
                  </a>
                </div>
              </div>
              <p className="mt-4 break-words rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-xs leading-6 text-slate-400">
                Admin payment email: {settings.admin_email}. If RESEND_API_KEY is configured, marking as delivered sends the pack automatically. Otherwise use the copy/open email buttons.
              </p>
            </article>
          ))}
        </MotionSection>
      )}
    </MotionMain>
  );
}
