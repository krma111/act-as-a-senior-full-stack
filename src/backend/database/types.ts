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
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          display_name: string | null;
          avatar_url: string | null;
          role: string;
          status: string | null;
          banned_at: string | null;
          banned_by: string | null;
          ban_reason: string | null;
          manual_badge_override: boolean | null;
          manual_badge_type: string | null;
          manual_badge_assigned_by: string | null;
          manual_badge_assigned_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      prompt_packs: {
        Row: {
          id: string;
          creator_id: string | null;
          creator_name: string | null;
          title: string;
          description: string | null;
          cover_image: string | null;
          price: number | null;
          is_paid: boolean | null;
          status: string | null;
          rejection_reason: string | null;
          total_prompts: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      payment_requests: {
        Row: {
          id: string;
          user_id: string;
          pack_id: string;
          order_id: string | null;
          user_email: string | null;
          amount: number;
          currency: string;
          whatsapp_proof_url: string | null;
          whatsapp_proof_status: string | null;
          screenshot_url: string | null;
          screenshot_status: string | null;
          access_link: string | null;
          access_sent_at: string | null;
          status: string;
          rejection_reason: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      user_pack_access: {
        Row: {
          id: string;
          user_id: string;
          pack_id: string;
          granted_by: string | null;
          granted_at: string;
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
