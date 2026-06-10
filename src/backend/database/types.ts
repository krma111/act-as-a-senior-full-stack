export type Database = {
  public: {
    Tables: {
      prompts: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          prompt_text: string;
          negative_prompt: string | null;
          image_url: string | null;
          creator_name: string | null;
          category: string;
          tags: string[];
          ai_model: string;
          aspect_ratio: string;
          reference_required: boolean;
          status: string;
          rejection_reason: string | null;
          featured: boolean;
          price: number;
          copy_count: number;
          like_count: number;
          save_count: number;
          view_count: number;
          deleted_at: string | null;
          deleted_by: string | null;
          approved_at: string | null;
          approved_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      site_settings: {
        Row: {
          id: number;
          website_name: string;
          logo_text: string;
          hero_headline: string;
          hero_subheadline: string;
          footer_text: string;
          admin_email: string;
          cta_text: string;
          empty_state_title: string;
          empty_state_message: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          website_name?: string;
          logo_text?: string;
          hero_headline?: string;
          hero_subheadline?: string;
          footer_text?: string;
          admin_email?: string;
          cta_text?: string;
          empty_state_title?: string;
          empty_state_message?: string;
          updated_at?: string;
        };
        Update: Record<string, unknown>;
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          prompt_id: string;
          user_id: string;
          reason: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      email_events: {
        Row: {
          id: string;
          recipient_email: string;
          recipient_user_id: string | null;
          prompt_id: string | null;
          event_type: string;
          subject: string;
          status: string;
          provider: string;
          error_message: string | null;
          sent_at: string | null;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
