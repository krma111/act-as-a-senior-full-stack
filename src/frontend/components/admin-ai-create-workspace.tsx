"use client";

import { useMemo, useState, useTransition } from "react";
import { SafeImage } from "@/frontend/components/safe-image";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Edit3, Loader2, Save, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { saveGeneratedPromptDrafts } from "@/backend/actions/admin";
import { generatePromptDrafts, type GeneratedPromptDraft } from "@/backend/ai/create";

type DraftState = GeneratedPromptDraft & {
  id: string;
  selected: boolean;
  editing: boolean;
};

const categories = ["portrait", "fashion", "product", "cinematic", "business", "fitness", "anime", "travel"];
const aspectRatios = ["1:1", "9:16", "16:9", "4:5", "3:4"];
const quantities = [1, 5, 10, 25];

function draftId(index: number) {
  return `draft-${Date.now()}-${index}`;
}

function toDraftState(draft: GeneratedPromptDraft, index: number): DraftState {
  return {
    ...draft,
    id: draftId(index),
    selected: true,
    editing: false
  };
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function generateDraftsWithRetry(idea: string, category: string, aspectRatio: string, quantity: number) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      return generatePromptDrafts(idea, category, aspectRatio, quantity).map(toDraftState);
    } catch (error) {
      lastError = error;
      console.error(`[admin-ai-create] Draft generation failed on attempt ${attempt}`, error);
      await wait(180);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Unable to generate drafts.");
}

