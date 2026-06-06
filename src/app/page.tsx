import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles, TrendingUp, UploadCloud } from "lucide-react";
import { MotionDiv, MotionMain, MotionSection } from "@/components/motion-primitives";
import { PromptGrid } from "@/components/prompt-grid";
import { SearchFilters } from "@/components/search-filters";
import { getCategories, getPrompts, getSiteSettings } from "@/lib/data";
import { promptSlug } from "@/lib/slugs";

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
  const heroPrompts = [...featured, ...trending, ...latest].filter((prompt, index, prompts) => prompts.findIndex((item) => item.id === prompt.id) === index);
  const heroPrompt = heroPrompts[0];
  const sidePrompts = heroPrompts.slice(1, 3);

  return (
    <MotionMain>
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="hero-grid" />
        <div className="hero-scan" />
        <div className="hero-orb hero-orb-left" />
        <div className="hero-orb hero-orb-right" />
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 mx-auto h-72 max-w-5xl rounded-full bg-brand/10 blur-3xl" />

        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="text-center lg:text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-4 py-2 text-sm font-semibold text-brand shadow-glow backdrop-blur-xl">
              <Sparkles className="h-4 w-4" /> Premium image prompt vault for creators
            </div>
            <h1 className="hero-title mx-auto max-w-5xl text-4xl font-black tracking-tight sm:text-6xl lg:mx-0 lg:text-7xl">
              {settings.hero_headline}
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl lg:mx-0">
              {settings.hero_subheadline}
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
              <Link href="/prompts/new" className="btn-primary px-5 py-3">
                <UploadCloud className="h-4 w-4" /> Submit your prompt
              </Link>
              <a href="#latest" className="btn-ghost px-5 py-3">
                Explore prompts <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            <div className="grid-cascade mx-auto mt-10 grid max-w-3xl gap-3 sm:grid-cols-2 lg:mx-0">
              <div className="panel rounded-2xl p-4 text-left">
                <p className="text-2xl font-black text-white">{totalVisiblePrompts}+</p>
                <p className="mt-1 text-sm text-slate-400">live prompt cards loaded</p>
              </div>
              <div className="panel rounded-2xl p-4 text-left">
                <p className="text-2xl font-black text-white">Copy-ready</p>
                <p className="mt-1 text-sm text-slate-400">prompts with real image examples</p>
              </div>
            </div>

            <SearchFilters categories={categories} activeCategory={params.category} activeAspectRatio={params.ratio} search={params.q} />
          </div>

          <MotionDiv className="hero-visual-stage relative hidden min-h-[620px] lg:block" delay={0.18}>
            {heroPrompt ? (
              <Link href={`/prompt/${promptSlug(heroPrompt)}`} className="hero-float-card card-surface absolute left-8 top-8 block w-[72%] overflow-hidden rounded-[34px] transition duration-500 hover:-translate-y-2">
                <div className="relative aspect-[4/5] overflow-hidden bg-black/50">
                  {heroPrompt.image_url ? (
                    <Image src={heroPrompt.image_url} alt={heroPrompt.title} fill className="object-cover" sizes="440px" priority />
                  ) : (
                    <div className="grid h-full place-items-center bg-brand/5 px-8 text-center text-sm text-slate-400">Text-only prompt</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5">
                    <p className="inline-flex rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-brand backdrop-blur">
                      Live approved prompt
                    </p>
                    <h3 className="mt-4 line-clamp-2 text-2xl font-black text-white">{heroPrompt.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">{heroPrompt.prompt_text}</p>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="hero-float-card card-surface absolute left-8 top-8 w-[72%] rounded-[34px] p-8">
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-brand">Vault ready</p>
                <h3 className="mt-4 text-3xl font-black text-white">Approved prompts will appear here.</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">This visual uses live Supabase content only when approved prompts exist.</p>
              </div>
            )}

            {sidePrompts.map((prompt, index) => (
              <Link
                key={prompt.id}
                href={`/prompt/${promptSlug(prompt)}`}
                className={`hero-float-card card-surface absolute right-0 ${index === 0 ? "top-24" : "bottom-20"} w-[48%] overflow-hidden rounded-[28px] transition duration-500 hover:-translate-y-2`}
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-black/50">
                  {prompt.image_url ? (
                    <Image src={prompt.image_url} alt={prompt.title} fill className="object-cover" sizes="300px" />
                  ) : (
                    <div className="grid h-full place-items-center bg-brand/5 px-6 text-center text-xs text-slate-400">Text-only</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="line-clamp-2 text-sm font-bold text-white">{prompt.title}</p>
                    <p className="mt-1 text-xs text-brand">{prompt.categories?.name ?? "Prompt"}</p>
                  </div>
                </div>
              </Link>
            ))}

            <div className="card-surface hero-float-card absolute bottom-4 left-0 max-w-[17rem] rounded-[28px] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand">Interaction</p>
              <p className="mt-3 text-lg font-black text-white">Copy, save, share, approve, edit.</p>
              <p className="mt-2 text-sm text-slate-400">Polished for mobile and desktop workflows.</p>
            </div>
          </MotionDiv>
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

      <MotionSection className="section-shell mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
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
      </MotionSection>

      <MotionSection className="section-shell mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
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
      </MotionSection>

      <MotionSection id="latest" className="section-shell mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand">Fresh uploads</p>
            <h2 className="mt-2 text-2xl font-bold">Latest prompts</h2>
          </div>
          <p className="max-w-xl text-sm text-slate-400">New image-generation ideas from the vault, ready to copy and remix.</p>
        </div>
        <PromptGrid prompts={latest} empty="No prompts yet. Be the first creator to publish one." />
      </MotionSection>
    </MotionMain>
  );
}
