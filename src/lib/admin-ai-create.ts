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

function numericSeedFrom(value: string, index: number) {
  const source = `${cleanWords(value)}-${index}`;
  let hash = 0;

  for (let charIndex = 0; charIndex < source.length; charIndex += 1) {
    hash = (hash * 31 + source.charCodeAt(charIndex)) % 100000;
  }

  return Math.max(hash, index + 1000);
}

function dimensionsForAspectRatio(aspectRatio: string) {
  switch (aspectRatio) {
    case "9:16":
      return { width: 900, height: 1600 };
    case "16:9":
      return { width: 1600, height: 900 };
    case "4:5":
      return { width: 1080, height: 1350 };
    case "3:4":
      return { width: 960, height: 1280 };
    default:
      return { width: 1024, height: 1024 };
  }
}

function relatedImageUrl(idea: string, category: string, aspectRatio: string, angle: string, index: number) {
  const { width, height } = dimensionsForAspectRatio(aspectRatio);
  const seed = numericSeedFrom(`${idea}-${category}-${angle}`, index);
  const imagePrompt = [
    titleCase(idea) || "Premium creator visual",
    category,
    angle,
    "professional AI image preview",
    "cinematic lighting",
    "high detail",
    "premium composition"
  ]
    .filter(Boolean)
    .join(", ");

  return `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true&enhance=true&safe=true`;
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
      imageUrl: relatedImageUrl(safeIdea, safeCategory, safeAspectRatio, angle, index + 1),
      status: "pending"
    };
  });
}
