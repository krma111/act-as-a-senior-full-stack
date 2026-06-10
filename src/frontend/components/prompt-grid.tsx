import { PromptCard } from "@/frontend/components/prompt-card";
import { getAuthSessionState } from "@/backend/auth/session";
import type { Prompt } from "@/shared/types";

export async function PromptGrid({ prompts, empty }: { prompts: Prompt[]; empty: string }) {
  const { profile } = await getAuthSessionState();
  const isAdmin = profile?.role === "admin";

  if (!prompts.length) {
    return (
      <div className="card-surface rounded-[32px] border-dashed p-10 text-center text-slate-400">
        <p className="text-lg font-bold text-white">Nothing to show yet.</p>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6">{empty}</p>
      </div>
    );
  }

  return (
    <div className="grid-cascade grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {prompts.map((prompt) => (
        <PromptCard key={prompt.id} prompt={prompt} isAdmin={isAdmin} />
      ))}
    </div>
  );
}
