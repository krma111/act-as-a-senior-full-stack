"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, Copy, ImagePlus, Upload } from "lucide-react";
import { toast } from "sonner";
import type { StyleExample } from "@/lib/style-examples";

type UploadedImage = {
  name: string;
  url: string;
};

function StyleCard({ example }: { example: StyleExample }) {
  const [uploaded, setUploaded] = useState<UploadedImage | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const prompt = useMemo(() => {
    const source = uploaded ? `Reference photo: ${uploaded.name}. ` : "Reference photo: upload your image first. ";
    return `${source}${example.prompt}`;
  }, [example.prompt, uploaded]);

  return (
    <article className="card-surface overflow-hidden rounded-2xl transition duration-500 hover:-translate-y-2 hover:border-brand/50">
      <div className="relative aspect-[4/5] overflow-hidden bg-slate-900">
        {/* eslint-disable-next-line @next/next/no-img-element -- Supports blob: URLs from local upload previews. */}
        <img src={uploaded?.url ?? example.imageUrl} alt={example.title} className="h-full w-full object-cover transition duration-700 hover:scale-110" loading="lazy" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(57,255,20,0.22),transparent_58%)]" />
        <div className="absolute left-3 top-3 rounded-md bg-slate-950/75 px-2 py-1 text-xs font-semibold text-white backdrop-blur">
          {example.category}
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div>
          <h3 className="text-base font-semibold text-white">{example.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-slate-400">{example.accent}</p>
        </div>

        <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-white/15 bg-white/[0.035] px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-brand/60 hover:text-brand">
          <ImagePlus className="h-4 w-4" />
          {uploaded ? "Replace photo" : "Upload photo"}
          <input
            className="sr-only"
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              if (uploaded) URL.revokeObjectURL(uploaded.url);
              setUploaded({ name: file.name, url: URL.createObjectURL(file) });
              setCopied(false);
            }}
          />
        </label>

        <button
          className="btn-primary w-full"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              try {
                await navigator.clipboard.writeText(prompt);
                setCopied(true);
                toast.success("Style prompt copied");
              } catch (error) {
                console.error("[style-remix] Clipboard copy failed", error);
                toast.error("Your browser blocked clipboard access.");
              }
            })
          }
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          Copy style prompt
        </button>
      </div>
    </article>
  );
}

export function StyleRemixGrid({ examples }: { examples: StyleExample[] }) {
  return (
    <section className="section-shell mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-brand">{examples.length} recreate-ready styles</p>
          <h2 className="mt-2 flex items-center gap-2 text-2xl font-bold">
            <Upload className="h-6 w-6 text-brand" /> Upload your photo and copy the matching prompt
          </h2>
        </div>
      </div>
      <div className="grid-cascade grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {examples.map((example) => (
          <StyleCard key={example.id} example={example} />
        ))}
      </div>
    </section>
  );
}
