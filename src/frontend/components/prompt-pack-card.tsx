import Link from "next/link";
import { ArrowRight, Lock, Sparkles } from "lucide-react";
import { CopyTextButton } from "@/frontend/components/copy-text-button";
import type { PublicPromptPack } from "@/backend/mvp-data";

function formatPrice(pack: PublicPromptPack) {
  return pack.is_free ? "Free" : `INR ${Math.round(pack.price).toLocaleString("en-IN")}`;
}

export function PromptPackCard({ pack, priority = false }: { pack: PublicPromptPack; priority?: boolean }) {
  const firstPreview = pack.preview_content[0] ?? "Preview prompt will appear here.";

  return (
    <article className="card-surface group flex h-full min-w-0 flex-col overflow-hidden rounded-[32px] p-5 transition duration-500 hover:-translate-y-1 hover:border-brand/50">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <span className="inline-flex max-w-full rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-brand">
            {pack.category}
          </span>
          <h3 className="mt-4 line-clamp-2 break-words text-2xl font-black text-white">{pack.title}</h3>
        </div>
        <div className="w-fit shrink-0 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2 text-left sm:text-right">
          <p className="text-xs text-slate-400">Price</p>
          <p className="font-black text-brand">{formatPrice(pack)}</p>
        </div>
      </div>

      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-300">{pack.description}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {pack.tools_supported.slice(0, 5).map((tool) => (
          <span key={tool} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">
            {tool}
          </span>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
          {pack.is_free ? <Sparkles className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
          {pack.is_free ? "Free prompt" : "Locked premium preview"}
        </p>
        <p className="mt-2 line-clamp-4 text-sm leading-6 text-slate-300">{firstPreview}</p>
      </div>

      <div className="mt-5 flex flex-1 flex-col justify-end gap-2 sm:flex-row sm:items-end">
        <Link href={`/packs/${pack.slug}`} className="btn-primary w-full flex-1">
          View pack <ArrowRight className="h-4 w-4" />
        </Link>
        {pack.is_free ? <CopyTextButton text={firstPreview} label="Copy" className="btn-ghost w-full sm:w-auto" /> : null}
      </div>
      {priority ? <span className="sr-only">Featured pack</span> : null}
    </article>
  );
}
