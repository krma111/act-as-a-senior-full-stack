import { CreatorBadge } from "@/frontend/components/creator-badge";
import { MotionMain, MotionSection } from "@/frontend/components/motion-primitives";
import { PromptGrid } from "@/frontend/components/prompt-grid";
import { getPromptsByCreator } from "@/backend/data/prompts";

export async function PublicCreatorProfile({ username }: { username: string }) {
  const { creator, prompts } = await getPromptsByCreator(username);
  const creatorName = creator?.full_name ?? creator?.display_name ?? creator?.email?.split("@")[0] ?? "Creator";

  return (
    <MotionMain className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <MotionSection className="panel rounded-[34px] p-6">
        <p className="text-sm uppercase tracking-wide text-brand">Creator</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="hero-title text-3xl font-black">{creatorName}</h1>
          <CreatorBadge profile={creator} hideEmpty={false} />
        </div>
        <p className="mt-2 text-slate-400">
          {prompts.length} approved public prompts - {creator?.copy_total ?? 0} total copies
        </p>
      </MotionSection>
      <MotionSection className="mt-10">
        <PromptGrid prompts={prompts} empty="This creator has not published approved prompts yet." />
      </MotionSection>
    </MotionMain>
  );
}
