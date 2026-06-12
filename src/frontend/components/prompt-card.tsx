"use client";

import { SafeImage } from "@/frontend/components/safe-image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Edit3, Heart, Sparkles, Trash2 } from "lucide-react";
import { creatorSlug, promptSlug } from "@/shared/constants/slugs";
import { CreatorBadge } from "@/frontend/components/creator-badge";
import { CopyPromptButton } from "@/frontend/components/copy-prompt-button";
import { deletePrompt } from "@/backend/actions/admin";
import type { Prompt } from "@/shared/types";

export function PromptCard({ prompt, isAdmin = false }: { prompt: Prompt; isAdmin?: boolean }) {
  const creator = prompt.creator_name ?? prompt.users?.display_name ?? prompt.users?.full_name ?? prompt.users?.email?.split("@")[0] ?? "Creator";
  const tags = prompt.tags.slice(0, 3);
  const href = `/prompt/${promptSlug(prompt)}`;

  return (
    <motion.article
      className="group card-surface min-w-0 overflow-hidden rounded-[28px] transition duration-500 hover:border-brand/50 hover:shadow-glow"
      initial={{ opacity: 0, y: 22, scale: 0.985 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -10, rotateX: 1.8, rotateY: -1.8, scale: 1.012 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link href={href} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-950">
          {prompt.image_url ? (
            <SafeImage
              src={prompt.image_url}
              alt={prompt.title}
              fill
              className="object-cover transition duration-700 group-hover:scale-110"
              sizes="(min-width:1280px) 25vw, (min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
            />
          ) : (
            <div className="grid h-full place-items-center bg-brand/5 px-6 text-center text-sm font-semibold text-slate-400">
              Text-only prompt
            </div>
          )}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(57,255,20,0.22),transparent_52%)] opacity-70 transition duration-500 group-hover:opacity-100" />
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
          <div className="absolute bottom-3 left-3 right-3 flex min-w-0 items-center justify-between gap-2 text-xs text-slate-200">
            <span className="flex min-w-0 items-center gap-1 rounded-full bg-slate-950/70 px-2.5 py-1 backdrop-blur">
              <span className="truncate">by {creator}</span>
              <CreatorBadge profile={prompt.users} compact />
            </span>
            <span className="max-w-[45%] shrink-0 truncate rounded-full bg-slate-950/70 px-2.5 py-1 backdrop-blur">{prompt.categories?.name ?? "Uncategorized"}</span>
          </div>
        </div>
      </Link>

      <div className="space-y-4 p-4">
        <Link href={href} className="block">
          <h3 className="line-clamp-2 text-lg font-bold leading-snug text-white transition duration-300 group-hover:text-brand">{prompt.title}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">{prompt.prompt_text}</p>
        </Link>

        {!!tags.length && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span key={tag} className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] font-medium text-slate-300">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-white/10 pt-3 text-xs text-slate-400 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <CopyPromptButton promptId={prompt.id} promptText={prompt.prompt_text} initialCopyCount={prompt.copy_count} variant="compact" showTargets />
          <span className="inline-flex items-center gap-1">
            <Heart className="h-3.5 w-3.5 text-brand" /> {prompt.like_count}
          </span>
        </div>
        {isAdmin ? (
          <div className="grid grid-cols-1 gap-2 border-t border-white/10 pt-3 sm:flex sm:flex-wrap">
            <Link href={`/admin/prompts/${prompt.id}/edit`} className="btn-ghost px-3 py-2 text-xs">
              <Edit3 className="h-3.5 w-3.5" />
              Edit
            </Link>
            <form action={deletePrompt} className="w-full sm:w-auto">
              <input type="hidden" name="id" value={prompt.id} />
              <button
                className="btn-ghost w-full px-3 py-2 text-xs text-red-100"
                onClick={(event) => {
                  if (!window.confirm("Move this prompt to deleted?")) event.preventDefault();
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </motion.article>
  );
}

export function CreatorLink({ prompt }: { prompt: Prompt }) {
  return `/creator/${prompt.users ? creatorSlug(prompt.users) : prompt.user_id}`;
}
