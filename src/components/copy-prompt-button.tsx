"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { incrementCopyCount } from "@/lib/actions";

type CopyPromptButtonProps = {
  promptId: string;
  promptText: string;
  initialCopyCount: number;
  variant?: "primary" | "compact";
  onCopied?: (copyCount: number | null) => void;
  showTargets?: boolean;
};

export function CopyPromptButton({ promptId, promptText, initialCopyCount, variant = "primary", onCopied, showTargets = false }: CopyPromptButtonProps) {
  const [pending, startTransition] = useTransition();
  const [copyCount, setCopyCount] = useState(initialCopyCount);
  const [showCopyTargets, setShowCopyTargets] = useState(false);
  const [copied, setCopied] = useState(false);

  function copyPrompt() {
    startTransition(async () => {
      try {
        await navigator.clipboard.writeText(promptText);
        const result = await incrementCopyCount(promptId);
        if ("error" in result) {
          toast.error(result.error);
          return;
        }

        const nextCount = typeof result.copyCount === "number" ? result.copyCount : copyCount;
        setCopyCount(nextCount);
        onCopied?.(nextCount);
        setShowCopyTargets(true);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
        toast.success("Prompt copied!");
      } catch {
        toast.error("Your browser blocked clipboard access.");
      }
    });
  }

  if (variant === "compact") {
    return (
      <div className="space-y-2">
        <motion.button
          type="button"
          className="btn-ghost px-3 py-2 text-xs"
          disabled={pending}
          onClick={copyPrompt}
          whileHover={pending ? undefined : { y: -2, scale: 1.02 }}
          whileTap={pending ? undefined : { scale: 0.95 }}
        >
          {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {pending ? "Copying..." : `Copy (${copyCount})`}
        </motion.button>
        <AnimatePresence>{showTargets && showCopyTargets ? <CopyTargets /> : null}</AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <motion.button
        type="button"
        className="btn-primary"
        disabled={pending}
        onClick={copyPrompt}
        whileHover={pending ? undefined : { y: -2, scale: 1.018 }}
        whileTap={pending ? undefined : { scale: 0.965 }}
      >
        {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {pending ? "Copying..." : copied ? "Copied" : "Copy Prompt"}
      </motion.button>
      <AnimatePresence>{showTargets && showCopyTargets ? <CopyTargets /> : null}</AnimatePresence>
    </div>
  );
}

function CopyTargets() {
  return (
    <motion.div
      className="flex flex-wrap items-center gap-2 rounded-2xl border border-brand/20 bg-brand/10 p-2 text-xs text-slate-200 shadow-glow backdrop-blur-xl"
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.22 }}
    >
      <span>Open in:</span>
      <a className="btn-ghost px-2 py-1 text-xs" href="https://chatgpt.com/" target="_blank" rel="noreferrer">
        ChatGPT <ExternalLink className="h-3 w-3" />
      </a>
      <a className="btn-ghost px-2 py-1 text-xs" href="https://gemini.google.com/" target="_blank" rel="noreferrer">
        Gemini <ExternalLink className="h-3 w-3" />
      </a>
    </motion.div>
  );
}
