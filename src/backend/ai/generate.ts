export type AIGeneratedPrompt = {
  title: string;
  prompt_text: string;
  description: string;
  negative_prompt: string;
  tags: string[];
  ai_model: string;
};

function cleanEnv(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.includes("<") || trimmed.length < 5) return "";
  return trimmed;
}

function getGeminiApiKey() {
  return cleanEnv(process.env.GEMINI_API_KEY);
}

const GEMINI_MODEL = "gemini-2.0-flash";

function buildGeminiPrompt(topic: string, category: string, aspectRatio: string): string {
  return `You are a professional prompt engineer for AI image generation. Generate a complete prompt listing based on this topic.

Topic: "${topic}"
Category: ${category}
Aspect ratio: ${aspectRatio}

Return ONLY valid JSON (no markdown, no code fences) with these exact fields:
{
  "title": "Catchy title for the prompt (3-8 words)",
  "prompt_text": "Detailed, highly optimized English prompt for AI image generation. Include subject, style, lighting, composition, camera settings, color palette, mood, and technical quality markers. 50-150 words.",
  "description": "2-3 sentence description of what this prompt creates and why it works well.",
  "negative_prompt": "Comma-separated list of things to avoid in the generated image.",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "ai_model": "Name of the best AI model for this prompt (e.g., Stable Diffusion XL, Midjourney v6, DALL-E 3)"
}

The prompt_text must be in English and optimized for text-to-image AI models. Be specific about details, style, and composition.`;
}

export async function generatePromptFromTopic(
  topic: string,
  category: string,
  aspectRatio: string
): Promise<AIGeneratedPrompt> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return generateMockPrompt(topic, category, aspectRatio);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: buildGeminiPrompt(topic, category, aspectRatio) }]
        }
      ],
      generationConfig: {
        temperature: 0.8,
        topP: 0.95,
        maxOutputTokens: 1024,
        responseMimeType: "application/json"
      }
    }),
    signal: AbortSignal.timeout(15000)
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    console.error(`[AI] Gemini API error ${response.status}: ${text}`);
    return generateMockPrompt(topic, category, aspectRatio);
  }

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };

  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) {
    console.error("[AI] Gemini returned empty response");
    return generateMockPrompt(topic, category, aspectRatio);
  }

  try {
    const parsed = JSON.parse(raw) as AIGeneratedPrompt;
    return {
      title: parsed.title?.trim() || titleCase(topic),
      prompt_text: parsed.prompt_text?.trim() || generateFallbackPrompt(topic, category, aspectRatio),
      description: parsed.description?.trim() || `AI-generated prompt for ${topic}.`,
      negative_prompt: parsed.negative_prompt?.trim() || "",
      tags: Array.isArray(parsed.tags) ? parsed.tags.filter(Boolean).slice(0, 8) : inferTags(topic, category),
      ai_model: parsed.ai_model?.trim() || "Stable Diffusion XL"
    };
  } catch (error) {
    console.error("[AI] Failed to parse Gemini JSON response:", error);
    return generateMockPrompt(topic, category, aspectRatio);
  }
}

function titleCase(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s-]/g, "")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function inferTags(topic: string, category: string): string[] {
  const words = topic.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const set = new Set([...words, category, "cinematic", "realistic", "professional", "high-quality"]);
  return Array.from(set).slice(0, 8);
}

function generateFallbackPrompt(topic: string, category: string, aspectRatio: string): string {
  const safeTopic = titleCase(topic) || "Premium visual";
  const dims = aspectRatio === "9:16" ? "portrait orientation, vertical composition" :
    aspectRatio === "16:9" ? "landscape orientation, wide composition" :
    "square composition, balanced framing";
  return `${safeTopic}, ${category} photography style, professional-grade AI image generation, ${dims}, cinematic lighting, intricate details, rich color palette, atmospheric depth, sharp focus, premium visual quality, highly detailed textures, dramatic contrast.`;
}

function generateMockPrompt(topic: string, category: string, aspectRatio: string): AIGeneratedPrompt {
  const safeTopic = titleCase(topic) || "Premium Visual";
  return {
    title: safeTopic,
    prompt_text: generateFallbackPrompt(topic, category, aspectRatio),
    description: `AI-generated prompt draft for "${safeTopic}" in ${category} category. Review and edit before publishing.`,
    negative_prompt: "blurry, low quality, distorted, extra limbs, bad anatomy, watermark, text, signature",
    tags: inferTags(topic, category),
    ai_model: "Stable Diffusion XL"
  };
}
