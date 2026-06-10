import { SafeImage } from "@/frontend/components/safe-image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminTabs } from "@/frontend/components/admin-tabs";
import { updateAdminPrompt } from "@/backend/actions/admin";
import { getAdminPromptById } from "@/backend/data/admin";

const categories = ["portrait", "fashion", "product", "cinematic", "architecture", "fantasy", "social", "branding", "general"];
const models = ["Midjourney", "DALL-E", "Flux", "Stable Diffusion", "Leonardo", "Ideogram", "Firefly", "Other"];
const ratios = ["1:1", "9:16", "16:9", "4:5", "3:4"];

export const dynamic = "force-dynamic";

export default async function AdminEditPromptPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const prompt = await getAdminPromptById(id);

  if (!prompt) notFound();

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <AdminTabs active="Prompts" />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Admin console</p>
          <h1 className="mt-2 text-3xl font-black text-white">Edit prompt</h1>
          <p className="mt-2 text-sm text-slate-400">Admin edits apply directly to the production prompt record.</p>
        </div>
        <Link href="/admin/prompts" className="btn-ghost">Back to prompts</Link>
      </div>

      <form action={updateAdminPrompt} className="card-surface grid gap-6 rounded-[28px] p-6 sm:p-8">
        <input type="hidden" name="id" value={prompt.id} />

        {query.message || query.error ? (
          <div className={`rounded-2xl border p-4 text-sm ${query.error ? "border-red-500/30 bg-red-500/10 text-red-100" : "border-brand/30 bg-brand/10 text-brand"}`}>
            {query.error ?? query.message}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-3">
            <span className="label">Image</span>
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-white/10 bg-black/40">
              {prompt.image_url ? (
                <SafeImage src={prompt.image_url} alt={prompt.title || "Prompt image"} fill className="object-cover" sizes="(min-width:1024px) 35vw, 100vw" />
              ) : (
                <div className="grid h-full place-items-center bg-brand/5 px-6 text-center text-sm text-slate-400">Text-only prompt</div>
              )}
            </div>
            <label className="block space-y-2">
              <span className="label">Replace image upload optional</span>
              <input className="field" name="image_file" type="file" accept="image/*" />
              <span className="text-xs text-slate-500">Maximum 8MB. Upload overrides the URL below.</span>
            </label>
            <label className="block space-y-2">
              <span className="label">Image URL optional</span>
              <input className="field" name="image_url" type="url" defaultValue={prompt.image_url ?? ""} />
            </label>
          </div>

          <div className="space-y-5">
            <label className="block space-y-2">
              <span className="label">Title</span>
              <input className="field" name="title" required minLength={3} maxLength={160} defaultValue={prompt.title} />
            </label>
            <label className="block space-y-2">
              <span className="label">Creator display name override</span>
              <input className="field" name="creator_name" defaultValue={prompt.creator_name_override ?? ""} placeholder={prompt.creator_name ?? "Creator"} />
            </label>
            <label className="block space-y-2">
              <span className="label">Description</span>
              <textarea className="field min-h-24" name="description" maxLength={500} defaultValue={prompt.description ?? ""} />
            </label>
            <label className="block space-y-2">
              <span className="label">Full prompt text</span>
              <textarea className="field min-h-48" name="prompt_text" required minLength={10} defaultValue={prompt.prompt_text} />
            </label>
          </div>
        </div>

        <label className="block space-y-2">
          <span className="label">Negative prompt</span>
          <textarea className="field min-h-24" name="negative_prompt" defaultValue={prompt.negative_prompt ?? ""} />
        </label>

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
            <span className="label">Model</span>
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

        <div className="grid gap-5 md:grid-cols-3">
          <label className="block space-y-2">
            <span className="label">Status</span>
            <select className="field" name="status" required defaultValue={prompt.status}>
              <option value="pending">pending</option>
              <option value="approved">approved</option>
              <option value="rejected">rejected</option>
            </select>
          </label>
          <label className="block space-y-2">
            <span className="label">Visibility</span>
            <select className="field" name="visibility" defaultValue={prompt.visibility ?? "public"}>
              <option value="public">public</option>
              <option value="private">private</option>
            </select>
          </label>
          <label className="block space-y-2">
            <span className="label">Tags</span>
            <input className="field" name="tags" defaultValue={prompt.tags.join(", ")} />
          </label>
          <label className="block space-y-2">
            <span className="label">Price</span>
            <input className="field" name="price" type="number" min="0" step="0.01" defaultValue={prompt.price ?? 0} />
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <label className="block space-y-2">
            <span className="label">Copy count</span>
            <input className="field" name="copy_count" type="number" min="0" step="1" defaultValue={prompt.copy_count ?? 0} />
          </label>
          <label className="block space-y-2">
            <span className="label">Favourite/save count</span>
            <input className="field" name="save_count" type="number" min="0" step="1" defaultValue={prompt.save_count ?? 0} />
          </label>
          <label className="block space-y-2">
            <span className="label">View count</span>
            <input className="field" value={prompt.view_count ?? 0} readOnly />
          </label>
        </div>

        <label className="block space-y-2">
          <span className="label">Rejection reason</span>
          <input className="field" name="rejection_reason" defaultValue={prompt.rejection_reason ?? ""} placeholder="Required when rejecting" />
        </label>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
            <input name="reference_required" type="checkbox" className="mt-1 h-4 w-4 accent-brand" defaultChecked={prompt.reference_required} />
            <span>This prompt works best with a reference face or image.</span>
          </label>
          <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
            <input name="featured" type="checkbox" className="mt-1 h-4 w-4 accent-brand" defaultChecked={prompt.featured} />
            <span>Feature this prompt on public discovery pages.</span>
          </label>
          <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
            <input name="hidden" type="checkbox" className="mt-1 h-4 w-4 accent-brand" defaultChecked={prompt.hidden ?? false} />
            <span>Hide from public browse pages.</span>
          </label>
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-white/10 pt-5">
          <Link href="/admin/prompts" className="btn-ghost">Cancel</Link>
          <button className="btn-primary">Save prompt</button>
        </div>
      </form>
    </main>
  );
}
