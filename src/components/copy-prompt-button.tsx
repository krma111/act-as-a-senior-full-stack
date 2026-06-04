"use client";

import { useState, useTransition } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { incrementCopyCount } from "@/lib/actions";

type CopyPromptButtonProps = {
  promptId: string;
  promptText: string;
  initialCopyCount: number;
  variant?: "primary" | "compact";
  onCopied?: (copyCount: number | null) => void;
};

export function CopyPromptButton({ promptId, promptText, initialCopyCount, variant = "primary", onCopied }: CopyPromptButtonProps) {
  const [pending, startTransition] = useTransition();
  const [copyCount, setCopyCount] = useState(initialCopyCount);

  function copyPrompt() {
    startTransition(async () => {
      try {
        await navigator.clipboard.writeText(promptText);
        const result = await incrementCopyCount(promptId);
        if ("error" in result) {
          toast.error(result.error);
          return;
        }

        const nextCount = typeof result.copyCount === "number" ? result.copyCount : copyCount + 1;
        setCopyCount(nextCount);
        onCopied?.(nextCount);
        toast.success("Prompt copied!");
      } catch {
        toast.error("Your browser blocked clipboard access.");
      }
    });
  }

  if (variant === "compact") {
    return (
      <button type="button" className="btn-ghost px-3 py-2 text-xs" disabled={pending} onClick={copyPrompt}>
        <Copy className="h-3.5 w-3.5" /> {pending ? "Copying..." : `Copy (${copyCount})`}
      </button>
    );
  }

  return (
    <button type="button" className="btn-primary" disabled={pending} onClick={copyPrompt}>
      <Copy className="h-4 w-4" /> {pending ? "Copying..." : "Copy Prompt"}
    </button>
  );
}
