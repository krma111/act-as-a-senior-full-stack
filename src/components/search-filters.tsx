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
  search
}: {
  categories: Category[];
  activeCategory?: string;
  activeAspectRatio?: string;
  search?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(search ?? "");

  const q = search ? `&q=${encodeURIComponent(search)}` : "";
  const categoryQ = activeCategory ? `&category=${encodeURIComponent(activeCategory)}` : "";
  const ratioQ = activeAspectRatio ? `&ratio=${encodeURIComponent(activeAspectRatio)}` : "";

  function buildUrl(nextQ?: string) {
    const params = new URLSearchParams();
    if (nextQ?.trim()) params.set("q", nextQ.trim());
    if (activeCategory) params.set("category", activeCategory);
    if (activeAspectRatio) params.set("ratio", activeAspectRatio);
    const query = params.toString();
    return query ? `/?${query}` : "/";
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    router.push(buildUrl(value));
  }

  function onChange(next: string) {
    setValue(next);
    if (!next.trim()) {
      router.push(buildUrl(""));
    }
  }

  return (
    <form className="mx-auto mt-8 max-w-3xl" onSubmit={onSubmit}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
        <input
          className="field h-14 pl-12 text-base"
          name="q"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search prompts, tags, models, or full prompt text"
        />
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
