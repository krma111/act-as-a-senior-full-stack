import Link from "next/link";
import { EyeOff, RotateCcw, ShieldCheck, XCircle } from "lucide-react";
import { AdminSubmitButton } from "@/components/admin-action-button";
import { AdminTabs } from "@/components/admin-tabs";
import { MotionMain, MotionSection } from "@/components/motion-primitives";
import { dismissReport, hideReportedPrompt, reopenReport, resolveReport } from "@/lib/admin-actions";
import { getAdminReports } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

const filters = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "Resolved", value: "resolved" },
  { label: "Dismissed", value: "dismissed" }
];

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
  } catch {
    return value;
  }
}

export default async function AdminReportsPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; message?: string; error?: string }>;
}) {
  const params = await searchParams;
  const activeStatus = params.status === "open" || params.status === "resolved" || params.status === "dismissed" ? params.status : "all";
  const { reports, error } = await getAdminReports(activeStatus !== "all" ? activeStatus : undefined);

  return (
    <MotionMain className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <AdminTabs active="Reports" />
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Admin console</p>
          <h1 className="hero-title mt-2 text-3xl font-black">Report moderation</h1>
          <p className="mt-2 text-sm text-slate-400">Review user reports and moderate flagged prompts.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin" className="btn-ghost">Admin home</Link>
          {filters.map((filter) => (
            <Link
              key={filter.value}
              href={filter.value === "all" ? "/admin/reports" : `/admin/reports?status=${filter.value}`}
              className={activeStatus === filter.value ? "btn-primary" : "btn-ghost"}
            >
              {filter.label}
            </Link>
          ))}
        </div>
      </div>

      {(params.message || params.error || error) && (
        <div className={`mb-6 rounded-2xl border p-4 text-sm ${params.error || error ? "border-red-500/30 bg-red-500/10 text-red-100" : "border-brand/30 bg-brand/10 text-brand"}`}>
          {params.error ?? error ?? params.message}
        </div>
      )}

      {!reports.length ? (
        <MotionSection className="card-surface rounded-[32px] p-10 text-center">
          <p className="text-xl font-bold text-white">No reports found.</p>
          <p className="mt-2 text-sm text-slate-400">User reports will appear here for moderation.</p>
        </MotionSection>
      ) : (
        <MotionSection className="grid gap-4">
          {reports.map((report) => (
            <div key={report.id} className="card-surface rounded-[28px] p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-lg font-bold text-white">{report.prompt_title ?? "Deleted prompt"}</p>
                    <span className={`rounded-full border px-3 py-0.5 text-xs font-bold uppercase ${
                      report.status === "resolved" ? "border-brand/30 bg-brand/10 text-brand" :
                      report.status === "dismissed" ? "border-slate-500/30 bg-slate-500/10 text-slate-300" :
                      "border-red-500/30 bg-red-500/10 text-red-100"
                    }`}>{report.status}</span>
                    {report.prompt_hidden ? <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-0.5 text-xs text-amber-100">Hidden</span> : null}
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{report.reason}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Reported by {report.reporter_email ?? "unknown"} &middot; {formatDate(report.created_at)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {report.status === "open" ? (
                    <>
                      <form action={resolveReport}>
                        <input type="hidden" name="id" value={report.id} />
                        <AdminSubmitButton pendingText="Resolving...">
                          <ShieldCheck className="h-4 w-4" />
                          Resolve
                        </AdminSubmitButton>
                      </form>
                      <form action={hideReportedPrompt}>
                        <input type="hidden" name="id" value={report.id} />
                        <input type="hidden" name="prompt_id" value={report.prompt_id} />
                        <AdminSubmitButton className="btn-ghost text-red-200" pendingText="Hiding..." confirm="Are you sure you want to hide this prompt?">
                          <EyeOff className="h-4 w-4" />
                          Hide prompt
                        </AdminSubmitButton>
                      </form>
                      <form action={dismissReport}>
                        <input type="hidden" name="id" value={report.id} />
                        <AdminSubmitButton className="btn-ghost" pendingText="Dismissing..." confirm="Are you sure you want to dismiss this report?">
                          <XCircle className="h-4 w-4" />
                          Dismiss
                        </AdminSubmitButton>
                      </form>
                    </>
                  ) : (
                    <form action={reopenReport}>
                      <input type="hidden" name="id" value={report.id} />
                      <AdminSubmitButton pendingText="Reopening...">
                        <RotateCcw className="h-4 w-4" />
                        Reopen
                      </AdminSubmitButton>
                    </form>
                  )}
                  <Link href={`/admin/prompts/${report.prompt_id}/edit`} className="btn-ghost">Edit prompt</Link>
                </div>
              </div>
            </div>
          ))}
        </MotionSection>
      )}
    </MotionMain>
  );
}
