"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Search } from "lucide-react";
import type { Category } from "@/lib/types";

const aspectRatios = ["16:9", "9:16"];

export function SearchFilters({
  categories,
  activeCategory,
  activeAspectRatio,
  search,
  basePath = "/"
}: {
  categories: Category[];
  activeCategory?: string;
  activeAspectRatio?: string;
  search?: string;
  basePath?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(search ?? "");

  function buildUrl(next?: { q?: string; category?: string; ratio?: string }) {
    const params = new URLSearchParams();
    const nextQ = next?.q ?? search ?? "";
    const nextCategory = next?.category ?? activeCategory;
    const nextRatio = next?.ratio ?? activeAspectRatio;
    if (nextQ.trim()) params.set("q", nextQ.trim());
    if (nextCategory) params.set("category", nextCategory);
    if (nextRatio) params.set("ratio", nextRatio);
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    router.push(buildUrl({ q: value }));
  }

  function onChange(next: string) {
    setValue(next);
    if (!next.trim()) router.push(buildUrl({ q: "" }));
  }

  return (
    <form className="mx-auto mt-8 max-w-3xl" onSubmit={onSubmit}>
      <div className="search-shell relative overflow-hidden rounded-2xl border border-brand/20 bg-white/[0.03] p-1 shadow-glow">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
        <input
          className="field h-14 border-transparent bg-black/30 pl-12 text-base"
          name="q"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search prompts, tags, models, or full prompt text"
        />
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Link className={`btn-ghost ${!activeCategory ? "border-brand/60 text-brand" : ""}`} href={buildUrl({ category: "" })}>
          All
        </Link>
        {categories.map((category) => (
          <Link
            key={category.id}
            className={`btn-ghost ${activeCategory === category.slug ? "border-brand/60 text-brand" : ""}`}
            href={buildUrl({ category: category.slug })}
          >
            {category.name}
          </Link>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <Link className={`btn-ghost ${!activeAspectRatio ? "border-brand/60 text-brand" : ""}`} href={buildUrl({ ratio: "" })}>All Ratios</Link>
        {aspectRatios.map((ratio) => (
          <Link
            key={ratio}
            className={`btn-ghost ${activeAspectRatio === ratio ? "border-brand/60 text-brand" : ""}`}
            href={buildUrl({ ratio })}
          >
            {ratio}
          </Link>
        ))}
      </div>
    </form>
  );
}
