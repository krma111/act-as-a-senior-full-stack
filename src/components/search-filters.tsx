import Link from "next/link";
import { Search } from "lucide-react";
import type { Category } from "@/lib/types";

const aspectRatios = ["16:9", "9:16"];

export function SearchFilters({
  categories,
  activeCategory,
  activeAspectRatio,
  search
}: {
  categories: Category[];
  activeCategory?: string;
  activeAspectRatio?: string;
  search?: string;
}) {
  const q = search ? `&q=${encodeURIComponent(search)}` : "";
  const categoryQ = activeCategory ? `&category=${encodeURIComponent(activeCategory)}` : "";
  const ratioQ = activeAspectRatio ? `&ratio=${encodeURIComponent(activeAspectRatio)}` : "";

  return (
    <form className="mx-auto mt-8 max-w-3xl">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
        <input
          className="field h-14 pl-12 text-base"
          name="q"
          defaultValue={search}
          placeholder="Search prompts, tags, models, or full prompt text"
        />
        {activeCategory && <input type="hidden" name="category" value={activeCategory} />}
        {activeAspectRatio && <input type="hidden" name="ratio" value={activeAspectRatio} />}
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Link className={`btn-ghost ${!activeCategory ? "border-brand/60 text-brand" : ""}`} href={`/?${ratioQ ? ratioQ.slice(1) : ""}${search ? `${ratioQ ? "&" : ""}q=${encodeURIComponent(search)}` : ""}`}>
          All
        </Link>
        {categories.map((category) => (
          <Link
            key={category.id}
            className={`btn-ghost ${activeCategory === category.slug ? "border-brand/60 text-brand" : ""}`}
            href={`/?category=${category.slug}${q}${ratioQ}`}
          >
            {category.name}
          </Link>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <Link className={`btn-ghost ${!activeAspectRatio ? "border-brand/60 text-brand" : ""}`} href={`/?${search ? `q=${encodeURIComponent(search)}` : ""}${categoryQ}`}>All Ratios</Link>
        {aspectRatios.map((ratio) => (
          <Link
            key={ratio}
            className={`btn-ghost ${activeAspectRatio === ratio ? "border-brand/60 text-brand" : ""}`}
            href={`/?ratio=${encodeURIComponent(ratio)}${q}${categoryQ}`}
          >
            {ratio}
          </Link>
        ))}
      </div>
    </form>
  );
}
