"use client";

import Link from "next/link";
import { type FormEvent, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { motion } from "framer-motion";
import { LoaderCircle, UploadCloud, X } from "lucide-react";
import { createCreatorPrompt } from "@/backend/actions/creators";
import { MAX_PROMPT_TAGS, PREDEFINED_PROMPT_TAGS, normalizePromptTag } from "@/shared/validation/prompt-tags";

const categories = ["portrait", "fashion", "product", "cinematic", "architecture", "fantasy", "social", "branding"];
const models = ["Midjourney", "DALL-E", "Flux", "Stable Diffusion", "Leonardo", "Ideogram", "Firefly", "Other"];
const ratios = ["1:1", "9:16", "16:9", "4:5", "3:4"];
const maxImageSizeBytes = 8 * 1024 * 1024;

const descriptionTemplates = [
  "Premium reusable AI image prompt designed for creators who want professional results using their own photo.",
  "High quality cinematic prompt with face preservation instructions and optimized generation settings.",
  "Ready-to-use prompt tested for social media, profile pictures, and content creation.",
  "Professional AI prompt crafted for realistic results while maintaining subject identity.",
  "Reusable creator prompt suitable for Midjourney, ChatGPT Images, Flux, Ideogram and similar models."
];

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <motion.button className="btn-primary min-w-[12rem] justify-center" disabled={pending} whileHover={pending ? undefined : { y: -2, scale: 1.015 }} whileTap={pending ? undefined : { scale: 0.965 }}>
      {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
      {pending ? "Submitting..." : "Submit for approval"}
    </motion.button>
  );
}

function getFileError(file: File | null) {
  if (!file) return null;
  if (!file.type.startsWith("image/")) return "Upload a valid image file.";
  if (file.size > maxImageSizeBytes) return "Images must be smaller than 8 MB.";
  return null;
}

function ratioValue(value: string) {
  const [width, height] = value.split(":").map(Number);
  return width && height ? width / height : 1;
}

function detectClosestAspectRatio(width: number, height: number) {
  const imageRatio = width / height;

  return ratios.reduce((best, ratio) => {
    const bestDiff = Math.abs(Math.log(imageRatio / ratioValue(best)));
    const nextDiff = Math.abs(Math.log(imageRatio / ratioValue(ratio)));
    return nextDiff < bestDiff ? ratio : best;
  }, "1:1");
}

