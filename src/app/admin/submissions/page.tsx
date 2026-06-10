import Link from "next/link";
import { AdminTabs } from "@/frontend/components/admin-tabs";
import { MotionMain, MotionSection } from "@/frontend/components/motion-primitives";
import { getAdminPrompts } from "@/backend/data/admin";

export const dynamic = "force-dynamic";

export default async function AdminSubmissionsPage() {
  const { prompts, error } = await getAdminPrompts("pending");

  return (
    <MotionMain className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <AdminTabs active="Submissions" />
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Admin console</p>
        <h1 className="hero-title mt-2 text-3xl font-black">Pending submissions</h1>
        <p className="mt-2 text-sm text-slate-400">New creator submissions waiting for review.</p>
      </div>
      {error ? <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">{error}</div> : null}
      {!prompts.length ? (
        <MotionSection className="card-surface rounded-[32px] p-10 text-center">
          <p className="text-xl font-bold text-white">No pending submissions.</p>
          <p className="mt-2 text-sm text-slate-400">Creator submissions will appear here immediately after upload.</p>
        </MotionSection>
      ) : (
        <MotionSection className="grid gap-4">
          {prompts.map((prompt) => (
            <Link key={prompt.id} href={`/admin/prompts/${prompt.id}/edit`} className="card-surface rounded-[28px] p-5 transition duration-500 hover:-translate-y-1 hover:border-brand/40">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-lg font-bold text-white">{prompt.title}</p>
                  <p className="text-sm text-slate-400">{prompt.creator_name ?? "Creator"} {prompt.creator_email ? `(${prompt.creator_email})` : ""}</p>
                </div>
                <span className="status-pill border-amber-500/30 bg-amber-500/10 text-amber-100">pending</span>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-slate-300">{prompt.description || prompt.prompt_text}</p>
            </Link>
          ))}
        </MotionSection>
      )}
    </MotionMain>
  );
}
