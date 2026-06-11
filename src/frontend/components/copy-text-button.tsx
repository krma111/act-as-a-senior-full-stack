"use client";

import { Check, Copy } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { MotionButton } from "@/frontend/components/motion-primitives";

export function CopyTextButton({ text, label = "Copy prompt", className = "btn-ghost" }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <MotionButton
      type="button"
      className={className}
      disabled={pending || !text.trim()}
      onClick={() => {
        startTransition(async () => {
          try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            toast.success("Prompt copied!");
            window.setTimeout(() => setCopied(false), 1600);
          } catch (error) {
            console.error("[copy-text-button] Clipboard failed", error);
            toast.error("Copy failed. Please select and copy manually.");
          }
        });
      }}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? "Copied" : pending ? "Copying..." : label}
    </MotionButton>
  );
}
