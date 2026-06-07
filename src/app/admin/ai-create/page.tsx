import Link from "next/link";
import { Bot, ShieldCheck } from "lucide-react";
import { AdminAiCreateWorkspace } from "@/components/admin-ai-create-workspace";
import { AdminTabs } from "@/components/admin-tabs";
import { MotionMain, MotionSection } from "@/components/motion-primitives";
import { requireAdmin } from "@/lib/admin-data";
import { hasSupabaseEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function AdminAiCreatePage() {
  if (hasSupabaseEnv) {
    await requireAdmin("/admin/ai-create");
  }

  return (
    <MotionMain className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <AdminTabs active="AI Create" />

      <MotionSection className="card-surface mb-8 overflow-hidden rounded-[32px] p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-brand">
              <Bot className="h-4 w-4" />
              Admin automation lab
            </p>
            <h1 className="hero-title mt-3 text-3xl font-black sm:text-5xl">Create prompt drafts from one idea</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
              Generate complete prompt listing drafts with idea-based image previews, edit each draft, remove weak ideas, then save selected drafts as pending prompts.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/prompts?status=pending" className="btn-ghost">
              <ShieldCheck className="h-4 w-4" />
              Pending prompts
            </Link>
            <Link href="/admin" className="btn-ghost">
              Admin home
            </Link>
          </div>
        </div>

        {!hasSupabaseEnv ? (
          <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
            Supabase is not configured, so this page is running in demo mode. Saving will log drafts in the browser console instead of writing to the database.
          </div>
        ) : null}
      </MotionSection>

      <AdminAiCreateWorkspace demoMode={!hasSupabaseEnv} />
    </MotionMain>
  );
}
