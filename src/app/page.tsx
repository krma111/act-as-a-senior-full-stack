import { Sparkles, TrendingUp } from "lucide-react";
import { PromptGrid } from "@/components/prompt-grid";
import { SearchFilters } from "@/components/search-filters";
import { StyleRemixGrid } from "@/components/style-remix-grid";
import { getCategories, getPrompts, getSiteSettings } from "@/lib/data";
import { styleExamples } from "@/lib/style-examples";

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

  return (
    <main>
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-lg border border-brand/30 bg-brand/10 px-3 py-1 text-sm text-brand">
            <Sparkles className="h-4 w-4" /> Free community prompt library
          </div>
          <h1 className="text-4xl font-black tracking-normal text-white sm:text-6xl">
            {settings.hero_headline}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            {settings.hero_subheadline}
          </p>
          <SearchFilters categories={categories} activeCategory={params.category} activeAspectRatio={params.ratio} search={params.q} />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <Sparkles className="h-6 w-6 text-brand" /> Featured prompts
          </h2>
        </div>
        <PromptGrid prompts={featured} empty="No featured prompts match this search yet." />
      </section>

      <StyleRemixGrid examples={styleExamples} />

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <TrendingUp className="h-6 w-6 text-brand" /> Trending prompts
          </h2>
        </div>
        <PromptGrid prompts={trending} empty="No trending prompts match this search yet." />
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Latest prompts</h2>
        </div>
        <PromptGrid prompts={latest} empty="No prompts yet. Be the first creator to publish one." />
      </section>
    </main>
  );
}
