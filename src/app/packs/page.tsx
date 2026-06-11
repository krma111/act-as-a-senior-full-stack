import Link from "next/link";
import { Boxes, IndianRupee } from "lucide-react";
import { MotionMain, MotionSection } from "@/frontend/components/motion-primitives";
import { getApprovedPacks } from "@/backend/data/payments";

export const dynamic = "force-dynamic";

export default async function PacksMarketplacePage() {
  const packs = await getApprovedPacks();

  return (
    <MotionMain className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <MotionSection>
        <div className="mb-8 text-center">
          <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-brand">
            <Boxes className="h-4 w-4" />
            Prompt packs
          </p>
          <h1 className="hero-title mt-3 text-4xl font-black sm:text-5xl">Premium prompt packs</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-400">
            Get curated collections of high-quality prompts created by top creators. One purchase gives you lifetime access.
          </p>
        </div>

        {packs.length === 0 ? (
          <div className="card-surface rounded-[32px] p-10 text-center">
            <p className="text-xl font-bold text-white">No packs available yet.</p>
            <p className="mt-2 text-sm text-slate-400">Check back soon for new prompt pack releases.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {packs.map((pack) => (
              <Link key={pack.id} href={`/packs/${pack.id}`} className="card-surface group overflow-hidden rounded-[28px] transition duration-300 hover:-translate-y-1 hover:border-brand/40">
                {pack.cover_image ? (
                  <div className="aspect-[4/3] overflow-hidden bg-slate-950">
                    <img src={pack.cover_image} alt={pack.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  </div>
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center bg-slate-950">
                    <Boxes className="h-12 w-12 text-slate-600" />
                  </div>
                )}
                <div className="space-y-3 p-5">
                  <h2 className="text-xl font-black text-white">{pack.title}</h2>
                  <p className="line-clamp-2 text-sm leading-6 text-slate-400">{pack.description ?? "No description."}</p>
                  <div className="flex items-center justify-between pt-2">
                    <span className="rounded-full border border-brand/30 bg-brand/10 px-4 py-1.5 text-sm font-bold text-brand">
                      <IndianRupee className="mr-1 inline h-3.5 w-3.5" />
                      {pack.price}
                    </span>
                    <span className="text-sm text-slate-500">{pack.total_prompts ?? 0} prompts</span>
                  </div>
                  {pack.creator_name && (
                    <p className="text-xs text-slate-500">by {pack.creator_name}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </MotionSection>
    </MotionMain>
  );
}
