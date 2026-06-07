export type GeneratedPromptDraft = {
  title: string;
  prompt: string;
  description: string;
  tags: string[];
  category: string;
  aspectRatio: string;
  imageUrl: string;
  status: "pending";
};

const styleAngles = [
  "cinematic neon portrait",
  "rain-soaked editorial frame",
  "premium social avatar scene",
  "dramatic street fashion shot",
  "hyper-real creator campaign visual",
  "glossy cyber studio composition",
  "moody city-light close-up",
  "high-end profile picture setup",
  "futuristic magazine cover",
  "luxury night-market atmosphere"
];

const tagPool = [
  "cinematic",
  "portrait",
  "neon",
  "rain",
  "cyberpunk",
  "realistic",
  "editorial",
  "fashion",
  "social-media",
  "photography",
  "glow",
  "urban",
  "dramatic",
  "face-lock",
  "premium"
];

function cleanWords(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s-]/g, "")
    .toLowerCase();
}

function titleCase(value: string) {
  return cleanWords(value)
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function seedFrom(value: string, index: number) {
  return cleanWords(`${value}-${index}`).replace(/\s+/g, "-") || `promptvault-draft-${index}`;
}

function tagsForIdea(idea: string, category: string, index: number) {
  const words = cleanWords(`${idea} ${category}`)
    .split(" ")
    .filter((word) => word.length > 2)
    .slice(0, 4);
  const generated = [...words, ...tagPool.slice(index, index + 6)].map((tag) => tag.replace(/\s+/g, "-"));
  return Array.from(new Set(generated)).slice(0, 5);
}

export function generatePromptDrafts(
  idea: string,
  category: string,
  aspectRatio: string,
  quantity: number
): GeneratedPromptDraft[] {
  // Future AI connection point: keep this return shape and replace the body with
  // a server-side model call when real prompt/image generation is enabled.
  const safeIdea = titleCase(idea) || "Premium Creator Visual";
  const safeCategory = cleanWords(category) || "portrait";
  const safeAspectRatio = aspectRatio || "1:1";
  const count = [1, 5, 10, 25].includes(quantity) ? quantity : 1;

  return Array.from({ length: count }, (_, index) => {
    const angle = styleAngles[index % styleAngles.length];
    const title = `${safeIdea} ${index + 1}`;
    const tags = tagsForIdea(idea, safeCategory, index);
    const seed = seedFrom(`${safeIdea}-${angle}`, index + 1);

    return {
      title,
      prompt: [
        `${safeIdea}, ${angle}, professional image generation prompt, highly detailed subject styling, atmospheric lighting, sharp facial details, clean skin texture, premium camera composition, rich color contrast, believable depth of field.`,
        `Use my uploaded reference image/face while keeping the same composition, lighting, outfit, camera angle, and style.`,
        `Optimize for ${safeAspectRatio} output, polished creator-ready result, no extra limbs, no distorted face, no unreadable text.`
      ].join(" "),
      description: `Auto-generated draft for "${safeIdea}" with a ${angle} direction. Review, edit, and save as a pending prompt for admin moderation.`,
      tags,
      category: safeCategory,
      aspectRatio: safeAspectRatio,
      imageUrl: `https://picsum.photos/seed/${encodeURIComponent(seed)}/900/1200`,
      status: "pending"
    };
  });
}
