import Link from "next/link";
import { createCreatorPack } from "@/backend/actions/creators";
import { requireDashboardUser } from "@/backend/data/creators";

export const dynamic = "force-dynamic";

export default async function NewPackPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  const params = await searchParams;
  await requireDashboardUser("/dashboard/packs/new");

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Creator studio</p>
          <h1 className="mt-2 text-3xl font-black text-white">Create prompt pack</h1>
          <p className="mt-2 text-sm text-slate-400">Submit a pack for admin review. Paid packs require at least 5 prompts.</p>
        </div>
        <Link href="/dashboard" className="btn-ghost">Dashboard</Link>
      </div>

      <form action={createCreatorPack} className="card-surface grid gap-5 rounded-[28px] p-6 sm:p-8">
        {(params.message || params.error) ? (
          <div className={"rounded-2xl border p-4 text-sm " + (params.error ? "border-red-500/30 bg-red-500/10 text-red-100" : "border-brand/30 bg-brand/10 text-brand")}>
            {params.error ?? params.message}
          </div>
        ) : null}

        <label className="block space-y-2">
          <span className="label">Pack title</span>
          <input className="field" name="title" required minLength={3} maxLength={160} placeholder="Premium portrait prompt pack" />
        </label>

        <label className="block space-y-2">
          <span className="label">Description</span>
          <textarea className="field min-h-24" name="description" maxLength={500} placeholder="What creators get in this pack." />
        </label>

        <label className="block space-y-2">
          <span className="label">Cover image URL</span>
          <input className="field" name="cover_image" type="url" placeholder="https://example.com/cover.jpg" />
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="label">Total prompts</span>
            <input className="field" name="total_prompts" type="number" min="0" step="1" defaultValue="5" required />
          </label>
          <label className="block space-y-2">
            <span className="label">Price</span>
            <input className="field" name="price" type="number" min="0" step="0.01" defaultValue="0" required />
          </label>
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-white/10 pt-5">
          <Link href="/dashboard" className="btn-ghost">Cancel</Link>
          <button className="btn-primary">Submit pack for review</button>
        </div>
      </form>
    </main>
  );
}
