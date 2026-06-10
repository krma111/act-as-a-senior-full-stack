import { PromptGrid } from "@/components/prompt-grid";
import { SearchFilters } from "@/components/search-filters";
import { MotionMain, MotionSection } from "@/components/motion-primitives";
import { getCategories, getPrompts } from "@/lib/data";

export default async function CategoryPage({
  params,
  searchParams
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ q?: string; ratio?: string }>;
}) {
  const [{ category }, query] = await Promise.all([params, searchParams]);
  const [categories, prompts] = await Promise.all([
    getCategories(),
    getPrompts({ search: query.q, category, aspectRatio: query.ratio, order: "latest", limit: 48 })
  ]);
  const current = categories.find((item) => item.slug === category);

  return (
    <MotionMain className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <MotionSection className="panel rounded-[34px] p-6 text-center sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Category</p>
        <h1 className="hero-title mt-3 text-4xl font-black sm:text-5xl">{current?.name ?? category.replace(/-/g, " ")}</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-400">Only approved Supabase prompts are visible in this category.</p>
        <SearchFilters categories={categories} activeCategory={category} activeAspectRatio={query.ratio} search={query.q} basePath="/prompts" />
      </MotionSection>
      <MotionSection className="mt-10">
        <PromptGrid prompts={prompts} empty="No approved prompts exist in this category yet." />
      </MotionSection>
    </MotionMain>
  );
}