export function CreatorUploadForm({ message, error }: { message?: string; error?: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [detectedAspectRatio, setDetectedAspectRatio] = useState<string | null>(null);
  const [tagSearch, setTagSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const filteredTags = useMemo(() => {
    const query = normalizePromptTag(tagSearch);
    return PREDEFINED_PROMPT_TAGS.filter((tag) => !selectedTags.includes(tag) && (!query || tag.includes(query))).slice(0, 18);
  }, [selectedTags, tagSearch]);

  function setTagLimitError() {
    setClientError(`Choose up to ${MAX_PROMPT_TAGS} tags.`);
  }

  function addTag(value: string) {
    const tag = normalizePromptTag(value);
    if (!tag || selectedTags.includes(tag)) return;
    if (selectedTags.length >= MAX_PROMPT_TAGS) {
      setTagLimitError();
      return;
    }

    setSelectedTags((current) => [...current, tag]);
    setTagSearch("");
    setClientError(null);
  }

  function removeTag(tag: string) {
    setSelectedTags((current) => current.filter((item) => item !== tag));
    setClientError(null);
  }

  function validateBeforeSubmit(event: FormEvent<HTMLFormElement>) {
    const file = fileInputRef.current?.files?.[0] ?? null;
    const fileError = getFileError(file);

    if (fileError) {
      event.preventDefault();
      setClientError(fileError);
      return;
    }

    if (selectedTags.length > MAX_PROMPT_TAGS) {
      event.preventDefault();
      setTagLimitError();
      return;
    }

    setClientError(null);
  }

  function handleImageChange() {
    const file = fileInputRef.current?.files?.[0] ?? null;
    const fileError = getFileError(file);
    setClientError(fileError);
    setDetectedAspectRatio(null);

    if (!file || fileError) return;

    const objectUrl = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      const nextRatio = detectClosestAspectRatio(image.naturalWidth, image.naturalHeight);
      setDetectedAspectRatio(nextRatio);
      setAspectRatio(nextRatio);
      URL.revokeObjectURL(objectUrl);
    };
    image.onerror = () => {
      setClientError("Could not read this image dimensions. You can still select the aspect ratio manually.");
      URL.revokeObjectURL(objectUrl);
    };
    image.src = objectUrl;
  }

  const visibleError = clientError ?? error;

  return (
    <motion.form
      action={createCreatorPrompt}
      onSubmit={validateBeforeSubmit}
      className="card-surface grid gap-6 rounded-[32px] p-6 sm:p-8"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
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
        <div className="rounded-3xl border border-dashed border-brand/30 bg-brand/5 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition duration-300 hover:border-brand/50 hover:bg-brand/10">
          <div className="flex flex-col items-center gap-3 text-center">
            <UploadCloud className="h-8 w-8 text-brand" />
            <p className="text-sm text-slate-300">Upload an optional example image for this prompt. Maximum size: 8 MB.</p>
            <input ref={fileInputRef} className="field max-w-xl" name="image" type="file" accept="image/*" onChange={handleImageChange} />
            {detectedAspectRatio ? (
              <p className="rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                Detected aspect ratio: {detectedAspectRatio}
              </p>
            ) : null}
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

      <div className="space-y-3">
        <span className="label">Description optional</span>
        <div className="grid gap-2 sm:grid-cols-2">
          {descriptionTemplates.map((template, index) => (
            <motion.button
              key={template}
              type="button"
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-left text-xs leading-5 text-slate-300 transition hover:border-brand/40 hover:text-white"
              onClick={() => setDescription(template)}
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="mb-1 block font-bold text-brand">Template {index + 1}</span>
              {template}
            </motion.button>
          ))}
        </div>
        <textarea
          className="field min-h-24"
          name="description"
          maxLength={500}
          placeholder="Short creator-friendly summary of what this prompt creates."
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

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
        <label className="block space-y-2 md:col-span-2">
          <span className="label">Aspect ratio</span>
          <select className="field" name="aspect_ratio" required value={aspectRatio} onChange={(event) => setAspectRatio(event.target.value)}>
            {ratios.map((ratio) => (
              <option key={ratio} value={ratio}>
                {ratio}
              </option>
            ))}
          </select>
          <span className="block text-xs text-slate-500">Auto-detected from uploaded image when available. You can override it.</span>
        </label>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className="label">Tags</span>
          <span className="text-xs text-slate-500">{selectedTags.length}/{MAX_PROMPT_TAGS} selected</span>
        </div>
        <input type="hidden" name="tags" value={selectedTags.join(",")} />
        {selectedTags.length ? (
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <motion.button
                key={tag}
                type="button"
                className="inline-flex items-center gap-1 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand"
                onClick={() => removeTag(tag)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
              >
                #{tag}
                <X className="h-3 w-3" />
              </motion.button>
            ))}
          </div>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className="field"
            value={tagSearch}
            onChange={(event) => setTagSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addTag(tagSearch);
              }
            }}
            placeholder="Search or type a custom tag"
          />
          <button type="button" className="btn-ghost shrink-0" onClick={() => addTag(tagSearch)}>
            Add tag
          </button>
        </div>
        <div className="flex max-h-44 flex-wrap gap-2 overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          {filteredTags.map((tag) => (
            <motion.button key={tag} type="button" className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-slate-300 hover:bg-brand/10 hover:text-brand" onClick={() => addTag(tag)} whileHover={{ y: -1, scale: 1.03 }} whileTap={{ scale: 0.95 }}>
              #{tag}
            </motion.button>
          ))}
          {!filteredTags.length ? <span className="text-xs text-slate-500">No matching tags. Add a custom tag.</span> : null}
        </div>
      </div>

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
    </motion.form>
  );
}
