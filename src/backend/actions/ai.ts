"use server";

import { requireAdmin } from "@/backend/data/admin";
import { generatePromptFromTopic } from "@/backend/ai/generate";
import { generateImage } from "@/backend/ai/image";
import { revalidatePath } from "next/cache";
import { logAdminAction } from "@/backend/actions/admin";

function asString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function generateAIPrompt(formData: FormData) {
  const topic = asString(formData, "topic");
  const category = asString(formData, "category");
  const aspectRatio = asString(formData, "aspect_ratio") || "1:1";

  if (!topic) {
    return { ok: false, message: "Enter a topic first." };
  }

  try {
    const promptData = await generatePromptFromTopic(topic, category, aspectRatio);

    const imageUrl = await generateImage(promptData.prompt_text, aspectRatio);

    return {
      ok: true,
      draft: {
        title: promptData.title,
        prompt: promptData.prompt_text,
        description: promptData.description,
        negative_prompt: promptData.negative_prompt,
        tags: promptData.tags,
        category,
        aspectRatio,
        ai_model: promptData.ai_model,
        imageUrl: imageUrl ?? ""
      }
    };
  } catch (error) {
    console.error("[AI] generateAIPrompt error:", error);
    return { ok: false, message: "Generation failed. Try a different topic." };
  }
}

export async function approveAIPrompt(formData: FormData) {
  const { supabase, user, profile } = await requireAdmin("/admin/ai-create");

  const title = asString(formData, "title");
  const prompt_text = asString(formData, "prompt_text");
  const description = asString(formData, "description");
  const negative_prompt = asString(formData, "negative_prompt");
  const image_url = asString(formData, "image_url");
  const category = asString(formData, "category");
  const aspect_ratio = asString(formData, "aspect_ratio");
  const ai_model = asString(formData, "ai_model");

  const tagsRaw = formData.get("tags");
  const tags = typeof tagsRaw === "string"
    ? tagsRaw.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, 8)
    : [];

  if (!title || !prompt_text) {
    return { ok: false, message: "Title and prompt text are required." };
  }

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("prompts")
    .insert({
      user_id: user.id,
      title,
      description: description || null,
      prompt_text,
      negative_prompt: negative_prompt || null,
      image_url: image_url || null,
      creator_name: profile.full_name ?? profile.display_name ?? profile.email?.split("@")[0] ?? "Admin",
      category: category || "general",
      tags,
      ai_model: ai_model || "AI Generated",
      aspect_ratio: aspect_ratio || "1:1",
      reference_required: false,
      status: "approved",
      rejection_reason: null,
      featured: false,
      updated_at: now
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false, message: error.message };
  }

  await logAdminAction(supabase, user.id, "ai_prompt_approved", "prompts", data.id, null, {
    title,
    status: "approved",
    source: "ai-generate"
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/prompts");

  return { ok: true, message: `"${title}" approved and published.`, id: data.id };
}
