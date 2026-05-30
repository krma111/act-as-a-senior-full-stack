"use client";

import { useState, useTransition } from "react";
import { Copy, Heart } from "lucide-react";
import { toast } from "sonner";
import { incrementCopyCount, toggleFavorite } from "@/lib/actions";

export function PromptActions({
  promptId,
  promptText,
  initialFavorited = false
}: {
  promptId: string;
  promptText: string;
  initialFavorited?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [favorited, setFavorited] = useState(initialFavorited);

  return (
    <div className="flex flex-wrap gap-3">
      <button
        className="btn-primary"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            try {
              await navigator.clipboard.writeText(promptText);
              await incrementCopyCount(promptId);
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
    </div>
  );
}
