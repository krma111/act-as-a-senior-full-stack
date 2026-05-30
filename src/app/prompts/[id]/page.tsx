import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Flag, Heart, User } from "lucide-react";
import { PromptActions } from "@/components/prompt-actions";
import { reportPrompt } from "@/lib/actions";
import { getPrompt } from "@/lib/data";
import { isPreviewMode } from "@/lib/env";
import { getPreviewUser } from "@/lib/preview-auth";
import { createClient } from "@/lib/supabase/server";

export default async function PromptDetail({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const previewUser = await getPreviewUser();
  const supabase = isPreviewMode ? null : await createClient();
  const {
    data: { user }
  } = supabase ? await supabase.auth.getUser() : { data: { user: previewUser } };
  const prompt = await getPrompt(id);
  if (!prompt) notFound();
  const { data: viewer } = isPreviewMode && previewUser
    ? { data: { role: previewUser.role } }
    : user && supabase
    ? await supabase.from("users").select("role").eq("id", user.id).single()
    : { data: null };
  const { data: favorite } = isPreviewMode && user
    ? { data: null }
    : user && supabase
    ? await supabase.from("favorites").select("id").eq("prompt_id", id).eq("user_id", user.id).maybeSingle()
    : { data: null };
  if (!prompt) notFound();
  const canView = (!prompt.hidden || viewer?.role === "admin") && (prompt.visibility === "public" || prompt.user_id === user?.id || viewer?.role === "admin");
  if (!canView) notFound();

  return (
    <main className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
      <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
        <div className="relative aspect-[4/3]">
          <Image
            src={prompt.image_url}
            alt={prompt.title}
            fill
            className="object-cover"
            priority
            sizes="(min-width:1024px) 55vw, 100vw"
          />
        </div>
      </div>
      <section className="space-y-6">
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            {prompt.featured && <span className="rounded-md bg-brand px-2 py-1 text-xs font-bold text-slate-950">Featured</span>}
            <span className="rounded-md bg-white/10 px-2 py-1 text-xs text-slate-300">{prompt.categories?.name}</span>
            <span className="rounded-md bg-white/10 px-2 py-1 text-xs text-slate-300">{prompt.ai_model}</span>
          </div>
          <h1 className="text-3xl font-black tracking-normal sm:text-4xl">{prompt.title}</h1>
          <Link
            href={`/creators/${prompt.user_id}`}
            className="mt-4 inline-flex items-center gap-2 text-sm text-slate-300 hover:text-brand"
          >
            <User className="h-4 w-4" /> {prompt.users?.display_name ?? prompt.users?.email ?? "Creator"}
          </Link>
          {(prompt.user_id === user?.id || viewer?.role === "admin") && (
            <Link href={`/prompts/${prompt.id}/edit`} className="btn-ghost mt-4">
              Edit prompt
            </Link>
          )}
        </div>

        {query.message && (
          <p className="rounded-lg border border-brand/30 bg-brand/10 p-3 text-sm text-brand">
            {query.message}
          </p>
        )}

        <PromptActions promptId={prompt.id} promptText={prompt.prompt_text} initialFavorited={Boolean(favorite)} />

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm text-slate-400">Favorites</p>
            <p className="mt-1 flex items-center gap-2 text-2xl font-bold"><Heart className="h-5 w-5 text-brand" /> {prompt.like_count}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm text-slate-400">Copies</p>
            <p className="mt-1 text-2xl font-bold">{prompt.copy_count}</p>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
          <h2 className="mb-3 font-semibold">Prompt</h2>
          <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-slate-200">{prompt.prompt_text}</pre>
        </div>
        {prompt.negative_prompt && (
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <h2 className="mb-3 font-semibold">Negative prompt</h2>
            <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-slate-300">{prompt.negative_prompt}</pre>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {prompt.tags.map((tag) => (
            <Link key={tag} href={`/?q=${encodeURIComponent(tag)}`} className="rounded-md bg-white/10 px-2.5 py-1 text-sm text-slate-300 hover:text-brand">
              #{tag}
            </Link>
          ))}
        </div>
        <form action={reportPrompt} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <input type="hidden" name="prompt_id" value={prompt.id} />
          <label className="block space-y-2">
            <span className="label">Report this prompt</span>
            <textarea className="field min-h-20" name="reason" placeholder="Tell admins what looks wrong" />
          </label>
          <button className="btn-ghost mt-3"><Flag className="h-4 w-4" /> Submit report</button>
        </form>
      </section>
    </main>
  );
}
