import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/backend/database/types";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "@/backend/env";

type AdminClient = ReturnType<typeof createClient<Database>>;

let cached: AdminClient | null = null;

export function createAdminClient(): AdminClient {
  if (cached) return cached;
  cached = createClient<Database>(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  return cached;
}

export function resetAdminClient() {
  cached = null;
}
