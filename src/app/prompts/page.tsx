import { PromptGrid } from "@/components/prompt-grid";
import { SearchFilters } from "@/components/search-filters";
import { MotionMain, MotionSection } from "@/components/motion-primitives";
import { getCategories, getPrompts } from "@/lib/data";

export default async function PromptsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; category?: string; ratio?: string }>;
}) {
  const params = await searchParams;
  const [categories, prompts] = await Promise.all([
    getCategories(),
    getPrompts({ search: params.q, category: params.category, aspectRatio: params.ratio, order: "latest", limit: 48 })
  ]);

  return (
    <MotionMain className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <MotionSection className="panel rounded-[34px] p-6 text-center sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Public vault</p>
        <h1 className="hero-title mt-3 text-4xl font-black sm:text-5xl">Approved prompts</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-400">
          Real creator prompts approved by PromptVault moderators. No demo or static prompt cards are shown here.
        </p>
        <SearchFilters categories={categories} activeCategory={params.category} activeAspectRatio={params.ratio} search={params.q} basePath="/prompts" />
      </MotionSection>
      <MotionSection className="mt-10">
        <PromptGrid prompts={prompts} empty="No approved prompts match this search yet." />
      </MotionSection>
    </MotionMain>
  );
}
