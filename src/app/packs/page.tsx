import Link from "next/link";
import { Search } from "lucide-react";
import { MotionMain, MotionSection } from "@/frontend/components/motion-primitives";
import { PromptPackCard } from "@/frontend/components/prompt-pack-card";
import { getMvpSiteSettings, getPublicPromptPacks } from "@/backend/mvp-data";

export const revalidate = 60;

export default async function PacksPage({ searchParams }: { searchParams: Promise<{ category?: string; type?: string; q?: string }> }) {
  const params = await searchParams;
  const settings = await getMvpSiteSettings();
  const packs = await getPublicPromptPacks({
    category: params.category,
    free: params.type === "free" ? "free" : params.type === "paid" ? "paid" : undefined,
    search: params.q
  });

  return (
    <MotionMain className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <MotionSection className="panel rounded-[34px] p-6 text-center sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Prompt pack store</p>
        <h1 className="hero-title mt-3 text-4xl font-black sm:text-5xl">Coding prompt packs</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-400">
          Browse copy-ready prompts for Codex, Cursor, Lovable, Replit, Bolt, Claude, and ChatGPT.
        </p>

        <form className="mx-auto mt-6 grid max-w-3xl gap-3 md:grid-cols-[1fr_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input className="field pl-11" name="q" defaultValue={params.q ?? ""} placeholder="Search packs, tools, stack..." />
          </label>
          <button className="btn-primary">Search</button>
        </form>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link href="/packs" className={!params.type && !params.category ? "btn-primary" : "btn-ghost"}>All</Link>
          <Link href="/packs?type=free" className={params.type === "free" ? "btn-primary" : "btn-ghost"}>Free</Link>
          <Link href="/packs?type=paid" className={params.type === "paid" ? "btn-primary" : "btn-ghost"}>Premium</Link>
          {settings.categories.map((category) => (
            <Link key={category} href={`/packs?category=${encodeURIComponent(category)}`} className={params.category === category ? "btn-primary" : "btn-ghost"}>
              {category}
            </Link>
          ))}
        </div>
      </MotionSection>

      <MotionSection className="mt-10">
        {packs.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {packs.map((pack) => <PromptPackCard key={pack.id} pack={pack} />)}
          </div>
        ) : (
          <div className="card-surface rounded-[32px] p-10 text-center">
            <p className="text-xl font-bold text-white">No prompt packs found.</p>
            <p className="mt-2 text-sm text-slate-400">Try another category or ask admin to add approved packs.</p>
          </div>
        )}
      </MotionSection>
    </MotionMain>
  );
}