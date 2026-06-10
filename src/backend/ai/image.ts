function aspectRatioToDimensions(aspectRatio: string): { width: number; height: number } {
  const parts = aspectRatio.split(":").map(Number);
  if (parts.length === 2 && parts[0] > 0 && parts[1] > 0) {
    const base = 1024;
    const ratio = parts[0] / parts[1];
    if (ratio >= 1) {
      return { width: base, height: Math.round(base / ratio) };
    }
    return { width: Math.round(base * ratio), height: base };
  }
  return { width: 1024, height: 1024 };
}

export function generateImageUrl(promptText: string, aspectRatio: string): string | null {
  const safePrompt = promptText.trim().slice(0, 800);
  if (!safePrompt) return null;

  const { width, height } = aspectRatioToDimensions(aspectRatio);
  const encoded = encodeURIComponent(safePrompt);
  const seed = Math.floor(Math.random() * 100000);

  return `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&seed=${seed}`;
}
