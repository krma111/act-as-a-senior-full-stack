import { redirect } from "next/navigation";
import { updatePrompt } from "@/lib/actions";
import { getCategories, getPrompt } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

const models = ["Midjourney", "DALL-E", "Leonardo", "Stable Diffusion", "Flux", "Ideogram", "Firefly"];

export default async function EditPrompt({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string }>;
}) {
  const [{ id }, messageParams] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [prompt, categories] = await Promise.all([getPrompt(id), getCategories()]);
  const { data: viewer } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (!prompt || (prompt.user_id !== user.id && viewer?.role !== "admin")) redirect("/dashboard");

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <form action={updatePrompt} className="panel space-y-6 rounded-lg p-6">
        <input type="hidden" name="id" value={prompt.id} />
        <div>
          <h1 className="text-3xl font-bold">Edit prompt</h1>
          <p className="mt-2 text-slate-400">Update prompt metadata and visibility. Images stay attached to the original post.</p>
        </div>
        {messageParams.message && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-200">{messageParams.message}</p>}
        <label className="block space-y-2">
          <span className="label">Title</span>
          <input className="field" name="title" required maxLength={120} defaultValue={prompt.title} />
        </label>
        <label className="block space-y-2">
          <span className="label">Prompt text</span>
          <textarea className="field min-h-40" name="prompt_text" required defaultValue={prompt.prompt_text} />
        </label>
        <label className="block space-y-2">
          <span className="label">Negative prompt</span>
          <textarea className="field min-h-24" name="negative_prompt" defaultValue={prompt.negative_prompt ?? ""} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="label">Category</span>
            <select className="field" name="category_id" defaultValue={prompt.category_id ?? ""}>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>
          <label className="block space-y-2">
            <span className="label">AI model used</span>
            <select className="field" name="ai_model" defaultValue={prompt.ai_model}>
              {models.map((model) => <option key={model}>{model}</option>)}
            </select>
          </label>
        </div>
        <label className="block space-y-2">
          <span className="label">Tags</span>
          <input className="field" name="tags" defaultValue={prompt.tags.join(", ")} />
        </label>
        <label className="block space-y-2">
          <span className="label">Visibility</span>
          <select className="field" name="visibility" defaultValue={prompt.visibility}>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </label>
        <button className="btn-primary">Save changes</button>
      </form>
    </main>
  );
}
