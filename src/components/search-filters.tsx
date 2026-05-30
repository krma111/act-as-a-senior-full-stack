import Link from "next/link";
import { Search } from "lucide-react";
import type { Category } from "@/lib/types";

export function SearchFilters({
  categories,
  activeCategory,
  search
}: {
  categories: Category[];
  activeCategory?: string;
  search?: string;
}) {
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
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Link className={`btn-ghost ${!activeCategory ? "border-brand/60 text-brand" : ""}`} href="/">
          All
        </Link>
        {categories.map((category) => (
          <Link
            key={category.id}
            className={`btn-ghost ${activeCategory === category.slug ? "border-brand/60 text-brand" : ""}`}
            href={`/?category=${category.slug}${search ? `&q=${encodeURIComponent(search)}` : ""}`}
          >
            {category.name}
          </Link>
        ))}
      </div>
    </form>
  );
}
