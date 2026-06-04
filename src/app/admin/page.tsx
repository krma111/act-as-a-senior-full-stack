import Link from "next/link";
import { ShieldCheck, Sparkles, UsersRound } from "lucide-react";
import { updateSiteSettings } from "@/lib/admin-actions";
import { getAdminSiteSettings, getAdminStats, requireAdmin } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card-surface rounded-[24px] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">{label}</p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

export default async function AdminPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const params = await searchParams;
  await requireAdmin("/admin");
  const [stats, settings] = await Promise.all([getAdminStats(), getAdminSiteSettings()]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="card-surface rounded-[28px] p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Admin console</p>
            <h1 className="mt-2 text-3xl font-black text-white">PromptVault moderation</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">Real production metrics from Supabase. No demo stats or fake moderation data.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/prompts" className="btn-primary">
              <Sparkles className="h-4 w-4" />
              Manage prompts
            </Link>
            <Link href="/admin/users" className="btn-ghost">
              <UsersRound className="h-4 w-4" />
              Manage users
            </Link>
          </div>
        </div>

        {(params.message || params.error) && (
          <div className={`mt-6 rounded-2xl border p-4 text-sm ${params.error ? "border-red-500/30 bg-red-500/10 text-red-100" : "border-brand/30 bg-brand/10 text-brand"}`}>
            {params.error ?? params.message}
          </div>
        )}
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total prompts" value={stats.totalPrompts} />
        <StatCard label="Pending" value={stats.pendingPrompts} />
        <StatCard label="Approved" value={stats.approvedPrompts} />
        <StatCard label="Rejected" value={stats.rejectedPrompts} />
        <StatCard label="Featured" value={stats.featuredPrompts} />
        <StatCard label="Users" value={stats.totalUsers} />
        <StatCard label="Copies" value={stats.totalCopies} />
        <StatCard label="Saves" value={stats.totalSaves} />
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-2">
        <Link href="/admin/prompts?status=pending" className="card-surface group rounded-[28px] p-6 transition hover:border-brand/40">
          <ShieldCheck className="h-8 w-8 text-brand" />
          <h2 className="mt-4 text-2xl font-bold text-white">Review pending prompts</h2>
          <p className="mt-2 text-sm text-slate-400">Approve, reject with a reason, feature, edit, or delete creator submissions.</p>
        </Link>
        <Link href="/admin/users" className="card-surface group rounded-[28px] p-6 transition hover:border-brand/40">
          <UsersRound className="h-8 w-8 text-brand" />
          <h2 className="mt-4 text-2xl font-bold text-white">Manage user roles</h2>
          <p className="mt-2 text-sm text-slate-400">View real profiles and change users between user, creator, and admin roles.</p>
        </Link>
      </section>

      <section className="card-surface mt-8 rounded-[28px] p-6 sm:p-8">
        <div className="mb-5">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Site content</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Edit website text</h2>
          <p className="mt-2 text-sm text-slate-400">Update core homepage, logo, and footer wording from the admin panel.</p>
        </div>
        <form action={updateSiteSettings} className="grid gap-4">
          <label className="block space-y-2">
            <span className="label">Website name</span>
            <input className="field" name="website_name" defaultValue={settings.website_name} required />
          </label>
          <label className="block space-y-2">
            <span className="label">Logo text</span>
            <input className="field" name="logo_text" defaultValue={settings.logo_text} required />
          </label>
          <label className="block space-y-2">
            <span className="label">Hero headline</span>
            <input className="field" name="hero_headline" defaultValue={settings.hero_headline} required />
          </label>
          <label className="block space-y-2">
            <span className="label">Hero subheadline</span>
            <textarea className="field min-h-24" name="hero_subheadline" defaultValue={settings.hero_subheadline} required />
          </label>
          <label className="block space-y-2">
            <span className="label">Footer text</span>
            <input className="field" name="footer_text" defaultValue={settings.footer_text} required />
          </label>
          <div>
            <button className="btn-primary">Save site text</button>
          </div>
        </form>
      </section>
    </main>
  );
}
