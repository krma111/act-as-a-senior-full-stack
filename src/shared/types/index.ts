export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order?: number;
  is_active?: boolean;
};

export type TagRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  email: string;
  full_name?: string | null;
  display_name?: string | null;
  avatar_url: string | null;
  role: "user" | "admin" | "creator";
  status?: "active" | "banned";
  banned_at?: string | null;
  banned_by?: string | null;
  ban_reason?: string | null;
  manual_badge_override?: boolean;
  manual_badge_type?: "none" | "bronze" | "silver" | "gold" | "diamond" | null;
  manual_badge_assigned_by?: string | null;
  manual_badge_assigned_at?: string | null;
  copy_total?: number;
  prompt_count?: number;
  created_at: string;
  updated_at?: string;
};

export type PromptStatus = "pending" | "approved" | "rejected";

export type Prompt = {
  id: string;
  user_id: string;
  category_id?: string | null;
  title: string;
  description?: string | null;
  prompt_text: string;
  negative_prompt: string | null;
  image_url: string | null;
  creator_name?: string | null;
  ai_model: string;
  visibility?: "public" | "private";
  aspect_ratio?: string | null;
  category?: string;
  reference_required?: boolean;
  tags: string[];
  copy_count: number;
  like_count: number;
  save_count?: number;
  view_count?: number;
  featured: boolean;
  hidden: boolean;
  status?: PromptStatus;
  rejection_reason?: string | null;
  deleted_at?: string | null;
  deleted_by?: string | null;
  approved_at?: string | null;
  approved_by?: string | null;
  created_at: string;
  updated_at?: string;
  categories?: Category | null;
  users?: Profile | null;
};

export type SiteSettings = {
  id: number;
  website_name: string;
  logo_text: string;
  hero_headline: string;
  hero_subheadline: string;
  footer_text: string;
  admin_email: string;
  cta_text?: string;
  empty_state_title?: string;
  empty_state_message?: string;
  featured_prompt_ids?: string[];
  trending_prompt_ids?: string[];
};

export type FavoriteWithPrompt = {
  prompts: Prompt | null;
};

export type ReportWithRelations = {
  id: string;
  prompt_id: string;
  reason: string;
  status: string;
  created_at: string;
  prompts: { id?: string; title: string; hidden?: boolean } | null;
  users: { email: string } | null;
};
