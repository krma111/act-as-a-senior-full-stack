import Link from "next/link";
import { CreditCard, PackagePlus, Settings, ShoppingBag } from "lucide-react";
import { AdminTabs } from "@/frontend/components/admin-tabs";
import { MotionMain, MotionSection } from "@/frontend/components/motion-primitives";
import { getMvpAdminStats } from "@/backend/mvp-data";
import { requireAdmin } from "@/backend/data/admin";

export const dynamic = "force-dynamic";

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="card-surface rounded-[24px] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">{label}</p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  const params = await searchParams;
  await requireAdmin("/admin");
  const stats = await getMvpAdminStats();

  return (
    <MotionMain className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <AdminTabs active="Overview" />
      <MotionSection className="card-surface rounded-[32px] p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Admin console</p>
            <h1 className="hero-title mt-2 text-3xl font-black">PromptVault MVP control center</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">Manage coding prompt packs, UPI payment settings, and buyer orders from one simple dashboard.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/packs" className="btn-primary"><PackagePlus className="h-4 w-4" /> Manage packs</Link>
            <Link href="/admin/payments" className="btn-ghost"><CreditCard className="h-4 w-4" /> Orders</Link>
            <Link href="/admin/settings" className="btn-ghost"><Settings className="h-4 w-4" /> Settings</Link>
          </div>
        </div>
        {(params.message || params.error) && (
          <div className={`mt-6 rounded-2xl border p-4 text-sm ${params.error ? "border-red-500/30 bg-red-500/10 text-red-100" : "border-brand/30 bg-brand/10 text-brand"}`}>
            {params.error ?? params.message}
          </div>
        )}
      </MotionSection>

      <MotionSection className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total packs" value={stats.totalPacks} />
        <StatCard label="Free packs" value={stats.freePacks} />
        <StatCard label="Premium packs" value={stats.paidPacks} />
        <StatCard label="Orders" value={stats.totalOrders} />
        <StatCard label="Pending payment" value={stats.pendingOrders} />
        <StatCard label="Paid orders" value={stats.paidOrders} />
        <StatCard label="Delivered" value={stats.deliveredOrders} />
        <StatCard label="Revenue" value={`INR ${Math.round(stats.revenue).toLocaleString("en-IN")}`} />
      </MotionSection>

      <MotionSection className="mt-8 grid gap-5 md:grid-cols-3">
        <Link href="/admin/packs" className="card-surface rounded-[28px] p-6 transition hover:border-brand/40">
          <PackagePlus className="h-8 w-8 text-brand" />
          <h2 className="mt-4 text-2xl font-bold text-white">Add and edit packs</h2>
          <p className="mt-2 text-sm text-slate-400">Create free or premium coding prompt packs with preview and locked full content.</p>
        </Link>
        <Link href="/admin/payments" className="card-surface rounded-[28px] p-6 transition hover:border-brand/40">
          <ShoppingBag className="h-8 w-8 text-brand" />
          <h2 className="mt-4 text-2xl font-bold text-white">Manage orders</h2>
          <p className="mt-2 text-sm text-slate-400">Track buyer emails, mark payment status, and deliver full prompt content.</p>
        </Link>
        <Link href="/admin/settings" className="card-surface rounded-[28px] p-6 transition hover:border-brand/40">
          <Settings className="h-8 w-8 text-brand" />
          <h2 className="mt-4 text-2xl font-bold text-white">Payment and homepage</h2>
          <p className="mt-2 text-sm text-slate-400">Update UPI ID, QR code URL, admin email, homepage copy, and categories.</p>
        </Link>
      </MotionSection>
    </MotionMain>
  );
}