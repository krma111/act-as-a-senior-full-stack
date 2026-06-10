import { SafeImage } from "@/components/safe-image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Flag, Heart, User } from "lucide-react";
import { CreatorBadge } from "@/components/creator-badge";
import { MotionMain, MotionSection } from "@/components/motion-primitives";
import { PromptActions } from "@/components/prompt-actions";
import { reportPrompt } from "@/lib/actions";
import { getAuthSessionState } from "@/lib/auth/session";
import { getPrompt } from "@/lib/data";
import { creatorSlug } from "@/lib/slugs";

export async function PublicPromptDetail({ idOrSlug, message, error }: { idOrSlug: string; message?: string; error?: string }) {
  const prompt = await getPrompt(idOrSlug);
  if (!prompt) notFound();

  const { supabase, user } = await getAuthSessionState();

  const { favorite, saveCount } = supabase
    ? await Promise.all([
        user
          ? supabase.from("saved_prompts").select("id").eq("prompt_id", prompt.id).eq("user_id", user.id).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase.from("saved_prompts").select("id", { count: "exact", head: true }).eq("prompt_id", prompt.id)
      ])
        .then(([favoriteResult, saveResult]) => ({
          favorite: favoriteResult.data,
          saveCount: saveResult.count ?? 0
        }))
        .catch(() => ({ favorite: null, saveCount: 0 }))
    : { favorite: null, saveCount: 0 };

  const creatorName = prompt.users?.full_name ?? prompt.users?.display_name ?? prompt.users?.email?.split("@")[0] ?? "Creator";
  const creatorHref = `/creator/${prompt.users ? creatorSlug(prompt.users) : prompt.user_id}`;

  return (
    <MotionMain className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
      <MotionSection className="card-surface overflow-hidden rounded-[34px]">
        <div className="relative aspect-[4/3]">
          {prompt.image_url ? (
            <SafeImage
              src={prompt.image_url}
              alt={prompt.title}
              fill
              className="object-cover"
              priority
              sizes="(min-width:1024px) 55vw, 100vw"
            />
          ) : (
            <div className="grid h-full place-items-center bg-brand/5 px-6 text-center text-sm font-semibold text-slate-400">
              Text-only prompt
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,255,0,0.18),transparent_52%)]" />
        </div>
      </MotionSection>
      <MotionSection className="space-y-6" delay={0.08}>
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            {prompt.featured && <span className="status-pill border-brand/30 bg-brand px-3 py-1 text-slate-950">Featured</span>}
            <Link href={`/category/${prompt.categories?.slug ?? "uncategorized"}`} className="status-pill border-white/10 bg-white/10 text-slate-300 hover:text-brand">
              {prompt.categories?.name ?? "Uncategorized"}
            </Link>
            <span className="status-pill border-white/10 bg-white/10 text-slate-300">{prompt.ai_model}</span>
            {prompt.aspect_ratio && <span className="status-pill border-white/10 bg-white/10 text-slate-300">{prompt.aspect_ratio}</span>}
          </div>
          <h1 className="hero-title text-3xl font-black tracking-normal sm:text-4xl">{prompt.title}</h1>
          <Link href={creatorHref} className="mt-4 inline-flex items-center gap-2 text-sm text-slate-300 hover:text-brand">
            <User className="h-4 w-4" /> {creatorName}
            <CreatorBadge profile={prompt.users} compact />
          </Link>
        </div>

        {(message || error) && (
          <p className={`rounded-lg border p-3 text-sm ${error ? "border-red-500/30 bg-red-500/10 text-red-100" : "border-brand/30 bg-brand/10 text-brand"}`}>
            {error ?? message}
          </p>
        )}

        <PromptActions promptId={prompt.id} promptText={prompt.prompt_text} initialCopyCount={prompt.copy_count} initialFavorited={Boolean(favorite)} />

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="panel rounded-[24px] p-4">
            <p className="text-sm text-slate-400">Saves</p>
            <p className="mt-1 flex items-center gap-2 text-2xl font-bold"><Heart className="h-5 w-5 text-brand" /> {saveCount ?? 0}</p>
          </div>
          <div className="panel rounded-[24px] p-4">
            <p className="text-sm text-slate-400">Model</p>
            <p className="mt-1 text-lg font-bold text-white">{prompt.ai_model}</p>
          </div>
          <div className="panel rounded-[24px] p-4">
            <p className="text-sm text-slate-400">Aspect ratio</p>
            <p className="mt-1 text-lg font-bold text-white">{prompt.aspect_ratio ?? "Not specified"}</p>
          </div>
        </div>

        {prompt.description && <p className="card-surface rounded-[24px] p-5 text-sm leading-7 text-slate-300">{prompt.description}</p>}

        <div className="card-surface rounded-[24px] p-5">
          <h2 className="mb-3 font-semibold">Full prompt</h2>
          <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-slate-200">{prompt.prompt_text}</pre>
        </div>
        {prompt.negative_prompt && (
          <div className="card-surface rounded-[24px] p-5">
            <h2 className="mb-3 font-semibold">Negative prompt</h2>
            <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-slate-300">{prompt.negative_prompt}</pre>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {prompt.tags.map((tag) => (
            <Link key={tag} href={`/prompts?q=${encodeURIComponent(tag)}`} className="rounded-md bg-white/10 px-2.5 py-1 text-sm text-slate-300 hover:text-brand">
              #{tag}
            </Link>
          ))}
        </div>
        <form action={reportPrompt} className="card-surface rounded-[24px] p-4">
          <input type="hidden" name="prompt_id" value={prompt.id} />
          <label className="block space-y-2">
            <span className="label">Report this prompt</span>
            <textarea className="field min-h-20" name="reason" placeholder="Tell admins what looks wrong" />
          </label>
          <button className="btn-ghost mt-3"><Flag className="h-4 w-4" /> Submit report</button>
        </form>
      </MotionSection>
    </MotionMain>
  );
}

