import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Edit3, Star, Trash2, XCircle } from "lucide-react";
import { AdminSubmitButton } from "@/components/admin-action-button";
import { approvePrompt, deletePrompt, rejectPrompt, toggleFeaturedPrompt } from "@/lib/admin-actions";
import { getAdminPrompts } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

const filters = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" }
];

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

export default async function AdminPromptsPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; message?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { prompts, error, activeStatus, counts, diagnostics } = await getAdminPrompts(params.status);
  const hasHiddenPendingProblem = activeStatus === "pending" && !prompts.length && counts.pending > 0;

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Admin console</p>
          <h1 className="mt-2 text-3xl font-black text-white">Prompt moderation</h1>
          <p className="mt-2 text-sm text-slate-400">Review every real prompt in Supabase and control its publication state.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin" className="btn-ghost">Admin home</Link>
          {filters.map((filter) => (
            <Link
              key={filter.value}
              href={filter.value === "all" ? "/admin/prompts" : `/admin/prompts?status=${filter.value}`}
              className={activeStatus === filter.value ? "btn-primary" : "btn-ghost"}
            >
              {filter.label} <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{counts[filter.value as keyof typeof counts] ?? 0}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
        Showing {diagnostics.renderedCount} prompts. Pending in database: {diagnostics.pendingCount}. Admin service:{" "}
        {diagnostics.usingServiceRole ? "configured" : "not configured"}.
        {diagnostics.serviceWarning ? <span className="mt-2 block text-amber-200">{diagnostics.serviceWarning}</span> : null}
      </div>

      {(params.message || params.error || error) && (
        <div className={`mb-6 rounded-2xl border p-4 text-sm ${params.error || error ? "border-red-500/30 bg-red-500/10 text-red-100" : "border-brand/30 bg-brand/10 text-brand"}`}>
          {params.error ?? error ?? params.message}
        </div>
      )}

      {hasHiddenPendingProblem ? (
        <section className="card-surface rounded-[28px] p-10 text-center">
          <p className="text-xl font-bold text-white">Pending prompts exist, but this page could not load them.</p>
          <p className="mt-2 text-sm text-slate-400">Check the admin service configuration and Supabase RLS policies instead of approving blindly.</p>
        </section>
      ) : !prompts.length ? (
        <section className="card-surface rounded-[28px] p-10 text-center">
          <p className="text-xl font-bold text-white">No prompts found.</p>
          <p className="mt-2 text-sm text-slate-400">When creators submit prompts, they will appear here for moderation.</p>
        </section>
      ) : (
        <section className="grid gap-5">
          {prompts.map((prompt) => (
            <article key={prompt.id} className="card-surface overflow-hidden rounded-[28px]">
              <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
                <div className="relative aspect-[4/3] bg-black/40 lg:aspect-auto">
                  {prompt.image_url ? (
                    <Image src={prompt.image_url} alt={prompt.title || "Prompt image"} fill className="object-cover" sizes="(min-width:1024px) 280px, 100vw" />
                  ) : (
                    <div className="grid h-full min-h-[220px] place-items-center bg-brand/5 px-6 text-center text-sm text-slate-400">
                      Text-only prompt
                    </div>
                  )}
                  <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${statusClass(prompt.status)}`}>{prompt.status}</span>
                    {prompt.featured ? <span className="rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-bold text-brand">Featured</span> : null}
                  </div>
                </div>

                <div className="space-y-5 p-5">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white">{prompt.title || "Untitled prompt"}</h2>
                      <p className="mt-1 text-sm text-slate-400">
                        {prompt.creator_name ?? "Creator"} {prompt.creator_email ? `(${prompt.creator_email})` : ""} · {formatDate(prompt.created_at)}
                      </p>
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-300">{prompt.description || prompt.prompt_text}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-slate-400 xl:min-w-[260px]">
                      <span className="rounded-xl bg-white/[0.04] p-2">Views: {prompt.view_count ?? 0}</span>
                      <span className="rounded-xl bg-white/[0.04] p-2">Copies: {prompt.copy_count ?? 0}</span>
                      <span className="rounded-xl bg-white/[0.04] p-2">{prompt.aspect_ratio ?? "1:1"}</span>
                    </div>
                  </div>

                  {prompt.rejection_reason ? (
                    <p className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-100">{prompt.rejection_reason}</p>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    <form action={approvePrompt}>
                      <input type="hidden" name="id" value={prompt.id} />
                      <AdminSubmitButton pendingText="Approving...">
                        <CheckCircle2 className="h-4 w-4" />
                        Approve
                      </AdminSubmitButton>
                    </form>

                    <form action={toggleFeaturedPrompt}>
                      <input type="hidden" name="id" value={prompt.id} />
                      <input type="hidden" name="featured" value={String(!prompt.featured)} />
                      <AdminSubmitButton pendingText="Saving...">
                        <Star className="h-4 w-4" />
                        {prompt.featured ? "Unfeature" : "Feature"}
                      </AdminSubmitButton>
                    </form>

                    <Link href={`/admin/prompts/${prompt.id}/edit`} className="btn-ghost">
                      <Edit3 className="h-4 w-4" />
                      Edit
                    </Link>

                    <form action={deletePrompt}>
                      <input type="hidden" name="id" value={prompt.id} />
                      <AdminSubmitButton className="btn-ghost text-red-200" pendingText="Deleting..." confirm="Delete this prompt permanently?">
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </AdminSubmitButton>
                    </form>
                  </div>

                  <form action={rejectPrompt} className="grid gap-2 border-t border-white/10 pt-4 md:grid-cols-[1fr_auto]">
                    <input type="hidden" name="id" value={prompt.id} />
                    <input className="field" name="rejection_reason" placeholder="Rejection reason shown to creator" />
                    <AdminSubmitButton className="btn-ghost text-red-100" pendingText="Rejecting...">
                      <XCircle className="h-4 w-4" />
                      Reject
                    </AdminSubmitButton>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
