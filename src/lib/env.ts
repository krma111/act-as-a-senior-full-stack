export function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
export const adminEmail = requiredEnv("NEXT_PUBLIC_ADMIN_EMAIL").toLowerCase();
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const isPreviewMode =
  supabaseUrl.includes("demo.supabase.co") ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "preview-anon-key";
