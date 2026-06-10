"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
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
    <motion.form
      className="mx-auto mt-8 max-w-3xl"
      onSubmit={onSubmit}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, delay: 0.08 }}
    >
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
        <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}>
          <Link className={`btn-ghost ${!activeCategory ? "border-brand/60 text-brand" : ""}`} href={buildUrl({ category: "" })}>
            All
          </Link>
        </motion.div>
        {categories.map((category) => (
          <motion.div key={category.id} whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}>
            <Link
              className={`btn-ghost ${activeCategory === category.slug ? "border-brand/60 text-brand" : ""}`}
              href={buildUrl({ category: category.slug })}
            >
              {category.name}
            </Link>
          </motion.div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}>
          <Link className={`btn-ghost ${!activeAspectRatio ? "border-brand/60 text-brand" : ""}`} href={buildUrl({ ratio: "" })}>All Ratios</Link>
        </motion.div>
        {aspectRatios.map((ratio) => (
          <motion.div key={ratio} whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}>
            <Link
              className={`btn-ghost ${activeAspectRatio === ratio ? "border-brand/60 text-brand" : ""}`}
              href={buildUrl({ ratio })}
            >
              {ratio}
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.form>
  );
}
