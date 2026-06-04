import { redirect } from "next/navigation";
import { getAuthSessionState } from "@/lib/auth/session";

export type CreatorPrompt = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  prompt_text: string;
  image_url: string | null;
  category: string;
  tags: string[];
  ai_model: string | null;
  aspect_ratio: string | null;
  reference_required: boolean;
  difficulty: "beginner" | "intermediate" | "advanced";
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  copy_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
};

export async function requireDashboardUser(nextPath = "/dashboard") {
  const { supabase, user, profile } = await getAuthSessionState();

  if (!supabase || !user || !profile) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  return { supabase, user, profile };
}

export async function getMyPrompts() {
  const { supabase, user } = await requireDashboardUser("/dashboard/my-prompts");
  const { data, error } = await supabase
    .from("prompts")
    .select(
      "id,user_id,title,description,prompt_text,image_url,category,tags,ai_model,aspect_ratio,reference_required,difficulty,status,rejection_reason,copy_count,view_count,created_at,updated_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return { prompts: [] as CreatorPrompt[], error: error.message };
  }

  return { prompts: (data ?? []) as CreatorPrompt[], error: null };
}

export async function getMyPromptById(id: string) {
  const { supabase, user } = await requireDashboardUser(`/dashboard/edit/${id}`);
  const { data, error } = await supabase
    .from("prompts")
    .select(
      "id,user_id,title,description,prompt_text,image_url,category,tags,ai_model,aspect_ratio,reference_required,difficulty,status,rejection_reason,copy_count,view_count,created_at,updated_at"
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return null;
  return data as CreatorPrompt;
}
