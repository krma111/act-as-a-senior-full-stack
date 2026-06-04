import { notFound } from "next/navigation";
import { PromptGrid } from "@/components/prompt-grid";
import { normalizePrompt } from "@/lib/data";
import { demoPrompts } from "@/lib/demo-data";
import { isPreviewMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

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
  const [{ data: creator }, { data: prompts, error: promptsError }] = await Promise.all([
    supabase.from("profiles").select("id,email,full_name,display_name,avatar_url,role,created_at,updated_at").eq("id", id).maybeSingle(),
    supabase
      .from("prompts")
      .select("*")
      .eq("user_id", id)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
  ]);
  if (promptsError || !(prompts ?? []).length) notFound();

  const profile = creator as Profile | null;
  const creatorName = profile?.full_name ?? profile?.display_name ?? profile?.email ?? "Creator";
  const normalizedPrompts = (prompts ?? []).map((prompt) => ({
    ...normalizePrompt(prompt),
    users: profile
  }));

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="panel rounded-lg p-6">
        <p className="text-sm uppercase tracking-wide text-brand">Creator</p>
        <h1 className="mt-2 text-3xl font-bold">{creatorName}</h1>
        <p className="mt-2 text-slate-400">{normalizedPrompts.length} public prompts</p>
      </section>
      <section className="mt-10">
        <PromptGrid prompts={normalizedPrompts} empty="This creator has not published public prompts yet." />
      </section>
    </main>
  );
}
