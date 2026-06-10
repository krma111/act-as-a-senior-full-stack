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

function sanitizeForUrl(text: string): string {
  return text
    .replace(/[<>"']/g, "")
    .replace(/[^\w\s,.-]/g, "")
    .trim()
    .slice(0, 500);
}

export async function generateImage(
  promptText: string,
  aspectRatio: string
): Promise<string | null> {
  const { width, height } = aspectRatioToDimensions(aspectRatio);
  const safePrompt = sanitizeForUrl(promptText);

  if (!safePrompt) return null;

  const encoded = encodeURIComponent(safePrompt);
  const seed = Math.floor(Math.random() * 100000);
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&seed=${seed}&nologo=true`;

  try {
    const response = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) return null;

    return url;
  } catch {
    return null;
  }
}
