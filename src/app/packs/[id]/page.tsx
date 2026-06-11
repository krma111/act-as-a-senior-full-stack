import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Boxes, IndianRupee, ShoppingCart } from "lucide-react";
import { MotionMain, MotionSection } from "@/frontend/components/motion-primitives";
import { getPackById } from "@/backend/data/payments";

export const dynamic = "force-dynamic";

export default async function PackDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pack = await getPackById(id);
  if (!pack) notFound();

  return (
    <MotionMain className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <Link href="/packs" className="btn-ghost mb-6 inline-flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to packs
      </Link>

      <MotionSection className="card-surface overflow-hidden rounded-[32px]">
        <div className="grid gap-0 md:grid-cols-2">
          {pack.cover_image ? (
            <div className="min-h-[300px] overflow-hidden bg-slate-950">
              <img src={pack.cover_image} alt={pack.title} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="flex min-h-[300px] items-center justify-center bg-slate-950">
              <Boxes className="h-16 w-16 text-slate-600" />
            </div>
          )}

          <div className="flex flex-col justify-center space-y-5 p-6 sm:p-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Prompt pack</p>
              <h1 className="mt-2 text-3xl font-black text-white">{pack.title}</h1>
            </div>

            <p className="text-sm leading-6 text-slate-400">{pack.description ?? "No description provided."}</p>

            <div className="flex flex-wrap gap-4">
              <span className="rounded-full border border-brand/30 bg-brand/10 px-4 py-2 text-lg font-bold text-brand">
                <IndianRupee className="mr-1 inline h-4 w-4" />
                {pack.price}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-slate-300">
                {pack.total_prompts ?? 0} prompts
              </span>
              {pack.creator_name && (
                <span className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-slate-300">
                  by {pack.creator_name}
                </span>
              )}
            </div>

            <Link href={`/packs/${id}/checkout`} className="btn-primary inline-flex items-center justify-center gap-2 py-3">
              <ShoppingCart className="h-4 w-4" />
              Buy with UPI
            </Link>

            <p className="text-xs text-slate-500">
              Secure payment via UPI. You will receive a unique access link after verification.
            </p>
          </div>
        </div>
      </MotionSection>
    </MotionMain>
  );
}
