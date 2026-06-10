import { Suspense } from "react";
import Link from "next/link";
import { Bot, Boxes, CreditCard, ShieldCheck, Sparkles, UsersRound } from "lucide-react";
import { AdminTabs } from "@/frontend/components/admin-tabs";
import { MotionMain, MotionSection } from "@/frontend/components/motion-primitives";
import { requireAdmin } from "@/backend/data/admin";

export const dynamic = "force-dynamic";

function StatSkeleton() {
  return <div className="card-surface rounded-[24px] p-5"><div className="h-3 w-24 animate-pulse rounded bg-white/10" /><div className="mt-3 h-8 w-16 animate-pulse rounded bg-white/10" /></div>;
}

function StatsSectionSkeleton() {
  return (
    <MotionSection className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 13 }).map((_, i) => <StatSkeleton key={i} />)}
    </MotionSection>
  );
}

function SettingsFormSkeleton() {
  return (
    <MotionSection className="card-surface mt-8 rounded-[32px] p-6 sm:p-8">
      <div className="mb-5">
        <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
        <div className="mt-2 h-7 w-48 animate-pulse rounded bg-white/10" />
        <div className="mt-2 h-4 w-96 animate-pulse rounded bg-white/10" />
      </div>
      <div className="grid gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="block space-y-2">
            <div className="h-3 w-20 animate-pulse rounded bg-white/10" />
            <div className="field h-10 animate-pulse rounded bg-white/10" />
          </div>
        ))}
      </div>
    </MotionSection>
  );
}

async function AdminStatsSection() {
  const { getAdminStats } = await import("@/backend/data/admin");
  const stats = await getAdminStats();
  return (
    <MotionSection className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div className="card-surface rounded-[24px] p-5"><p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Total prompts</p><p className="mt-3 text-3xl font-black text-white">{stats.totalPrompts}</p></div>
      <div className="card-surface rounded-[24px] p-5"><p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Pending</p><p className="mt-3 text-3xl font-black text-white">{stats.pendingPrompts}</p></div>
      <div className="card-surface rounded-[24px] p-5"><p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Approved</p><p className="mt-3 text-3xl font-black text-white">{stats.approvedPrompts}</p></div>
      <div className="card-surface rounded-[24px] p-5"><p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Rejected</p><p className="mt-3 text-3xl font-black text-white">{stats.rejectedPrompts}</p></div>
      <div className="card-surface rounded-[24px] p-5"><p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Featured</p><p className="mt-3 text-3xl font-black text-white">{stats.featuredPrompts}</p></div>
      <div className="card-surface rounded-[24px] p-5"><p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Deleted</p><p className="mt-3 text-3xl font-black text-white">{stats.deletedPrompts}</p></div>
      <div className="card-surface rounded-[24px] p-5"><p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Users</p><p className="mt-3 text-3xl font-black text-white">{stats.totalUsers}</p></div>
      <div className="card-surface rounded-[24px] p-5"><p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Creators</p><p className="mt-3 text-3xl font-black text-white">{stats.totalCreators}</p></div>
      <div className="card-surface rounded-[24px] p-5"><p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Copies</p><p className="mt-3 text-3xl font-black text-white">{stats.totalCopies}</p></div>
      <div className="card-surface rounded-[24px] p-5"><p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Saves</p><p className="mt-3 text-3xl font-black text-white">{stats.totalSaves}</p></div>
      <div className="card-surface rounded-[24px] p-5"><p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Paid packs</p><p className="mt-3 text-3xl font-black text-white">{stats.totalPaidPacks}</p></div>
      <div className="card-surface rounded-[24px] p-5"><p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Payment requests</p><p className="mt-3 text-3xl font-black text-white">{stats.totalPaymentRequests}</p></div>
      <div className="card-surface rounded-[24px] p-5"><p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Approved sales</p><p className="mt-3 text-3xl font-black text-white">{stats.totalApprovedSales}</p></div>
    </MotionSection>
  );
}