export function AdminAiCreateWorkspace({ demoMode = false }: { demoMode?: boolean }) {
  const [idea, setIdea] = useState("Cyberpunk Indian girl in rain");
  const [category, setCategory] = useState("portrait");
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [quantity, setQuantity] = useState(5);
  const [drafts, setDrafts] = useState<DraftState[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, startSaving] = useTransition();

  const selectedDrafts = useMemo(() => drafts.filter((draft) => draft.selected), [drafts]);

  function updateDraft(id: string, patch: Partial<DraftState>) {
    setDrafts((current) => current.map((draft) => (draft.id === id ? { ...draft, ...patch } : draft)));
  }

  function updateDraftTags(id: string, value: string) {
    updateDraft(id, {
      tags: value
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 5)
    });
  }

  function generateDrafts() {
    if (!idea.trim()) {
      toast.error("Enter an idea first.");
      return;
    }

    setIsGenerating(true);
    window.setTimeout(() => {
      // Future AI connection point: replace this mock generator with a server action
      // that calls the chosen text/image model and returns the same draft shape.
      generateDraftsWithRetry(idea, category, aspectRatio, quantity)
        .then((generated) => {
          setDrafts(generated);
          toast.success(`${generated.length} draft${generated.length === 1 ? "" : "s"} generated.`);
        })
        .catch((error) => {
          console.error("[admin-ai-create] Draft generation failed", error);
          toast.error("Unable to generate drafts. Try a shorter idea.");
        })
        .finally(() => setIsGenerating(false));
    }, 450);
  }

  function deleteDraft(id: string) {
    setDrafts((current) => current.filter((draft) => draft.id !== id));
    toast.message("Draft removed.");
  }

  function saveSelectedDrafts() {
    if (!selectedDrafts.length) {
      toast.error("Select at least one draft to save.");
      return;
    }

    const payload = selectedDrafts.map((draft) => ({
      title: draft.title,
      prompt: draft.prompt,
      description: draft.description,
      tags: draft.tags,
      category: draft.category,
      aspectRatio: draft.aspectRatio,
      imageUrl: draft.imageUrl,
      status: draft.status
    }));

    if (demoMode) {
      console.log("[PromptVault demo save] Generated prompt drafts:", payload);
      toast.success(`${payload.length} draft${payload.length === 1 ? "" : "s"} saved in demo mode.`);
      setDrafts([]);
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
        setDrafts([]);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save generated drafts.");
      }
    });
  }

  return (
    <div className="space-y-8">
      <section className="card-surface rounded-[32px] p-5 sm:p-8">
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <label className="block space-y-2">
            <span className="label">Idea</span>
            <textarea
              className="field min-h-32 text-base"
              value={idea}
              onChange={(event) => setIdea(event.target.value)}
              placeholder="Cyberpunk Indian girl in rain"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <label className="block space-y-2">
              <span className="label">Category</span>
              <select className="field" value={category} onChange={(event) => setCategory(event.target.value)}>
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-2">
              <span className="label">Aspect ratio</span>
              <select className="field" value={aspectRatio} onChange={(event) => setAspectRatio(event.target.value)}>
                {aspectRatios.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-2">
              <span className="label">Quantity</span>
              <select className="field" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))}>
                {quantities.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button className="btn-primary" onClick={generateDrafts} disabled={isGenerating}>
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isGenerating ? "Generating..." : "Generate"}
          </button>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Generated results preview</p>
            <h2 className="mt-2 text-2xl font-black text-white">{drafts.length ? `${drafts.length} draft${drafts.length === 1 ? "" : "s"} ready` : "No drafts yet"}</h2>
          </div>
          <button className="btn-primary" onClick={saveSelectedDrafts} disabled={!selectedDrafts.length || isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSaving ? "Saving..." : `Save selected (${selectedDrafts.length})`}
          </button>
        </div>

        {!drafts.length ? (
          <div className="card-surface rounded-[32px] p-10 text-center">
            <p className="text-lg font-bold text-white">Generated drafts will appear here.</p>
            <p className="mt-2 text-sm text-slate-400">Type an idea, choose settings, and generate prompt listing drafts.</p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            <AnimatePresence>
              {drafts.map((draft) => (
                <motion.article
                  key={draft.id}
                  layout
                  initial={{ opacity: 0, y: 18, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.96 }}
                  className="card-surface overflow-hidden rounded-[32px]"
                >
                  <div className="grid gap-0 md:grid-cols-[180px_1fr]">
                    <div className="relative min-h-[220px] overflow-hidden bg-slate-950">
                      <SafeImage src={draft.imageUrl} alt={draft.title} fill className="object-cover" sizes="(min-width: 768px) 180px, 100vw" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-brand/20" />
                      <label className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/70 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                        <input
                          type="checkbox"
                          checked={draft.selected}
                          onChange={(event) => updateDraft(draft.id, { selected: event.target.checked })}
                        />
                        Save
                      </label>
                      <span className="absolute bottom-3 left-3 rounded-full bg-brand px-3 py-1 text-xs font-black text-slate-950 shadow-glow">
                        {draft.status}
                      </span>
                    </div>

                    <div className="space-y-4 p-5">
                      {draft.editing ? (
                        <div className="grid gap-3">
                          <input className="field" value={draft.title} onChange={(event) => updateDraft(draft.id, { title: event.target.value })} />
                          <textarea className="field min-h-24" value={draft.description} onChange={(event) => updateDraft(draft.id, { description: event.target.value })} />
                          <input className="field" value={draft.category} onChange={(event) => updateDraft(draft.id, { category: event.target.value })} />
                          <input className="field" value={draft.aspectRatio} onChange={(event) => updateDraft(draft.id, { aspectRatio: event.target.value })} />
                          <input className="field" value={draft.tags.join(", ")} onChange={(event) => updateDraftTags(draft.id, event.target.value)} />
                          <input className="field" value={draft.imageUrl} onChange={(event) => updateDraft(draft.id, { imageUrl: event.target.value })} />
                          <textarea className="field min-h-40" value={draft.prompt} onChange={(event) => updateDraft(draft.id, { prompt: event.target.value })} />
                        </div>
                      ) : (
                        <>
                          <div>
                            <h3 className="text-xl font-black text-white">{draft.title}</h3>
                            <p className="mt-2 text-sm leading-6 text-slate-400">{draft.description}</p>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="rounded-full border border-brand/30 bg-brand/10 px-3 py-1 font-bold text-brand">{draft.category}</span>
                            <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-slate-200">{draft.aspectRatio}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {draft.tags.map((tag) => (
                              <span key={tag} className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-slate-300">
                                #{tag}
                              </span>
                            ))}
                          </div>
                          <p className="max-h-32 overflow-auto rounded-2xl border border-white/10 bg-black/30 p-3 text-sm leading-6 text-slate-300">
                            {draft.prompt}
                          </p>
                        </>
                      )}

                      <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
                        <button className="btn-ghost px-3 py-2 text-xs" onClick={() => updateDraft(draft.id, { editing: !draft.editing })}>
                          {draft.editing ? <Check className="h-3.5 w-3.5" /> : <Edit3 className="h-3.5 w-3.5" />}
                          {draft.editing ? "Done" : "Edit"}
                        </button>
                        <button className="btn-ghost px-3 py-2 text-xs text-red-100" onClick={() => deleteDraft(draft.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </div>
  );
}
