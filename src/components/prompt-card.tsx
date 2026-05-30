import Image from "next/image";
import Link from "next/link";
import { Copy, Heart, Sparkles } from "lucide-react";
import type { Prompt } from "@/lib/types";

export function PromptCard({ prompt }: { prompt: Prompt }) {
  return (
    <Link
      href={`/prompts/${prompt.id}`}
      className="group overflow-hidden rounded-lg border border-white/10 bg-white/[0.045] transition hover:-translate-y-1 hover:border-brand/50"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-900">
        <Image
          src={prompt.image_url}
          alt={prompt.title}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
        />
        {prompt.featured && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-md bg-brand px-2 py-1 text-xs font-bold text-slate-950">
            <Sparkles className="h-3 w-3" /> Featured
          </span>
        )}
      </div>
      <div className="space-y-3 p-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-brand">{prompt.categories?.name ?? "Uncategorized"}</p>
          <h3 className="mt-1 line-clamp-2 text-base font-semibold text-white">{prompt.title}</h3>
        </div>
        <p className="line-clamp-2 text-sm text-slate-400">{prompt.prompt_text}</p>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{prompt.ai_model}</span>
          <span className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" /> {prompt.like_count}
            </span>
            <span className="inline-flex items-center gap-1">
              <Copy className="h-3.5 w-3.5" /> {prompt.copy_count}
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}
