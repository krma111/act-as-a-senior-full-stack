import Link from "next/link";
import { CheckCircle2, ExternalLink, XCircle } from "lucide-react";
import { AdminTabs } from "@/frontend/components/admin-tabs";
import { AdminSubmitButton } from "@/frontend/components/admin-action-button";
import { MotionMain, MotionSection } from "@/frontend/components/motion-primitives";
import { approvePaymentRequest, rejectPaymentRequest } from "@/backend/actions/admin";
import { getAdminPaymentRequests } from "@/backend/data/admin";

export const dynamic = "force-dynamic";

const filters = ["all", "pending", "approved", "rejected"];

function statusClass(status: string) {
  if (status === "approved") return "border-brand/30 bg-brand/10 text-brand";
  if (status === "rejected") return "border-red-500/30 bg-red-500/10 text-red-100";
  return "border-amber-500/30 bg-amber-500/10 text-amber-100";
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
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
          <p className="mt-2 text-sm text-slate-400">Approve manual payments and grant paid pack access.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin" className="btn-ghost">Admin home</Link>
          {filters.map((filter) => (
            <Link key={filter} href={filter === "all" ? "/admin/payments" : "/admin/payments?status=" + filter} className={activeStatus === filter ? "btn-primary" : "btn-ghost"}>
              {filter[0].toUpperCase() + filter.slice(1)}
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
          <p className="mt-2 text-sm text-slate-400">Manual payment requests will appear here.</p>
        </MotionSection>
      ) : (
        <MotionSection className="grid gap-4">
          {requests.map((request) => (
            <article key={request.id} className="card-surface rounded-[28px] p-5 transition duration-500 hover:-translate-y-1 hover:border-brand/40">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <span className={"rounded-full border px-3 py-1 text-xs font-bold uppercase " + statusClass(request.status)}>{request.status}</span>
                  <h2 className="mt-3 text-xl font-bold text-white">{request.pack_name ?? "Unknown pack"}</h2>
                  <p className="mt-1 text-sm text-slate-400">{request.user_email ?? "Unknown user"} - {formatDate(request.created_at)}</p>
                  <div className="mt-4 grid gap-2 text-sm text-slate-300 sm:grid-cols-3">
                    <span className="rounded-xl bg-white/[0.04] p-3">Amount: {request.currency} {request.amount}</span>
                    <span className="rounded-xl bg-white/[0.04] p-3">WhatsApp proof: {request.whatsapp_proof_status}</span>
                    <span className="rounded-xl bg-white/[0.04] p-3">Request ID: {request.id.slice(0, 8)}</span>
                  </div>
                  {request.whatsapp_proof_url ? (
                    <a href={request.whatsapp_proof_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm text-brand hover:text-brand/80">
                      View payment proof <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : null}
                  {request.rejection_reason ? <p className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-100">{request.rejection_reason}</p> : null}
                </div>

                <div className="grid gap-3 xl:min-w-[360px]">
                  <form action={approvePaymentRequest}>
                    <input type="hidden" name="id" value={request.id} />
                    <input type="hidden" name="user_id" value={request.user_id} />
                    <input type="hidden" name="pack_id" value={request.pack_id} />
                    <AdminSubmitButton className="btn-primary w-full justify-center" pendingText="Approving..."><CheckCircle2 className="h-4 w-4" /> Approve payment</AdminSubmitButton>
                  </form>
                  <form action={rejectPaymentRequest} className="grid gap-2">
                    <input type="hidden" name="id" value={request.id} />
                    <input className="field" name="rejection_reason" placeholder="Reject reason" />
                    <AdminSubmitButton className="btn-ghost w-full justify-center text-red-100" pendingText="Rejecting..."><XCircle className="h-4 w-4" /> Reject payment</AdminSubmitButton>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </MotionSection>
      )}
    </MotionMain>
  );
}