async function AdminSettingsForm() {
  const { getAdminSiteSettings } = await import("@/backend/data/admin");
  const { updateSiteSettings } = await import("@/backend/actions/admin");
  const settings = await getAdminSiteSettings();
  return (
    <MotionSection className="card-surface mt-8 rounded-[32px] p-6 sm:p-8">
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Site content</p>
        <h2 className="mt-2 text-2xl font-bold text-white">Edit website text</h2>
        <p className="mt-2 text-sm text-slate-400">Update core homepage, logo, and footer wording from the admin panel.</p>
      </div>
      <form action={updateSiteSettings} className="grid gap-4">
        <label className="block space-y-2"><span className="label">Website name</span><input className="field" name="website_name" defaultValue={settings.website_name} required /></label>
        <label className="block space-y-2"><span className="label">Logo text</span><input className="field" name="logo_text" defaultValue={settings.logo_text} required /></label>
        <label className="block space-y-2"><span className="label">Hero headline</span><input className="field" name="hero_headline" defaultValue={settings.hero_headline} required /></label>
        <label className="block space-y-2"><span className="label">Hero subheadline</span><textarea className="field min-h-24" name="hero_subheadline" defaultValue={settings.hero_subheadline} required /></label>
        <label className="block space-y-2"><span className="label">Footer text</span><input className="field" name="footer_text" defaultValue={settings.footer_text} required /></label>
        <label className="block space-y-2"><span className="label">CTA text</span><input className="field" name="cta_text" defaultValue={settings.cta_text} required /></label>
        <label className="block space-y-2"><span className="label">Empty state title</span><input className="field" name="empty_state_title" defaultValue={settings.empty_state_title} required /></label>
        <label className="block space-y-2"><span className="label">Empty state message</span><input className="field" name="empty_state_message" defaultValue={settings.empty_state_message} required /></label>
        <div><button className="btn-primary">Save site text</button></div>
      </form>
    </MotionSection>
  );
}

export default async function AdminPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const params = await searchParams;
  await requireAdmin("/admin");

  return (
    <MotionMain className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <AdminTabs active="Overview" />
      <MotionSection className="card-surface rounded-[32px] p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Admin console</p>
            <h1 className="hero-title mt-2 text-3xl font-black">PromptVault moderation</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">Real production metrics from Supabase. No demo stats or fake moderation data.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/ai-create" className="btn-primary"><Bot className="h-4 w-4" />AI create</Link>
            <Link href="/admin/prompts" className="btn-primary"><Sparkles className="h-4 w-4" />Manage prompts</Link>
            <Link href="/admin/users" className="btn-ghost"><UsersRound className="h-4 w-4" />Manage users</Link>
            <Link href="/admin/packs" className="btn-ghost"><Boxes className="h-4 w-4" />Packs</Link>
            <Link href="/admin/payments" className="btn-ghost"><CreditCard className="h-4 w-4" />Payments</Link>
          </div>
        </div>
        {(params.message || params.error) && (
          <div className={`mt-6 rounded-2xl border p-4 text-sm ${params.error ? "border-red-500/30 bg-red-500/10 text-red-100" : "border-brand/30 bg-brand/10 text-brand"}`}>
            {params.error ?? params.message}
          </div>
        )}
      </MotionSection>

      <Suspense fallback={<StatsSectionSkeleton />}>
        <AdminStatsSection />
      </Suspense>

      <MotionSection className="mt-8 grid gap-5 lg:grid-cols-2">
        <Link href="/admin/prompts?status=pending" className="card-surface group rounded-[28px] p-6 transition hover:border-brand/40"><ShieldCheck className="h-8 w-8 text-brand" /><h2 className="mt-4 text-2xl font-bold text-white">Review pending prompts</h2><p className="mt-2 text-sm text-slate-400">Approve, reject with a reason, feature, edit, or delete creator submissions.</p></Link>
        <Link href="/admin/users" className="card-surface group rounded-[28px] p-6 transition hover:border-brand/40"><UsersRound className="h-8 w-8 text-brand" /><h2 className="mt-4 text-2xl font-bold text-white">Manage user roles</h2><p className="mt-2 text-sm text-slate-400">View real profiles and change users between user, creator, and admin roles.</p></Link>
        <Link href="/admin/packs?status=pending" className="card-surface group rounded-[28px] p-6 transition hover:border-brand/40"><Boxes className="h-8 w-8 text-brand" /><h2 className="mt-4 text-2xl font-bold text-white">Review prompt packs</h2><p className="mt-2 text-sm text-slate-400">Approve or reject creator packs. Paid packs must include at least 5 prompts.</p></Link>
        <Link href="/admin/payments?status=pending" className="card-surface group rounded-[28px] p-6 transition hover:border-brand/40"><CreditCard className="h-8 w-8 text-brand" /><h2 className="mt-4 text-2xl font-bold text-white">Approve payments</h2><p className="mt-2 text-sm text-slate-400">Review manual payment requests and grant paid pack access.</p></Link>
      </MotionSection>

      <Suspense fallback={<SettingsFormSkeleton />}>
        <AdminSettingsForm />
      </Suspense>
    </MotionMain>
  );
}
