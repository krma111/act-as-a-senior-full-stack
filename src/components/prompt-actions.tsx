"use client";

import { useState, useTransition } from "react";
import { Copy, ExternalLink, Heart } from "lucide-react";
import { toast } from "sonner";
import { incrementCopyCount, toggleFavorite } from "@/lib/actions";

export function PromptActions({
  promptId,
  promptText,
  initialCopyCount,
  initialFavorited = false
}: {
  promptId: string;
  promptText: string;
  initialCopyCount: number;
  initialFavorited?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [copyCount, setCopyCount] = useState(initialCopyCount);
  const [showCopyTargets, setShowCopyTargets] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          className="btn-primary"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              try {
                await navigator.clipboard.writeText(promptText);
                const result = await incrementCopyCount(promptId);
                if ("error" in result) {
                  toast.error(result.error);
                  return;
                }
                if (typeof result.copyCount === "number") setCopyCount(result.copyCount);
                else setCopyCount((count) => count + 1);
                setShowCopyTargets(true);
                toast.success("Prompt copied");
              } catch {
                toast.error("Your browser blocked clipboard access.");
              }
            })
          }
        >
          <Copy className="h-4 w-4" /> Copy prompt
        </button>
        <button
          className="btn-ghost"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await toggleFavorite(promptId);
              if ("error" in result) toast.error(result.error);
              else {
                setFavorited(result.favorited);
                toast.success(result.favorited ? "Saved to favorites" : "Removed from favorites");
              }
            })
          }
        >
          <Heart className={`h-4 w-4 ${favorited ? "fill-current text-brand" : ""}`} /> {favorited ? "Favorited" : "Favorite"}
        </button>
        <span className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-300">
          Copies: {copyCount}
        </span>
      </div>
      {showCopyTargets ? (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-brand/20 bg-brand/10 p-3 text-sm text-slate-200">
          <span>Open copied prompt in:</span>
          <a className="btn-ghost py-2" href="https://chatgpt.com/" target="_blank" rel="noreferrer">
            ChatGPT <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <a className="btn-ghost py-2" href="https://gemini.google.com/" target="_blank" rel="noreferrer">
            Gemini <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      ) : null}
    </div>
  );
}
