function cleanEnv(value: string | undefined) {
  return value?.trim() ?? "";
}

function isUsableUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function isUsableSupabaseKey(value: string) {
  return value.length > 20 && !value.includes("<") && !value.toLowerCase().includes("your-");
}

export function requiredEnv(name: string) {
  const value = cleanEnv(process.env[name]);
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const supabaseUrl = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
export const supabaseAnonKey = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export const supabaseServiceRoleKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);
export const hasSupabaseEnv = isUsableUrl(supabaseUrl) && isUsableSupabaseKey(supabaseAnonKey);
export const hasSupabaseServiceRoleKey = isUsableSupabaseKey(supabaseServiceRoleKey);
// Public read-only pages return empty states when Supabase is not configured.
// Authentication routes must not use preview auth or fake user data.
export const isPreviewMode = !hasSupabaseEnv;

const vercelUrl = cleanEnv(process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL);
export const siteUrl = cleanEnv(process.env.NEXT_PUBLIC_SITE_URL) || (vercelUrl ? `https://${vercelUrl}` : "http://localhost:3000");
export const adminEmail = cleanEnv(process.env.NEXT_PUBLIC_ADMIN_EMAIL).toLowerCase();
export const isGithubOAuthEnabled = cleanEnv(process.env.NEXT_PUBLIC_ENABLE_GITHUB_OAUTH).toLowerCase() === "true";
export const resendApiKey = cleanEnv(process.env.RESEND_API_KEY);
export const hasEmailProviderEnv = isUsableSupabaseKey(resendApiKey);

export function getSupabaseUrl() {
  if (!supabaseUrl) throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL");
  return supabaseUrl;
}

export function getSupabaseAnonKey() {
  if (!supabaseAnonKey) throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return supabaseAnonKey;
}

export function getSupabaseServiceRoleKey() {
  if (!supabaseServiceRoleKey) throw new Error("Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY");
  return supabaseServiceRoleKey;
}
