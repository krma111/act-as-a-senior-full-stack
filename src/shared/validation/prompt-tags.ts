export const PREDEFINED_PROMPT_TAGS = [
  "cinematic",
  "portrait",
  "luxury",
  "fashion",
  "editorial",
  "business",
  "fitness",
  "anime",
  "cyberpunk",
  "golden",
  "dark",
  "moody",
  "realistic",
  "photography",
  "studio",
  "viral",
  "social-media",
  "instagram",
  "youtube",
  "creator",
  "professional",
  "premium",
  "glow",
  "fantasy",
  "movie-poster",
  "travel",
  "street",
  "urban",
  "rain",
  "neon",
  "black-gold",
  "minimalist",
  "photorealistic",
  "dramatic",
  "headshot",
  "profile-picture",
  "male",
  "female",
  "creative",
  "branding",
  "marketing",
  "modern",
  "epic",
  "artistic",
  "sharp",
  "ultra-detail",
  "8k",
  "face-lock",
  "identity-preservation",
  "masterpiece"
] as const;

export const MAX_PROMPT_TAGS = 5;

export function normalizePromptTag(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9- ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function normalizePromptTags(value: string | string[]) {
  const source = Array.isArray(value) ? value : value.split(",");
  const tags: string[] = [];

  for (const item of source) {
    const tag = normalizePromptTag(item);
    if (tag && !tags.includes(tag)) tags.push(tag);
    if (tags.length >= MAX_PROMPT_TAGS) break;
  }

  return tags;
}
