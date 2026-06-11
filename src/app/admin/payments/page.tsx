import Link from "next/link";
import { CheckCircle2, ExternalLink, XCircle, IndianRupee, Copy, Eye } from "lucide-react";
import { AdminTabs } from "@/frontend/components/admin-tabs";
import { AdminSubmitButton } from "@/frontend/components/admin-action-button";
import { MotionMain, MotionSection } from "@/frontend/components/motion-primitives";
import { getAdminPaymentRequests } from "@/backend/data/admin";
import { approvePaymentWithAccess, rejectPaymentFromAdmin } from "@/backend/actions/payments";
import { AccessLinkForm } from "./access-link-form";

export const dynamic = "force-dynamic";

const filters = ["all", "pending", "submitted", "approved", "access_sent", "rejected"];

function statusClass(status: string) {
  if (status === "approved" || status === "access_sent") return "border-brand/30 bg-brand/10 text-brand";
  if (status === "rejected") return "border-red-500/30 bg-red-500/10 text-red-100";
  if (status === "submitted") return "border-blue-500/30 bg-blue-500/10 text-blue-100";
  return "border-amber-500/30 bg-amber-500/10 text-amber-100";
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
  } catch {
    return value;
  }
}

export default async function AdminPaymentsPage({ searchParams }: { searchParams: Promise<{ status?: string; message?: string; error?: string }> }) {
  const params = await searchParams;
  const { requests, error, activeStatus } = await getAdminPaymentRequests(params.status);

  return (
    <MotionMain className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <AdminTabs active="Payments" />
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Admin console</p>
          <h1 className="hero-title mt-2 text-3xl font-black">Payment requests</h1>
          <p className="mt-2 text-sm text-slate-400">Manage UPI payments, verify screenshots, and send unique access links.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin" className="btn-ghost">Admin home</Link>
          {filters.map((filter) => (
            <Link key={filter} href={filter === "all" ? "/admin/payments" : "/admin/payments?status=" + filter} className={activeStatus === filter ? "btn-primary" : "btn-ghost"}>
              {filter === "access_sent" ? "Access Sent" : filter[0].toUpperCase() + filter.slice(1)}
            </Link>
          ))}
        </div>
      </div>

      {(params.message || params.error || error) && (
        <div className={"mb-6 rounded-2xl border p-4 text-sm " + (params.error || error ? "border-red-500/30 bg-red-500/10 text-red-100" : "border-brand/30 bg-brand/10 text-brand")}>
          {params.error ?? error ?? params.message}
        </div>
      )}

      {!requests.length ? (
        <MotionSection className="card-surface rounded-[32px] p-10 text-center">
          <p className="text-xl font-bold text-white">No payment requests found.</p>
          <p className="mt-2 text-sm text-slate-400">UPI payment requests will appear here.</p>
        </MotionSection>
      ) : (
        <MotionSection className="grid gap-4">
          {requests.map((request) => (
            <article key={request.id} className="card-surface rounded-[28px] p-5 transition duration-500 hover:-translate-y-1 hover:border-brand/40">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={"rounded-full border px-3 py-1 text-xs font-bold uppercase " + statusClass(request.status)}>{request.status}</span>
                    {request.order_id && (
                      <span className="font-mono text-xs text-slate-500">{request.order_id}</span>
                    )}
                  </div>

                  <h2 className="mt-3 text-xl font-bold text-white">{request.pack_name ?? "Unknown pack"}</h2>
                  <p className="mt-1 text-sm text-slate-400">{request.user_email ?? "Unknown user"} - {formatDate(request.created_at)}</p>

                  <div className="mt-4 grid gap-2 text-sm text-slate-300 sm:grid-cols-2 lg:grid-cols-4">
                    <span className="rounded-xl bg-white/[0.04] p-3 flex items-center gap-1">
                      <IndianRupee className="h-3.5 w-3.5" /> {request.currency} {request.amount}
                    </span>
                    <span className="rounded-xl bg-white/[0.04] p-3">Screenshot: {request.screenshot_status ?? "missing"}</span>
                    <span className="rounded-xl bg-white/[0.04] p-3">Order: {request.order_id?.slice(-8) ?? "N/A"}</span>
                    <span className="rounded-xl bg-white/[0.04] p-3 truncate" title={request.user_id}>User: {request.user_id.slice(0, 8)}...</span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-3">
                    {request.screenshot_url ? (
                      <a href={request.screenshot_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-brand hover:text-brand/80">
                        <Eye className="h-4 w-4" /> View screenshot <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : null}

                    {request.whatsapp_proof_url ? (
                      <a href={request.whatsapp_proof_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300">
                        <ExternalLink className="h-3 w-3" /> WhatsApp proof
                      </a>
                    ) : null}

                    {request.access_link ? (
                      <a href={request.access_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-brand hover:text-brand/80">
                        <ExternalLink className="h-3 w-3" /> Access link
                      </a>
                    ) : null}
                  </div>

                  {request.rejection_reason ? (
                    <p className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-100">{request.rejection_reason}</p>
                  ) : null}
                </div>

                <div className="grid gap-3 xl:min-w-[400px]">
                  {(request.status === "pending" || request.status === "submitted") && (
                    <AccessLinkForm
                      id={request.id}
                      userId={request.user_id}
                      packId={request.pack_id}
                      userEmail={request.user_email ?? ""}
                      packName={request.pack_name ?? "Prompt Pack"}
                    />
                  )}

                  {request.status !== "rejected" && request.status !== "access_sent" && (
                    <form action={rejectPaymentFromAdmin}>
                      <input type="hidden" name="id" value={request.id} />
                      <input className="field mb-2" name="rejection_reason" placeholder="Rejection reason" />
                      <AdminSubmitButton className="btn-ghost w-full justify-center text-red-100" pendingText="Rejecting..."><XCircle className="h-4 w-4" /> Reject payment</AdminSubmitButton>
                    </form>
                  )}
                </div>
              </div>
            </article>
          ))}
        </MotionSection>
      )}
    </MotionMain>
  );
}
