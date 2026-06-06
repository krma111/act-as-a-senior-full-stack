import Link from "next/link";
import { Trophy } from "lucide-react";
import { CreatorBadge } from "@/components/creator-badge";
import { MotionMain, MotionSection } from "@/components/motion-primitives";
import { getCreatorLeaderboard } from "@/lib/data";
import { creatorSlug } from "@/lib/slugs";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const creators = await getCreatorLeaderboard();

  return (
    <MotionMain className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <MotionSection className="panel rounded-[34px] p-6 text-center sm:p-10">
        <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-brand">
          <Trophy className="h-4 w-4" />
          Leaderboard
        </p>
        <h1 className="hero-title mt-3 text-4xl font-black sm:text-5xl">Top creators</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-400">
          Ranked by real approved-prompt copy counts from Supabase.
        </p>
      </MotionSection>

      <MotionSection className="mt-8 grid gap-4">
        {creators.map((creator, index) => {
          const name = creator.full_name ?? creator.display_name ?? creator.email?.split("@")[0] ?? "Creator";
          return (
            <Link key={creator.id} href={`/creator/${creatorSlug(creator)}`} className="card-surface rounded-[28px] p-5 transition duration-500 hover:-translate-y-1 hover:border-brand/50">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl border border-brand/30 bg-brand/10 text-lg font-black text-brand">
                    {index + 1}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-bold text-white">{name}</p>
                      <CreatorBadge profile={creator} compact hideEmpty={false} />
                    </div>
                    <p className="mt-1 text-sm text-slate-400">{creator.prompt_count ?? 0} approved prompts</p>
                  </div>
                </div>
                <p className="text-2xl font-black text-brand">{creator.copy_total ?? 0} copies</p>
              </div>
            </Link>
          );
        })}

        {!creators.length ? (
          <div className="card-surface rounded-[32px] border-dashed p-10 text-center text-slate-400">
            No approved creator prompts have copy counts yet.
          </div>
        ) : null}
      </MotionSection>
    </MotionMain>
  );
}
