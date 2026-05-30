import { redirect } from "next/navigation";
import { createPrompt } from "@/lib/actions";
import { getCategories } from "@/lib/data";
import { isPreviewMode } from "@/lib/env";
import { getPreviewUser } from "@/lib/preview-auth";
import { createClient } from "@/lib/supabase/server";

const models = ["Midjourney", "DALL-E", "Leonardo", "Stable Diffusion", "Flux", "Ideogram", "Firefly"];

export default async function NewPrompt({
  searchParams
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;
  const previewUser = await getPreviewUser();
  const supabase = isPreviewMode ? null : await createClient();
  const {
    data: { user }
  } = supabase ? await supabase.auth.getUser() : { data: { user: previewUser } };
  if (!user) redirect("/auth/login");
  const categories = await getCategories();

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <form action={createPrompt} className="panel space-y-6 rounded-lg p-6">
        <div>
          <h1 className="text-3xl font-bold">Publish a prompt</h1>
          <p className="mt-2 text-slate-400">Share the prompt, model context, tags, and a real example image.</p>
        </div>
        {params.message && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-200">{params.message}</p>}
        <label className="block space-y-2">
          <span className="label">Title</span>
          <input className="field" name="title" required maxLength={120} />
        </label>
        <label className="block space-y-2">
          <span className="label">Prompt text</span>
          <textarea className="field min-h-40" name="prompt_text" required />
        </label>
        <label className="block space-y-2">
          <span className="label">Negative prompt</span>
          <textarea className="field min-h-24" name="negative_prompt" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="label">Category</span>
            <select className="field" name="category_id" required>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>
          <label className="block space-y-2">
            <span className="label">AI model used</span>
            <select className="field" name="ai_model" required>
              {models.map((model) => <option key={model}>{model}</option>)}
            </select>
          </label>
        </div>
        <label className="block space-y-2">
          <span className="label">Tags</span>
          <input className="field" name="tags" placeholder="portrait, cinematic, neon" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="label">Visibility</span>
            <select className="field" name="visibility">
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </label>
          <label className="block space-y-2">
            <span className="label">Example image</span>
            <input className="field" name="image" type="file" accept="image/*" required />
          </label>
        </div>
        <button className="btn-primary">Publish prompt</button>
      </form>
    </main>
  );
}
