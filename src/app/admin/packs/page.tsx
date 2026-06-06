import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Trash2, XCircle } from "lucide-react";
import { AdminTabs } from "@/components/admin-tabs";
import { AdminSubmitButton } from "@/components/admin-action-button";
import { AdminFlashToast } from "@/components/admin-flash-toast";
import { MotionMain, MotionSection } from "@/components/motion-primitives";
import { approvePack, deletePack, rejectPack } from "@/lib/admin-actions";
import { getAdminPacks } from "@/lib/admin-data";

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

export default async function AdminPacksPage({ searchParams }: { searchParams: Promise<{ status?: string; message?: string; error?: string }> }) {
  const params = await searchParams;
  const { packs, error, activeStatus } = await getAdminPacks(params.status);

  return (
    <MotionMain className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <AdminTabs active="Packs" />
      <AdminFlashToast message={params.message} error={params.error ?? error ?? undefined} />
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Admin console</p>
          <h1 className="hero-title mt-2 text-3xl font-black">Prompt packs</h1>
          <p className="mt-2 text-sm text-slate-400">Review creator packs. Paid packs require at least 5 prompts before approval.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin" className="btn-ghost">Admin home</Link>
          {filters.map((filter) => (
            <Link key={filter} href={filter === "all" ? "/admin/packs" : "/admin/packs?status=" + filter} className={activeStatus === filter ? "btn-primary" : "btn-ghost"}>
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

      {!packs.length ? (
        <MotionSection className="card-surface rounded-[32px] p-10 text-center">
          <p className="text-xl font-bold text-white">No packs found.</p>
          <p className="mt-2 text-sm text-slate-400">Creator packs will appear here when submitted.</p>
        </MotionSection>
      ) : (
        <MotionSection className="grid gap-5">
          {packs.map((pack) => (
            <article key={pack.id} className="card-surface overflow-hidden rounded-[32px] transition duration-500 hover:-translate-y-1 hover:border-brand/40">
              <div className="grid gap-0 lg:grid-cols-[260px_1fr]">
                <div className="relative aspect-[4/3] bg-black/40 lg:aspect-auto">
                  {pack.cover_image ? (
                    <Image src={pack.cover_image} alt={pack.title} fill className="object-cover" sizes="(min-width:1024px) 260px, 100vw" />
                  ) : (
                    <div className="grid h-full min-h-[200px] place-items-center bg-brand/5 px-6 text-center text-sm text-slate-400">No cover image</div>
                  )}
                </div>
                <div className="space-y-5 p-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span className={"rounded-full border px-3 py-1 text-xs font-bold uppercase " + statusClass(pack.status)}>{pack.status}</span>
                      </div>
                      <h2 className="mt-3 text-xl font-bold text-white">{pack.title}</h2>
                      <p className="mt-1 text-sm text-slate-400">{pack.creator_name ?? "Creator"} {pack.creator_email ? "(" + pack.creator_email + ")" : ""} - {formatDate(pack.created_at)}</p>
                      <p className="mt-3 text-sm leading-6 text-slate-300">{pack.description || "No description."}</p>
                    </div>
                    <div className="grid min-w-[220px] grid-cols-2 gap-2 text-xs text-slate-400">
                      <span className="rounded-xl bg-white/[0.04] p-2">Prompts: {pack.total_prompts}</span>
                      <span className="rounded-xl bg-white/[0.04] p-2">{pack.is_paid ? `Paid: ${pack.price}` : "Free"}</span>
                    </div>
                  </div>

                  {pack.rejection_reason ? <p className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-100">{pack.rejection_reason}</p> : null}

                  <div className="flex flex-wrap gap-2">
                    <form action={approvePack}>
                      <input type="hidden" name="id" value={pack.id} />
                      <input type="hidden" name="prompt_count" value={pack.total_prompts} />
                      <input type="hidden" name="price" value={pack.price} />
                      <AdminSubmitButton pendingText="Approving..."><CheckCircle2 className="h-4 w-4" /> Approve</AdminSubmitButton>
                    </form>
                    <form action={deletePack}>
                      <input type="hidden" name="id" value={pack.id} />
                      <AdminSubmitButton className="btn-ghost text-red-200" pendingText="Deleting..." confirm="Delete this pack permanently?"><Trash2 className="h-4 w-4" /> Delete</AdminSubmitButton>
                    </form>
                  </div>

                  <form action={rejectPack} className="grid gap-2 border-t border-white/10 pt-4 md:grid-cols-[1fr_auto]">
                    <input type="hidden" name="id" value={pack.id} />
                    <input className="field" name="rejection_reason" placeholder="Rejection reason shown to creator" />
                    <AdminSubmitButton className="btn-ghost text-red-100" pendingText="Rejecting..."><XCircle className="h-4 w-4" /> Reject</AdminSubmitButton>
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
