const previewSupabaseUrl = "https://demo.supabase.co";
const previewAnonKey = "preview-anon-key";

function cleanEnv(value: string | undefined) {
  return value?.trim() ?? "";
}

export function requiredEnv(name: string) {
  const value = cleanEnv(process.env[name]);
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const supabaseUrl = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
export const supabaseAnonKey = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export const isPreviewMode =
  supabaseUrl.includes("demo.supabase.co") || supabaseAnonKey === previewAnonKey;

export const siteUrl = cleanEnv(process.env.NEXT_PUBLIC_SITE_URL) || "http://localhost:3000";
export const adminEmail = requiredEnv("NEXT_PUBLIC_ADMIN_EMAIL").toLowerCase();

export function getSupabaseUrl() {
  return isPreviewMode ? previewSupabaseUrl : requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
}

export function getSupabaseAnonKey() {
  return isPreviewMode ? previewAnonKey : requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}
