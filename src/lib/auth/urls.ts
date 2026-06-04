import { siteUrl } from "@/lib/env";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export function getBaseUrl() {
  if (typeof window !== "undefined" && window.location.origin) {
    return trimTrailingSlash(window.location.origin);
  }

  return trimTrailingSlash(siteUrl);
}

// Add both of these callback URLs in Supabase Auth settings and provider dashboards:
// Development: http://localhost:3000/auth/callback
// Production:  https://your-domain.com/auth/callback
export function getAuthCallbackUrl(nextPath = "/dashboard") {
  const next = nextPath.startsWith("/") ? nextPath : "/dashboard";
  const callbackUrl = `${getBaseUrl()}/auth/callback`;
  return next === "/dashboard" ? callbackUrl : `${callbackUrl}?next=${encodeURIComponent(next)}`;
}

export function getPasswordResetRedirectUrl() {
  return `${getBaseUrl()}/reset-password`;
}
