import { AdminTabs } from "@/frontend/components/admin-tabs";
import { upsertCategory, toggleCategory } from "@/backend/actions/admin";
import { getAdminCategories } from "@/backend/data/admin";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  const params = await searchParams;
  const { categories, error } = await getAdminCategories();

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <AdminTabs active="Categories" />
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Admin console</p>
        <h1 className="mt-2 text-3xl font-black text-white">Categories</h1>
        <p className="mt-2 text-sm text-slate-400">Add, edit, disable, or restore public category labels.</p>
      </div>
      {(params.message || params.error || error) ? (
        <div className={`mb-6 rounded-2xl border p-4 text-sm ${params.error || error ? "border-red-500/30 bg-red-500/10 text-red-100" : "border-brand/30 bg-brand/10 text-brand"}`}>
          {params.error ?? error ?? params.message}
        </div>
      ) : null}
      <form action={upsertCategory} className="card-surface mb-6 grid gap-4 rounded-[24px] p-5 md:grid-cols-[1fr_1fr_1fr_auto]">
        <input className="field" name="name" placeholder="Category name" required />
        <input className="field" name="slug" placeholder="slug optional" />
        <input className="field" name="sort_order" type="number" min="0" defaultValue="0" />
        <label className="flex items-center gap-2 text-sm text-slate-300"><input name="is_active" type="checkbox" defaultChecked className="accent-brand" /> Active</label>
        <textarea className="field md:col-span-3" name="description" placeholder="Description optional" />
        <button className="btn-primary">Add category</button>
      </form>
      <section className="grid gap-4">
        {categories.map((category) => (
          <article key={category.id} className="card-surface rounded-[24px] p-5">
            <form action={upsertCategory} className="grid gap-3 lg:grid-cols-[1fr_1fr_90px_120px_auto]">
              <input type="hidden" name="id" value={category.id} />
              <input className="field" name="name" defaultValue={category.name} required />
              <input className="field" name="slug" defaultValue={category.slug} required />
              <input className="field" name="sort_order" type="number" min="0" defaultValue={category.sort_order ?? 0} />
              <label className="flex items-center gap-2 text-sm text-slate-300"><input name="is_active" type="checkbox" defaultChecked={category.is_active ?? true} className="accent-brand" /> Active</label>
              <button className="btn-primary">Save</button>
              <textarea className="field lg:col-span-4" name="description" defaultValue={category.description ?? ""} />
            </form>
            <form action={toggleCategory} className="mt-3">
              <input type="hidden" name="id" value={category.id} />
              <input type="hidden" name="is_active" value={String(!(category.is_active ?? true))} />
              <button className="btn-ghost">{category.is_active ?? true ? "Disable" : "Restore"}</button>
            </form>
          </article>
        ))}
      </section>
    </main>
  );
}
