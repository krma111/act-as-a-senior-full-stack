import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles, TrendingUp, UploadCloud } from "lucide-react";
import { PromptGrid } from "@/components/prompt-grid";
import { SearchFilters } from "@/components/search-filters";
import { getCategories, getPrompts, getSiteSettings } from "@/lib/data";

export default async function Home({
  searchParams
}: {
  searchParams: Promise<{ q?: string; category?: string; ratio?: string }>;
}) {
  const params = await searchParams;
  const [settings, categories, featured, trending, latest] = await Promise.all([
    getSiteSettings(),
    getCategories(),
    getPrompts({ search: params.q, category: params.category, aspectRatio: params.ratio, featured: true, order: "latest", limit: 4 }),
    getPrompts({ search: params.q, category: params.category, aspectRatio: params.ratio, order: "trending", limit: 8 }),
    getPrompts({ search: params.q, category: params.category, aspectRatio: params.ratio, order: "latest", limit: 12 })
  ]);

  const totalVisiblePrompts = featured.length + trending.length + latest.length;

  return (
    <main>
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="hero-grid" />
        <div className="hero-scan" />
        <div className="hero-orb hero-orb-left" />
        <div className="hero-orb hero-orb-right" />
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 mx-auto h-72 max-w-5xl rounded-full bg-brand/10 blur-3xl" />
        <div className="mx-auto max-w-6xl text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-4 py-2 text-sm font-semibold text-brand shadow-glow">
            <Sparkles className="h-4 w-4" /> Free image prompt vault for creators
          </div>
          <h1 className="mx-auto max-w-5xl text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
            {settings.hero_headline}
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl">
            {settings.hero_subheadline}
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/prompts/new" className="btn-primary px-5 py-3">
              <UploadCloud className="h-4 w-4" /> Submit your prompt
            </Link>
            <a href="#latest" className="btn-ghost px-5 py-3">
              Explore prompts <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <div className="grid-cascade mx-auto mt-10 grid max-w-4xl gap-3 sm:grid-cols-3">
            <div className="panel rounded-2xl p-4 text-left">
              <p className="text-2xl font-black text-white">{totalVisiblePrompts}+</p>
              <p className="mt-1 text-sm text-slate-400">live prompt cards loaded</p>
            </div>
            <div className="panel rounded-2xl p-4 text-left">
              <p className="text-2xl font-black text-white">Copy-ready</p>
              <p className="mt-1 text-sm text-slate-400">prompts with real image examples</p>
            </div>
            <div className="panel rounded-2xl p-4 text-left">
              <p className="text-2xl font-black text-white">Creator-first</p>
              <p className="mt-1 text-sm text-slate-400">publish, save, report, and manage</p>
            </div>
          </div>

          <SearchFilters categories={categories} activeCategory={params.category} activeAspectRatio={params.ratio} search={params.q} />
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-8 hidden xl:flex xl:items-center">
          <div className="floating-badge max-w-[14rem]">
            <p className="text-[11px] uppercase tracking-[0.24em] text-brand">Signal</p>
            <p className="mt-2 text-lg font-bold text-white">Motion-rich prompt discovery</p>
            <p className="mt-1 text-sm text-slate-400">Animated glow, sharper contrast, actual green.</p>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-8 hidden xl:flex xl:items-center">
          <div className="floating-badge floating-badge-delay max-w-[14rem]">
            <p className="text-[11px] uppercase tracking-[0.24em] text-brand">Format</p>
            <p className="mt-2 text-lg font-bold text-white">9:16, 1:1, 16:9</p>
            <p className="mt-1 text-sm text-slate-400">Built for social, portraits, and campaign assets.</p>
          </div>
        </div>
      </section>

      <section className="section-shell mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-brand">
              <CheckCircle2 className="h-4 w-4" /> Editor picks
            </p>
            <h2 className="mt-2 text-2xl font-bold">Featured prompts</h2>
          </div>
          <p className="max-w-xl text-sm text-slate-400">Hand-picked prompt examples that show what users can recreate fast.</p>
        </div>
        <PromptGrid prompts={featured} empty="No featured prompts match this search yet." />
      </section>

      <section className="section-shell mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-brand">
              <TrendingUp className="h-4 w-4" /> Community signals
            </p>
            <h2 className="mt-2 text-2xl font-bold">Trending prompts</h2>
          </div>
          <p className="max-w-xl text-sm text-slate-400">Prompts rising by likes and copies, so users quickly find what is working.</p>
        </div>
        <PromptGrid prompts={trending} empty="No trending prompts match this search yet." />
      </section>

      <section id="latest" className="section-shell mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand">Fresh uploads</p>
            <h2 className="mt-2 text-2xl font-bold">Latest prompts</h2>
          </div>
          <p className="max-w-xl text-sm text-slate-400">New image-generation ideas from the vault, ready to copy and remix.</p>
        </div>
        <PromptGrid prompts={latest} empty="No prompts yet. Be the first creator to publish one." />
      </section>
    </main>
  );
}
