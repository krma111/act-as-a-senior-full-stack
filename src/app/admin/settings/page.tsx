import { AdminTabs } from "@/frontend/components/admin-tabs";
import { updateSiteSettings } from "@/backend/actions/admin";
import { getAdminSiteSettings } from "@/backend/data/admin";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  const params = await searchParams;
  const settings = await getAdminSiteSettings();

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <AdminTabs active="Site Settings" />
      <section className="card-surface rounded-[28px] p-6 sm:p-8">
        <div className="mb-5">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Admin console</p>
          <h1 className="mt-2 text-3xl font-black text-white">Site settings</h1>
          <p className="mt-2 text-sm text-slate-400">Edit website text without touching code.</p>
        </div>
        {(params.message || params.error) ? (
          <div className={`mb-6 rounded-2xl border p-4 text-sm ${params.error ? "border-red-500/30 bg-red-500/10 text-red-100" : "border-brand/30 bg-brand/10 text-brand"}`}>
            {params.error ?? params.message}
          </div>
        ) : null}
        <form action={updateSiteSettings} className="grid gap-4">
          <label className="block space-y-2"><span className="label">Website name</span><input className="field" name="website_name" defaultValue={settings.website_name} required /></label>
          <label className="block space-y-2"><span className="label">Logo text</span><input className="field" name="logo_text" defaultValue={settings.logo_text} required /></label>
          <label className="block space-y-2"><span className="label">Hero headline</span><input className="field" name="hero_headline" defaultValue={settings.hero_headline} required /></label>
          <label className="block space-y-2"><span className="label">Hero subtitle</span><textarea className="field min-h-24" name="hero_subheadline" defaultValue={settings.hero_subheadline} required /></label>
          <label className="block space-y-2"><span className="label">CTA text</span><input className="field" name="cta_text" defaultValue={settings.cta_text} required /></label>
          <label className="block space-y-2"><span className="label">Empty state title</span><input className="field" name="empty_state_title" defaultValue={settings.empty_state_title} required /></label>
          <label className="block space-y-2"><span className="label">Empty state message</span><textarea className="field min-h-20" name="empty_state_message" defaultValue={settings.empty_state_message} required /></label>
          <label className="block space-y-2"><span className="label">Footer text</span><input className="field" name="footer_text" defaultValue={settings.footer_text} required /></label>
          <button className="btn-primary w-fit">Save settings</button>
        </form>
      </section>
    </main>
  );
}
