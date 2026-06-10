function numericSeed(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) % 100000;
  }
  return String(hash);
}

function titlePreview(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[<>"']/g, "")
    .slice(0, 60);
}

export function generateImageUrl(promptText: string, aspectRatio: string): string {
  const safePrompt = promptText.trim().slice(0, 200);
  const preview = titlePreview(safePrompt) || "AI Generated Prompt";
  const seed = numericSeed(safePrompt || String(Date.now()));

  const params = new URLSearchParams({
    title: preview,
    category: "AI Generated",
    aspect: aspectRatio || "1:1",
    seed
  });

  return `/api/generated-preview?${params.toString()}`;
}
