import { AdminTabs } from "@/components/admin-tabs";
import { toggleTag, upsertTag } from "@/lib/admin-actions";
import { getAdminTags } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

export default async function AdminTagsPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  const params = await searchParams;
  const { tags, error } = await getAdminTags();

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <AdminTabs active="Tags" />
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Admin console</p>
        <h1 className="mt-2 text-3xl font-black text-white">Tags</h1>
        <p className="mt-2 text-sm text-slate-400">Manage searchable creator tags.</p>
      </div>
      {(params.message || params.error || error) ? (
        <div className={`mb-6 rounded-2xl border p-4 text-sm ${params.error || error ? "border-red-500/30 bg-red-500/10 text-red-100" : "border-brand/30 bg-brand/10 text-brand"}`}>
          {params.error ?? error ?? params.message}
        </div>
      ) : null}
      <form action={upsertTag} className="card-surface mb-6 grid gap-4 rounded-[24px] p-5 md:grid-cols-[1fr_1fr_auto]">
        <input className="field" name="name" placeholder="Tag name" required />
        <input className="field" name="slug" placeholder="slug optional" />
        <label className="flex items-center gap-2 text-sm text-slate-300"><input name="is_active" type="checkbox" defaultChecked className="accent-brand" /> Active</label>
        <textarea className="field md:col-span-2" name="description" placeholder="Description optional" />
        <button className="btn-primary">Add tag</button>
      </form>
      <section className="grid gap-4">
        {tags.map((tag) => (
          <article key={tag.id} className="card-surface rounded-[24px] p-5">
            <form action={upsertTag} className="grid gap-3 lg:grid-cols-[1fr_1fr_120px_auto]">
              <input type="hidden" name="id" value={tag.id} />
              <input className="field" name="name" defaultValue={tag.name} required />
              <input className="field" name="slug" defaultValue={tag.slug} required />
              <label className="flex items-center gap-2 text-sm text-slate-300"><input name="is_active" type="checkbox" defaultChecked={tag.is_active} className="accent-brand" /> Active</label>
              <button className="btn-primary">Save</button>
              <textarea className="field lg:col-span-3" name="description" defaultValue={tag.description ?? ""} />
            </form>
            <form action={toggleTag} className="mt-3">
              <input type="hidden" name="id" value={tag.id} />
              <input type="hidden" name="is_active" value={String(!tag.is_active)} />
              <button className="btn-ghost">{tag.is_active ? "Disable" : "Restore"}</button>
            </form>
          </article>
        ))}
      </section>
    </main>
  );
}
