import Link from "next/link";
import { UploadCloud } from "lucide-react";
import { createCreatorPrompt } from "@/lib/creator-actions";
import { requireDashboardUser } from "@/lib/creator-data";

const categories = ["portrait", "fashion", "product", "cinematic", "architecture", "fantasy", "social", "branding"];
const models = ["Midjourney", "DALL-E", "Flux", "Stable Diffusion", "Leonardo", "Ideogram", "Firefly", "Other"];
const ratios = ["1:1", "9:16", "16:9", "4:5", "3:2", "2:3"];

export const dynamic = "force-dynamic";

export default async function DashboardUploadPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const params = await searchParams;
  await requireDashboardUser("/dashboard/upload");

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Creator studio</p>
          <h1 className="mt-2 text-3xl font-black text-white">Upload a prompt</h1>
          <p className="mt-2 text-sm text-slate-400">Submit real prompt data for admin approval. New uploads stay pending until reviewed.</p>
        </div>
        <Link href="/dashboard/my-prompts" className="btn-ghost">My prompts</Link>
      </div>

      <form action={createCreatorPrompt} className="card-surface grid gap-6 rounded-[28px] p-6 sm:p-8">
        {params.message || params.error ? (
          <div className={`rounded-2xl border p-4 text-sm ${params.error ? "border-red-500/30 bg-red-500/10 text-red-100" : "border-brand/30 bg-brand/10 text-brand"}`}>
            {params.error ?? params.message}
          </div>
        ) : null}

        <label className="block space-y-2">
          <span className="label">Image upload</span>
          <div className="rounded-3xl border border-dashed border-brand/30 bg-brand/5 p-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <UploadCloud className="h-8 w-8 text-brand" />
              <p className="text-sm text-slate-300">Upload the real example image for this prompt.</p>
              <input className="field max-w-xl" name="image" type="file" accept="image/*" required />
            </div>
          </div>
        </label>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="label">Title</span>
            <input className="field" name="title" required maxLength={160} placeholder="Neon editorial portrait" />
          </label>
          <label className="block space-y-2">
            <span className="label">Category</span>
            <select className="field" name="category" required defaultValue="portrait">
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="block space-y-2">
          <span className="label">Description</span>
          <textarea className="field min-h-24" name="description" maxLength={500} placeholder="Short creator-friendly summary of what this prompt creates." />
        </label>

        <label className="block space-y-2">
          <span className="label">Full prompt text</span>
          <textarea className="field min-h-48" name="prompt_text" required placeholder="Paste the exact prompt users should copy." />
        </label>

        <div className="grid gap-5 md:grid-cols-3">
          <label className="block space-y-2">
            <span className="label">AI model</span>
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
            <span className="label">Difficulty</span>
            <select className="field" name="difficulty" required defaultValue="intermediate">
              <option value="beginner">beginner</option>
              <option value="intermediate">intermediate</option>
              <option value="advanced">advanced</option>
            </select>
          </label>
        </div>

        <label className="block space-y-2">
          <span className="label">Tags</span>
          <input className="field" name="tags" placeholder="neon, editorial, portrait, green light" />
        </label>

        <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
          <input name="reference_required" type="checkbox" className="mt-1 h-4 w-4 accent-brand" />
          <span>This prompt works best when the user uploads a reference face or image.</span>
        </label>

        <div className="flex flex-wrap justify-end gap-3 border-t border-white/10 pt-5">
          <Link href="/dashboard" className="btn-ghost">Cancel</Link>
          <button className="btn-primary">Submit for approval</button>
        </div>
      </form>
    </main>
  );
}
