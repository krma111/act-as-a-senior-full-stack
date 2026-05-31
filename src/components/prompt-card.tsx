import Image from "next/image";
import Link from "next/link";
import { Copy, Heart, Sparkles } from "lucide-react";
import type { Prompt } from "@/lib/types";

export function PromptCard({ prompt }: { prompt: Prompt }) {
  const creator = prompt.users?.display_name ?? prompt.users?.email?.split("@")[0] ?? "Creator";
  const tags = prompt.tags.slice(0, 3);

  return (
    <Link
      href={`/prompts/${prompt.id}`}
      className="group card-surface overflow-hidden rounded-2xl transition duration-300 hover:-translate-y-1 hover:border-brand/50 hover:shadow-glow"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-950">
        <Image
          src={prompt.image_url}
          alt={prompt.title}
          fill
          className="object-cover transition duration-700 group-hover:scale-105"
          sizes="(min-width:1280px) 25vw, (min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/90 to-transparent" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {prompt.featured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-xs font-black text-slate-950 shadow-glow">
              <Sparkles className="h-3 w-3" /> Featured
            </span>
          )}
          <span className="rounded-full border border-white/10 bg-slate-950/70 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
            {prompt.ai_model}
          </span>
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-slate-200">
          <span className="rounded-full bg-slate-950/70 px-2.5 py-1 backdrop-blur">by {creator}</span>
          <span className="rounded-full bg-slate-950/70 px-2.5 py-1 backdrop-blur">{prompt.categories?.name ?? "Uncategorized"}</span>
        </div>
      </div>
      <div className="space-y-4 p-4">
        <div>
          <h3 className="line-clamp-2 text-lg font-bold leading-snug text-white transition group-hover:text-brand">{prompt.title}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">{prompt.prompt_text}</p>
        </div>

        {!!tags.length && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span key={tag} className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] font-medium text-slate-300">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-white/10 pt-3 text-xs text-slate-400">
          <span className="font-semibold text-slate-300">Copy-ready prompt</span>
          <span className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <Heart className="h-3.5 w-3.5 text-brand" /> {prompt.like_count}
            </span>
            <span className="inline-flex items-center gap-1">
              <Copy className="h-3.5 w-3.5 text-brand" /> {prompt.copy_count}
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}
