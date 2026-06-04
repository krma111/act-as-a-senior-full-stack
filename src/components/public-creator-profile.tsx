import { PromptGrid } from "@/components/prompt-grid";
import { getPromptsByCreator } from "@/lib/data";

export async function PublicCreatorProfile({ username }: { username: string }) {
  const { creator, prompts } = await getPromptsByCreator(username);
  const creatorName = creator?.full_name ?? creator?.display_name ?? creator?.email?.split("@")[0] ?? "Creator";

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="panel rounded-lg p-6">
        <p className="text-sm uppercase tracking-wide text-brand">Creator</p>
        <h1 className="mt-2 text-3xl font-bold">{creatorName}</h1>
        <p className="mt-2 text-slate-400">{prompts.length} approved public prompts</p>
      </section>
      <section className="mt-10">
        <PromptGrid prompts={prompts} empty="This creator has not published approved prompts yet." />
      </section>
    </main>
  );
}
