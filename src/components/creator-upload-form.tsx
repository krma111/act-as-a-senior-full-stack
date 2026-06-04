"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle, UploadCloud } from "lucide-react";
import { createCreatorPrompt } from "@/lib/creator-actions";

const categories = ["portrait", "fashion", "product", "cinematic", "architecture", "fantasy", "social", "branding"];
const models = ["Midjourney", "DALL-E", "Flux", "Stable Diffusion", "Leonardo", "Ideogram", "Firefly", "Other"];
const ratios = ["1:1", "9:16", "16:9", "4:5", "3:2", "2:3"];
const maxImageSizeBytes = 8 * 1024 * 1024;

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button className="btn-primary min-w-[12rem] justify-center" disabled={pending}>
      {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
      {pending ? "Submitting..." : "Submit for approval"}
    </button>
  );
}

function getFileError(file: File | null) {
  if (!file) return null;
  if (!file.type.startsWith("image/")) return "Upload a valid image file.";
  if (file.size > maxImageSizeBytes) return "Images must be smaller than 8 MB.";
  return null;
}

export function CreatorUploadForm({ message, error }: { message?: string; error?: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [clientError, setClientError] = useState<string | null>(null);

  function validateBeforeSubmit(event: React.FormEvent<HTMLFormElement>) {
    const file = fileInputRef.current?.files?.[0] ?? null;
    const fileError = getFileError(file);

    if (fileError) {
      event.preventDefault();
      setClientError(fileError);
      return;
    }

    setClientError(null);
  }

  const visibleError = clientError ?? error;

  return (
    <form action={createCreatorPrompt} onSubmit={validateBeforeSubmit} className="card-surface grid gap-6 rounded-[28px] p-6 sm:p-8">
      {message || visibleError ? (
        <div
          className={`rounded-2xl border p-4 text-sm ${
            visibleError ? "border-red-500/30 bg-red-500/10 text-red-100" : "border-brand/30 bg-brand/10 text-brand"
          }`}
          role={visibleError ? "alert" : "status"}
        >
          {visibleError ?? message}
        </div>
      ) : null}

      <label className="block space-y-2">
        <span className="label">Image upload</span>
        <div className="rounded-3xl border border-dashed border-brand/30 bg-brand/5 p-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <UploadCloud className="h-8 w-8 text-brand" />
            <p className="text-sm text-slate-300">Upload an optional example image for this prompt. Maximum size: 8 MB.</p>
            <input
              ref={fileInputRef}
              className="field max-w-xl"
              name="image"
              type="file"
              accept="image/*"
              onChange={() => setClientError(getFileError(fileInputRef.current?.files?.[0] ?? null))}
            />
          </div>
        </div>
      </label>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block space-y-2">
          <span className="label">Title</span>
          <input className="field" name="title" required minLength={3} maxLength={160} placeholder="Neon editorial portrait" />
        </label>
        <label className="block space-y-2">
          <span className="label">Category</span>
          <select className="field" name="category" required defaultValue="portrait">
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
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
        <textarea className="field min-h-48" name="prompt_text" required minLength={10} placeholder="Paste the exact prompt users should copy." />
      </label>

      <div className="grid gap-5 md:grid-cols-3">
        <label className="block space-y-2">
          <span className="label">AI model</span>
          <select className="field" name="ai_model" required defaultValue="Midjourney">
            {models.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-2">
          <span className="label">Aspect ratio</span>
          <select className="field" name="aspect_ratio" required defaultValue="1:1">
            {ratios.map((ratio) => (
              <option key={ratio} value={ratio}>
                {ratio}
              </option>
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
        <Link href="/dashboard" className="btn-ghost">
          Cancel
        </Link>
        <SubmitButton />
      </div>
    </form>
  );
}
