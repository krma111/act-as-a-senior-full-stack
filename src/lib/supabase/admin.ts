import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl, requiredEnv } from "@/lib/env";

export function createAdminClient() {
  return createClient(getSupabaseUrl(), requiredEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}
