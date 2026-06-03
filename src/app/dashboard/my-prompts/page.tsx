import Image from "next/image";
import Link from "next/link";
import { Edit3, PlusCircle } from "lucide-react";
import { getMyPrompts } from "@/lib/creator-data";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
  } catch {
    return value;
  }
}

function statusClass(status: string) {
  if (status === "approved") return "border-brand/30 bg-brand/10 text-brand";
  if (status === "rejected") return "border-red-500/30 bg-red-500/10 text-red-100";
  return "border-amber-500/30 bg-amber-500/10 text-amber-100";
}

export default async function MyPromptsPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { prompts, error } = await getMyPrompts();

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Creator library</p>
          <h1 className="mt-2 text-3xl font-black text-white">My prompts</h1>
          <p className="mt-2 text-sm text-slate-400">Only prompts submitted from your logged-in account are shown here.</p>
        </div>
        <Link href="/dashboard/upload" className="btn-primary">
          <PlusCircle className="h-4 w-4" />
          Upload prompt
        </Link>
      </div>

      {(params.message || params.error || error) && (
        <div className={`mb-6 rounded-2xl border p-4 text-sm ${params.error || error ? "border-red-500/30 bg-red-500/10 text-red-100" : "border-brand/30 bg-brand/10 text-brand"}`}>
          {params.error ?? error ?? params.message}
        </div>
      )}

      {!prompts.length ? (
        <section className="card-surface rounded-[28px] p-10 text-center">
          <p className="text-xl font-bold text-white">No data yet. Start creating your first prompt.</p>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400">Your submitted prompts will appear here with approval status, edit controls, and performance counts.</p>
          <div className="mt-6">
            <Link href="/dashboard/upload" className="btn-primary">Upload first prompt</Link>
          </div>
        </section>
      ) : (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {prompts.map((prompt) => (
            <article key={prompt.id} className="card-surface overflow-hidden rounded-[28px]">
              <div className="relative aspect-[4/3] bg-black/40">
                <Image src={prompt.image_url} alt={prompt.title} fill className="object-cover" sizes="(min-width:1280px) 33vw, (min-width:768px) 50vw, 100vw" />
                <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                  <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${statusClass(prompt.status)}`}>{prompt.status}</span>
                  <span className="rounded-full border border-white/10 bg-black/60 px-3 py-1 text-xs text-white">{prompt.aspect_ratio}</span>
                </div>
              </div>
              <div className="space-y-4 p-5">
                <div>
                  <p className="text-lg font-bold text-white">{prompt.title}</p>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-400">{prompt.description || prompt.prompt_text}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-slate-400">
                  <span className="rounded-xl bg-white/[0.04] p-2">Views: {prompt.view_count}</span>
                  <span className="rounded-xl bg-white/[0.04] p-2">Copies: {prompt.copy_count}</span>
                  <span className="rounded-xl bg-white/[0.04] p-2">{formatDate(prompt.created_at)}</span>
                </div>
                {prompt.rejection_reason ? (
                  <p className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-100">{prompt.rejection_reason}</p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Link href={`/dashboard/edit/${prompt.id}`} className="btn-ghost">
                    <Edit3 className="h-4 w-4" />
                    Edit
                  </Link>
                  {prompt.status === "approved" ? <Link href={`/prompts/${prompt.id}`} className="btn-ghost">View public page</Link> : null}
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
