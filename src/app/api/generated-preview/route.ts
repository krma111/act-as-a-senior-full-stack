import { NextRequest } from "next/server";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function dimensionsForAspect(aspect: string) {
  switch (aspect) {
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

function colorFromSeed(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 360;
  }

  return {
    a: `hsl(${hash}, 95%, 52%)`,
    b: `hsl(${(hash + 72) % 360}, 90%, 38%)`,
    c: `hsl(${(hash + 145) % 360}, 90%, 14%)`
  };
}

function shortText(value: string, fallback: string, max = 42) {
  const clean = value.trim().replace(/\s+/g, " ");
  if (!clean) return fallback;
  return clean.length > max ? `${clean.slice(0, max - 1)}...` : clean;
}

export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const title = shortText(params.get("title") ?? "", "PromptVault Preview");
  const category = shortText(params.get("category") ?? "", "Creator prompt", 28);
  const aspect = params.get("aspect") ?? "1:1";
  const seed = params.get("seed") ?? `${title}-${category}-${aspect}`;
  const { width, height } = dimensionsForAspect(aspect);
  const colors = colorFromSeed(seed);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <radialGradient id="glowA" cx="30%" cy="20%" r="70%">
      <stop offset="0%" stop-color="${colors.a}" stop-opacity="0.95"/>
      <stop offset="50%" stop-color="${colors.b}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#020403" stop-opacity="1"/>
    </radialGradient>
    <linearGradient id="glass" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.04"/>
    </linearGradient>
    <filter id="blur">
      <feGaussianBlur stdDeviation="22"/>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="#020403"/>
  <rect width="100%" height="100%" fill="url(#glowA)"/>
  <circle cx="${width * 0.78}" cy="${height * 0.18}" r="${Math.min(width, height) * 0.2}" fill="${colors.a}" opacity="0.3" filter="url(#blur)"/>
  <circle cx="${width * 0.18}" cy="${height * 0.78}" r="${Math.min(width, height) * 0.24}" fill="${colors.c}" opacity="0.45" filter="url(#blur)"/>
  <path d="M0 ${height * 0.72} C ${width * 0.25} ${height * 0.58}, ${width * 0.62} ${height * 0.92}, ${width} ${height * 0.66} L ${width} ${height} L 0 ${height} Z" fill="#07140d" opacity="0.72"/>
  <g opacity="0.25">
    ${Array.from({ length: 14 }, (_, index) => `<line x1="${(width / 14) * index}" y1="0" x2="${(width / 14) * index + width * 0.18}" y2="${height}" stroke="#b8ff33" stroke-width="1"/>`).join("")}
    ${Array.from({ length: 12 }, (_, index) => `<line x1="0" y1="${(height / 12) * index}" x2="${width}" y2="${(height / 12) * index + height * 0.08}" stroke="#ffffff" stroke-width="1" opacity="0.35"/>`).join("")}
  </g>
  <rect x="${width * 0.08}" y="${height * 0.1}" width="${width * 0.84}" height="${height * 0.8}" rx="${Math.min(width, height) * 0.045}" fill="url(#glass)" stroke="#b8ff33" stroke-opacity="0.42" stroke-width="2"/>
  <text x="${width * 0.12}" y="${height * 0.2}" fill="#b8ff33" font-family="Arial, Helvetica, sans-serif" font-size="${Math.max(22, width * 0.035)}" font-weight="700" letter-spacing="7">${escapeXml(category.toUpperCase())}</text>
  <text x="${width * 0.12}" y="${height * 0.34}" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="${Math.max(42, width * 0.064)}" font-weight="900">${escapeXml(title)}</text>
  <text x="${width * 0.12}" y="${height * 0.43}" fill="#d7fbd8" font-family="Arial, Helvetica, sans-serif" font-size="${Math.max(24, width * 0.032)}" font-weight="600">Generated PromptVault preview</text>
  <text x="${width * 0.12}" y="${height * 0.82}" fill="#ffffff" opacity="0.85" font-family="Arial, Helvetica, sans-serif" font-size="${Math.max(18, width * 0.024)}">Aspect ${escapeXml(aspect)} - same-origin safe image</text>
</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; img-src data:"
    }
  });
}
