import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { AdminSubmitButton } from "@/frontend/components/admin-action-button";
import { AdminFlashToast } from "@/frontend/components/admin-flash-toast";
import { AdminTabs } from "@/frontend/components/admin-tabs";
import { MotionMain, MotionSection } from "@/frontend/components/motion-primitives";
import { deleteMvpPack, upsertMvpPack } from "@/backend/mvp-actions";
import { getAdminPromptPacks, getMvpSiteSettings, promptPackCategories, type AdminPromptPack } from "@/backend/mvp-data";
import { requireAdmin } from "@/backend/data/admin";

export const dynamic = "force-dynamic";

const statusOptions = ["pending", "approved", "rejected"];
const filters = ["all", "pending", "approved", "rejected"];

function statusClass(status: string) {
  if (status === "approved") return "border-brand/30 bg-brand/10 text-brand";
  if (status === "rejected") return "border-red-500/30 bg-red-500/10 text-red-100";
  return "border-amber-500/30 bg-amber-500/10 text-amber-100";
}

function formatPrice(pack: AdminPromptPack) {
  return pack.is_free ? "Free" : `INR ${Math.round(pack.price).toLocaleString("en-IN")}`;
}

export default async function AdminPacksPage({ searchParams }: { searchParams: Promise<{ status?: string; message?: string; error?: string }> }) {
  const params = await searchParams;
  await requireAdmin("/admin/packs");
  const [settings, packResult] = await Promise.all([getMvpSiteSettings(), getAdminPromptPacks(params.status)]);
  const categories = settings.categories.length ? settings.categories : promptPackCategories;

  return (
    <MotionMain className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <AdminTabs active="Prompt Packs" />
      <AdminFlashToast message={params.message} error={params.error ?? packResult.error ?? undefined} />
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Admin console</p>
          <h1 className="hero-title mt-2 text-3xl font-black">Coding prompt packs</h1>
          <p className="mt-2 text-sm text-slate-400">Add, edit, approve, reject, or delete store packs. Public pages show only approved packs.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin" className="btn-ghost">Admin home</Link>
          {filters.map((filter) => (
            <Link key={filter} href={filter === "all" ? "/admin/packs" : `/admin/packs?status=${filter}`} className={(params.status ?? "all") === filter ? "btn-primary" : "btn-ghost"}>
              {filter[0].toUpperCase() + filter.slice(1)}
            </Link>
          ))}
        </div>
      </div>

      {(params.message || params.error || packResult.error) && (
        <div className={`mb-6 rounded-2xl border p-4 text-sm ${params.error || packResult.error ? "border-red-500/30 bg-red-500/10 text-red-100" : "border-brand/30 bg-brand/10 text-brand"}`}>
          {params.error ?? packResult.error ?? params.message}
        </div>
      )}

      <MotionSection className="card-surface rounded-[32px] p-6 sm:p-8">
        <div className="mb-5 flex items-center gap-3">
          <Plus className="h-6 w-6 text-brand" />
          <div>
            <h2 className="text-2xl font-bold text-white">Add new prompt pack</h2>
            <p className="mt-1 text-sm text-slate-400">Use status approved to publish immediately, or pending to keep hidden.</p>
          </div>
        </div>
        <PackForm categories={categories} />
      </MotionSection>

      <MotionSection className="mt-8 grid gap-5">
        {!packResult.packs.length ? (
          <div className="card-surface rounded-[32px] p-10 text-center">
            <p className="text-xl font-bold text-white">No prompt packs found.</p>
            <p className="mt-2 text-sm text-slate-400">Create your first coding prompt pack above.</p>
          </div>
        ) : (
          packResult.packs.map((pack) => (
            <article key={pack.id} className="card-surface rounded-[32px] p-5 sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${statusClass(pack.status)}`}>{pack.status}</span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">{formatPrice(pack)}</span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">{pack.category}</span>
                  </div>
                  <h2 className="mt-3 text-2xl font-black text-white">{pack.title}</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{pack.description || "No description."}</p>
                  <p className="mt-2 text-xs text-slate-500">Slug: {pack.slug}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/packs/${pack.slug}`} className="btn-ghost">View public page</Link>
                  <form action={deleteMvpPack}>
                    <input type="hidden" name="id" value={pack.id} />
                    <AdminSubmitButton className="btn-ghost text-red-100" pendingText="Deleting..." confirm="Delete this prompt pack?">
                      <Trash2 className="h-4 w-4" /> Delete
                    </AdminSubmitButton>
                  </form>
                </div>
              </div>

              <details className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-4">
                <summary className="cursor-pointer text-sm font-bold text-brand">Edit pack</summary>
                <div className="mt-5">
                  <PackForm pack={pack} categories={categories} />
                </div>
              </details>
            </article>
          ))
        )}
      </MotionSection>
    </MotionMain>
  );
}

function PackForm({ pack, categories }: { pack?: AdminPromptPack; categories: string[] }) {
  return (
    <form action={upsertMvpPack} className="grid gap-4">
      {pack ? <input type="hidden" name="id" value={pack.id} /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-2">
          <span className="label">Title</span>
          <input className="field" name="title" defaultValue={pack?.title ?? ""} required minLength={3} />
        </label>
        <label className="block space-y-2">
          <span className="label">Slug</span>
          <input className="field" name="slug" defaultValue={pack?.slug ?? ""} placeholder="auto-generated if blank" />
        </label>
      </div>
      <label className="block space-y-2">
        <span className="label">Short description</span>
        <textarea className="field min-h-24" name="description" defaultValue={pack?.description ?? ""} />
      </label>
      <div className="grid gap-4 md:grid-cols-4">
        <label className="block space-y-2 md:col-span-2">
          <span className="label">Category</span>
          <select className="field" name="category" defaultValue={pack?.category ?? categories[0]}>
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </label>
        <label className="block space-y-2">
          <span className="label">Price INR</span>
          <input className="field" name="price" type="number" min="0" step="1" defaultValue={pack?.price ?? 0} />
        </label>
        <label className="block space-y-2">
          <span className="label">Status</span>
          <select className="field" name="status" defaultValue={pack?.status ?? "pending"}>
            {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </label>
      </div>
      <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
        <input name="is_free" type="checkbox" defaultChecked={pack?.is_free ?? false} />
        Free pack. Show copy buttons publicly.
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-2">
          <span className="label">Tools supported comma-separated</span>
          <input className="field" name="tools_supported" defaultValue={(pack?.tools_supported?.length ? pack.tools_supported : ["Codex", "Cursor", "Lovable", "Replit", "Bolt", "Claude", "ChatGPT"]).join(", ")} />
        </label>
        <label className="block space-y-2">
          <span className="label">Tech stack comma-separated</span>
          <input className="field" name="tech_stack" defaultValue={(pack?.tech_stack?.length ? pack.tech_stack : ["React", "Next.js", "Supabase", "Tailwind", "Vercel"]).join(", ")} />
        </label>
      </div>
      <label className="block space-y-2">
        <span className="label">What user will get</span>
        <textarea className="field min-h-20" name="what_user_gets" defaultValue={pack?.what_user_gets ?? ""} />
      </label>
      <label className="block space-y-2">
        <span className="label">Preview prompts, one per line</span>
        <textarea className="field min-h-32" name="preview_content" defaultValue={pack?.preview_content.join("\n") ?? ""} />
      </label>
      <label className="block space-y-2">
        <span className="label">Full locked premium content</span>
        <textarea className="field min-h-44 font-mono text-xs" name="full_content" defaultValue={pack?.full_content ?? ""} />
      </label>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="block space-y-2 md:col-span-2">
          <span className="label">Cover image URL (optional)</span>
          <input className="field" name="cover_image" defaultValue={pack?.cover_image ?? ""} />
        </label>
        <label className="block space-y-2">
          <span className="label">Sort order</span>
          <input className="field" name="sort_order" type="number" defaultValue={pack?.sort_order ?? 0} />
        </label>
      </div>
      <input type="hidden" name="total_prompts" value={pack?.total_prompts ?? ""} />
      <div>
        <AdminSubmitButton className="btn-primary" pendingText="Saving...">{pack ? "Save pack" : "Create pack"}</AdminSubmitButton>
      </div>
    </form>
  );
}