import Link from "next/link";
import { AdminTabs } from "@/frontend/components/admin-tabs";
import { createAdminPrompt } from "@/backend/actions/admin";

export const dynamic = "force-dynamic";

const categories = ["portrait", "fashion", "product", "cinematic", "architecture", "fantasy", "social", "branding", "general"];
const models = ["Midjourney", "DALL-E", "Flux", "Stable Diffusion", "Leonardo", "Ideogram", "Firefly", "Other"];
const ratios = ["1:1", "9:16", "16:9", "4:5", "3:4"];

export default async function AdminNewPromptPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const query = await searchParams;

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <AdminTabs active="Prompts" />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Admin console</p>
          <h1 className="mt-2 text-3xl font-black text-white">Add prompt</h1>
          <p className="mt-2 text-sm text-slate-400">Create a new prompt directly from the admin panel.</p>
        </div>
        <Link href="/admin/prompts" className="btn-ghost">Back to prompts</Link>
      </div>

      <form action={createAdminPrompt} className="card-surface grid gap-6 rounded-[28px] p-6 sm:p-8">
        {query.message || query.error ? (
          <div className={`rounded-2xl border p-4 text-sm ${query.error ? "border-red-500/30 bg-red-500/10 text-red-100" : "border-brand/30 bg-brand/10 text-brand"}`}>
            {query.error ?? query.message}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-3">
            <span className="label">Image</span>
            <div className="relative flex aspect-[4/3] items-center justify-center rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-center text-sm text-slate-400">
              Upload an image or provide a URL below.
            </div>
            <label className="block space-y-2">
              <span className="label">Image file upload optional</span>
              <input className="field" name="image_file" type="file" accept="image/*" />
              <span className="text-xs text-slate-500">Maximum 8MB.</span>
            </label>
            <label className="block space-y-2">
              <span className="label">Image URL optional</span>
              <input className="field" name="image_url" type="url" placeholder="https://example.com/image.jpg" />
            </label>
          </div>

          <div className="space-y-5">
            <label className="block space-y-2">
              <span className="label">Title</span>
              <input className="field" name="title" required minLength={3} maxLength={160} placeholder="Enter prompt title" />
            </label>
            <label className="block space-y-2">
              <span className="label">Creator display name override</span>
              <input className="field" name="creator_name" placeholder="Leave empty to use admin name" />
            </label>
            <label className="block space-y-2">
              <span className="label">Description</span>
              <textarea className="field min-h-24" name="description" maxLength={500} placeholder="Short description" />
            </label>
            <label className="block space-y-2">
              <span className="label">Full prompt text</span>
              <textarea className="field min-h-48" name="prompt_text" required minLength={10} placeholder="Enter the full prompt text" />
            </label>
          </div>
        </div>

        <label className="block space-y-2">
          <span className="label">Negative prompt</span>
          <textarea className="field min-h-24" name="negative_prompt" placeholder="Optional negative prompt" />
        </label>

        <div className="grid gap-5 md:grid-cols-4">
          <label className="block space-y-2">
            <span className="label">Category</span>
            <select className="field" name="category" required defaultValue="general">
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </label>
          <label className="block space-y-2">
            <span className="label">Model</span>
            <select className="field" name="ai_model" required defaultValue="Midjourney">
              {models.map((model) => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </label>
          <label className="block space-y-2">
            <span className="label">Aspect ratio</span>
            <select className="field" name="aspect_ratio" required defaultValue="1:1">
              {ratios.map((ratio) => (
                <option key={ratio} value={ratio}>{ratio}</option>
              ))}
            </select>
          </label>
          <label className="block space-y-2">
            <span className="label">Status</span>
            <select className="field" name="status" defaultValue="pending">
              <option value="pending">pending</option>
              <option value="approved">approved</option>
              <option value="rejected">rejected</option>
            </select>
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-4">
          <label className="block space-y-2">
            <span className="label">Tags</span>
            <input className="field" name="tags" placeholder="tag1, tag2, tag3" />
          </label>
          <label className="block space-y-2">
            <span className="label">Price</span>
            <input className="field" name="price" type="number" min="0" step="0.01" defaultValue="0" />
          </label>
          <label className="block space-y-2">
            <span className="label">Visibility</span>
            <select className="field" name="visibility" defaultValue="public">
              <option value="public">public</option>
              <option value="private">private</option>
            </select>
          </label>
          <label className="block space-y-2">
            <span className="label">Rejection reason</span>
            <input className="field" name="rejection_reason" placeholder="Required when rejecting" />
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
            <input name="reference_required" type="checkbox" className="mt-1 h-4 w-4 accent-brand" />
            <span>This prompt works best with a reference face or image.</span>
          </label>
          <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
            <input name="featured" type="checkbox" className="mt-1 h-4 w-4 accent-brand" />
            <span>Feature this prompt on public discovery pages.</span>
          </label>
          <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
            <input name="hidden" type="checkbox" className="mt-1 h-4 w-4 accent-brand" />
            <span>Hide from public browse pages.</span>
          </label>
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-white/10 pt-5">
          <Link href="/admin/prompts" className="btn-ghost">Cancel</Link>
          <button className="btn-primary">Create prompt</button>
        </div>
      </form>
    </main>
  );
}
