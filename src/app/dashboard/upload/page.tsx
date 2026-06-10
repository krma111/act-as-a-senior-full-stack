import Link from "next/link";
import { CreatorUploadForm } from "@/components/creator-upload-form";
import { MotionMain } from "@/components/motion-primitives";
import { requireDashboardUser } from "@/lib/creator-data";

export const dynamic = "force-dynamic";

export default async function DashboardUploadPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const params = await searchParams;
  await requireDashboardUser("/dashboard/upload");

  return (
    <MotionMain className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Creator studio</p>
          <h1 className="hero-title mt-2 text-3xl font-black">Upload a prompt</h1>
          <p className="mt-2 text-sm text-slate-400">Submit real prompt data for admin approval. New uploads stay pending until reviewed.</p>
        </div>
        <Link href="/dashboard/my-prompts" className="btn-ghost">My prompts</Link>
      </div>

      <CreatorUploadForm message={params.message} error={params.error} />
    </MotionMain>
  );
}
