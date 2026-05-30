import { PromptCard } from "@/components/prompt-card";
import type { Prompt } from "@/lib/types";

export function PromptGrid({ prompts, empty }: { prompts: Prompt[]; empty: string }) {
  if (!prompts.length) {
    return (
      <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.03] p-10 text-center text-slate-400">
        {empty}
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {prompts.map((prompt) => (
        <PromptCard key={prompt.id} prompt={prompt} />
      ))}
    </div>
  );
}
