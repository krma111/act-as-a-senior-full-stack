import { redirect } from "next/navigation";
import Link from "next/link";
import { Boxes, ExternalLink, IndianRupee, Clock, CheckCircle2, XCircle, Eye } from "lucide-react";
import { MotionMain, MotionSection } from "@/frontend/components/motion-primitives";
import { getAuthSessionState } from "@/backend/auth/session";
import { getUserPurchases } from "@/backend/data/payments";

export const dynamic = "force-dynamic";

function statusBadge(status: string) {
  if (status === "access_sent" || status === "approved") {
    return <span className="inline-flex items-center gap-1 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-bold text-brand"><CheckCircle2 className="h-3 w-3" /> Access granted</span>;
  }
  if (status === "submitted") {
    return <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-400"><Clock className="h-3 w-3" /> Under review</span>;
  }
  if (status === "rejected") {
    return <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-400"><XCircle className="h-3 w-3" /> Rejected</span>;
  }
  return null;
}

export default async function MyPacksPage() {
  const { user, profile } = await getAuthSessionState();
  if (!user || !profile) redirect("/login?next=/dashboard/my-packs");
  const purchases = await getUserPurchases(user.id);

  return (
    <MotionMain className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <MotionSection>
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">
            <Boxes className="mr-2 inline h-4 w-4" />
            My purchases
          </p>
          <h1 className="hero-title mt-2 text-3xl font-black">Your purchased packs</h1>
          <p className="mt-2 text-sm text-slate-400">Track your payment submissions and access your purchased packs.</p>
        </div>

        {purchases.length === 0 ? (
          <div className="card-surface rounded-[32px] p-10 text-center">
            <Boxes className="mx-auto h-12 w-12 text-slate-600" />
            <p className="mt-4 text-xl font-bold text-white">No purchases yet</p>
            <p className="mt-2 text-sm text-slate-400">Browse available packs and make your first purchase.</p>
            <Link href="/packs" className="btn-primary mt-6 inline-flex items-center gap-2">
              Browse packs
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {purchases.map((purchase) => (
              <article key={purchase.id} className="card-surface rounded-[28px] p-5 transition duration-300 hover:border-brand/40">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-bold text-white">{purchase.pack_name ?? "Prompt Pack"}</h2>
                      {statusBadge(purchase.status)}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-400">
                      <span>Order: <span className="font-mono text-slate-300">{purchase.order_id ?? "N/A"}</span></span>
                      <span>
                        <IndianRupee className="mr-0.5 inline h-3.5 w-3.5" />
                        {purchase.amount}
                      </span>
                      <span>{new Date(purchase.created_at).toLocaleDateString()}</span>
                    </div>

                    {purchase.screenshot_url && (
                      <a href={purchase.screenshot_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-xs text-brand hover:text-brand/80">
                        <Eye className="h-3 w-3" /> View my screenshot
                      </a>
                    )}

                    {purchase.rejection_reason && (
                      <p className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-100">{purchase.rejection_reason}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {purchase.access_link && (
                      <a href={purchase.access_link} target="_blank" rel="noreferrer" className="btn-primary inline-flex items-center gap-2">
                        <ExternalLink className="h-4 w-4" />
                        Access pack
                      </a>
                    )}
                    {purchase.status === "submitted" && (
                      <span className="btn-ghost inline-flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4" />
                        Awaiting verification
                      </span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </MotionSection>
    </MotionMain>
  );
}
