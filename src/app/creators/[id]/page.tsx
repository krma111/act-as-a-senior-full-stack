import { notFound } from "next/navigation";
import { PromptGrid } from "@/components/prompt-grid";
import { demoPrompts } from "@/lib/demo-data";
import { isPreviewMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Prompt } from "@/lib/types";

export default async function CreatorProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (isPreviewMode) {
    const prompts = demoPrompts.filter((prompt) => prompt.user_id === id);
    const creator = prompts[0]?.users;
    if (!creator) notFound();

    return (
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="panel rounded-lg p-6">
          <p className="text-sm uppercase tracking-wide text-brand">Creator</p>
          <h1 className="mt-2 text-3xl font-bold">{creator.display_name ?? creator.email}</h1>
          <p className="mt-2 text-slate-400">{prompts.length} public prompts</p>
        </section>
        <section className="mt-10">
          <PromptGrid prompts={prompts} empty="This creator has not published public prompts yet." />
        </section>
      </main>
    );
  }

  const supabase = await createClient();
  const [{ data: creator }, { data: prompts }] = await Promise.all([
    supabase.from("users").select("*").eq("id", id).single(),
    supabase
      .from("prompts")
      .select("*, categories(*), users(*)")
      .eq("user_id", id)
      .eq("visibility", "public")
      .eq("hidden", false)
      .order("created_at", { ascending: false })
  ]);
  if (!creator) notFound();

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="panel rounded-lg p-6">
        <p className="text-sm uppercase tracking-wide text-brand">Creator</p>
        <h1 className="mt-2 text-3xl font-bold">{creator.display_name ?? creator.email}</h1>
        <p className="mt-2 text-slate-400">{(prompts ?? []).length} public prompts</p>
      </section>
      <section className="mt-10">
        <PromptGrid prompts={(prompts ?? []) as Prompt[]} empty="This creator has not published public prompts yet." />
      </section>
    </main>
  );
}
