import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl, hasSupabaseEnv } from "@/backend/env";

let publicClient: SupabaseClient | null = null;

export function createPublicClient() {
  if (!hasSupabaseEnv) return null;

  publicClient ??= createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });

  return publicClient;
}
