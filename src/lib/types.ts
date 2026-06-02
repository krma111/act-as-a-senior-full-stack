export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

export type Profile = {
  id: string;
  email: string;
  full_name?: string | null;
  display_name?: string | null;
  avatar_url: string | null;
  role: "user" | "admin" | "creator";
  created_at: string;
  updated_at?: string;
};

export type PromptStatus = "pending" | "approved" | "rejected";

export type Prompt = {
  id: string;
  user_id: string;
  category_id: string | null;
  title: string;
  prompt_text: string;
  negative_prompt: string | null;
  image_url: string;
  ai_model: string;
  visibility: "public" | "private";
  aspect_ratio?: string | null;
  tags: string[];
  copy_count: number;
  like_count: number;
  featured: boolean;
  hidden: boolean;
  status?: PromptStatus;
  rejection_reason?: string | null;
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
