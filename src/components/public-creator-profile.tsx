import { CreatorBadge } from "@/components/creator-badge";
import { PromptGrid } from "@/components/prompt-grid";
import { getPromptsByCreator } from "@/lib/data";

export async function PublicCreatorProfile({ username }: { username: string }) {
  const { creator, prompts } = await getPromptsByCreator(username);
  const creatorName = creator?.full_name ?? creator?.display_name ?? creator?.email?.split("@")[0] ?? "Creator";

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="panel rounded-lg p-6">
        <p className="text-sm uppercase tracking-wide text-brand">Creator</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold">{creatorName}</h1>
          <CreatorBadge profile={creator} hideEmpty={false} />
        </div>
        <p className="mt-2 text-slate-400">
          {prompts.length} approved public prompts · {creator?.copy_total ?? 0} total copies
        </p>
      </section>
      <section className="mt-10">
        <PromptGrid prompts={prompts} empty="This creator has not published approved prompts yet." />
      </section>
    </main>
  );
}
