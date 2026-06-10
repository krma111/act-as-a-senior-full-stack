"use client";

import { useMemo, useState, useTransition } from "react";
import { SafeImage } from "@/frontend/components/safe-image";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Edit3,
  Loader2,
  Save,
  Sparkles,
  Trash2,
  BadgeCheck,
  ImageIcon
} from "lucide-react";
import { toast } from "sonner";
import { saveGeneratedPromptDrafts } from "@/backend/actions/admin";
import { generateAIPrompt, approveAIPrompt } from "@/backend/actions/ai";
import { generatePromptDrafts, type GeneratedPromptDraft } from "@/backend/ai/create";

type DraftDisplay = GeneratedPromptDraft & {
  id: string;
  selected: boolean;
  editing: boolean;
  negative_prompt?: string;
  ai_model?: string;
};

const categories = ["portrait", "fashion", "product", "cinematic", "business", "fitness", "anime", "travel"];
const aspectRatios = ["1:1", "9:16", "16:9", "4:5", "3:4"];

let draftCounter = 0;

function nextDraftId() {
  draftCounter += 1;
  return `draft-${Date.now()}-${draftCounter}`;
}

export function AdminAiCreateWorkspace({ demoMode = false }: { demoMode?: boolean }) {
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState("cinematic");
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [draft, setDraft] = useState<DraftDisplay | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const [isApproving, startApproving] = useTransition();

  function updateDraft(patch: Partial<DraftDisplay>) {
    if (!draft) return;
    setDraft({ ...draft, ...patch });
  }

  function updateDraftTags(value: string) {
    if (!draft) return;
    updateDraft({
      tags: value
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 8)
    });
  }

  async function handleGenerate() {
    if (!topic.trim()) {
      toast.error("Enter a topic first.");
      return;
    }

    setIsGenerating(true);

    if (demoMode) {
      await new Promise((r) => setTimeout(r, 800));
      const mock = generatePromptDrafts(topic, category, aspectRatio, 1)[0];
      setDraft({
        ...mock,
        id: nextDraftId(),
        selected: true,
        editing: false,
        negative_prompt: "blurry, low quality, distorted",
        ai_model: "Stable Diffusion XL"
      });
      toast.success("Demo draft generated.");
      setIsGenerating(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.set("topic", topic);
      formData.set("category", category);
      formData.set("aspect_ratio", aspectRatio);

      const result = await generateAIPrompt(formData);

      if (!result.ok || !result.draft) {
        toast.error(result.message || "Generation failed.");
        setIsGenerating(false);
        return;
      }

      const d = result.draft;
      setDraft({
        id: nextDraftId(),
        title: d.title,
        prompt: d.prompt,
        description: d.description,
        tags: d.tags,
        category: d.category,
        aspectRatio: d.aspectRatio,
        imageUrl: d.imageUrl,
        status: "pending",
        selected: true,
        editing: false,
        negative_prompt: d.negative_prompt,
        ai_model: d.ai_model
      });

      toast.success("Prompt generated.");
    } catch (error) {
      console.error("[admin-ai-create] Generation error:", error);
      toast.error("Generation failed. Try again.");
    }

    setIsGenerating(false);
  }

  function handleDelete() {
    setDraft(null);
    toast.message("Draft removed.");
  }

  function handleSaveAsPending() {
    if (!draft) {
      toast.error("Generate a draft first.");
      return;
    }

    const payload = [
      {
        title: draft.title,
        prompt: draft.prompt,
        description: draft.description,
        tags: draft.tags,
        category: draft.category,
        aspectRatio: draft.aspectRatio,
        imageUrl: draft.imageUrl,
        status: draft.status
      }
    ];

    if (demoMode) {
      console.log("[PromptVault demo save] Generated prompt drafts:", payload);
      toast.success("Draft saved in demo mode.");
      setDraft(null);
      return;
    }

    startSaving(async () => {
      try {
        const result = await saveGeneratedPromptDrafts(payload);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        toast.success(result.message);
        setDraft(null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save draft.");
      }
    });
  }

  function handleApprove() {
    if (!draft) {
      toast.error("Generate a draft first.");
      return;
    }

    if (demoMode) {
      console.log("[PromptVault demo approve] Would approve:", draft.title);
      toast.success(`"${draft.title}" approved in demo mode.`);
      setDraft(null);
      return;
    }

    startApproving(async () => {
      try {
        const formData = new FormData();
        formData.set("title", draft.title);
        formData.set("prompt_text", draft.prompt);
        formData.set("description", draft.description);
        formData.set("negative_prompt", draft.negative_prompt ?? "");
        formData.set("image_url", draft.imageUrl);
        formData.set("category", draft.category);
        formData.set("aspect_ratio", draft.aspectRatio);
        formData.set("ai_model", draft.ai_model ?? "AI Generated");
        formData.set("tags", draft.tags.join(", "));

        const result = await approveAIPrompt(formData);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        toast.success(result.message);
        setDraft(null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to approve draft.");
      }
    });
  }

  return (
    <div className="space-y-8">
      <section className="card-surface rounded-[32px] p-5 sm:p-8">
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <label className="block space-y-2">
            <span className="label">Topic</span>
            <textarea
              className="field min-h-32 text-base"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., realistic bullet bike poses"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <label className="block space-y-2">
              <span className="label">Category</span>
              <select className="field" value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="block space-y-2">
              <span className="label">Aspect ratio</span>
              <select className="field" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}>
                {aspectRatios.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button className="btn-primary" onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isGenerating ? "Generating..." : "Generate"}
          </button>
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Generated result</p>
          <h2 className="mt-2 text-2xl font-black text-white">
            {draft ? "Review & Publish" : "No draft yet"}
          </h2>
        </div>

        {!draft ? (
          <div className="card-surface rounded-[32px] p-10 text-center">
            <p className="text-lg font-bold text-white">Enter a topic above to generate.</p>
            <p className="mt-2 text-sm text-slate-400">
              The AI will create a high-quality image and a detailed prompt. You can then approve it directly or save as pending for later review.
            </p>
          </div>
        ) : (
          <AnimatePresence>
            <motion.article
              key={draft.id}
              layout
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.96 }}
              className="card-surface overflow-hidden rounded-[32px]"
            >
              <div className="grid gap-0 md:grid-cols-[280px_1fr]">
                <div className="relative min-h-[300px] overflow-hidden bg-slate-950">
                  {draft.imageUrl ? (
                    <>
                      <SafeImage src={draft.imageUrl} alt={draft.title} fill className="object-cover" sizes="280px" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-brand/20" />
                    </>
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-slate-600" />
                    </div>
                  )}
                  <span className="absolute bottom-3 left-3 rounded-full bg-brand px-3 py-1 text-xs font-black text-slate-950 shadow-glow">
                    {draft.status}
                  </span>
                </div>

                <div className="space-y-4 p-5">
                  {draft.editing ? (
                    <div className="grid gap-3">
                      <input className="field" value={draft.title} onChange={(e) => updateDraft({ title: e.target.value })} />
                      <textarea className="field min-h-24" value={draft.description} onChange={(e) => updateDraft({ description: e.target.value })} />
                      <input className="field" value={draft.category} onChange={(e) => updateDraft({ category: e.target.value })} />
                      <input className="field" value={draft.aspectRatio} onChange={(e) => updateDraft({ aspectRatio: e.target.value })} />
                      <input className="field" value={draft.tags.join(", ")} onChange={(e) => updateDraftTags(e.target.value)} />
                      <input className="field" value={draft.negative_prompt ?? ""} onChange={(e) => updateDraft({ negative_prompt: e.target.value })} />
                      <input className="field" value={draft.ai_model ?? ""} onChange={(e) => updateDraft({ ai_model: e.target.value })} />
                      <input className="field" value={draft.imageUrl} onChange={(e) => updateDraft({ imageUrl: e.target.value })} />
                      <textarea className="field min-h-40" value={draft.prompt} onChange={(e) => updateDraft({ prompt: e.target.value })} />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-xl font-black text-white">{draft.title}</h3>
                          <p className="mt-2 text-sm leading-6 text-slate-400">{draft.description}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-brand/30 bg-brand/10 px-3 py-1 font-bold text-brand">{draft.category}</span>
                        <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-slate-200">{draft.aspectRatio}</span>
                        {draft.ai_model && (
                          <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 font-bold text-blue-400">{draft.ai_model}</span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {draft.tags.map((tag) => (
                          <span key={tag} className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-slate-300">
                            #{tag}
                          </span>
                        ))}
                      </div>

                      {draft.negative_prompt && (
                        <div>
                          <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-slate-500">Negative prompt</p>
                          <p className="text-sm leading-6 text-slate-400">{draft.negative_prompt}</p>
                        </div>
                      )}

                      <div>
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-slate-500">Prompt text</p>
                        <p className="max-h-40 overflow-auto rounded-2xl border border-white/10 bg-black/30 p-3 text-sm leading-6 text-slate-300">
                          {draft.prompt}
                        </p>
                      </div>
                    </>
                  )}

                  <div className="flex flex-wrap gap-3 border-t border-white/10 pt-4">
                    <button
                      className="btn-primary"
                      onClick={handleApprove}
                      disabled={isApproving}
                    >
                      {isApproving ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
                      {isApproving ? "Approving..." : "Approve & Publish"}
                    </button>

                    <button className="btn-ghost" onClick={handleSaveAsPending} disabled={isSaving}>
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {isSaving ? "Saving..." : "Save as Pending"}
                    </button>

                    <button className="btn-ghost px-3 py-2 text-xs text-red-100" onClick={() => updateDraft({ editing: !draft.editing })}>
                      {draft.editing ? <Check className="h-3.5 w-3.5" /> : <Edit3 className="h-3.5 w-3.5" />}
                      {draft.editing ? "Done" : "Edit"}
                    </button>

                    <button className="btn-ghost px-3 py-2 text-xs text-red-100" onClick={handleDelete}>
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </motion.article>
          </AnimatePresence>
        )}
      </section>
    </div>
  );
}
