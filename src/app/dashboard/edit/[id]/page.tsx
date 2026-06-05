import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { updateCreatorPrompt } from "@/lib/creator-actions";
import { getMyPromptById } from "@/lib/creator-data";

const categories = ["portrait", "fashion", "product", "cinematic", "architecture", "fantasy", "social", "branding"];
const models = ["Midjourney", "DALL-E", "Flux", "Stable Diffusion", "Leonardo", "Ideogram", "Firefly", "Other"];
const ratios = ["1:1", "9:16", "16:9", "4:5", "3:4"];

export const dynamic = "force-dynamic";

export default async function EditCreatorPromptPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const prompt = await getMyPromptById(id);

  if (!prompt) notFound();

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Creator studio</p>
          <h1 className="mt-2 text-3xl font-black text-white">Edit prompt</h1>
          <p className="mt-2 text-sm text-slate-400">Saving changes sends the prompt back to pending review.</p>
        </div>
        <Link href="/dashboard/my-prompts" className="btn-ghost">Back to my prompts</Link>
      </div>

      <form action={updateCreatorPrompt} className="card-surface grid gap-6 rounded-[28px] p-6 sm:p-8">
        <input type="hidden" name="id" value={prompt.id} />

        {query.message || query.error ? (
          <div className={`rounded-2xl border p-4 text-sm ${query.error ? "border-red-500/30 bg-red-500/10 text-red-100" : "border-brand/30 bg-brand/10 text-brand"}`}>
            {query.error ?? query.message}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-3">
            <span className="label">Current image</span>
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-white/10 bg-black/40">
              {prompt.image_url ? (
                <Image src={prompt.image_url} alt={prompt.title} fill className="object-cover" sizes="(min-width:1024px) 35vw, 100vw" />
              ) : (
                <div className="grid h-full place-items-center bg-brand/5 px-6 text-center text-sm text-slate-400">Text-only prompt</div>
              )}
            </div>
            <label className="block space-y-2">
              <span className="label">Replace image optional</span>
              <input className="field" name="image" type="file" accept="image/*" />
            </label>
          </div>

          <div className="space-y-5">
            <label className="block space-y-2">
              <span className="label">Title</span>
              <input className="field" name="title" required maxLength={160} defaultValue={prompt.title} />
            </label>
            <label className="block space-y-2">
              <span className="label">Description</span>
              <textarea className="field min-h-24" name="description" maxLength={500} defaultValue={prompt.description ?? ""} />
            </label>
            <label className="block space-y-2">
              <span className="label">Full prompt text</span>
              <textarea className="field min-h-48" name="prompt_text" required defaultValue={prompt.prompt_text} />
            </label>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <label className="block space-y-2">
            <span className="label">Category</span>
            <select className="field" name="category" required defaultValue={prompt.category}>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </label>
          <label className="block space-y-2">
            <span className="label">AI model</span>
            <select className="field" name="ai_model" required defaultValue={prompt.ai_model ?? "Midjourney"}>
              {models.map((model) => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </label>
          <label className="block space-y-2">
            <span className="label">Aspect ratio</span>
            <select className="field" name="aspect_ratio" required defaultValue={prompt.aspect_ratio ?? "1:1"}>
              {ratios.map((ratio) => (
                <option key={ratio} value={ratio}>{ratio}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-5">
          <label className="block space-y-2">
            <span className="label">Tags</span>
            <input className="field" name="tags" defaultValue={prompt.tags.join(", ")} />
          </label>
        </div>

        <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
          <input name="reference_required" type="checkbox" className="mt-1 h-4 w-4 accent-brand" defaultChecked={prompt.reference_required} />
          <span>This prompt works best when the user uploads a reference face or image.</span>
        </label>

        <div className="flex flex-wrap justify-end gap-3 border-t border-white/10 pt-5">
          <Link href="/dashboard/my-prompts" className="btn-ghost">Cancel</Link>
          <button className="btn-primary">Save and resubmit</button>
        </div>
      </form>
    </main>
  );
}
