import Link from "next/link";
import { redirect } from "next/navigation";
import { Trash2 } from "lucide-react";
import { PromptGrid } from "@/components/prompt-grid";
import { deleteOwnPrompt, updateProfile } from "@/lib/actions";
import { demoPrompts } from "@/lib/demo-data";
import { isPreviewMode } from "@/lib/env";
import { getPreviewUser } from "@/lib/preview-auth";
import { createClient } from "@/lib/supabase/server";
import type { FavoriteWithPrompt, Prompt } from "@/lib/types";

export default async function Profile({
  searchParams
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;
  if (isPreviewMode) {
    const previewUser = await getPreviewUser();
    if (!previewUser) redirect("/auth/login");

    return (
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="panel rounded-lg p-6">
          <p className="text-sm uppercase tracking-wide text-brand">Creator profile</p>
          <h1 className="mt-2 text-3xl font-bold">{previewUser.display_name}</h1>
          <p className="mt-2 text-slate-400">{previewUser.email}</p>
          {params.message && <p className="mt-4 rounded-lg border border-brand/30 bg-brand/10 p-3 text-sm text-brand">{params.message}</p>}
          <Link href="/prompts/new" className="btn-primary mt-5">Upload a prompt</Link>
        </section>

        <section className="mt-10">
          <h2 className="mb-5 text-2xl font-bold">Saved favorites</h2>
          <PromptGrid prompts={demoPrompts} empty="No saved prompts yet." />
        </section>
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: profile }, { data: prompts }, { data: favorites }] = await Promise.all([
    supabase.from("users").select("*").eq("id", user.id).single(),
    supabase.from("prompts").select("*, categories(*), users(*)").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("favorites").select("prompts(*, categories(*), users(*))").eq("user_id", user.id)
  ]);

  const saved = ((favorites ?? []) as unknown as FavoriteWithPrompt[])
    .map((item) => item.prompts)
    .filter((prompt): prompt is Prompt => Boolean(prompt));

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="panel rounded-lg p-6">
        <p className="text-sm uppercase tracking-wide text-brand">Creator profile</p>
        <h1 className="mt-2 text-3xl font-bold">{profile?.display_name ?? user.email}</h1>
        <p className="mt-2 text-slate-400">{user.email}</p>
        {params.message && <p className="mt-4 rounded-lg border border-brand/30 bg-brand/10 p-3 text-sm text-brand">{params.message}</p>}
        <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <form action={updateProfile} className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <label className="block space-y-2">
              <span className="label">Display name</span>
              <input className="field" name="display_name" defaultValue={profile?.display_name ?? ""} required maxLength={80} />
            </label>
            <button className="btn-ghost self-end">Save profile</button>
          </form>
          <Link href="/prompts/new" className="btn-primary">Upload a prompt</Link>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-5 text-2xl font-bold">Your uploaded prompts</h2>
        <div className="mb-4 grid gap-3">
          {(prompts ?? []).map((prompt: Prompt) => (
            <div key={prompt.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <Link href={`/prompts/${prompt.id}`} className="font-semibold hover:text-brand">{prompt.title}</Link>
              <div className="flex gap-2">
                <Link href={`/prompts/${prompt.id}/edit`} className="btn-ghost">Edit</Link>
                <form action={deleteOwnPrompt}>
                  <input type="hidden" name="id" value={prompt.id} />
                  <button className="btn-ghost text-red-200"><Trash2 className="h-4 w-4" /> Delete</button>
                </form>
              </div>
            </div>
          ))}
        </div>
        {!prompts?.length && <p className="rounded-lg border border-dashed border-white/15 p-8 text-center text-slate-400">You have not uploaded prompts yet.</p>}
      </section>

      <section className="mt-10">
        <h2 className="mb-5 text-2xl font-bold">Saved favorites</h2>
        <PromptGrid prompts={saved} empty="No saved prompts yet." />
      </section>
    </main>
  );
}
