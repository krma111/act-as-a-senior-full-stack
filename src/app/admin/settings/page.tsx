import Link from "next/link";
import { AdminSubmitButton } from "@/frontend/components/admin-action-button";
import { AdminFlashToast } from "@/frontend/components/admin-flash-toast";
import { AdminTabs } from "@/frontend/components/admin-tabs";
import { MotionMain, MotionSection } from "@/frontend/components/motion-primitives";
import { updateMvpSettings } from "@/backend/mvp-actions";
import { getMvpSiteSettings } from "@/backend/mvp-data";
import { requireAdmin } from "@/backend/data/admin";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  const params = await searchParams;
  await requireAdmin("/admin/settings");
  const settings = await getMvpSiteSettings();

  return (
    <MotionMain className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <AdminTabs active="Site Settings" />
      <AdminFlashToast message={params.message} error={params.error} />
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Admin console</p>
          <h1 className="hero-title mt-2 text-3xl font-black">Store settings</h1>
          <p className="mt-2 text-sm text-slate-400">Update payment instructions and public homepage content without editing code.</p>
        </div>
        <Link href="/admin" className="btn-ghost">Admin home</Link>
      </div>

      {(params.message || params.error) && (
        <div className={`mb-6 rounded-2xl border p-4 text-sm ${params.error ? "border-red-500/30 bg-red-500/10 text-red-100" : "border-brand/30 bg-brand/10 text-brand"}`}>
          {params.error ?? params.message}
        </div>
      )}

      <MotionSection className="card-surface rounded-[32px] p-6 sm:p-8">
        <form action={updateMvpSettings} className="grid gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="label">Website name</span>
              <input className="field" name="website_name" defaultValue={settings.website_name} required />
            </label>
            <label className="block space-y-2">
              <span className="label">Logo text</span>
              <input className="field" name="logo_text" defaultValue={settings.logo_text} required />
            </label>
          </div>
          <label className="block space-y-2">
            <span className="label">Homepage headline</span>
            <input className="field" name="homepage_title" defaultValue={settings.homepage_title} required />
          </label>
          <label className="block space-y-2">
            <span className="label">Homepage subheadline</span>
            <textarea className="field min-h-24" name="homepage_subtitle" defaultValue={settings.homepage_subtitle} required />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="label">Admin email for payment screenshots</span>
              <input className="field" name="admin_email" type="email" defaultValue={settings.admin_email} required />
            </label>
            <label className="block space-y-2">
              <span className="label">UPI ID</span>
              <input className="field" name="upi_id" defaultValue={settings.upi_id} required />
            </label>
          </div>
          <label className="block space-y-2">
            <span className="label">UPI QR code image URL</span>
            <input className="field" name="qr_code_url" defaultValue={settings.qr_code_url ?? ""} placeholder="https://..." />
          </label>
          <label className="block space-y-2">
            <span className="label">Categories, one per line</span>
            <textarea className="field min-h-48" name="categories" defaultValue={settings.categories.join("\n")} />
          </label>
          <label className="block space-y-2">
            <span className="label">Footer text</span>
            <input className="field" name="footer_text" defaultValue={settings.footer_text} required />
          </label>
          <div>
            <AdminSubmitButton className="btn-primary" pendingText="Saving...">Save settings</AdminSubmitButton>
          </div>
        </form>
      </MotionSection>
    </MotionMain>
  );
}