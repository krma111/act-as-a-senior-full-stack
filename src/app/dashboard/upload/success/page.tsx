import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { requireDashboardUser } from "@/backend/data/creators";

export const dynamic = "force-dynamic";

export default async function UploadSuccessPage() {
  await requireDashboardUser("/dashboard/upload/success");

  return (
    <main className="mx-auto grid min-h-[70vh] max-w-3xl place-items-center px-4 py-12 sm:px-6 lg:px-8">
      <section className="card-surface rounded-[32px] p-8 text-center sm:p-10">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-brand/30 bg-brand/10 text-brand shadow-glow">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h1 className="mt-6 text-3xl font-black text-white">Submission received</h1>
        <div className="mx-auto mt-4 max-w-xl space-y-4 text-sm leading-7 text-slate-300">
          <p>Thank you for your contribution to the PromptVault community.</p>
          <p>Your submission has been received and is currently under review.</p>
          <p>You will receive an email notification once your prompt has been approved.</p>
        </div>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/dashboard/upload" className="btn-primary">
            Submit Another Prompt
          </Link>
          <Link href="/" className="btn-ghost">
            Go Home
          </Link>
        </div>
      </section>
    </main>
  );
}
