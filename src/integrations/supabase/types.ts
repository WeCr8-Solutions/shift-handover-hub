export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      act_as_sessions: {
        Row: {
          actor_id: string
          created_at: string
          ended_at: string | null
          id: string
          organization_id: string | null
          started_at: string
          target_display_name: string | null
          target_user_id: string
        }
        Insert: {
          actor_id: string
          created_at?: string
          ended_at?: string | null
          id?: string
          organization_id?: string | null
          started_at?: string
          target_display_name?: string | null
          target_user_id: string
        }
        Update: {
          actor_id?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          organization_id?: string | null
          started_at?: string
          target_display_name?: string | null
          target_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "act_as_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "act_as_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_logs: {
        Row: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at: string
          description: string
          id: string
          ip_address: string | null
          metadata: Json | null
          organization_id: string | null
          team_id: string | null
          user_display_name: string | null
          user_email: string | null
          user_id: string
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at?: string
          description: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          organization_id?: string | null
          team_id?: string | null
          user_display_name?: string | null
          user_email?: string | null
          user_id: string
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["activity_type"]
          created_at?: string
          description?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          organization_id?: string | null
          team_id?: string | null
          user_display_name?: string | null
          user_email?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_chat_usage: {
        Row: {
          created_at: string
          id: string
          message_count: number
          organization_id: string
          updated_at: string
          usage_date: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_count?: number
          organization_id: string
          updated_at?: string
          usage_date?: string
        }
        Update: {
          created_at?: string
          id?: string
          message_count?: number
          organization_id?: string
          updated_at?: string
          usage_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_usage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_chat_usage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      announcement_reads: {
        Row: {
          announcement_id: string
          id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          announcement_id: string
          id?: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          announcement_id?: string
          id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          announcement_type: string | null
          content: string
          created_at: string | null
          created_by: string
          expires_at: string | null
          id: string
          is_pinned: boolean | null
          organization_id: string
          priority: string | null
          starts_at: string | null
          team_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          announcement_type?: string | null
          content: string
          created_at?: string | null
          created_by: string
          expires_at?: string | null
          id?: string
          is_pinned?: boolean | null
          organization_id: string
          priority?: string | null
          starts_at?: string | null
          team_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          announcement_type?: string | null
          content?: string
          created_at?: string | null
          created_by?: string
          expires_at?: string | null
          id?: string
          is_pinned?: boolean | null
          organization_id?: string
          priority?: string | null
          starts_at?: string | null
          team_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      api_request_logs: {
        Row: {
          api_key_id: string | null
          created_at: string | null
          endpoint: string
          error_message: string | null
          id: string
          ip_address: unknown
          method: string
          organization_id: string
          request_body: Json | null
          response_time_ms: number | null
          status_code: number | null
          user_agent: string | null
        }
        Insert: {
          api_key_id?: string | null
          created_at?: string | null
          endpoint: string
          error_message?: string | null
          id?: string
          ip_address?: unknown
          method: string
          organization_id: string
          request_body?: Json | null
          response_time_ms?: number | null
          status_code?: number | null
          user_agent?: string | null
        }
        Update: {
          api_key_id?: string | null
          created_at?: string | null
          endpoint?: string
          error_message?: string | null
          id?: string
          ip_address?: unknown
          method?: string
          organization_id?: string
          request_body?: Json | null
          response_time_ms?: number | null
          status_code?: number | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_request_logs_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "organization_api_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_request_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_request_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_system: boolean | null
          organization_id: string | null
          setting_key: string
          setting_type: string
          setting_value: Json
          team_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean | null
          organization_id?: string | null
          setting_key: string
          setting_type?: string
          setting_value?: Json
          team_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean | null
          organization_id?: string | null
          setting_key?: string
          setting_type?: string
          setting_value?: Json
          team_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_settings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author: string
          body: string
          category: string
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          excerpt: string
          featured: boolean
          gallery: Json
          id: string
          is_published: boolean
          published_date: string
          read_time: string
          seo_description: string | null
          seo_title: string | null
          slug: string
          tags: string[]
          title: string
          updated_at: string
          video_provider: string | null
          video_url: string | null
        }
        Insert: {
          author?: string
          body?: string
          category?: string
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          excerpt?: string
          featured?: boolean
          gallery?: Json
          id?: string
          is_published?: boolean
          published_date?: string
          read_time?: string
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          tags?: string[]
          title: string
          updated_at?: string
          video_provider?: string | null
          video_url?: string | null
        }
        Update: {
          author?: string
          body?: string
          category?: string
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          excerpt?: string
          featured?: boolean
          gallery?: Json
          id?: string
          is_published?: boolean
          published_date?: string
          read_time?: string
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          tags?: string[]
          title?: string
          updated_at?: string
          video_provider?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      certificate_templates: {
        Row: {
          accent_color_hex: string | null
          background_watermark_path: string | null
          border_style: string | null
          created_at: string
          created_by: string | null
          font_family_sans: string | null
          font_family_serif: string | null
          footer_text: string | null
          header_text: string | null
          id: string
          is_active: boolean
          is_canonical: boolean
          name: string
          organization_id: string | null
          program: string
          seal_logo_path: string | null
          signature_default_path: string | null
          updated_at: string
          variant: string
        }
        Insert: {
          accent_color_hex?: string | null
          background_watermark_path?: string | null
          border_style?: string | null
          created_at?: string
          created_by?: string | null
          font_family_sans?: string | null
          font_family_serif?: string | null
          footer_text?: string | null
          header_text?: string | null
          id?: string
          is_active?: boolean
          is_canonical?: boolean
          name: string
          organization_id?: string | null
          program: string
          seal_logo_path?: string | null
          signature_default_path?: string | null
          updated_at?: string
          variant: string
        }
        Update: {
          accent_color_hex?: string | null
          background_watermark_path?: string | null
          border_style?: string | null
          created_at?: string
          created_by?: string | null
          font_family_sans?: string | null
          font_family_serif?: string | null
          footer_text?: string | null
          header_text?: string | null
          id?: string
          is_active?: boolean
          is_canonical?: boolean
          name?: string
          organization_id?: string | null
          program?: string
          seal_logo_path?: string | null
          signature_default_path?: string | null
          updated_at?: string
          variant?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificate_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      certifications: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          organization_id: string
          required_for_work_centers: string[] | null
          requires_renewal: boolean | null
          updated_at: string | null
          validity_period_days: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          organization_id: string
          required_for_work_centers?: string[] | null
          requires_renewal?: boolean | null
          updated_at?: string | null
          validity_period_days?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          required_for_work_centers?: string[] | null
          requires_renewal?: boolean | null
          updated_at?: string | null
          validity_period_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "certifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      changelogs: {
        Row: {
          author_id: string | null
          author_name: string | null
          change_type: string
          created_at: string | null
          description: string | null
          id: string
          is_published: boolean | null
          published_at: string | null
          title: string
          updated_at: string | null
          version: string | null
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          change_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          title: string
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          change_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          title?: string
          updated_at?: string | null
          version?: string | null
        }
        Relationships: []
      }
      company_social_profiles: {
        Row: {
          company_name: string
          created_at: string
          created_by: string | null
          handle: string | null
          id: string
          is_active: boolean
          notes: string | null
          organization_id: string | null
          platform: string
          profile_name: string
          profile_url: string
          updated_at: string
        }
        Insert: {
          company_name: string
          created_at?: string
          created_by?: string | null
          handle?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          organization_id?: string | null
          platform: string
          profile_name: string
          profile_url: string
          updated_at?: string
        }
        Update: {
          company_name?: string
          created_at?: string
          created_by?: string | null
          handle?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          organization_id?: string | null
          platform?: string
          profile_name?: string
          profile_url?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_social_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_social_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      current_station_status: {
        Row: {
          condition_notes: string | null
          condition_status: string | null
          current_job_part_number: string | null
          current_job_state: string | null
          current_job_work_order: string | null
          current_operator_id: string | null
          current_operator_name: string | null
          id: string
          last_handoff_id: string | null
          organization_id: string | null
          parts_complete: number | null
          parts_required: number | null
          station_id: string | null
          updated_at: string
        }
        Insert: {
          condition_notes?: string | null
          condition_status?: string | null
          current_job_part_number?: string | null
          current_job_state?: string | null
          current_job_work_order?: string | null
          current_operator_id?: string | null
          current_operator_name?: string | null
          id?: string
          last_handoff_id?: string | null
          organization_id?: string | null
          parts_complete?: number | null
          parts_required?: number | null
          station_id?: string | null
          updated_at?: string
        }
        Update: {
          condition_notes?: string | null
          condition_status?: string | null
          current_job_part_number?: string | null
          current_job_state?: string | null
          current_job_work_order?: string | null
          current_operator_id?: string | null
          current_operator_name?: string | null
          id?: string
          last_handoff_id?: string | null
          organization_id?: string | null
          parts_complete?: number | null
          parts_required?: number | null
          station_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "current_station_status_last_handoff_id_fkey"
            columns: ["last_handoff_id"]
            isOneToOne: false
            referencedRelation: "handoff_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "current_station_status_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "current_station_status_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "current_station_status_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: true
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      data_access_logs: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          operation: string
          organization_id: string | null
          record_id: string | null
          table_name: string
          user_display_name: string | null
          user_email: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          operation: string
          organization_id?: string | null
          record_id?: string | null
          table_name: string
          user_display_name?: string | null
          user_email?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          operation?: string
          organization_id?: string | null
          record_id?: string | null
          table_name?: string
          user_display_name?: string | null
          user_email?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_access_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_access_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      data_export_requests: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          export_type: string
          file_expires_at: string | null
          file_url: string | null
          filters: Json | null
          id: string
          organization_id: string
          requested_by: string
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          export_type: string
          file_expires_at?: string | null
          file_url?: string | null
          filters?: Json | null
          id?: string
          organization_id: string
          requested_by: string
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          export_type?: string
          file_expires_at?: string | null
          file_url?: string | null
          filters?: Json | null
          id?: string
          organization_id?: string
          requested_by?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_export_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_export_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_requests: {
        Row: {
          created_at: string | null
          delivered_at: string | null
          delivered_by: string | null
          delivered_by_name: string | null
          estimated_delivery_time: string | null
          from_station_id: string | null
          id: string
          notes: string | null
          organization_id: string
          picked_up_at: string | null
          picked_up_by: string | null
          picked_up_by_name: string | null
          priority: string | null
          quantity: number | null
          queue_item_id: string | null
          requested_by: string | null
          requested_by_name: string | null
          routing_step_id: string | null
          status: string
          to_station_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          delivered_at?: string | null
          delivered_by?: string | null
          delivered_by_name?: string | null
          estimated_delivery_time?: string | null
          from_station_id?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          picked_up_at?: string | null
          picked_up_by?: string | null
          picked_up_by_name?: string | null
          priority?: string | null
          quantity?: number | null
          queue_item_id?: string | null
          requested_by?: string | null
          requested_by_name?: string | null
          routing_step_id?: string | null
          status?: string
          to_station_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          delivered_at?: string | null
          delivered_by?: string | null
          delivered_by_name?: string | null
          estimated_delivery_time?: string | null
          from_station_id?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          picked_up_at?: string | null
          picked_up_by?: string | null
          picked_up_by_name?: string | null
          priority?: string | null
          quantity?: number | null
          queue_item_id?: string | null
          requested_by?: string | null
          requested_by_name?: string | null
          routing_step_id?: string | null
          status?: string
          to_station_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_requests_from_station_id_fkey"
            columns: ["from_station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_requests_queue_item_id_fkey"
            columns: ["queue_item_id"]
            isOneToOne: false
            referencedRelation: "queue_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_requests_routing_step_id_fkey"
            columns: ["routing_step_id"]
            isOneToOne: false
            referencedRelation: "work_order_routing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_requests_to_station_id_fkey"
            columns: ["to_station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string
          team_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          team_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      dev_issue_queue: {
        Row: {
          assigned_developer_id: string | null
          assigned_developer_name: string | null
          completed_at: string | null
          created_at: string | null
          estimated_effort: string | null
          id: string
          issue_id: string
          notes: string | null
          priority: number
          queue_position: number
          started_at: string | null
          status: string
          time_spent_minutes: number | null
          updated_at: string | null
        }
        Insert: {
          assigned_developer_id?: string | null
          assigned_developer_name?: string | null
          completed_at?: string | null
          created_at?: string | null
          estimated_effort?: string | null
          id?: string
          issue_id: string
          notes?: string | null
          priority?: number
          queue_position: number
          started_at?: string | null
          status?: string
          time_spent_minutes?: number | null
          updated_at?: string | null
        }
        Update: {
          assigned_developer_id?: string | null
          assigned_developer_name?: string | null
          completed_at?: string | null
          created_at?: string | null
          estimated_effort?: string | null
          id?: string
          issue_id?: string
          notes?: string | null
          priority?: number
          queue_position?: number
          started_at?: string | null
          status?: string
          time_spent_minutes?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dev_issue_queue_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: true
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      dimension_check_requests: {
        Row: {
          created_at: string
          id: string
          organization_id: string | null
          queue_item_id: string
          reason: string
          requested_by: string | null
          requested_by_name: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewed_by_name: string | null
          routing_step_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id?: string | null
          queue_item_id: string
          reason: string
          requested_by?: string | null
          requested_by_name?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewed_by_name?: string | null
          routing_step_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string | null
          queue_item_id?: string
          reason?: string
          requested_by?: string | null
          requested_by_name?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewed_by_name?: string | null
          routing_step_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dimension_check_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dimension_check_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dimension_check_requests_queue_item_id_fkey"
            columns: ["queue_item_id"]
            isOneToOne: false
            referencedRelation: "queue_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dimension_check_requests_routing_step_id_fkey"
            columns: ["routing_step_id"]
            isOneToOne: false
            referencedRelation: "work_order_routing"
            referencedColumns: ["id"]
          },
        ]
      }
      dimension_readings: {
        Row: {
          dimension_id: string
          id: string
          instrument_used: string | null
          is_pass: boolean
          measured_value: number
          notes: string | null
          organization_id: string | null
          queue_item_id: string
          recorded_at: string
          recorded_by: string | null
          recorded_by_name: string | null
          routing_step_id: string
        }
        Insert: {
          dimension_id: string
          id?: string
          instrument_used?: string | null
          is_pass?: boolean
          measured_value: number
          notes?: string | null
          organization_id?: string | null
          queue_item_id: string
          recorded_at?: string
          recorded_by?: string | null
          recorded_by_name?: string | null
          routing_step_id: string
        }
        Update: {
          dimension_id?: string
          id?: string
          instrument_used?: string | null
          is_pass?: boolean
          measured_value?: number
          notes?: string | null
          organization_id?: string | null
          queue_item_id?: string
          recorded_at?: string
          recorded_by?: string | null
          recorded_by_name?: string | null
          routing_step_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dimension_readings_dimension_id_fkey"
            columns: ["dimension_id"]
            isOneToOne: false
            referencedRelation: "routing_step_dimensions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dimension_readings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dimension_readings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dimension_readings_queue_item_id_fkey"
            columns: ["queue_item_id"]
            isOneToOne: false
            referencedRelation: "queue_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dimension_readings_routing_step_id_fkey"
            columns: ["routing_step_id"]
            isOneToOne: false
            referencedRelation: "work_order_routing"
            referencedColumns: ["id"]
          },
        ]
      }
      downtime_events: {
        Row: {
          created_at: string | null
          description: string | null
          downtime_type: string
          duration_minutes: number | null
          ended_at: string | null
          equipment_id: string | null
          id: string
          organization_id: string
          reason_code: string | null
          reported_by: string | null
          reported_by_name: string | null
          resolution_notes: string | null
          resolved_by: string | null
          resolved_by_name: string | null
          started_at: string
          station_id: string | null
          team_id: string | null
          updated_at: string | null
          work_order_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          downtime_type: string
          duration_minutes?: number | null
          ended_at?: string | null
          equipment_id?: string | null
          id?: string
          organization_id: string
          reason_code?: string | null
          reported_by?: string | null
          reported_by_name?: string | null
          resolution_notes?: string | null
          resolved_by?: string | null
          resolved_by_name?: string | null
          started_at: string
          station_id?: string | null
          team_id?: string | null
          updated_at?: string | null
          work_order_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          downtime_type?: string
          duration_minutes?: number | null
          ended_at?: string | null
          equipment_id?: string | null
          id?: string
          organization_id?: string
          reason_code?: string | null
          reported_by?: string | null
          reported_by_name?: string | null
          resolution_notes?: string | null
          resolved_by?: string | null
          resolved_by_name?: string | null
          started_at?: string
          station_id?: string | null
          team_id?: string | null
          updated_at?: string | null
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "downtime_events_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "downtime_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "downtime_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "downtime_events_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "downtime_events_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "downtime_events_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "queue_items"
            referencedColumns: ["id"]
          },
        ]
      }
      email_leads: {
        Row: {
          created_at: string
          email: string
          id: string
          lead_type: string | null
          source_page: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          lead_type?: string | null
          source_page?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          lead_type?: string | null
          source_page?: string | null
        }
        Relationships: []
      }
      email_rate_limits: {
        Row: {
          email_type: string
          id: string
          recipient: string
          sent_at: string
          user_id: string
        }
        Insert: {
          email_type: string
          id?: string
          recipient: string
          sent_at?: string
          user_id: string
        }
        Update: {
          email_type?: string
          id?: string
          recipient?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
      entitlements: {
        Row: {
          created_at: string | null
          features: Json | null
          id: string
          limits: Json | null
          organization_id: string | null
          plan: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          features?: Json | null
          id?: string
          limits?: Json | null
          organization_id?: string | null
          plan?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          features?: Json | null
          id?: string
          limits?: Json | null
          organization_id?: string | null
          plan?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entitlements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entitlements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          asset_tag: string
          calibration_due: string | null
          created_at: string | null
          description: string | null
          equipment_type: string
          id: string
          last_calibration: string | null
          location: string | null
          manufacturer: string | null
          metadata: Json | null
          model: string | null
          name: string
          organization_id: string
          purchase_date: string | null
          serial_number: string | null
          station_id: string | null
          status: string | null
          team_id: string | null
          updated_at: string | null
          warranty_expires: string | null
        }
        Insert: {
          asset_tag: string
          calibration_due?: string | null
          created_at?: string | null
          description?: string | null
          equipment_type: string
          id?: string
          last_calibration?: string | null
          location?: string | null
          manufacturer?: string | null
          metadata?: Json | null
          model?: string | null
          name: string
          organization_id: string
          purchase_date?: string | null
          serial_number?: string | null
          station_id?: string | null
          status?: string | null
          team_id?: string | null
          updated_at?: string | null
          warranty_expires?: string | null
        }
        Update: {
          asset_tag?: string
          calibration_due?: string | null
          created_at?: string | null
          description?: string | null
          equipment_type?: string
          id?: string
          last_calibration?: string | null
          location?: string | null
          manufacturer?: string | null
          metadata?: Json | null
          model?: string | null
          name?: string
          organization_id?: string
          purchase_date?: string | null
          serial_number?: string | null
          station_id?: string | null
          status?: string | null
          team_id?: string | null
          updated_at?: string | null
          warranty_expires?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_connections: {
        Row: {
          api_base_url: string | null
          client_id_encrypted: string | null
          client_secret_encrypted: string | null
          connection_status: string
          created_at: string
          created_by: string | null
          erp_persistence_mode: string
          erp_vendor: string
          id: string
          instance_type: string
          is_active: boolean
          last_tested_at: string | null
          metadata: Json | null
          oauth_token_endpoint: string | null
          organization_id: string
          scopes: string | null
          sync_interval_minutes: number
          tenant_identifier: string | null
          updated_at: string
        }
        Insert: {
          api_base_url?: string | null
          client_id_encrypted?: string | null
          client_secret_encrypted?: string | null
          connection_status?: string
          created_at?: string
          created_by?: string | null
          erp_persistence_mode?: string
          erp_vendor: string
          id?: string
          instance_type?: string
          is_active?: boolean
          last_tested_at?: string | null
          metadata?: Json | null
          oauth_token_endpoint?: string | null
          organization_id: string
          scopes?: string | null
          sync_interval_minutes?: number
          tenant_identifier?: string | null
          updated_at?: string
        }
        Update: {
          api_base_url?: string | null
          client_id_encrypted?: string | null
          client_secret_encrypted?: string | null
          connection_status?: string
          created_at?: string
          created_by?: string | null
          erp_persistence_mode?: string
          erp_vendor?: string
          id?: string
          instance_type?: string
          is_active?: boolean
          last_tested_at?: string | null
          metadata?: Json | null
          oauth_token_endpoint?: string | null
          organization_id?: string
          scopes?: string | null
          sync_interval_minutes?: number
          tenant_identifier?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_status_mappings: {
        Row: {
          created_at: string
          erp_status: string
          id: string
          jobline_status: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          erp_status: string
          id?: string
          jobline_status: string
          organization_id: string
        }
        Update: {
          created_at?: string
          erp_status?: string
          id?: string
          jobline_status?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_status_mappings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_status_mappings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_sync_errors: {
        Row: {
          created_at: string
          erp_record_id: string | null
          erp_record_type: string
          error_message: string
          id: string
          organization_id: string
          resolved: boolean
          retry_count: number
          sync_log_id: string
        }
        Insert: {
          created_at?: string
          erp_record_id?: string | null
          erp_record_type: string
          error_message: string
          id?: string
          organization_id: string
          resolved?: boolean
          retry_count?: number
          sync_log_id: string
        }
        Update: {
          created_at?: string
          erp_record_id?: string | null
          erp_record_type?: string
          error_message?: string
          id?: string
          organization_id?: string
          resolved?: boolean
          retry_count?: number
          sync_log_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_sync_errors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_sync_errors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_sync_errors_sync_log_id_fkey"
            columns: ["sync_log_id"]
            isOneToOne: false
            referencedRelation: "erp_sync_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_sync_logs: {
        Row: {
          completed_at: string | null
          duration_ms: number | null
          erp_connection_id: string
          error_details: Json | null
          errors_count: number | null
          id: string
          organization_id: string
          records_created: number | null
          records_fetched: number | null
          records_updated: number | null
          started_at: string
          status: string
          sync_type: string
          triggered_by: string
        }
        Insert: {
          completed_at?: string | null
          duration_ms?: number | null
          erp_connection_id: string
          error_details?: Json | null
          errors_count?: number | null
          id?: string
          organization_id: string
          records_created?: number | null
          records_fetched?: number | null
          records_updated?: number | null
          started_at?: string
          status?: string
          sync_type?: string
          triggered_by?: string
        }
        Update: {
          completed_at?: string | null
          duration_ms?: number | null
          erp_connection_id?: string
          error_details?: Json | null
          errors_count?: number | null
          id?: string
          organization_id?: string
          records_created?: number | null
          records_fetched?: number | null
          records_updated?: number | null
          started_at?: string
          status?: string
          sync_type?: string
          triggered_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_sync_logs_erp_connection_id_fkey"
            columns: ["erp_connection_id"]
            isOneToOne: false
            referencedRelation: "erp_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_sync_logs_erp_connection_id_fkey"
            columns: ["erp_connection_id"]
            isOneToOne: false
            referencedRelation: "erp_connections_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_sync_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_sync_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_usage_metering: {
        Row: {
          created_at: string
          id: string
          last_sync_at: string | null
          organization_id: string
          period_start: string
          sync_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_sync_at?: string | null
          organization_id: string
          period_start?: string
          sync_count?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_sync_at?: string | null
          organization_id?: string
          period_start?: string
          sync_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_usage_metering_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_usage_metering_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_work_center_mappings: {
        Row: {
          created_at: string
          erp_work_center_id: string
          erp_work_center_name: string | null
          id: string
          jobline_station_id: string | null
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          erp_work_center_id: string
          erp_work_center_name?: string | null
          id?: string
          jobline_station_id?: string | null
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          erp_work_center_id?: string
          erp_work_center_name?: string | null
          id?: string
          jobline_station_id?: string | null
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_work_center_mappings_jobline_station_id_fkey"
            columns: ["jobline_station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_work_center_mappings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_work_center_mappings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      flyer_campaigns: {
        Row: {
          attachment_urls: string[]
          campaign_type: string
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          cta_label: string | null
          description: string | null
          ends_at: string | null
          gallery_urls: string[]
          id: string
          is_published: boolean
          location_address: string | null
          location_name: string | null
          name: string
          promo_copy: string | null
          qr_target_url: string | null
          slug: string
          starts_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attachment_urls?: string[]
          campaign_type?: string
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          cta_label?: string | null
          description?: string | null
          ends_at?: string | null
          gallery_urls?: string[]
          id?: string
          is_published?: boolean
          location_address?: string | null
          location_name?: string | null
          name: string
          promo_copy?: string | null
          qr_target_url?: string | null
          slug: string
          starts_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attachment_urls?: string[]
          campaign_type?: string
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          cta_label?: string | null
          description?: string | null
          ends_at?: string | null
          gallery_urls?: string[]
          id?: string
          is_published?: boolean
          location_address?: string | null
          location_name?: string | null
          name?: string
          promo_copy?: string | null
          qr_target_url?: string | null
          slug?: string
          starts_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      flyer_drop_logs: {
        Row: {
          business_count: number
          campaign_id: string
          created_at: string
          dropped_at: string
          dropped_by: string | null
          flyer_count: number
          id: string
          notes: string | null
          zone_id: string
        }
        Insert: {
          business_count?: number
          campaign_id: string
          created_at?: string
          dropped_at?: string
          dropped_by?: string | null
          flyer_count?: number
          id?: string
          notes?: string | null
          zone_id: string
        }
        Update: {
          business_count?: number
          campaign_id?: string
          created_at?: string
          dropped_at?: string
          dropped_by?: string | null
          flyer_count?: number
          id?: string
          notes?: string | null
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flyer_drop_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "flyer_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flyer_drop_logs_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "flyer_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      flyer_mailing_list_entries: {
        Row: {
          added_by: string | null
          created_at: string | null
          id: string
          mailing_list_id: string
          notes: string | null
          stop_visit_id: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string | null
          id?: string
          mailing_list_id: string
          notes?: string | null
          stop_visit_id: string
        }
        Update: {
          added_by?: string | null
          created_at?: string | null
          id?: string
          mailing_list_id?: string
          notes?: string | null
          stop_visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flyer_mailing_list_entries_mailing_list_id_fkey"
            columns: ["mailing_list_id"]
            isOneToOne: false
            referencedRelation: "flyer_mailing_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flyer_mailing_list_entries_stop_visit_id_fkey"
            columns: ["stop_visit_id"]
            isOneToOne: false
            referencedRelation: "flyer_stop_visits"
            referencedColumns: ["id"]
          },
        ]
      }
      flyer_mailing_lists: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          list_type: string
          name: string
          updated_at: string | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          list_type?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          list_type?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flyer_mailing_lists_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "flyer_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      flyer_mediums: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      flyer_stop_visits: {
        Row: {
          assignment_id: string | null
          business_address: string | null
          business_email: string | null
          business_phone: string | null
          campaign_id: string
          contact_name: string | null
          contact_title: string | null
          created_at: string
          flyer_count: number
          flyer_design: string | null
          id: string
          interaction_flags: string[]
          mailing_consent: boolean | null
          medium_id: string | null
          medium_name: string | null
          notes: string | null
          stop_key: string
          stop_name: string
          visited_at: string
          visited_by: string
          visited_by_name: string | null
          zone_id: string
          zone_number: number
        }
        Insert: {
          assignment_id?: string | null
          business_address?: string | null
          business_email?: string | null
          business_phone?: string | null
          campaign_id: string
          contact_name?: string | null
          contact_title?: string | null
          created_at?: string
          flyer_count?: number
          flyer_design?: string | null
          id?: string
          interaction_flags?: string[]
          mailing_consent?: boolean | null
          medium_id?: string | null
          medium_name?: string | null
          notes?: string | null
          stop_key: string
          stop_name: string
          visited_at?: string
          visited_by: string
          visited_by_name?: string | null
          zone_id: string
          zone_number: number
        }
        Update: {
          assignment_id?: string | null
          business_address?: string | null
          business_email?: string | null
          business_phone?: string | null
          campaign_id?: string
          contact_name?: string | null
          contact_title?: string | null
          created_at?: string
          flyer_count?: number
          flyer_design?: string | null
          id?: string
          interaction_flags?: string[]
          mailing_consent?: boolean | null
          medium_id?: string | null
          medium_name?: string | null
          notes?: string | null
          stop_key?: string
          stop_name?: string
          visited_at?: string
          visited_by?: string
          visited_by_name?: string | null
          zone_id?: string
          zone_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "flyer_stop_visits_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "flyer_zone_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flyer_stop_visits_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "flyer_zone_assignments_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flyer_stop_visits_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "flyer_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flyer_stop_visits_medium_id_fkey"
            columns: ["medium_id"]
            isOneToOne: false
            referencedRelation: "flyer_mediums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flyer_stop_visits_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "flyer_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      flyer_zone_assignments: {
        Row: {
          assigned_by: string | null
          assigned_to_user_id: string | null
          assignee_email: string | null
          assignee_name: string
          campaign_id: string
          created_at: string
          id: string
          invite_token: string
          is_active: boolean
          updated_at: string
          zone_numbers: number[]
        }
        Insert: {
          assigned_by?: string | null
          assigned_to_user_id?: string | null
          assignee_email?: string | null
          assignee_name: string
          campaign_id: string
          created_at?: string
          id?: string
          invite_token?: string
          is_active?: boolean
          updated_at?: string
          zone_numbers?: number[]
        }
        Update: {
          assigned_by?: string | null
          assigned_to_user_id?: string | null
          assignee_email?: string | null
          assignee_name?: string
          campaign_id?: string
          created_at?: string
          id?: string
          invite_token?: string
          is_active?: boolean
          updated_at?: string
          zone_numbers?: number[]
        }
        Relationships: [
          {
            foreignKeyName: "flyer_zone_assignments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "flyer_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      flyer_zones: {
        Row: {
          bitly_back_half: string | null
          bitly_short_url: string | null
          campaign_id: string
          city: string
          created_at: string
          flyer_count: number
          full_utm_url: string
          id: string
          notes: string | null
          qr_filename: string | null
          status: string
          total_hires: number
          total_scans: number
          total_signups: number
          updated_at: string
          utm_content: string
          zone_name: string
          zone_number: number
        }
        Insert: {
          bitly_back_half?: string | null
          bitly_short_url?: string | null
          campaign_id: string
          city: string
          created_at?: string
          flyer_count?: number
          full_utm_url: string
          id?: string
          notes?: string | null
          qr_filename?: string | null
          status?: string
          total_hires?: number
          total_scans?: number
          total_signups?: number
          updated_at?: string
          utm_content: string
          zone_name: string
          zone_number: number
        }
        Update: {
          bitly_back_half?: string | null
          bitly_short_url?: string | null
          campaign_id?: string
          city?: string
          created_at?: string
          flyer_count?: number
          full_utm_url?: string
          id?: string
          notes?: string | null
          qr_filename?: string | null
          status?: string
          total_hires?: number
          total_scans?: number
          total_signups?: number
          updated_at?: string
          utm_content?: string
          zone_name?: string
          zone_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "flyer_zones_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "flyer_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      gca_accomplishments: {
        Row: {
          category: string
          created_at: string
          description: string | null
          earned_date: string | null
          expires_date: string | null
          id: string
          issuer: string | null
          metadata: Json | null
          reference_url: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          earned_date?: string | null
          expires_date?: string | null
          id?: string
          issuer?: string | null
          metadata?: Json | null
          reference_url?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          earned_date?: string | null
          expires_date?: string | null
          id?: string
          issuer?: string | null
          metadata?: Json | null
          reference_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gca_assignments: {
        Row: {
          assigned_by: string
          assigned_by_name: string | null
          bank_id: string
          completed_at: string | null
          created_at: string
          due_at: string | null
          id: string
          notes: string | null
          organization_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_by: string
          assigned_by_name?: string | null
          bank_id: string
          completed_at?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_by?: string
          assigned_by_name?: string | null
          bank_id?: string
          completed_at?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gca_assignments_bank_id_fkey"
            columns: ["bank_id"]
            isOneToOne: false
            referencedRelation: "gca_question_banks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gca_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gca_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      gca_certificates: {
        Row: {
          amount_cents: number
          bank_id: string | null
          cert_id: string
          created_at: string
          id: string
          issued_at: string
          pdf_url: string | null
          program_name: string
          qr_token: string
          recipient_email: string
          recipient_name: string
          recipient_username: string | null
          revoked_at: string | null
          revoked_reason: string | null
          signed_by_name: string | null
          signed_by_signature_url: string | null
          signed_by_title: string | null
          signed_by_user_id: string | null
          status: string
          stripe_session_id: string | null
          updated_at: string
          user_id: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          amount_cents?: number
          bank_id?: string | null
          cert_id: string
          created_at?: string
          id?: string
          issued_at?: string
          pdf_url?: string | null
          program_name: string
          qr_token?: string
          recipient_email: string
          recipient_name: string
          recipient_username?: string | null
          revoked_at?: string | null
          revoked_reason?: string | null
          signed_by_name?: string | null
          signed_by_signature_url?: string | null
          signed_by_title?: string | null
          signed_by_user_id?: string | null
          status?: string
          stripe_session_id?: string | null
          updated_at?: string
          user_id: string
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          amount_cents?: number
          bank_id?: string | null
          cert_id?: string
          created_at?: string
          id?: string
          issued_at?: string
          pdf_url?: string | null
          program_name?: string
          qr_token?: string
          recipient_email?: string
          recipient_name?: string
          recipient_username?: string | null
          revoked_at?: string | null
          revoked_reason?: string | null
          signed_by_name?: string | null
          signed_by_signature_url?: string | null
          signed_by_title?: string | null
          signed_by_user_id?: string | null
          status?: string
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gca_certificates_bank_id_fkey"
            columns: ["bank_id"]
            isOneToOne: false
            referencedRelation: "gca_question_banks"
            referencedColumns: ["id"]
          },
        ]
      }
      gca_machine_experience: {
        Row: {
          controller: string | null
          created_at: string
          id: string
          machine_type: string
          manufacturer: string | null
          model: string | null
          notes: string | null
          proficiency: string
          updated_at: string
          user_id: string
          years_used: number | null
        }
        Insert: {
          controller?: string | null
          created_at?: string
          id?: string
          machine_type: string
          manufacturer?: string | null
          model?: string | null
          notes?: string | null
          proficiency?: string
          updated_at?: string
          user_id: string
          years_used?: number | null
        }
        Update: {
          controller?: string | null
          created_at?: string
          id?: string
          machine_type?: string
          manufacturer?: string | null
          model?: string | null
          notes?: string | null
          proficiency?: string
          updated_at?: string
          user_id?: string
          years_used?: number | null
        }
        Relationships: []
      }
      gca_measurement_tools_tested: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          precision_spec: string | null
          proficiency: string
          tested_at: string
          tool_category: string | null
          tool_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          precision_spec?: string | null
          proficiency?: string
          tested_at?: string
          tool_category?: string | null
          tool_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          precision_spec?: string | null
          proficiency?: string
          tested_at?: string
          tool_category?: string | null
          tool_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gca_professional_profiles: {
        Row: {
          bio: string | null
          created_at: string
          headline: string | null
          id: string
          is_public: boolean
          location: string | null
          specialty: string | null
          updated_at: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          headline?: string | null
          id?: string
          is_public?: boolean
          location?: string | null
          specialty?: string | null
          updated_at?: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          headline?: string | null
          id?: string
          is_public?: boolean
          location?: string | null
          specialty?: string | null
          updated_at?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: []
      }
      gca_question_banks: {
        Row: {
          created_at: string
          description: string | null
          difficulty: string
          id: string
          is_pro_only: boolean
          is_published: boolean
          passing_score_pct: number
          slug: string
          sort_order: number
          title: string
          topic: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty?: string
          id?: string
          is_pro_only?: boolean
          is_published?: boolean
          passing_score_pct?: number
          slug: string
          sort_order?: number
          title: string
          topic: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          difficulty?: string
          id?: string
          is_pro_only?: boolean
          is_published?: boolean
          passing_score_pct?: number
          slug?: string
          sort_order?: number
          title?: string
          topic?: string
          updated_at?: string
        }
        Relationships: []
      }
      gca_questions: {
        Row: {
          bank_id: string
          choices: Json
          correct_answers: Json
          created_at: string
          explanation: string | null
          id: string
          points: number
          prompt: string
          question_type: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          bank_id: string
          choices?: Json
          correct_answers?: Json
          created_at?: string
          explanation?: string | null
          id?: string
          points?: number
          prompt: string
          question_type?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          bank_id?: string
          choices?: Json
          correct_answers?: Json
          created_at?: string
          explanation?: string | null
          id?: string
          points?: number
          prompt?: string
          question_type?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gca_questions_bank_id_fkey"
            columns: ["bank_id"]
            isOneToOne: false
            referencedRelation: "gca_question_banks"
            referencedColumns: ["id"]
          },
        ]
      }
      gca_subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gca_test_attempts: {
        Row: {
          answers: Json
          bank_id: string
          completed_at: string | null
          created_at: string
          duration_seconds: number | null
          id: string
          passed: boolean | null
          score_pct: number | null
          started_at: string
          user_id: string
        }
        Insert: {
          answers?: Json
          bank_id: string
          completed_at?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          passed?: boolean | null
          score_pct?: number | null
          started_at?: string
          user_id: string
        }
        Update: {
          answers?: Json
          bank_id?: string
          completed_at?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          passed?: boolean | null
          score_pct?: number | null
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gca_test_attempts_bank_id_fkey"
            columns: ["bank_id"]
            isOneToOne: false
            referencedRelation: "gca_question_banks"
            referencedColumns: ["id"]
          },
        ]
      }
      global_update_acknowledgements: {
        Row: {
          acknowledged_at: string
          id: string
          update_id: string
          user_id: string
        }
        Insert: {
          acknowledged_at?: string
          id?: string
          update_id: string
          user_id: string
        }
        Update: {
          acknowledged_at?: string
          id?: string
          update_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "global_update_acknowledgements_update_id_fkey"
            columns: ["update_id"]
            isOneToOne: false
            referencedRelation: "global_updates"
            referencedColumns: ["id"]
          },
        ]
      }
      global_updates: {
        Row: {
          affected_modules: string[] | null
          category: Database["public"]["Enums"]["update_category"]
          created_at: string
          created_by: string | null
          full_description: string | null
          how_it_helps_users: string | null
          id: string
          impact_level: Database["public"]["Enums"]["impact_level"]
          is_visible_to_users: boolean
          issues_addressed: string[] | null
          published_at: string | null
          requires_acknowledgement: boolean
          revision_number: number
          status: Database["public"]["Enums"]["update_status"]
          summary: string | null
          title: string
          updated_at: string
          version_number: string | null
        }
        Insert: {
          affected_modules?: string[] | null
          category?: Database["public"]["Enums"]["update_category"]
          created_at?: string
          created_by?: string | null
          full_description?: string | null
          how_it_helps_users?: string | null
          id?: string
          impact_level?: Database["public"]["Enums"]["impact_level"]
          is_visible_to_users?: boolean
          issues_addressed?: string[] | null
          published_at?: string | null
          requires_acknowledgement?: boolean
          revision_number?: number
          status?: Database["public"]["Enums"]["update_status"]
          summary?: string | null
          title: string
          updated_at?: string
          version_number?: string | null
        }
        Update: {
          affected_modules?: string[] | null
          category?: Database["public"]["Enums"]["update_category"]
          created_at?: string
          created_by?: string | null
          full_description?: string | null
          how_it_helps_users?: string | null
          id?: string
          impact_level?: Database["public"]["Enums"]["impact_level"]
          is_visible_to_users?: boolean
          issues_addressed?: string[] | null
          published_at?: string | null
          requires_acknowledgement?: boolean
          revision_number?: number
          status?: Database["public"]["Enums"]["update_status"]
          summary?: string | null
          title?: string
          updated_at?: string
          version_number?: string | null
        }
        Relationships: []
      }
      handoff_records: {
        Row: {
          clamps_bolts_torqued: string | null
          created_at: string
          critical_dims_verified: boolean
          date: string
          delay_code: string | null
          equipment_readiness: Json | null
          fixture_installed: string | null
          fixture_orientation_verified: string | null
          handoff_summary: string
          id: string
          image_urls: string[] | null
          incoming_operator_id: string | null
          incoming_operator_name: string
          incoming_time: string | null
          issues_follow_ups: Json | null
          last_good_part_timestamp: string | null
          machine_condition: Json | null
          machine_id: string
          machine_readiness: Json | null
          material_issues_noted: boolean
          material_notes: string | null
          next_material_lot_ready: boolean
          operation_number: string
          organization_id: string
          outgoing_operator_id: string | null
          outgoing_operator_name: string
          outgoing_time: string | null
          part_number: string
          part_revision: string
          parts_completed_this_shift: number
          primary_state: string
          process_notes_for_next_shift: string | null
          qa_notified: string | null
          quality_notes: string | null
          raw_material_available: boolean
          record_version: number
          rework_count: number
          scrap_count: number
          shift: string
          special_instructions_followed: string | null
          state_reason: string | null
          station_id: string | null
          supervisor_name: string | null
          supervisor_time: string | null
          team_id: string | null
          tooling_notes: Json | null
          updated_at: string
          water_jet_condition: Json | null
          welding_condition: Json | null
          work_center: string
          work_center_type: string
          work_order: string
        }
        Insert: {
          clamps_bolts_torqued?: string | null
          created_at?: string
          critical_dims_verified?: boolean
          date: string
          delay_code?: string | null
          equipment_readiness?: Json | null
          fixture_installed?: string | null
          fixture_orientation_verified?: string | null
          handoff_summary: string
          id?: string
          image_urls?: string[] | null
          incoming_operator_id?: string | null
          incoming_operator_name: string
          incoming_time?: string | null
          issues_follow_ups?: Json | null
          last_good_part_timestamp?: string | null
          machine_condition?: Json | null
          machine_id: string
          machine_readiness?: Json | null
          material_issues_noted?: boolean
          material_notes?: string | null
          next_material_lot_ready?: boolean
          operation_number: string
          organization_id: string
          outgoing_operator_id?: string | null
          outgoing_operator_name: string
          outgoing_time?: string | null
          part_number: string
          part_revision: string
          parts_completed_this_shift?: number
          primary_state: string
          process_notes_for_next_shift?: string | null
          qa_notified?: string | null
          quality_notes?: string | null
          raw_material_available?: boolean
          record_version?: number
          rework_count?: number
          scrap_count?: number
          shift: string
          special_instructions_followed?: string | null
          state_reason?: string | null
          station_id?: string | null
          supervisor_name?: string | null
          supervisor_time?: string | null
          team_id?: string | null
          tooling_notes?: Json | null
          updated_at?: string
          water_jet_condition?: Json | null
          welding_condition?: Json | null
          work_center: string
          work_center_type: string
          work_order: string
        }
        Update: {
          clamps_bolts_torqued?: string | null
          created_at?: string
          critical_dims_verified?: boolean
          date?: string
          delay_code?: string | null
          equipment_readiness?: Json | null
          fixture_installed?: string | null
          fixture_orientation_verified?: string | null
          handoff_summary?: string
          id?: string
          image_urls?: string[] | null
          incoming_operator_id?: string | null
          incoming_operator_name?: string
          incoming_time?: string | null
          issues_follow_ups?: Json | null
          last_good_part_timestamp?: string | null
          machine_condition?: Json | null
          machine_id?: string
          machine_readiness?: Json | null
          material_issues_noted?: boolean
          material_notes?: string | null
          next_material_lot_ready?: boolean
          operation_number?: string
          organization_id?: string
          outgoing_operator_id?: string | null
          outgoing_operator_name?: string
          outgoing_time?: string | null
          part_number?: string
          part_revision?: string
          parts_completed_this_shift?: number
          primary_state?: string
          process_notes_for_next_shift?: string | null
          qa_notified?: string | null
          quality_notes?: string | null
          raw_material_available?: boolean
          record_version?: number
          rework_count?: number
          scrap_count?: number
          shift?: string
          special_instructions_followed?: string | null
          state_reason?: string | null
          station_id?: string | null
          supervisor_name?: string | null
          supervisor_time?: string | null
          team_id?: string | null
          tooling_notes?: Json | null
          updated_at?: string
          water_jet_condition?: Json | null
          welding_condition?: Json | null
          work_center?: string
          work_center_type?: string
          work_order?: string
        }
        Relationships: [
          {
            foreignKeyName: "handoff_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handoff_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handoff_records_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handoff_records_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_tool_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_canonical: boolean
          name: string
          organization_id: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_canonical?: boolean
          name: string
          organization_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_canonical?: boolean
          name?: string
          organization_id?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_tool_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_tool_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_tools: {
        Row: {
          category_id: string
          created_at: string
          created_by: string | null
          description: string | null
          difficulty: string
          id: string
          is_active: boolean
          is_canonical: boolean
          manufacturer_examples: string[] | null
          measurement_range: string | null
          name: string
          organization_id: string | null
          precision_spec: string | null
          profession_tags: Database["public"]["Enums"]["inspection_profession_tag"][]
          role_tags: Database["public"]["Enums"]["inspection_role_tag"][]
          safety_notes: string | null
          slug: string
          sort_order: number
          typical_use: string | null
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: string
          id?: string
          is_active?: boolean
          is_canonical?: boolean
          manufacturer_examples?: string[] | null
          measurement_range?: string | null
          name: string
          organization_id?: string | null
          precision_spec?: string | null
          profession_tags?: Database["public"]["Enums"]["inspection_profession_tag"][]
          role_tags?: Database["public"]["Enums"]["inspection_role_tag"][]
          safety_notes?: string | null
          slug: string
          sort_order?: number
          typical_use?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: string
          id?: string
          is_active?: boolean
          is_canonical?: boolean
          manufacturer_examples?: string[] | null
          measurement_range?: string | null
          name?: string
          organization_id?: string | null
          precision_spec?: string | null
          profession_tags?: Database["public"]["Enums"]["inspection_profession_tag"][]
          role_tags?: Database["public"]["Enums"]["inspection_role_tag"][]
          safety_notes?: string | null
          slug?: string
          sort_order?: number
          typical_use?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_tools_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "inspection_tool_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_tools_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_tools_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      invite_redemptions: {
        Row: {
          id: string
          invite_id: string
          redeemed_at: string
          user_id: string
        }
        Insert: {
          id?: string
          invite_id: string
          redeemed_at?: string
          user_id: string
        }
        Update: {
          id?: string
          invite_id?: string
          redeemed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invite_redemptions_invite_id_fkey"
            columns: ["invite_id"]
            isOneToOne: false
            referencedRelation: "organization_invites"
            referencedColumns: ["id"]
          },
        ]
      }
      issues: {
        Row: {
          app_version: string | null
          assigned_at: string | null
          assigned_by: string | null
          assigned_to: string | null
          build_id: string | null
          commit_hash: string | null
          console_logs: Json | null
          created_at: string
          description: string | null
          environment: string | null
          error_message: string | null
          error_stack: string | null
          id: string
          metadata: Json | null
          organization_id: string | null
          page_url: string | null
          reporter_display_name: string | null
          reporter_email: string | null
          reporter_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: Database["public"]["Enums"]["issue_severity"]
          status: Database["public"]["Enums"]["issue_status"]
          title: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          app_version?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          build_id?: string | null
          commit_hash?: string | null
          console_logs?: Json | null
          created_at?: string
          description?: string | null
          environment?: string | null
          error_message?: string | null
          error_stack?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          page_url?: string | null
          reporter_display_name?: string | null
          reporter_email?: string | null
          reporter_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["issue_severity"]
          status?: Database["public"]["Enums"]["issue_status"]
          title: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          app_version?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          build_id?: string | null
          commit_hash?: string | null
          console_logs?: Json | null
          created_at?: string
          description?: string | null
          environment?: string | null
          error_message?: string | null
          error_stack?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          page_url?: string | null
          reporter_display_name?: string | null
          reporter_email?: string | null
          reporter_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["issue_severity"]
          status?: Database["public"]["Enums"]["issue_status"]
          title?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "issues_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      job_performance_updates: {
        Row: {
          affects_cycle_time: boolean | null
          affects_quality: boolean | null
          affects_safety: boolean | null
          assigned_at: string | null
          assigned_by: string | null
          assigned_station_id: string | null
          assigned_team_id: string | null
          created_at: string
          description: string
          expected_benefit: string | null
          id: string
          image_urls: string[] | null
          operation_number: string | null
          organization_id: string
          part_number: string | null
          priority: string
          proposed_solution: string | null
          requires_engineering_review: boolean | null
          requires_fixture_modification: boolean | null
          requires_program_update: boolean | null
          requires_qa_approval: boolean | null
          requires_tooling_change: boolean | null
          review_notes: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          reviewer_name: string | null
          station_id: string | null
          status: string
          team_id: string | null
          title: string
          update_type: string
          updated_at: string
          user_id: string
          user_name: string
          work_order: string | null
        }
        Insert: {
          affects_cycle_time?: boolean | null
          affects_quality?: boolean | null
          affects_safety?: boolean | null
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_station_id?: string | null
          assigned_team_id?: string | null
          created_at?: string
          description: string
          expected_benefit?: string | null
          id?: string
          image_urls?: string[] | null
          operation_number?: string | null
          organization_id: string
          part_number?: string | null
          priority?: string
          proposed_solution?: string | null
          requires_engineering_review?: boolean | null
          requires_fixture_modification?: boolean | null
          requires_program_update?: boolean | null
          requires_qa_approval?: boolean | null
          requires_tooling_change?: boolean | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_name?: string | null
          station_id?: string | null
          status?: string
          team_id?: string | null
          title: string
          update_type: string
          updated_at?: string
          user_id: string
          user_name: string
          work_order?: string | null
        }
        Update: {
          affects_cycle_time?: boolean | null
          affects_quality?: boolean | null
          affects_safety?: boolean | null
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_station_id?: string | null
          assigned_team_id?: string | null
          created_at?: string
          description?: string
          expected_benefit?: string | null
          id?: string
          image_urls?: string[] | null
          operation_number?: string | null
          organization_id?: string
          part_number?: string | null
          priority?: string
          proposed_solution?: string | null
          requires_engineering_review?: boolean | null
          requires_fixture_modification?: boolean | null
          requires_program_update?: boolean | null
          requires_qa_approval?: boolean | null
          requires_tooling_change?: boolean | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_name?: string | null
          station_id?: string | null
          status?: string
          team_id?: string | null
          title?: string
          update_type?: string
          updated_at?: string
          user_id?: string
          user_name?: string
          work_order?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_performance_updates_assigned_station_id_fkey"
            columns: ["assigned_station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_performance_updates_assigned_team_id_fkey"
            columns: ["assigned_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_performance_updates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_performance_updates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_performance_updates_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_performance_updates_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      job_postings: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          employment_type: string
          expires_at: string | null
          id: string
          location: string | null
          organization_id: string
          published_at: string | null
          remote: boolean
          required_skills: string[] | null
          salary_max: number | null
          salary_min: number | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          employment_type?: string
          expires_at?: string | null
          id?: string
          location?: string | null
          organization_id: string
          published_at?: string | null
          remote?: boolean
          required_skills?: string[] | null
          salary_max?: number | null
          salary_min?: number | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          employment_type?: string
          expires_at?: string | null
          id?: string
          location?: string | null
          organization_id?: string
          published_at?: string | null
          remote?: boolean
          required_skills?: string[] | null
          salary_max?: number | null
          salary_min?: number | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_postings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_postings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      machining_operation_categories: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_canonical: boolean
          name: string
          organization_id: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_canonical?: boolean
          name: string
          organization_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_canonical?: boolean
          name?: string
          organization_id?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "machining_operation_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machining_operation_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      machining_operations: {
        Row: {
          category_id: string
          common_pitfalls: string | null
          created_at: string
          created_by: string | null
          difficulty: string | null
          id: string
          is_canonical: boolean
          long_description: string | null
          machine_tags: string[]
          name: string
          organization_id: string | null
          profession_tags: string[]
          reference_links: Json
          role_tags: string[]
          safety_notes: string | null
          short_description: string | null
          slug: string
          sort_order: number
          typical_tooling: string[]
          updated_at: string
        }
        Insert: {
          category_id: string
          common_pitfalls?: string | null
          created_at?: string
          created_by?: string | null
          difficulty?: string | null
          id?: string
          is_canonical?: boolean
          long_description?: string | null
          machine_tags?: string[]
          name: string
          organization_id?: string | null
          profession_tags?: string[]
          reference_links?: Json
          role_tags?: string[]
          safety_notes?: string | null
          short_description?: string | null
          slug: string
          sort_order?: number
          typical_tooling?: string[]
          updated_at?: string
        }
        Update: {
          category_id?: string
          common_pitfalls?: string | null
          created_at?: string
          created_by?: string | null
          difficulty?: string | null
          id?: string
          is_canonical?: boolean
          long_description?: string | null
          machine_tags?: string[]
          name?: string
          organization_id?: string | null
          profession_tags?: string[]
          reference_links?: Json
          role_tags?: string[]
          safety_notes?: string | null
          short_description?: string | null
          slug?: string
          sort_order?: number
          typical_tooling?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "machining_operations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "machining_operation_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machining_operations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machining_operations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_records: {
        Row: {
          completed_date: string | null
          cost: number | null
          created_at: string | null
          description: string | null
          equipment_id: string | null
          id: string
          maintenance_type: string
          next_due_date: string | null
          notes: string | null
          organization_id: string
          parts_used: Json | null
          performed_by: string | null
          performed_by_name: string | null
          scheduled_date: string | null
          station_id: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          completed_date?: string | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          equipment_id?: string | null
          id?: string
          maintenance_type: string
          next_due_date?: string | null
          notes?: string | null
          organization_id: string
          parts_used?: Json | null
          performed_by?: string | null
          performed_by_name?: string | null
          scheduled_date?: string | null
          station_id?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          completed_date?: string | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          equipment_id?: string | null
          id?: string
          maintenance_type?: string
          next_due_date?: string | null
          notes?: string | null
          organization_id?: string
          parts_used?: Json | null
          performed_by?: string | null
          performed_by_name?: string | null
          scheduled_date?: string | null
          station_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_records_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_records_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      material_lots: {
        Row: {
          certification_docs: string[] | null
          created_at: string | null
          expiry_date: string | null
          id: string
          location: string | null
          lot_number: string
          material_type: string
          metadata: Json | null
          organization_id: string
          part_number: string | null
          quantity: number
          received_date: string | null
          status: string | null
          supplier: string | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          certification_docs?: string[] | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          location?: string | null
          lot_number: string
          material_type: string
          metadata?: Json | null
          organization_id: string
          part_number?: string | null
          quantity: number
          received_date?: string | null
          status?: string | null
          supplier?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          certification_docs?: string[] | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          location?: string | null
          lot_number?: string
          material_type?: string
          metadata?: Json | null
          organization_id?: string
          part_number?: string | null
          quantity?: number
          received_date?: string | null
          status?: string | null
          supplier?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "material_lots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_lots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      ncr_audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          ncr_id: string
          new_values: Json | null
          old_values: Json | null
          organization_id: string
          performed_by: string
          performed_by_name: string
          queue_item_id: string
          reason: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ncr_id: string
          new_values?: Json | null
          old_values?: Json | null
          organization_id: string
          performed_by: string
          performed_by_name: string
          queue_item_id: string
          reason?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ncr_id?: string
          new_values?: Json | null
          old_values?: Json | null
          organization_id?: string
          performed_by?: string
          performed_by_name?: string
          queue_item_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ncr_audit_log_ncr_id_fkey"
            columns: ["ncr_id"]
            isOneToOne: false
            referencedRelation: "ncr_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      ncr_reports: {
        Row: {
          authorization_status: string
          authorized_at: string | null
          authorized_by: string | null
          authorized_by_name: string | null
          created_at: string
          created_by: string
          customer_approval: boolean | null
          defect_type: string
          description: string
          disposition: string
          id: string
          image_urls: string[] | null
          metadata: Json | null
          ncr_number: string
          operation_number: string
          organization_id: string
          part_number: string | null
          quality_signoff: boolean | null
          quantity_affected: number
          queue_item_id: string
          rejection_reason: string | null
          rework_wo_id: string | null
          serial_or_lot: string
          updated_at: string
          work_order_number: string
        }
        Insert: {
          authorization_status?: string
          authorized_at?: string | null
          authorized_by?: string | null
          authorized_by_name?: string | null
          created_at?: string
          created_by: string
          customer_approval?: boolean | null
          defect_type: string
          description: string
          disposition: string
          id?: string
          image_urls?: string[] | null
          metadata?: Json | null
          ncr_number: string
          operation_number: string
          organization_id: string
          part_number?: string | null
          quality_signoff?: boolean | null
          quantity_affected?: number
          queue_item_id: string
          rejection_reason?: string | null
          rework_wo_id?: string | null
          serial_or_lot: string
          updated_at?: string
          work_order_number: string
        }
        Update: {
          authorization_status?: string
          authorized_at?: string | null
          authorized_by?: string | null
          authorized_by_name?: string | null
          created_at?: string
          created_by?: string
          customer_approval?: boolean | null
          defect_type?: string
          description?: string
          disposition?: string
          id?: string
          image_urls?: string[] | null
          metadata?: Json | null
          ncr_number?: string
          operation_number?: string
          organization_id?: string
          part_number?: string | null
          quality_signoff?: boolean | null
          quantity_affected?: number
          queue_item_id?: string
          rejection_reason?: string | null
          rework_wo_id?: string | null
          serial_or_lot?: string
          updated_at?: string
          work_order_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "ncr_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ncr_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ncr_reports_queue_item_id_fkey"
            columns: ["queue_item_id"]
            isOneToOne: false
            referencedRelation: "queue_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ncr_reports_rework_wo_id_fkey"
            columns: ["rework_wo_id"]
            isOneToOne: false
            referencedRelation: "queue_items"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_handoff_alerts: boolean | null
          email_machine_down: boolean | null
          email_quality_alerts: boolean | null
          email_shift_reminders: boolean | null
          email_weekly_summary: boolean | null
          id: string
          push_enabled: boolean | null
          push_urgent_only: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_handoff_alerts?: boolean | null
          email_machine_down?: boolean | null
          email_quality_alerts?: boolean | null
          email_shift_reminders?: boolean | null
          email_weekly_summary?: boolean | null
          id?: string
          push_enabled?: boolean | null
          push_urgent_only?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_handoff_alerts?: boolean | null
          email_machine_down?: boolean | null
          email_quality_alerts?: boolean | null
          email_shift_reminders?: boolean | null
          email_weekly_summary?: boolean | null
          id?: string
          push_enabled?: boolean | null
          push_urgent_only?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_queue: {
        Row: {
          attempts: number | null
          channel: string
          content: string
          created_at: string | null
          error_message: string | null
          id: string
          last_attempt_at: string | null
          max_attempts: number | null
          metadata: Json | null
          notification_type: string
          organization_id: string | null
          priority: string | null
          recipient: string
          scheduled_for: string | null
          sent_at: string | null
          status: string | null
          subject: string | null
          user_id: string | null
        }
        Insert: {
          attempts?: number | null
          channel: string
          content: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          last_attempt_at?: string | null
          max_attempts?: number | null
          metadata?: Json | null
          notification_type: string
          organization_id?: string | null
          priority?: string | null
          recipient: string
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          user_id?: string | null
        }
        Update: {
          attempts?: number | null
          channel?: string
          content?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          last_attempt_at?: string | null
          max_attempts?: number | null
          metadata?: Json | null
          notification_type?: string
          organization_id?: string | null
          priority?: string | null
          recipient?: string
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      oap_certificate_items: {
        Row: {
          certificate_id: string
          display_label: string
          id: string
          item_slug: string | null
          item_type: string
          sort_order: number
        }
        Insert: {
          certificate_id: string
          display_label: string
          id?: string
          item_slug?: string | null
          item_type: string
          sort_order?: number
        }
        Update: {
          certificate_id?: string
          display_label?: string
          id?: string
          item_slug?: string | null
          item_type?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "oap_certificate_items_certificate_id_fkey"
            columns: ["certificate_id"]
            isOneToOne: false
            referencedRelation: "oap_certificates"
            referencedColumns: ["id"]
          },
        ]
      }
      oap_certificates: {
        Row: {
          amount_cents: number
          cert_id: string
          created_at: string
          id: string
          issued_at: string
          organization_id: string | null
          pdf_url: string | null
          program_name: string
          qr_token: string
          recipient_email: string
          recipient_name: string
          recipient_username: string | null
          revoked_at: string | null
          revoked_reason: string | null
          role_program_id: string | null
          signed_by_name: string | null
          signed_by_signature_url: string | null
          signed_by_title: string | null
          signed_by_user_id: string | null
          status: string
          stripe_session_id: string | null
          updated_at: string
          user_id: string
          valid_from: string
          valid_until: string | null
          vertical: Database["public"]["Enums"]["oap_vertical"]
        }
        Insert: {
          amount_cents?: number
          cert_id: string
          created_at?: string
          id?: string
          issued_at?: string
          organization_id?: string | null
          pdf_url?: string | null
          program_name: string
          qr_token?: string
          recipient_email: string
          recipient_name: string
          recipient_username?: string | null
          revoked_at?: string | null
          revoked_reason?: string | null
          role_program_id?: string | null
          signed_by_name?: string | null
          signed_by_signature_url?: string | null
          signed_by_title?: string | null
          signed_by_user_id?: string | null
          status?: string
          stripe_session_id?: string | null
          updated_at?: string
          user_id: string
          valid_from?: string
          valid_until?: string | null
          vertical?: Database["public"]["Enums"]["oap_vertical"]
        }
        Update: {
          amount_cents?: number
          cert_id?: string
          created_at?: string
          id?: string
          issued_at?: string
          organization_id?: string | null
          pdf_url?: string | null
          program_name?: string
          qr_token?: string
          recipient_email?: string
          recipient_name?: string
          recipient_username?: string | null
          revoked_at?: string | null
          revoked_reason?: string | null
          role_program_id?: string | null
          signed_by_name?: string | null
          signed_by_signature_url?: string | null
          signed_by_title?: string | null
          signed_by_user_id?: string | null
          status?: string
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string
          valid_from?: string
          valid_until?: string | null
          vertical?: Database["public"]["Enums"]["oap_vertical"]
        }
        Relationships: [
          {
            foreignKeyName: "oap_certificates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oap_certificates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oap_certificates_role_program_id_fkey"
            columns: ["role_program_id"]
            isOneToOne: false
            referencedRelation: "oap_role_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      oap_courses: {
        Row: {
          created_at: string
          description: string | null
          estimated_minutes: number | null
          id: string
          is_published: boolean
          section_number: number
          slug: string
          sort_order: number
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          is_published?: boolean
          section_number: number
          slug: string
          sort_order?: number
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          is_published?: boolean
          section_number?: number
          slug?: string
          sort_order?: number
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      oap_designated_mentors: {
        Row: {
          designated_at: string
          designated_by: string
          id: string
          is_active: boolean
          notes: string | null
          organization_id: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          designated_at?: string
          designated_by: string
          id?: string
          is_active?: boolean
          notes?: string | null
          organization_id: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          designated_at?: string
          designated_by?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          organization_id?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oap_designated_mentors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oap_designated_mentors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      oap_enrollments: {
        Row: {
          completed_at: string | null
          created_at: string
          expected_completion_at: string | null
          id: string
          lifecycle_changed_at: string | null
          lifecycle_changed_by: string | null
          lifecycle_reason: string | null
          lifecycle_status: string
          next_recert_due: string | null
          organization_id: string
          recert_interval_months_override: number | null
          role_program_id: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          expected_completion_at?: string | null
          id?: string
          lifecycle_changed_at?: string | null
          lifecycle_changed_by?: string | null
          lifecycle_reason?: string | null
          lifecycle_status?: string
          next_recert_due?: string | null
          organization_id: string
          recert_interval_months_override?: number | null
          role_program_id: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          expected_completion_at?: string | null
          id?: string
          lifecycle_changed_at?: string | null
          lifecycle_changed_by?: string | null
          lifecycle_reason?: string | null
          lifecycle_status?: string
          next_recert_due?: string | null
          organization_id?: string
          recert_interval_months_override?: number | null
          role_program_id?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oap_enrollments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oap_enrollments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oap_enrollments_role_program_id_fkey"
            columns: ["role_program_id"]
            isOneToOne: false
            referencedRelation: "oap_role_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      oap_lessons: {
        Row: {
          body_markdown: string
          course_id: string
          created_at: string
          estimated_minutes: number | null
          id: string
          is_published: boolean
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          body_markdown?: string
          course_id: string
          created_at?: string
          estimated_minutes?: number | null
          id?: string
          is_published?: boolean
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          body_markdown?: string
          course_id?: string
          created_at?: string
          estimated_minutes?: number | null
          id?: string
          is_published?: boolean
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "oap_lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "oap_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      oap_operator_credentials: {
        Row: {
          approved_operations: string[]
          cert_id: string | null
          created_at: string
          enrollment_id: string | null
          expires_at: string | null
          id: string
          is_portable: boolean
          issued_at: string
          issuing_organization_id: string | null
          issuing_organization_name: string
          machine_tags: string[]
          notes: string | null
          operator_user_id: string
          revoked_at: string | null
          role_program_name: string | null
          status: string
          updated_at: string
          vertical: Database["public"]["Enums"]["oap_vertical"]
        }
        Insert: {
          approved_operations?: string[]
          cert_id?: string | null
          created_at?: string
          enrollment_id?: string | null
          expires_at?: string | null
          id?: string
          is_portable?: boolean
          issued_at?: string
          issuing_organization_id?: string | null
          issuing_organization_name: string
          machine_tags?: string[]
          notes?: string | null
          operator_user_id: string
          revoked_at?: string | null
          role_program_name?: string | null
          status?: string
          updated_at?: string
          vertical?: Database["public"]["Enums"]["oap_vertical"]
        }
        Update: {
          approved_operations?: string[]
          cert_id?: string | null
          created_at?: string
          enrollment_id?: string | null
          expires_at?: string | null
          id?: string
          is_portable?: boolean
          issued_at?: string
          issuing_organization_id?: string | null
          issuing_organization_name?: string
          machine_tags?: string[]
          notes?: string | null
          operator_user_id?: string
          revoked_at?: string | null
          role_program_name?: string | null
          status?: string
          updated_at?: string
          vertical?: Database["public"]["Enums"]["oap_vertical"]
        }
        Relationships: [
          {
            foreignKeyName: "oap_operator_credentials_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "oap_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oap_operator_credentials_issuing_organization_id_fkey"
            columns: ["issuing_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oap_operator_credentials_issuing_organization_id_fkey"
            columns: ["issuing_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      oap_quiz_attempts: {
        Row: {
          answers: Json
          completed_at: string | null
          created_at: string
          duration_seconds: number | null
          id: string
          organization_id: string | null
          passed: boolean | null
          quiz_id: string
          score_pct: number | null
          started_at: string
          user_id: string
        }
        Insert: {
          answers?: Json
          completed_at?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          organization_id?: string | null
          passed?: boolean | null
          quiz_id: string
          score_pct?: number | null
          started_at?: string
          user_id: string
        }
        Update: {
          answers?: Json
          completed_at?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          organization_id?: string | null
          passed?: boolean | null
          quiz_id?: string
          score_pct?: number | null
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oap_quiz_attempts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oap_quiz_attempts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oap_quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "oap_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      oap_quiz_questions: {
        Row: {
          choices: Json
          correct_answers: Json
          created_at: string
          explanation: string | null
          id: string
          points: number
          prompt: string
          question_type: string
          quiz_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          choices?: Json
          correct_answers?: Json
          created_at?: string
          explanation?: string | null
          id?: string
          points?: number
          prompt: string
          question_type?: string
          quiz_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          choices?: Json
          correct_answers?: Json
          created_at?: string
          explanation?: string | null
          id?: string
          points?: number
          prompt?: string
          question_type?: string
          quiz_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "oap_quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "oap_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      oap_quizzes: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          max_attempts: number | null
          passing_score_pct: number
          time_limit_minutes: number | null
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          max_attempts?: number | null
          passing_score_pct?: number
          time_limit_minutes?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          max_attempts?: number | null
          passing_score_pct?: number
          time_limit_minutes?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "oap_quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "oap_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      oap_recert_events: {
        Row: {
          acted_by: string | null
          acted_by_name: string | null
          created_at: string
          enrollment_id: string
          event_type: string
          id: string
          metadata: Json
          new_due: string | null
          operator_user_id: string
          organization_id: string
          previous_due: string | null
          reason: string | null
        }
        Insert: {
          acted_by?: string | null
          acted_by_name?: string | null
          created_at?: string
          enrollment_id: string
          event_type: string
          id?: string
          metadata?: Json
          new_due?: string | null
          operator_user_id: string
          organization_id: string
          previous_due?: string | null
          reason?: string | null
        }
        Update: {
          acted_by?: string | null
          acted_by_name?: string | null
          created_at?: string
          enrollment_id?: string
          event_type?: string
          id?: string
          metadata?: Json
          new_due?: string | null
          operator_user_id?: string
          organization_id?: string
          previous_due?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oap_recert_events_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "oap_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oap_recert_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oap_recert_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      oap_role_program_courses: {
        Row: {
          course_id: string
          id: string
          is_required: boolean
          role_program_id: string
          sort_order: number
        }
        Insert: {
          course_id: string
          id?: string
          is_required?: boolean
          role_program_id: string
          sort_order?: number
        }
        Update: {
          course_id?: string
          id?: string
          is_required?: boolean
          role_program_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "oap_role_program_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "oap_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oap_role_program_courses_role_program_id_fkey"
            columns: ["role_program_id"]
            isOneToOne: false
            referencedRelation: "oap_role_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      oap_role_programs: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          is_canonical: boolean
          name: string
          organization_id: string | null
          recert_grace_days: number
          recert_interval_months: number | null
          required_inspection_tool_slugs: string[] | null
          required_machine_tags: string[] | null
          required_machining_operation_slugs: string[] | null
          source_template_id: string | null
          template_slug: string | null
          updated_at: string
          vertical: Database["public"]["Enums"]["oap_vertical"]
          vertical_role_slug: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_canonical?: boolean
          name: string
          organization_id?: string | null
          recert_grace_days?: number
          recert_interval_months?: number | null
          required_inspection_tool_slugs?: string[] | null
          required_machine_tags?: string[] | null
          required_machining_operation_slugs?: string[] | null
          source_template_id?: string | null
          template_slug?: string | null
          updated_at?: string
          vertical?: Database["public"]["Enums"]["oap_vertical"]
          vertical_role_slug?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_canonical?: boolean
          name?: string
          organization_id?: string | null
          recert_grace_days?: number
          recert_interval_months?: number | null
          required_inspection_tool_slugs?: string[] | null
          required_machine_tags?: string[] | null
          required_machining_operation_slugs?: string[] | null
          source_template_id?: string | null
          template_slug?: string | null
          updated_at?: string
          vertical?: Database["public"]["Enums"]["oap_vertical"]
          vertical_role_slug?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oap_role_programs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oap_role_programs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oap_role_programs_source_template_id_fkey"
            columns: ["source_template_id"]
            isOneToOne: false
            referencedRelation: "oap_role_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      oap_safety_credentials: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          issuing_body: string | null
          name: string
          slug: string
          updated_at: string
          validity_months: number | null
          vertical: Database["public"]["Enums"]["oap_vertical"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          issuing_body?: string | null
          name: string
          slug: string
          updated_at?: string
          validity_months?: number | null
          vertical: Database["public"]["Enums"]["oap_vertical"]
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          issuing_body?: string | null
          name?: string
          slug?: string
          updated_at?: string
          validity_months?: number | null
          vertical?: Database["public"]["Enums"]["oap_vertical"]
        }
        Relationships: []
      }
      oap_transfer_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          operator_user_id: string
          redeemed_at: string | null
          redeemed_by_org_id: string | null
          redeemed_by_user_id: string | null
          token: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          operator_user_id: string
          redeemed_at?: string | null
          redeemed_by_org_id?: string | null
          redeemed_by_user_id?: string | null
          token?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          operator_user_id?: string
          redeemed_at?: string | null
          redeemed_by_org_id?: string | null
          redeemed_by_user_id?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "oap_transfer_tokens_redeemed_by_org_id_fkey"
            columns: ["redeemed_by_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oap_transfer_tokens_redeemed_by_org_id_fkey"
            columns: ["redeemed_by_org_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      oap_vertical_roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          prerequisites: string[] | null
          slug: string
          tier: number
          typical_duties: string[] | null
          updated_at: string
          vertical: Database["public"]["Enums"]["oap_vertical"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          prerequisites?: string[] | null
          slug: string
          tier?: number
          typical_duties?: string[] | null
          updated_at?: string
          vertical: Database["public"]["Enums"]["oap_vertical"]
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          prerequisites?: string[] | null
          slug?: string
          tier?: number
          typical_duties?: string[] | null
          updated_at?: string
          vertical?: Database["public"]["Enums"]["oap_vertical"]
        }
        Relationships: []
      }
      oap_walkthrough_checkoffs: {
        Row: {
          created_at: string
          id: string
          item_id: string
          mentor_id: string
          mentor_name: string
          mentor_signature: string
          notes: string | null
          organization_id: string
          result: Database["public"]["Enums"]["oap_checkoff_result"]
          section_id: string
          session_id: string
          signed_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          mentor_id: string
          mentor_name: string
          mentor_signature: string
          notes?: string | null
          organization_id: string
          result: Database["public"]["Enums"]["oap_checkoff_result"]
          section_id: string
          session_id: string
          signed_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          mentor_id?: string
          mentor_name?: string
          mentor_signature?: string
          notes?: string | null
          organization_id?: string
          result?: Database["public"]["Enums"]["oap_checkoff_result"]
          section_id?: string
          session_id?: string
          signed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "oap_walkthrough_checkoffs_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "oap_walkthrough_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oap_walkthrough_checkoffs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oap_walkthrough_checkoffs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oap_walkthrough_checkoffs_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "oap_walkthrough_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oap_walkthrough_checkoffs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "oap_walkthrough_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      oap_walkthrough_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          instructions: string | null
          is_active: boolean
          is_required: boolean
          item_order: number
          organization_id: string | null
          section_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          is_required?: boolean
          item_order: number
          organization_id?: string | null
          section_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          is_required?: boolean
          item_order?: number
          organization_id?: string | null
          section_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "oap_walkthrough_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oap_walkthrough_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oap_walkthrough_items_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "oap_walkthrough_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      oap_walkthrough_sections: {
        Row: {
          created_at: string
          description: string | null
          id: string
          section_key: string
          section_order: number
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          section_key: string
          section_order: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          section_key?: string
          section_order?: number
          title?: string
        }
        Relationships: []
      }
      oap_walkthrough_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          current_section_order: number
          id: string
          notes: string | null
          operator_id: string
          operator_name: string | null
          organization_id: string
          primary_mentor_id: string | null
          primary_mentor_name: string | null
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_section_order?: number
          id?: string
          notes?: string | null
          operator_id: string
          operator_name?: string | null
          organization_id: string
          primary_mentor_id?: string | null
          primary_mentor_name?: string | null
          started_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_section_order?: number
          id?: string
          notes?: string | null
          operator_id?: string
          operator_name?: string | null
          organization_id?: string
          primary_mentor_id?: string | null
          primary_mentor_name?: string | null
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "oap_walkthrough_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oap_walkthrough_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      operator_certifications: {
        Row: {
          attachment_url: string | null
          created_at: string
          credential_id: string | null
          credential_url: string | null
          description: string | null
          expires_date: string | null
          id: string
          is_public: boolean
          issued_date: string | null
          issuer: string | null
          linked_cert_id: string | null
          name: string
          updated_at: string
          user_id: string
          verification_source: string
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string
          credential_id?: string | null
          credential_url?: string | null
          description?: string | null
          expires_date?: string | null
          id?: string
          is_public?: boolean
          issued_date?: string | null
          issuer?: string | null
          linked_cert_id?: string | null
          name: string
          updated_at?: string
          user_id: string
          verification_source?: string
        }
        Update: {
          attachment_url?: string | null
          created_at?: string
          credential_id?: string | null
          credential_url?: string | null
          description?: string | null
          expires_date?: string | null
          id?: string
          is_public?: boolean
          issued_date?: string | null
          issuer?: string | null
          linked_cert_id?: string | null
          name?: string
          updated_at?: string
          user_id?: string
          verification_source?: string
        }
        Relationships: []
      }
      operator_connections: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          responded_at: string | null
          shared_org_id: string | null
          status: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          responded_at?: string | null
          shared_org_id?: string | null
          status?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          responded_at?: string | null
          shared_org_id?: string | null
          status?: string
        }
        Relationships: []
      }
      operator_education: {
        Row: {
          created_at: string
          degree: string | null
          description: string | null
          end_date: string | null
          field_of_study: string | null
          id: string
          school_name: string
          start_date: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          degree?: string | null
          description?: string | null
          end_date?: string | null
          field_of_study?: string | null
          id?: string
          school_name: string
          start_date?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          degree?: string | null
          description?: string | null
          end_date?: string | null
          field_of_study?: string | null
          id?: string
          school_name?: string
          start_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
      operator_follows: {
        Row: {
          created_at: string
          followed_id: string
          follower_id: string
          id: string
        }
        Insert: {
          created_at?: string
          followed_id: string
          follower_id: string
          id?: string
        }
        Update: {
          created_at?: string
          followed_id?: string
          follower_id?: string
          id?: string
        }
        Relationships: []
      }
      operator_machine_proficiencies: {
        Row: {
          control_type: string | null
          created_at: string
          id: string
          machine_category: string
          machine_make: string | null
          machine_model: string | null
          notes: string | null
          proficiency: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          control_type?: string | null
          created_at?: string
          id?: string
          machine_category: string
          machine_make?: string | null
          machine_model?: string | null
          notes?: string | null
          proficiency?: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          control_type?: string | null
          created_at?: string
          id?: string
          machine_category?: string
          machine_make?: string | null
          machine_model?: string | null
          notes?: string | null
          proficiency?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: []
      }
      operator_profiles: {
        Row: {
          accent_color: string | null
          avatar_url: string | null
          banner_url: string | null
          bio: string | null
          business_hours: Json | null
          card_slug: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          cta_label: string | null
          cta_url: string | null
          desired_salary_max: number | null
          desired_salary_min: number | null
          facebook_url: string | null
          gallery: Json
          github_url: string | null
          headline: string | null
          id: string
          instagram_url: string | null
          is_discoverable: boolean
          latitude: number | null
          linkedin_url: string | null
          location_city: string | null
          location_country: string | null
          location_region: string | null
          longitude: number | null
          open_to_work: boolean
          portfolio_url: string | null
          preferred_employment_types: string[] | null
          profile_visibility: Database["public"]["Enums"]["operator_profile_visibility"]
          public_published_at: string | null
          public_username: string | null
          resume_pdf_url: string | null
          resume_public: boolean
          services: Json
          show_only_verified_certs: boolean
          social_visibility: Json
          testimonials: Json
          theme_color: string | null
          twitter_url: string | null
          updated_at: string
          user_id: string
          vcard_company: string | null
          vcard_full_name: string | null
          vcard_title: string | null
          website_url: string | null
          willing_to_relocate: boolean
          years_experience: number | null
          youtube_url: string | null
        }
        Insert: {
          accent_color?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          business_hours?: Json | null
          card_slug?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          desired_salary_max?: number | null
          desired_salary_min?: number | null
          facebook_url?: string | null
          gallery?: Json
          github_url?: string | null
          headline?: string | null
          id?: string
          instagram_url?: string | null
          is_discoverable?: boolean
          latitude?: number | null
          linkedin_url?: string | null
          location_city?: string | null
          location_country?: string | null
          location_region?: string | null
          longitude?: number | null
          open_to_work?: boolean
          portfolio_url?: string | null
          preferred_employment_types?: string[] | null
          profile_visibility?: Database["public"]["Enums"]["operator_profile_visibility"]
          public_published_at?: string | null
          public_username?: string | null
          resume_pdf_url?: string | null
          resume_public?: boolean
          services?: Json
          show_only_verified_certs?: boolean
          social_visibility?: Json
          testimonials?: Json
          theme_color?: string | null
          twitter_url?: string | null
          updated_at?: string
          user_id: string
          vcard_company?: string | null
          vcard_full_name?: string | null
          vcard_title?: string | null
          website_url?: string | null
          willing_to_relocate?: boolean
          years_experience?: number | null
          youtube_url?: string | null
        }
        Update: {
          accent_color?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          business_hours?: Json | null
          card_slug?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          desired_salary_max?: number | null
          desired_salary_min?: number | null
          facebook_url?: string | null
          gallery?: Json
          github_url?: string | null
          headline?: string | null
          id?: string
          instagram_url?: string | null
          is_discoverable?: boolean
          latitude?: number | null
          linkedin_url?: string | null
          location_city?: string | null
          location_country?: string | null
          location_region?: string | null
          longitude?: number | null
          open_to_work?: boolean
          portfolio_url?: string | null
          preferred_employment_types?: string[] | null
          profile_visibility?: Database["public"]["Enums"]["operator_profile_visibility"]
          public_published_at?: string | null
          public_username?: string | null
          resume_pdf_url?: string | null
          resume_public?: boolean
          services?: Json
          show_only_verified_certs?: boolean
          social_visibility?: Json
          testimonials?: Json
          theme_color?: string | null
          twitter_url?: string | null
          updated_at?: string
          user_id?: string
          vcard_company?: string | null
          vcard_full_name?: string | null
          vcard_title?: string | null
          website_url?: string | null
          willing_to_relocate?: boolean
          years_experience?: number | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      operator_recommendations: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          is_hidden_by_recipient: boolean
          recipient_id: string
          relationship: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          is_hidden_by_recipient?: boolean
          recipient_id: string
          relationship?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          is_hidden_by_recipient?: boolean
          recipient_id?: string
          relationship?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      operator_references: {
        Row: {
          company: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          notes: string | null
          reference_name: string
          relationship: string | null
          user_id: string
        }
        Insert: {
          company?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          reference_name: string
          relationship?: string | null
          user_id: string
        }
        Update: {
          company?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          reference_name?: string
          relationship?: string | null
          user_id?: string
        }
        Relationships: []
      }
      operator_skills: {
        Row: {
          created_at: string
          id: string
          proficiency: string
          skill: string
          user_id: string
          years_used: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          proficiency?: string
          skill: string
          user_id: string
          years_used?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          proficiency?: string
          skill?: string
          user_id?: string
          years_used?: number | null
        }
        Relationships: []
      }
      operator_station_sessions: {
        Row: {
          checked_in_at: string
          checked_out_at: string | null
          created_at: string
          id: string
          is_active: boolean
          organization_id: string | null
          shift: string
          station_id: string
          user_id: string
        }
        Insert: {
          checked_in_at?: string
          checked_out_at?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          organization_id?: string | null
          shift?: string
          station_id: string
          user_id: string
        }
        Update: {
          checked_in_at?: string
          checked_out_at?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          organization_id?: string | null
          shift?: string
          station_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "operator_station_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operator_station_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operator_station_sessions_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      operator_work_history: {
        Row: {
          created_at: string
          description: string | null
          employer_name: string
          end_date: string | null
          id: string
          is_current: boolean
          job_title: string
          location: string | null
          organization_id: string | null
          start_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          employer_name: string
          end_date?: string | null
          id?: string
          is_current?: boolean
          job_title: string
          location?: string | null
          organization_id?: string | null
          start_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          employer_name?: string
          end_date?: string | null
          id?: string
          is_current?: boolean
          job_title?: string
          location?: string | null
          organization_id?: string | null
          start_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "operator_work_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operator_work_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      org_connections: {
        Row: {
          created_at: string
          id: string
          message: string | null
          organization_id: string
          recipient_id: string
          requester_id: string
          responded_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          organization_id: string
          recipient_id: string
          requester_id: string
          responded_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          organization_id?: string
          recipient_id?: string
          requester_id?: string
          responded_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      org_inspection_tool_overrides: {
        Row: {
          created_at: string
          custom_notes: string | null
          custom_precision_spec: string | null
          id: string
          is_hidden: boolean
          organization_id: string
          required_for_roles: Database["public"]["Enums"]["inspection_role_tag"][]
          tool_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_notes?: string | null
          custom_precision_spec?: string | null
          id?: string
          is_hidden?: boolean
          organization_id: string
          required_for_roles?: Database["public"]["Enums"]["inspection_role_tag"][]
          tool_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_notes?: string | null
          custom_precision_spec?: string | null
          id?: string
          is_hidden?: boolean
          organization_id?: string
          required_for_roles?: Database["public"]["Enums"]["inspection_role_tag"][]
          tool_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_inspection_tool_overrides_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_inspection_tool_overrides_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_inspection_tool_overrides_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "inspection_tools"
            referencedColumns: ["id"]
          },
        ]
      }
      org_machining_operation_overrides: {
        Row: {
          created_at: string
          id: string
          is_hidden: boolean
          notes: string | null
          operation_id: string
          organization_id: string
          required_for_roles: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_hidden?: boolean
          notes?: string | null
          operation_id: string
          organization_id: string
          required_for_roles?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_hidden?: boolean
          notes?: string | null
          operation_id?: string
          organization_id?: string
          required_for_roles?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_machining_operation_overrides_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: false
            referencedRelation: "machining_operations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_machining_operation_overrides_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_machining_operation_overrides_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      org_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          organization_id: string
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          organization_id: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          organization_id?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_api_keys: {
        Row: {
          created_at: string | null
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          organization_id: string
          revoked_at: string | null
          revoked_by: string | null
          scopes: string[] | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          organization_id: string
          revoked_at?: string | null
          revoked_by?: string | null
          scopes?: string[] | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          organization_id?: string
          revoked_at?: string | null
          revoked_by?: string | null
          scopes?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_api_keys_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_api_keys_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_audit_events: {
        Row: {
          actor_id: string | null
          actor_type: string | null
          created_at: string | null
          event_type: string
          id: string
          ip_address: unknown
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          organization_id: string
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
        }
        Insert: {
          actor_id?: string | null
          actor_type?: string | null
          created_at?: string | null
          event_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          organization_id: string
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
        }
        Update: {
          actor_id?: string | null
          actor_type?: string | null
          created_at?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          organization_id?: string
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_audit_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_audit_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_billing: {
        Row: {
          billing_email: string | null
          created_at: string
          id: string
          organization_id: string
          stripe_customer_id: string | null
          updated_at: string
        }
        Insert: {
          billing_email?: string | null
          created_at?: string
          id?: string
          organization_id: string
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Update: {
          billing_email?: string | null
          created_at?: string
          id?: string
          organization_id?: string
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_billing_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_billing_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_branding: {
        Row: {
          accent_color: string | null
          company_tagline: string | null
          created_at: string | null
          custom_css: string | null
          email_footer_html: string | null
          email_header_html: string | null
          favicon_url: string | null
          id: string
          login_background_url: string | null
          logo_dark_url: string | null
          logo_light_url: string | null
          organization_id: string
          primary_color: string | null
          secondary_color: string | null
          support_email: string | null
          support_phone: string | null
          updated_at: string | null
        }
        Insert: {
          accent_color?: string | null
          company_tagline?: string | null
          created_at?: string | null
          custom_css?: string | null
          email_footer_html?: string | null
          email_header_html?: string | null
          favicon_url?: string | null
          id?: string
          login_background_url?: string | null
          logo_dark_url?: string | null
          logo_light_url?: string | null
          organization_id: string
          primary_color?: string | null
          secondary_color?: string | null
          support_email?: string | null
          support_phone?: string | null
          updated_at?: string | null
        }
        Update: {
          accent_color?: string | null
          company_tagline?: string | null
          created_at?: string | null
          custom_css?: string | null
          email_footer_html?: string | null
          email_header_html?: string | null
          favicon_url?: string | null
          id?: string
          login_background_url?: string | null
          logo_dark_url?: string | null
          logo_light_url?: string | null
          organization_id?: string
          primary_color?: string | null
          secondary_color?: string | null
          support_email?: string | null
          support_phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_branding_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_branding_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_feature_flags: {
        Row: {
          config: Json | null
          created_at: string | null
          enabled_at: string | null
          enabled_by: string | null
          expires_at: string | null
          feature_key: string
          id: string
          is_enabled: boolean | null
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          enabled_at?: string | null
          enabled_by?: string | null
          expires_at?: string | null
          feature_key: string
          id?: string
          is_enabled?: boolean | null
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          enabled_at?: string | null
          enabled_by?: string | null
          expires_at?: string | null
          feature_key?: string
          id?: string
          is_enabled?: boolean | null
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_feature_flags_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_feature_flags_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_integrations: {
        Row: {
          config: Json | null
          created_at: string | null
          created_by: string
          credentials_encrypted: string | null
          error_message: string | null
          id: string
          last_sync_at: string | null
          name: string
          organization_id: string
          provider: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          created_by: string
          credentials_encrypted?: string | null
          error_message?: string | null
          id?: string
          last_sync_at?: string | null
          name: string
          organization_id: string
          provider: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          created_by?: string
          credentials_encrypted?: string | null
          error_message?: string | null
          id?: string
          last_sync_at?: string | null
          name?: string
          organization_id?: string
          provider?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_integrations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_integrations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invites: {
        Row: {
          app_role: string | null
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          invite_code: string
          invited_email: string | null
          is_active: boolean
          max_uses: number | null
          org_role: string
          organization_id: string
          team_id: string | null
          updated_at: string
          uses_count: number
        }
        Insert: {
          app_role?: string | null
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          invite_code: string
          invited_email?: string | null
          is_active?: boolean
          max_uses?: number | null
          org_role?: string
          organization_id: string
          team_id?: string | null
          updated_at?: string
          uses_count?: number
        }
        Update: {
          app_role?: string | null
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          invite_code?: string
          invited_email?: string | null
          is_active?: boolean
          max_uses?: number | null
          org_role?: string
          organization_id?: string
          team_id?: string | null
          updated_at?: string
          uses_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "organization_invites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_invites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_invites_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_machine_purchases: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          machine_library_id: string
          organization_id: string
          purchased_at: string
          purchased_by: string
          stripe_payment_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          machine_library_id: string
          organization_id: string
          purchased_at?: string
          purchased_by: string
          stripe_payment_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          machine_library_id?: string
          organization_id?: string
          purchased_at?: string
          purchased_by?: string
          stripe_payment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_machine_purchases_machine_library_id_fkey"
            columns: ["machine_library_id"]
            isOneToOne: false
            referencedRelation: "verified_machine_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_machine_purchases_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_machine_purchases_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          id: string
          joined_at: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_usage: {
        Row: {
          created_at: string | null
          id: string
          metric_type: string
          organization_id: string
          overage_count: number | null
          period_end: string
          period_start: string
          updated_at: string | null
          usage_count: number | null
          usage_limit: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          metric_type: string
          organization_id: string
          overage_count?: number | null
          period_end: string
          period_start: string
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          metric_type?: string
          organization_id?: string
          overage_count?: number | null
          period_end?: string
          period_start?: string
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_usage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_usage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_webhooks: {
        Row: {
          created_at: string | null
          created_by: string
          events: string[]
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
          retry_count: number | null
          secret: string | null
          timeout_seconds: number | null
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          events?: string[]
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
          retry_count?: number | null
          secret?: string | null
          timeout_seconds?: number | null
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          events?: string[]
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
          retry_count?: number | null
          secret?: string | null
          timeout_seconds?: number | null
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_webhooks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_webhooks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          ai_enabled: boolean
          billing_email: string | null
          created_at: string
          created_by: string
          description: string | null
          designated_oap_mentor_user_id: string | null
          employer_about: string | null
          employer_cover_url: string | null
          employer_hiring_email: string | null
          employer_ideal_certs: string[] | null
          employer_ideal_experience_min: number | null
          employer_ideal_machines: string[] | null
          employer_ideal_notes: string | null
          employer_ideal_roles: string[] | null
          employer_ideal_skills: string[] | null
          employer_industries: string[] | null
          employer_linkedin: string | null
          employer_locations: string[] | null
          employer_logo_url: string | null
          employer_paid_contact: boolean
          employer_paid_contact_until: string | null
          employer_tagline: string | null
          employer_website: string | null
          id: string
          logo_url: string | null
          mfa_required: boolean
          name: string
          organization_kind: Database["public"]["Enums"]["organization_kind"]
          public_employer: boolean
          public_slug: string | null
          requires_us_person_declaration: boolean
          slug: string
          stripe_customer_id: string | null
          subscription_status: string | null
          subscription_tier: string | null
          trial_ends_at: string
          updated_at: string
        }
        Insert: {
          ai_enabled?: boolean
          billing_email?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          designated_oap_mentor_user_id?: string | null
          employer_about?: string | null
          employer_cover_url?: string | null
          employer_hiring_email?: string | null
          employer_ideal_certs?: string[] | null
          employer_ideal_experience_min?: number | null
          employer_ideal_machines?: string[] | null
          employer_ideal_notes?: string | null
          employer_ideal_roles?: string[] | null
          employer_ideal_skills?: string[] | null
          employer_industries?: string[] | null
          employer_linkedin?: string | null
          employer_locations?: string[] | null
          employer_logo_url?: string | null
          employer_paid_contact?: boolean
          employer_paid_contact_until?: string | null
          employer_tagline?: string | null
          employer_website?: string | null
          id?: string
          logo_url?: string | null
          mfa_required?: boolean
          name: string
          organization_kind?: Database["public"]["Enums"]["organization_kind"]
          public_employer?: boolean
          public_slug?: string | null
          requires_us_person_declaration?: boolean
          slug: string
          stripe_customer_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          trial_ends_at?: string
          updated_at?: string
        }
        Update: {
          ai_enabled?: boolean
          billing_email?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          designated_oap_mentor_user_id?: string | null
          employer_about?: string | null
          employer_cover_url?: string | null
          employer_hiring_email?: string | null
          employer_ideal_certs?: string[] | null
          employer_ideal_experience_min?: number | null
          employer_ideal_machines?: string[] | null
          employer_ideal_notes?: string | null
          employer_ideal_roles?: string[] | null
          employer_ideal_skills?: string[] | null
          employer_industries?: string[] | null
          employer_linkedin?: string | null
          employer_locations?: string[] | null
          employer_logo_url?: string | null
          employer_paid_contact?: boolean
          employer_paid_contact_until?: string | null
          employer_tagline?: string | null
          employer_website?: string | null
          id?: string
          logo_url?: string | null
          mfa_required?: boolean
          name?: string
          organization_kind?: Database["public"]["Enums"]["organization_kind"]
          public_employer?: boolean
          public_slug?: string | null
          requires_us_person_declaration?: boolean
          slug?: string
          stripe_customer_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          trial_ends_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      part_catalog: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          material_type: string | null
          organization_id: string
          part_height_inches: number | null
          part_length_inches: number | null
          part_number: string
          part_shape: string | null
          part_weight_lbs: number | null
          part_width_inches: number | null
          required_tolerance: string | null
          surface_finish: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          material_type?: string | null
          organization_id: string
          part_height_inches?: number | null
          part_length_inches?: number | null
          part_number: string
          part_shape?: string | null
          part_weight_lbs?: number | null
          part_width_inches?: number | null
          required_tolerance?: string | null
          surface_finish?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          material_type?: string | null
          organization_id?: string
          part_height_inches?: number | null
          part_length_inches?: number | null
          part_number?: string
          part_shape?: string | null
          part_weight_lbs?: number | null
          part_width_inches?: number | null
          required_tolerance?: string | null
          surface_finish?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "part_catalog_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_catalog_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      planning_chat_sessions: {
        Row: {
          created_at: string
          id: string
          messages: Json
          organization_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          messages?: Json
          organization_id: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          messages?: Json
          organization_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planning_chat_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planning_chat_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_views: {
        Row: {
          created_at: string
          id: string
          referrer: string | null
          subject_id: string
          subject_type: string
          user_agent: string | null
          viewer_user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          referrer?: string | null
          subject_id: string
          subject_type: string
          user_agent?: string | null
          viewer_user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          referrer?: string | null
          subject_id?: string
          subject_type?: string
          user_agent?: string | null
          viewer_user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          email: string
          id: string
          rob_accepted_at: string | null
          rob_version: string | null
          updated_at: string
          us_person_declaration_text: string | null
          us_person_declared: boolean
          us_person_declared_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          email: string
          id?: string
          rob_accepted_at?: string | null
          rob_version?: string | null
          updated_at?: string
          us_person_declaration_text?: string | null
          us_person_declared?: boolean
          us_person_declared_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          email?: string
          id?: string
          rob_accepted_at?: string | null
          rob_version?: string | null
          updated_at?: string
          us_person_declaration_text?: string | null
          us_person_declared?: boolean
          us_person_declared_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      quality_checkpoints: {
        Row: {
          checklist_items: Json | null
          checkpoint_type: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
          required_for_work_centers: string[] | null
          updated_at: string | null
        }
        Insert: {
          checklist_items?: Json | null
          checkpoint_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
          required_for_work_centers?: string[] | null
          updated_at?: string | null
        }
        Update: {
          checklist_items?: Json | null
          checkpoint_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
          required_for_work_centers?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quality_checkpoints_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quality_checkpoints_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      quality_inspections: {
        Row: {
          checkpoint_id: string | null
          completed_at: string | null
          created_at: string | null
          defects_found: number | null
          id: string
          images: string[] | null
          inspector_id: string | null
          inspector_name: string | null
          notes: string | null
          organization_id: string
          queue_item_id: string | null
          results: Json | null
          station_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          checkpoint_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          defects_found?: number | null
          id?: string
          images?: string[] | null
          inspector_id?: string | null
          inspector_name?: string | null
          notes?: string | null
          organization_id: string
          queue_item_id?: string | null
          results?: Json | null
          station_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          checkpoint_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          defects_found?: number | null
          id?: string
          images?: string[] | null
          inspector_id?: string | null
          inspector_name?: string | null
          notes?: string | null
          organization_id?: string
          queue_item_id?: string | null
          results?: Json | null
          station_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quality_inspections_checkpoint_id_fkey"
            columns: ["checkpoint_id"]
            isOneToOne: false
            referencedRelation: "quality_checkpoints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quality_inspections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quality_inspections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quality_inspections_queue_item_id_fkey"
            columns: ["queue_item_id"]
            isOneToOne: false
            referencedRelation: "queue_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quality_inspections_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      queue_item_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          organization_id: string
          queue_item_id: string
          user_id: string
          user_name: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          organization_id: string
          queue_item_id: string
          user_id: string
          user_name: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          organization_id?: string
          queue_item_id?: string
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "queue_item_comments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_item_comments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_item_comments_queue_item_id_fkey"
            columns: ["queue_item_id"]
            isOneToOne: false
            referencedRelation: "queue_items"
            referencedColumns: ["id"]
          },
        ]
      }
      queue_item_history: {
        Row: {
          action: string
          created_at: string
          id: string
          new_value: Json | null
          old_value: Json | null
          organization_id: string
          queue_item_id: string
          user_id: string
          user_name: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          organization_id: string
          queue_item_id: string
          user_id: string
          user_name: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          organization_id?: string
          queue_item_id?: string
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "queue_item_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_item_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_item_history_queue_item_id_fkey"
            columns: ["queue_item_id"]
            isOneToOne: false
            referencedRelation: "queue_items"
            referencedColumns: ["id"]
          },
        ]
      }
      queue_items: {
        Row: {
          assigned_by: string | null
          assigned_to: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          cancelled_by_name: string | null
          completed_at: string | null
          converted_at: string | null
          converted_by: string | null
          converted_to_work_order_id: string | null
          created_at: string
          created_by: string | null
          current_phase: string | null
          cycle_time_minutes: number | null
          description: string | null
          due_date: string | null
          erp_job_id: string | null
          erp_last_synced_at: string | null
          erp_source: string | null
          estimated_duration: number | null
          first_article_minutes: number | null
          hold_reason: string | null
          id: string
          is_rework: boolean | null
          item_type: Database["public"]["Enums"]["queue_item_type"]
          last_synced_at: string | null
          material_type: string | null
          metadata: Json | null
          on_hold_at: string | null
          on_hold_by: string | null
          on_hold_by_name: string | null
          operation_number: string | null
          organization_id: string
          parent_work_order_id: string | null
          part_catalog_id: string | null
          part_height_inches: number | null
          part_image_url: string | null
          part_length_inches: number | null
          part_number: string | null
          part_shape: string | null
          part_weight_lbs: number | null
          part_width_inches: number | null
          parts_completed: number | null
          position: number
          priority: Database["public"]["Enums"]["queue_priority"]
          qty_completed: number | null
          qty_open: number | null
          qty_original: number | null
          qty_rework: number | null
          qty_scrap: number | null
          quantity: number | null
          quantity_locked: boolean | null
          required_tolerance: string | null
          scheduled_end: string | null
          scheduled_start: string | null
          setup_time_minutes: number | null
          source_quote_id: string | null
          source_system: string | null
          started_at: string | null
          station_id: string | null
          status: Database["public"]["Enums"]["queue_status"]
          surface_finish: string | null
          tags: string[] | null
          team_id: string | null
          title: string
          updated_at: string
          work_order: string | null
        }
        Insert: {
          assigned_by?: string | null
          assigned_to?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          cancelled_by_name?: string | null
          completed_at?: string | null
          converted_at?: string | null
          converted_by?: string | null
          converted_to_work_order_id?: string | null
          created_at?: string
          created_by?: string | null
          current_phase?: string | null
          cycle_time_minutes?: number | null
          description?: string | null
          due_date?: string | null
          erp_job_id?: string | null
          erp_last_synced_at?: string | null
          erp_source?: string | null
          estimated_duration?: number | null
          first_article_minutes?: number | null
          hold_reason?: string | null
          id?: string
          is_rework?: boolean | null
          item_type?: Database["public"]["Enums"]["queue_item_type"]
          last_synced_at?: string | null
          material_type?: string | null
          metadata?: Json | null
          on_hold_at?: string | null
          on_hold_by?: string | null
          on_hold_by_name?: string | null
          operation_number?: string | null
          organization_id: string
          parent_work_order_id?: string | null
          part_catalog_id?: string | null
          part_height_inches?: number | null
          part_image_url?: string | null
          part_length_inches?: number | null
          part_number?: string | null
          part_shape?: string | null
          part_weight_lbs?: number | null
          part_width_inches?: number | null
          parts_completed?: number | null
          position?: number
          priority?: Database["public"]["Enums"]["queue_priority"]
          qty_completed?: number | null
          qty_open?: number | null
          qty_original?: number | null
          qty_rework?: number | null
          qty_scrap?: number | null
          quantity?: number | null
          quantity_locked?: boolean | null
          required_tolerance?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          setup_time_minutes?: number | null
          source_quote_id?: string | null
          source_system?: string | null
          started_at?: string | null
          station_id?: string | null
          status?: Database["public"]["Enums"]["queue_status"]
          surface_finish?: string | null
          tags?: string[] | null
          team_id?: string | null
          title: string
          updated_at?: string
          work_order?: string | null
        }
        Update: {
          assigned_by?: string | null
          assigned_to?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          cancelled_by_name?: string | null
          completed_at?: string | null
          converted_at?: string | null
          converted_by?: string | null
          converted_to_work_order_id?: string | null
          created_at?: string
          created_by?: string | null
          current_phase?: string | null
          cycle_time_minutes?: number | null
          description?: string | null
          due_date?: string | null
          erp_job_id?: string | null
          erp_last_synced_at?: string | null
          erp_source?: string | null
          estimated_duration?: number | null
          first_article_minutes?: number | null
          hold_reason?: string | null
          id?: string
          is_rework?: boolean | null
          item_type?: Database["public"]["Enums"]["queue_item_type"]
          last_synced_at?: string | null
          material_type?: string | null
          metadata?: Json | null
          on_hold_at?: string | null
          on_hold_by?: string | null
          on_hold_by_name?: string | null
          operation_number?: string | null
          organization_id?: string
          parent_work_order_id?: string | null
          part_catalog_id?: string | null
          part_height_inches?: number | null
          part_image_url?: string | null
          part_length_inches?: number | null
          part_number?: string | null
          part_shape?: string | null
          part_weight_lbs?: number | null
          part_width_inches?: number | null
          parts_completed?: number | null
          position?: number
          priority?: Database["public"]["Enums"]["queue_priority"]
          qty_completed?: number | null
          qty_open?: number | null
          qty_original?: number | null
          qty_rework?: number | null
          qty_scrap?: number | null
          quantity?: number | null
          quantity_locked?: boolean | null
          required_tolerance?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          setup_time_minutes?: number | null
          source_quote_id?: string | null
          source_system?: string | null
          started_at?: string | null
          station_id?: string | null
          status?: Database["public"]["Enums"]["queue_status"]
          surface_finish?: string | null
          tags?: string[] | null
          team_id?: string | null
          title?: string
          updated_at?: string
          work_order?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "queue_items_converted_to_work_order_id_fkey"
            columns: ["converted_to_work_order_id"]
            isOneToOne: false
            referencedRelation: "queue_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_items_parent_work_order_id_fkey"
            columns: ["parent_work_order_id"]
            isOneToOne: false
            referencedRelation: "queue_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_items_part_catalog_id_fkey"
            columns: ["part_catalog_id"]
            isOneToOne: false
            referencedRelation: "part_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_items_source_quote_id_fkey"
            columns: ["source_quote_id"]
            isOneToOne: false
            referencedRelation: "queue_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_items_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_items_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      rls_health_checks: {
        Row: {
          actual_result: string
          check_name: string
          created_at: string
          error_message: string | null
          execution_time_ms: number | null
          expected_result: string
          id: string
          operation: string
          passed: boolean
          run_id: string
          table_name: string
        }
        Insert: {
          actual_result: string
          check_name: string
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          expected_result: string
          id?: string
          operation: string
          passed: boolean
          run_id: string
          table_name: string
        }
        Update: {
          actual_result?: string
          check_name?: string
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          expected_result?: string
          id?: string
          operation?: string
          passed?: boolean
          run_id?: string
          table_name?: string
        }
        Relationships: []
      }
      routing_step_dimensions: {
        Row: {
          created_at: string
          created_by: string | null
          dimension_name: string
          id: string
          is_critical: boolean
          lower_tolerance: number
          nominal_value: number
          notes: string | null
          organization_id: string | null
          routing_step_id: string
          sort_order: number
          unit: string
          updated_at: string
          upper_tolerance: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          dimension_name: string
          id?: string
          is_critical?: boolean
          lower_tolerance: number
          nominal_value: number
          notes?: string | null
          organization_id?: string | null
          routing_step_id: string
          sort_order?: number
          unit?: string
          updated_at?: string
          upper_tolerance: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          dimension_name?: string
          id?: string
          is_critical?: boolean
          lower_tolerance?: number
          nominal_value?: number
          notes?: string | null
          organization_id?: string | null
          routing_step_id?: string
          sort_order?: number
          unit?: string
          updated_at?: string
          upper_tolerance?: number
        }
        Relationships: [
          {
            foreignKeyName: "routing_step_dimensions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routing_step_dimensions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routing_step_dimensions_routing_step_id_fkey"
            columns: ["routing_step_id"]
            isOneToOne: false
            referencedRelation: "work_order_routing"
            referencedColumns: ["id"]
          },
        ]
      }
      routing_template_steps: {
        Row: {
          cycle_time_minutes: number | null
          estimated_duration: number | null
          first_article_minutes: number | null
          id: string
          instructions: string | null
          operation_name: string
          operation_type: string
          organization_id: string
          setup_time_minutes: number | null
          step_number: number
          template_id: string
          work_center_type: string | null
        }
        Insert: {
          cycle_time_minutes?: number | null
          estimated_duration?: number | null
          first_article_minutes?: number | null
          id?: string
          instructions?: string | null
          operation_name: string
          operation_type?: string
          organization_id: string
          setup_time_minutes?: number | null
          step_number: number
          template_id: string
          work_center_type?: string | null
        }
        Update: {
          cycle_time_minutes?: number | null
          estimated_duration?: number | null
          first_article_minutes?: number | null
          id?: string
          instructions?: string | null
          operation_name?: string
          operation_type?: string
          organization_id?: string
          setup_time_minutes?: number | null
          step_number?: number
          template_id?: string
          work_center_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routing_template_steps_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routing_template_steps_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routing_template_steps_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "routing_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      routing_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          organization_id: string
          part_number_pattern: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          organization_id: string
          part_number_pattern?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          organization_id?: string
          part_number_pattern?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "routing_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routing_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_views: {
        Row: {
          columns: Json | null
          created_at: string | null
          filters: Json
          id: string
          is_default: boolean | null
          is_shared: boolean | null
          name: string
          organization_id: string
          sort_by: Json | null
          team_id: string | null
          updated_at: string | null
          user_id: string
          view_type: string
        }
        Insert: {
          columns?: Json | null
          created_at?: string | null
          filters?: Json
          id?: string
          is_default?: boolean | null
          is_shared?: boolean | null
          name: string
          organization_id: string
          sort_by?: Json | null
          team_id?: string | null
          updated_at?: string | null
          user_id: string
          view_type: string
        }
        Update: {
          columns?: Json | null
          created_at?: string | null
          filters?: Json
          id?: string
          is_default?: boolean | null
          is_shared?: boolean | null
          name?: string
          organization_id?: string
          sort_by?: Json | null
          team_id?: string | null
          updated_at?: string | null
          user_id?: string
          view_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_views_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_views_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_views_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      setup_sheets: {
        Row: {
          created_at: string
          description: string | null
          external_link: string | null
          file_name: string | null
          file_url: string | null
          id: string
          organization_id: string
          queue_item_id: string
          revision: string | null
          routing_step_id: string
          sheet_type: string
          title: string
          updated_at: string
          uploaded_by: string | null
          uploaded_by_name: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          external_link?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          organization_id: string
          queue_item_id: string
          revision?: string | null
          routing_step_id: string
          sheet_type?: string
          title: string
          updated_at?: string
          uploaded_by?: string | null
          uploaded_by_name?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          external_link?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          organization_id?: string
          queue_item_id?: string
          revision?: string | null
          routing_step_id?: string
          sheet_type?: string
          title?: string
          updated_at?: string
          uploaded_by?: string | null
          uploaded_by_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "setup_sheets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "setup_sheets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "setup_sheets_queue_item_id_fkey"
            columns: ["queue_item_id"]
            isOneToOne: false
            referencedRelation: "queue_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "setup_sheets_routing_step_id_fkey"
            columns: ["routing_step_id"]
            isOneToOne: false
            referencedRelation: "work_order_routing"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_assignments: {
        Row: {
          created_at: string | null
          effective_from: string
          effective_until: string | null
          id: string
          is_primary: boolean | null
          organization_id: string
          shift_schedule_id: string
          station_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          effective_from: string
          effective_until?: string | null
          id?: string
          is_primary?: boolean | null
          organization_id: string
          shift_schedule_id: string
          station_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          effective_from?: string
          effective_until?: string | null
          id?: string
          is_primary?: boolean | null
          organization_id?: string
          shift_schedule_id?: string
          station_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_assignments_shift_schedule_id_fkey"
            columns: ["shift_schedule_id"]
            isOneToOne: false
            referencedRelation: "shift_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_assignments_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_schedules: {
        Row: {
          color: string | null
          created_at: string
          days_of_week: number[]
          end_time: string
          id: string
          is_active: boolean | null
          organization_id: string | null
          shift_code: string
          shift_name: string
          start_time: string
          team_id: string | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          days_of_week?: number[]
          end_time: string
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          shift_code: string
          shift_name: string
          start_time: string
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          days_of_week?: number[]
          end_time?: string
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          shift_code?: string
          shift_name?: string
          start_time?: string
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_schedules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_schedules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_schedules_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_floor_displays: {
        Row: {
          alert_sound_enabled: boolean | null
          auto_rotate_enabled: boolean | null
          auto_rotate_interval_seconds: number | null
          bluetooth_device_name: string | null
          bluetooth_enabled: boolean | null
          cast_protocol: string | null
          connection_type: string | null
          created_at: string | null
          created_by: string
          dark_mode: string | null
          display_mode: string
          display_name: string
          display_token: string
          id: string
          ip_address: string | null
          is_active: boolean | null
          last_seen_at: string | null
          organization_id: string
          refresh_interval_seconds: number
          team_ids: string[] | null
          token_expires_at: string
          updated_at: string | null
        }
        Insert: {
          alert_sound_enabled?: boolean | null
          auto_rotate_enabled?: boolean | null
          auto_rotate_interval_seconds?: number | null
          bluetooth_device_name?: string | null
          bluetooth_enabled?: boolean | null
          cast_protocol?: string | null
          connection_type?: string | null
          created_at?: string | null
          created_by: string
          dark_mode?: string | null
          display_mode?: string
          display_name: string
          display_token?: string
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_seen_at?: string | null
          organization_id: string
          refresh_interval_seconds?: number
          team_ids?: string[] | null
          token_expires_at?: string
          updated_at?: string | null
        }
        Update: {
          alert_sound_enabled?: boolean | null
          auto_rotate_enabled?: boolean | null
          auto_rotate_interval_seconds?: number | null
          bluetooth_device_name?: string | null
          bluetooth_enabled?: boolean | null
          cast_protocol?: string | null
          connection_type?: string | null
          created_at?: string | null
          created_by?: string
          dark_mode?: string | null
          display_mode?: string
          display_name?: string
          display_token?: string
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_seen_at?: string | null
          organization_id?: string
          refresh_interval_seconds?: number
          team_ids?: string[] | null
          token_expires_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shop_floor_displays_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_floor_displays_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      station_machine_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          id: string
          organization_id: string
          purchase_id: string
          station_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          id?: string
          organization_id: string
          purchase_id: string
          station_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          id?: string
          organization_id?: string
          purchase_id?: string
          station_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "station_machine_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "station_machine_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "station_machine_assignments_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "organization_machine_purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "station_machine_assignments_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: true
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      station_manual_machine_profiles: {
        Row: {
          asset_tag: string | null
          bar_capacity_mm: number | null
          bar_feeder: boolean
          control_model: string | null
          control_type: string | null
          created_at: string
          created_by: string
          five_axis_simultaneous: boolean
          fourth_axis: boolean
          hard_constraints: Json[]
          id: string
          image_url: string | null
          live_tooling: boolean
          machine_type: string
          manufacturer: string
          material_capability: string[]
          max_part_envelope_height: number | null
          max_part_envelope_length: number | null
          max_part_envelope_width: number | null
          max_part_weight: number | null
          max_spindle_rpm: number | null
          max_tool_diameter: number | null
          max_tool_length: number | null
          max_turning_diameter: number | null
          max_turning_length: number | null
          max_x_travel: number | null
          max_y_travel: number | null
          max_z_travel: number | null
          model: string
          notes: string | null
          organization_id: string
          pallet_pool: boolean
          platform_category: string
          probing: boolean
          serial_number: string | null
          spindle_power_hp: number | null
          spindle_taper: string | null
          station_category: string
          station_id: string
          sub_spindle: boolean
          through_spindle_coolant: boolean
          tool_magazine_capacity: number | null
          typical_tolerance: number | null
          updated_at: string
          y_axis_turn: boolean
          year_installed: number | null
        }
        Insert: {
          asset_tag?: string | null
          bar_capacity_mm?: number | null
          bar_feeder?: boolean
          control_model?: string | null
          control_type?: string | null
          created_at?: string
          created_by: string
          five_axis_simultaneous?: boolean
          fourth_axis?: boolean
          hard_constraints?: Json[]
          id?: string
          image_url?: string | null
          live_tooling?: boolean
          machine_type: string
          manufacturer: string
          material_capability?: string[]
          max_part_envelope_height?: number | null
          max_part_envelope_length?: number | null
          max_part_envelope_width?: number | null
          max_part_weight?: number | null
          max_spindle_rpm?: number | null
          max_tool_diameter?: number | null
          max_tool_length?: number | null
          max_turning_diameter?: number | null
          max_turning_length?: number | null
          max_x_travel?: number | null
          max_y_travel?: number | null
          max_z_travel?: number | null
          model: string
          notes?: string | null
          organization_id: string
          pallet_pool?: boolean
          platform_category: string
          probing?: boolean
          serial_number?: string | null
          spindle_power_hp?: number | null
          spindle_taper?: string | null
          station_category?: string
          station_id: string
          sub_spindle?: boolean
          through_spindle_coolant?: boolean
          tool_magazine_capacity?: number | null
          typical_tolerance?: number | null
          updated_at?: string
          y_axis_turn?: boolean
          year_installed?: number | null
        }
        Update: {
          asset_tag?: string | null
          bar_capacity_mm?: number | null
          bar_feeder?: boolean
          control_model?: string | null
          control_type?: string | null
          created_at?: string
          created_by?: string
          five_axis_simultaneous?: boolean
          fourth_axis?: boolean
          hard_constraints?: Json[]
          id?: string
          image_url?: string | null
          live_tooling?: boolean
          machine_type?: string
          manufacturer?: string
          material_capability?: string[]
          max_part_envelope_height?: number | null
          max_part_envelope_length?: number | null
          max_part_envelope_width?: number | null
          max_part_weight?: number | null
          max_spindle_rpm?: number | null
          max_tool_diameter?: number | null
          max_tool_length?: number | null
          max_turning_diameter?: number | null
          max_turning_length?: number | null
          max_x_travel?: number | null
          max_y_travel?: number | null
          max_z_travel?: number | null
          model?: string
          notes?: string | null
          organization_id?: string
          pallet_pool?: boolean
          platform_category?: string
          probing?: boolean
          serial_number?: string | null
          spindle_power_hp?: number | null
          spindle_taper?: string | null
          station_category?: string
          station_id?: string
          sub_spindle?: boolean
          through_spindle_coolant?: boolean
          tool_magazine_capacity?: number | null
          typical_tolerance?: number | null
          updated_at?: string
          y_axis_turn?: boolean
          year_installed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "station_manual_machine_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "station_manual_machine_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "station_manual_machine_profiles_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: true
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      stations: {
        Row: {
          created_at: string
          department_id: string | null
          id: string
          is_active: boolean
          name: string
          organization_id: string
          station_id: string
          team_id: string | null
          updated_at: string
          work_center: string
          work_center_type: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          station_id: string
          team_id?: string | null
          updated_at?: string
          work_center: string
          work_center_type: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          station_id?: string
          team_id?: string | null
          updated_at?: string
          work_center?: string
          work_center_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "stations_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_events: {
        Row: {
          event_type: string
          id: string
          payload: Json | null
          processed_at: string | null
        }
        Insert: {
          event_type: string
          id: string
          payload?: Json | null
          processed_at?: string | null
        }
        Update: {
          event_type?: string
          id?: string
          payload?: Json | null
          processed_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          metadata: Json | null
          organization_id: string | null
          quantity: number | null
          status: string
          stripe_customer_id: string
          stripe_price_id: string
          stripe_subscription_id: string
          updated_at: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          quantity?: number | null
          status?: string
          stripe_customer_id: string
          stripe_price_id: string
          stripe_subscription_id: string
          updated_at?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          quantity?: number | null
          status?: string
          stripe_customer_id?: string
          stripe_price_id?: string
          stripe_subscription_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_contact_requests: {
        Row: {
          candidate_response: string
          candidate_response_message: string | null
          candidate_user_id: string
          created_at: string
          id: string
          message: string
          organization_id: string
          organization_name: string | null
          responded_at: string | null
          sender_display_name: string | null
          sender_user_id: string
          subject: string
        }
        Insert: {
          candidate_response?: string
          candidate_response_message?: string | null
          candidate_user_id: string
          created_at?: string
          id?: string
          message: string
          organization_id: string
          organization_name?: string | null
          responded_at?: string | null
          sender_display_name?: string | null
          sender_user_id: string
          subject: string
        }
        Update: {
          candidate_response?: string
          candidate_response_message?: string | null
          candidate_user_id?: string
          created_at?: string
          id?: string
          message?: string
          organization_id?: string
          organization_name?: string | null
          responded_at?: string | null
          sender_display_name?: string | null
          sender_user_id?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_contact_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_contact_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_message_replies: {
        Row: {
          body: string
          created_at: string
          id: string
          request_id: string
          sender_role: string
          sender_user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          request_id: string
          sender_role: string
          sender_user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          request_id?: string
          sender_role?: string
          sender_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_message_replies_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "talent_contact_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_saved_candidates: {
        Row: {
          added_by: string | null
          candidate_user_id: string
          created_at: string
          id: string
          list_id: string
          notes: string | null
          organization_id: string
          stage: string
          updated_at: string
        }
        Insert: {
          added_by?: string | null
          candidate_user_id: string
          created_at?: string
          id?: string
          list_id: string
          notes?: string | null
          organization_id: string
          stage?: string
          updated_at?: string
        }
        Update: {
          added_by?: string | null
          candidate_user_id?: string
          created_at?: string
          id?: string
          list_id?: string
          notes?: string | null
          organization_id?: string
          stage?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_saved_candidates_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "talent_saved_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_saved_candidates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_saved_candidates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_saved_lists: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_saved_lists_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_saved_lists_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          joined_at: string
          organization_id: string
          role: Database["public"]["Enums"]["team_role"]
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          organization_id: string
          role?: Database["public"]["Enums"]["team_role"]
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["team_role"]
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_members_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["user_id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      terms_acceptance: {
        Row: {
          accepted_at: string | null
          id: string
          ip_address: unknown
          organization_id: string | null
          terms_type: string
          terms_version: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          id?: string
          ip_address?: unknown
          organization_id?: string | null
          terms_type: string
          terms_version: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          id?: string
          ip_address?: unknown
          organization_id?: string | null
          terms_type?: string
          terms_version?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "terms_acceptance_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "terms_acceptance_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      training_media: {
        Row: {
          alt_text: string | null
          caption: string | null
          created_at: string
          duration_ms: number | null
          entity_id: string
          entity_type: Database["public"]["Enums"]["training_media_entity"]
          file_name: string | null
          file_size_bytes: number | null
          height: number | null
          id: string
          is_canonical: boolean
          is_primary: boolean
          media_type: Database["public"]["Enums"]["training_media_type"]
          mime_type: string
          organization_id: string | null
          program: Database["public"]["Enums"]["training_media_program"]
          sort_order: number
          storage_bucket: string
          storage_path: string
          transcript: string | null
          updated_at: string
          uploaded_by: string | null
          visibility: Database["public"]["Enums"]["training_media_visibility"]
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string
          duration_ms?: number | null
          entity_id: string
          entity_type: Database["public"]["Enums"]["training_media_entity"]
          file_name?: string | null
          file_size_bytes?: number | null
          height?: number | null
          id?: string
          is_canonical?: boolean
          is_primary?: boolean
          media_type: Database["public"]["Enums"]["training_media_type"]
          mime_type: string
          organization_id?: string | null
          program?: Database["public"]["Enums"]["training_media_program"]
          sort_order?: number
          storage_bucket: string
          storage_path: string
          transcript?: string | null
          updated_at?: string
          uploaded_by?: string | null
          visibility?: Database["public"]["Enums"]["training_media_visibility"]
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string
          duration_ms?: number | null
          entity_id?: string
          entity_type?: Database["public"]["Enums"]["training_media_entity"]
          file_name?: string | null
          file_size_bytes?: number | null
          height?: number | null
          id?: string
          is_canonical?: boolean
          is_primary?: boolean
          media_type?: Database["public"]["Enums"]["training_media_type"]
          mime_type?: string
          organization_id?: string | null
          program?: Database["public"]["Enums"]["training_media_program"]
          sort_order?: number
          storage_bucket?: string
          storage_path?: string
          transcript?: string | null
          updated_at?: string
          uploaded_by?: string | null
          visibility?: Database["public"]["Enums"]["training_media_visibility"]
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "training_media_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_media_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      user_certifications: {
        Row: {
          certificate_number: string | null
          certification_id: string
          created_at: string | null
          document_url: string | null
          expires_date: string | null
          id: string
          issued_by: string | null
          issued_by_name: string | null
          issued_date: string
          notes: string | null
          organization_id: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          certificate_number?: string | null
          certification_id: string
          created_at?: string | null
          document_url?: string | null
          expires_date?: string | null
          id?: string
          issued_by?: string | null
          issued_by_name?: string | null
          issued_date: string
          notes?: string | null
          organization_id: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          certificate_number?: string | null
          certification_id?: string
          created_at?: string | null
          document_url?: string | null
          expires_date?: string | null
          id?: string
          issued_by?: string | null
          issued_by_name?: string | null
          issued_date?: string
          notes?: string | null
          organization_id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_certifications_certification_id_fkey"
            columns: ["certification_id"]
            isOneToOne: false
            referencedRelation: "certifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_certifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_certifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      user_onboarding: {
        Row: {
          completed_at: string | null
          completed_steps: string[] | null
          created_at: string | null
          current_step: string | null
          has_seen_welcome: boolean | null
          id: string
          is_complete: boolean | null
          setup_wizard_dismissed: boolean
          started_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_steps?: string[] | null
          created_at?: string | null
          current_step?: string | null
          has_seen_welcome?: boolean | null
          id?: string
          is_complete?: boolean | null
          setup_wizard_dismissed?: boolean
          started_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_steps?: string[] | null
          created_at?: string | null
          current_step?: string | null
          has_seen_welcome?: boolean | null
          id?: string
          is_complete?: boolean | null
          setup_wizard_dismissed?: boolean
          started_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_org_preferences: {
        Row: {
          created_at: string | null
          dashboard_layout: Json | null
          default_station_id: string | null
          default_team_id: string | null
          id: string
          locale: string | null
          notifications_muted: boolean | null
          organization_id: string
          sidebar_collapsed: boolean | null
          theme_preference: string | null
          timezone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          dashboard_layout?: Json | null
          default_station_id?: string | null
          default_team_id?: string | null
          id?: string
          locale?: string | null
          notifications_muted?: boolean | null
          organization_id: string
          sidebar_collapsed?: boolean | null
          theme_preference?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          dashboard_layout?: Json | null
          default_station_id?: string | null
          default_team_id?: string | null
          id?: string
          locale?: string | null
          notifications_muted?: boolean | null
          organization_id?: string
          sidebar_collapsed?: boolean | null
          theme_preference?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_org_preferences_default_station_id_fkey"
            columns: ["default_station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_org_preferences_default_team_id_fkey"
            columns: ["default_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_org_preferences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_org_preferences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string | null
          device_info: Json | null
          expires_at: string | null
          id: string
          ip_address: unknown
          is_active: boolean | null
          last_activity_at: string | null
          organization_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_info?: Json | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_activity_at?: string | null
          organization_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_info?: Json | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_activity_at?: string | null
          organization_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      verified_machine_library: {
        Row: {
          bar_capacity_mm: number | null
          bar_feeder: boolean
          control_model: string | null
          control_type: string | null
          created_at: string
          datasheet_url: string | null
          five_axis_simultaneous: boolean
          fourth_axis: boolean
          hard_constraints: Json
          id: string
          image_url: string | null
          is_verified: boolean
          live_tooling: boolean
          machine_type: string
          manufacturer: string
          material_capability: string[]
          max_part_envelope_height: number | null
          max_part_envelope_length: number | null
          max_part_envelope_width: number | null
          max_part_weight: number | null
          max_spindle_rpm: number | null
          max_tool_diameter: number | null
          max_tool_length: number | null
          max_turning_diameter: number | null
          max_turning_length: number | null
          max_x_travel: number | null
          max_y_travel: number | null
          max_z_travel: number | null
          model: string
          pallet_pool: boolean
          platform_category: string
          probing: boolean
          spindle_power_hp: number | null
          spindle_taper: string | null
          sub_spindle: boolean
          through_spindle_coolant: boolean
          tool_magazine_capacity: number | null
          typical_tolerance: number | null
          updated_at: string
          y_axis_turn: boolean
        }
        Insert: {
          bar_capacity_mm?: number | null
          bar_feeder?: boolean
          control_model?: string | null
          control_type?: string | null
          created_at?: string
          datasheet_url?: string | null
          five_axis_simultaneous?: boolean
          fourth_axis?: boolean
          hard_constraints?: Json
          id?: string
          image_url?: string | null
          is_verified?: boolean
          live_tooling?: boolean
          machine_type: string
          manufacturer: string
          material_capability?: string[]
          max_part_envelope_height?: number | null
          max_part_envelope_length?: number | null
          max_part_envelope_width?: number | null
          max_part_weight?: number | null
          max_spindle_rpm?: number | null
          max_tool_diameter?: number | null
          max_tool_length?: number | null
          max_turning_diameter?: number | null
          max_turning_length?: number | null
          max_x_travel?: number | null
          max_y_travel?: number | null
          max_z_travel?: number | null
          model: string
          pallet_pool?: boolean
          platform_category: string
          probing?: boolean
          spindle_power_hp?: number | null
          spindle_taper?: string | null
          sub_spindle?: boolean
          through_spindle_coolant?: boolean
          tool_magazine_capacity?: number | null
          typical_tolerance?: number | null
          updated_at?: string
          y_axis_turn?: boolean
        }
        Update: {
          bar_capacity_mm?: number | null
          bar_feeder?: boolean
          control_model?: string | null
          control_type?: string | null
          created_at?: string
          datasheet_url?: string | null
          five_axis_simultaneous?: boolean
          fourth_axis?: boolean
          hard_constraints?: Json
          id?: string
          image_url?: string | null
          is_verified?: boolean
          live_tooling?: boolean
          machine_type?: string
          manufacturer?: string
          material_capability?: string[]
          max_part_envelope_height?: number | null
          max_part_envelope_length?: number | null
          max_part_envelope_width?: number | null
          max_part_weight?: number | null
          max_spindle_rpm?: number | null
          max_tool_diameter?: number | null
          max_tool_length?: number | null
          max_turning_diameter?: number | null
          max_turning_length?: number | null
          max_x_travel?: number | null
          max_y_travel?: number | null
          max_z_travel?: number | null
          model?: string
          pallet_pool?: boolean
          platform_category?: string
          probing?: boolean
          spindle_power_hp?: number | null
          spindle_taper?: string | null
          sub_spindle?: boolean
          through_spindle_coolant?: boolean
          tool_magazine_capacity?: number | null
          typical_tolerance?: number | null
          updated_at?: string
          y_axis_turn?: boolean
        }
        Relationships: []
      }
      visitor_surveys: {
        Row: {
          created_at: string
          heard_about_us: string
          id: string
          looking_for: string[]
          other_heard_about: string | null
          other_looking_for: string | null
          source_page: string | null
        }
        Insert: {
          created_at?: string
          heard_about_us: string
          id?: string
          looking_for?: string[]
          other_heard_about?: string | null
          other_looking_for?: string | null
          source_page?: string | null
        }
        Update: {
          created_at?: string
          heard_about_us?: string
          id?: string
          looking_for?: string[]
          other_heard_about?: string | null
          other_looking_for?: string | null
          source_page?: string | null
        }
        Relationships: []
      }
      webhook_deliveries: {
        Row: {
          attempt_count: number | null
          created_at: string | null
          delivered_at: string | null
          event_type: string
          id: string
          next_retry_at: string | null
          organization_id: string
          payload: Json
          response_body: string | null
          response_status: number | null
          status: string | null
          webhook_id: string
        }
        Insert: {
          attempt_count?: number | null
          created_at?: string | null
          delivered_at?: string | null
          event_type: string
          id?: string
          next_retry_at?: string | null
          organization_id: string
          payload: Json
          response_body?: string | null
          response_status?: number | null
          status?: string | null
          webhook_id: string
        }
        Update: {
          attempt_count?: number | null
          created_at?: string | null
          delivered_at?: string | null
          event_type?: string
          id?: string
          next_retry_at?: string | null
          organization_id?: string
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          status?: string | null
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_deliveries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_deliveries_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "organization_webhooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_deliveries_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "organization_webhooks_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      work_center_config: {
        Row: {
          created_at: string
          custom_fields: Json | null
          default_cycle_time: number | null
          default_setup_time: number | null
          display_name: string
          id: string
          is_active: boolean | null
          organization_id: string | null
          requires_first_article: boolean | null
          requires_qa_signoff: boolean | null
          sort_order: number | null
          track_rework: boolean | null
          track_scrap: boolean | null
          updated_at: string
          work_center_type: string
        }
        Insert: {
          created_at?: string
          custom_fields?: Json | null
          default_cycle_time?: number | null
          default_setup_time?: number | null
          display_name: string
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          requires_first_article?: boolean | null
          requires_qa_signoff?: boolean | null
          sort_order?: number | null
          track_rework?: boolean | null
          track_scrap?: boolean | null
          updated_at?: string
          work_center_type: string
        }
        Update: {
          created_at?: string
          custom_fields?: Json | null
          default_cycle_time?: number | null
          default_setup_time?: number | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          requires_first_article?: boolean | null
          requires_qa_signoff?: boolean | null
          sort_order?: number | null
          track_rework?: boolean | null
          track_scrap?: boolean | null
          updated_at?: string
          work_center_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_center_config_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_center_config_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_routing: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string
          cycle_time_minutes: number | null
          dimensions_required: boolean
          erp_operation_id: string | null
          erp_sequence_number: number | null
          estimated_duration: number | null
          expected_return_date: string | null
          first_article_minutes: number | null
          id: string
          notes: string | null
          operation_name: string
          operation_type: string
          organization_id: string
          outside_vendor: string | null
          po_number: string | null
          queue_item_id: string
          setup_time_minutes: number | null
          started_at: string | null
          station_id: string | null
          status: string
          step_number: number
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          cycle_time_minutes?: number | null
          dimensions_required?: boolean
          erp_operation_id?: string | null
          erp_sequence_number?: number | null
          estimated_duration?: number | null
          expected_return_date?: string | null
          first_article_minutes?: number | null
          id?: string
          notes?: string | null
          operation_name: string
          operation_type?: string
          organization_id: string
          outside_vendor?: string | null
          po_number?: string | null
          queue_item_id: string
          setup_time_minutes?: number | null
          started_at?: string | null
          station_id?: string | null
          status?: string
          step_number: number
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          cycle_time_minutes?: number | null
          dimensions_required?: boolean
          erp_operation_id?: string | null
          erp_sequence_number?: number | null
          estimated_duration?: number | null
          expected_return_date?: string | null
          first_article_minutes?: number | null
          id?: string
          notes?: string | null
          operation_name?: string
          operation_type?: string
          organization_id?: string
          outside_vendor?: string | null
          po_number?: string | null
          queue_item_id?: string
          setup_time_minutes?: number | null
          started_at?: string | null
          station_id?: string | null
          status?: string
          step_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_routing_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_routing_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_routing_queue_item_id_fkey"
            columns: ["queue_item_id"]
            isOneToOne: false
            referencedRelation: "queue_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_routing_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      activity_logs_org_admin: {
        Row: {
          activity_type: Database["public"]["Enums"]["activity_type"] | null
          created_at: string | null
          description: string | null
          id: string | null
          metadata: Json | null
          organization_id: string | null
          user_display_name: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          activity_type?: Database["public"]["Enums"]["activity_type"] | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          metadata?: Json | null
          organization_id?: string | null
          user_display_name?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["activity_type"] | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          metadata?: Json | null
          organization_id?: string | null
          user_display_name?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_logs_supervisor: {
        Row: {
          activity_type: Database["public"]["Enums"]["activity_type"] | null
          created_at: string | null
          description: string | null
          id: string | null
          user_display_name: string | null
          user_id: string | null
        }
        Insert: {
          activity_type?: Database["public"]["Enums"]["activity_type"] | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          user_display_name?: string | null
          user_id?: string | null
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["activity_type"] | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          user_display_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      erp_connections_safe: {
        Row: {
          api_base_url: string | null
          connection_status: string | null
          created_at: string | null
          created_by: string | null
          erp_vendor: string | null
          id: string | null
          instance_type: string | null
          is_active: boolean | null
          last_tested_at: string | null
          metadata: Json | null
          oauth_token_endpoint: string | null
          organization_id: string | null
          scopes: string | null
          sync_interval_minutes: number | null
          tenant_identifier: string | null
          updated_at: string | null
        }
        Insert: {
          api_base_url?: string | null
          connection_status?: string | null
          created_at?: string | null
          created_by?: string | null
          erp_vendor?: string | null
          id?: string | null
          instance_type?: string | null
          is_active?: boolean | null
          last_tested_at?: string | null
          metadata?: Json | null
          oauth_token_endpoint?: string | null
          organization_id?: string | null
          scopes?: string | null
          sync_interval_minutes?: number | null
          tenant_identifier?: string | null
          updated_at?: string | null
        }
        Update: {
          api_base_url?: string | null
          connection_status?: string | null
          created_at?: string | null
          created_by?: string | null
          erp_vendor?: string | null
          id?: string | null
          instance_type?: string | null
          is_active?: boolean | null
          last_tested_at?: string | null
          metadata?: Json | null
          oauth_token_endpoint?: string | null
          organization_id?: string | null
          scopes?: string | null
          sync_interval_minutes?: number | null
          tenant_identifier?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "erp_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      flyer_zone_assignments_safe: {
        Row: {
          assigned_by: string | null
          assigned_to_user_id: string | null
          assignee_email: string | null
          assignee_name: string | null
          campaign_id: string | null
          created_at: string | null
          id: string | null
          is_active: boolean | null
          updated_at: string | null
          zone_numbers: number[] | null
        }
        Insert: {
          assigned_by?: string | null
          assigned_to_user_id?: string | null
          assignee_email?: string | null
          assignee_name?: string | null
          campaign_id?: string | null
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          updated_at?: string | null
          zone_numbers?: number[] | null
        }
        Update: {
          assigned_by?: string | null
          assigned_to_user_id?: string | null
          assignee_email?: string | null
          assignee_name?: string | null
          campaign_id?: string | null
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          updated_at?: string | null
          zone_numbers?: number[] | null
        }
        Relationships: [
          {
            foreignKeyName: "flyer_zone_assignments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "flyer_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      operator_profiles_public: {
        Row: {
          avatar_url: string | null
          bio: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          desired_salary_max: number | null
          desired_salary_min: number | null
          headline: string | null
          id: string | null
          is_discoverable: boolean | null
          linkedin_url: string | null
          location_city: string | null
          location_country: string | null
          location_region: string | null
          open_to_work: boolean | null
          portfolio_url: string | null
          preferred_employment_types: string[] | null
          profile_visibility:
            | Database["public"]["Enums"]["operator_profile_visibility"]
            | null
          resume_pdf_url: string | null
          updated_at: string | null
          user_id: string | null
          willing_to_relocate: boolean | null
          years_experience: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          contact_email?: never
          contact_phone?: never
          created_at?: string | null
          desired_salary_max?: never
          desired_salary_min?: never
          headline?: string | null
          id?: string | null
          is_discoverable?: boolean | null
          linkedin_url?: string | null
          location_city?: string | null
          location_country?: string | null
          location_region?: string | null
          open_to_work?: boolean | null
          portfolio_url?: string | null
          preferred_employment_types?: string[] | null
          profile_visibility?:
            | Database["public"]["Enums"]["operator_profile_visibility"]
            | null
          resume_pdf_url?: string | null
          updated_at?: string | null
          user_id?: string | null
          willing_to_relocate?: boolean | null
          years_experience?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          contact_email?: never
          contact_phone?: never
          created_at?: string | null
          desired_salary_max?: never
          desired_salary_min?: never
          headline?: string | null
          id?: string | null
          is_discoverable?: boolean | null
          linkedin_url?: string | null
          location_city?: string | null
          location_country?: string | null
          location_region?: string | null
          open_to_work?: boolean | null
          portfolio_url?: string | null
          preferred_employment_types?: string[] | null
          profile_visibility?:
            | Database["public"]["Enums"]["operator_profile_visibility"]
            | null
          resume_pdf_url?: string | null
          updated_at?: string | null
          user_id?: string | null
          willing_to_relocate?: boolean | null
          years_experience?: number | null
        }
        Relationships: []
      }
      operator_profiles_public_view: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
          bio: string | null
          contact_email: string | null
          contact_phone: string | null
          desired_salary_max: number | null
          desired_salary_min: number | null
          facebook_url: string | null
          github_url: string | null
          headline: string | null
          id: string | null
          instagram_url: string | null
          is_discoverable: boolean | null
          linkedin_url: string | null
          location_city: string | null
          location_country: string | null
          location_region: string | null
          open_to_work: boolean | null
          portfolio_url: string | null
          preferred_employment_types: string[] | null
          profile_visibility:
            | Database["public"]["Enums"]["operator_profile_visibility"]
            | null
          public_published_at: string | null
          public_username: string | null
          resume_pdf_url: string | null
          resume_public: boolean | null
          show_only_verified_certs: boolean | null
          social_visibility: Json | null
          twitter_url: string | null
          user_id: string | null
          website_url: string | null
          willing_to_relocate: boolean | null
          years_experience: number | null
          youtube_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          contact_email?: never
          contact_phone?: never
          desired_salary_max?: never
          desired_salary_min?: never
          facebook_url?: string | null
          github_url?: string | null
          headline?: string | null
          id?: string | null
          instagram_url?: string | null
          is_discoverable?: boolean | null
          linkedin_url?: string | null
          location_city?: string | null
          location_country?: string | null
          location_region?: string | null
          open_to_work?: boolean | null
          portfolio_url?: string | null
          preferred_employment_types?: string[] | null
          profile_visibility?:
            | Database["public"]["Enums"]["operator_profile_visibility"]
            | null
          public_published_at?: string | null
          public_username?: string | null
          resume_pdf_url?: string | null
          resume_public?: boolean | null
          show_only_verified_certs?: boolean | null
          social_visibility?: Json | null
          twitter_url?: string | null
          user_id?: string | null
          website_url?: string | null
          willing_to_relocate?: boolean | null
          years_experience?: number | null
          youtube_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          contact_email?: never
          contact_phone?: never
          desired_salary_max?: never
          desired_salary_min?: never
          facebook_url?: string | null
          github_url?: string | null
          headline?: string | null
          id?: string | null
          instagram_url?: string | null
          is_discoverable?: boolean | null
          linkedin_url?: string | null
          location_city?: string | null
          location_country?: string | null
          location_region?: string | null
          open_to_work?: boolean | null
          portfolio_url?: string | null
          preferred_employment_types?: string[] | null
          profile_visibility?:
            | Database["public"]["Enums"]["operator_profile_visibility"]
            | null
          public_published_at?: string | null
          public_username?: string | null
          resume_pdf_url?: string | null
          resume_public?: boolean | null
          show_only_verified_certs?: boolean | null
          social_visibility?: Json | null
          twitter_url?: string | null
          user_id?: string | null
          website_url?: string | null
          willing_to_relocate?: boolean | null
          years_experience?: number | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      operator_references_safe: {
        Row: {
          company: string | null
          created_at: string | null
          id: string | null
          notes: string | null
          reference_name: string | null
          relationship: string | null
          user_id: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          id?: string | null
          notes?: string | null
          reference_name?: string | null
          relationship?: string | null
          user_id?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          id?: string | null
          notes?: string | null
          reference_name?: string | null
          relationship?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      organization_webhooks_safe: {
        Row: {
          created_at: string | null
          created_by: string | null
          events: string[] | null
          id: string | null
          is_active: boolean | null
          name: string | null
          organization_id: string | null
          retry_count: number | null
          timeout_seconds: number | null
          updated_at: string | null
          url: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          events?: string[] | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          organization_id?: string | null
          retry_count?: number | null
          timeout_seconds?: number | null
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          events?: string[] | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          organization_id?: string | null
          retry_count?: number | null
          timeout_seconds?: number | null
          updated_at?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_webhooks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_webhooks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_member_view"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations_member_view: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string | null
          logo_url: string | null
          mfa_required: boolean | null
          name: string | null
          requires_us_person_declaration: boolean | null
          slug: string | null
          subscription_status: string | null
          subscription_tier: string | null
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string | null
          logo_url?: string | null
          mfa_required?: boolean | null
          name?: string | null
          requires_us_person_declaration?: boolean | null
          slug?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string | null
          logo_url?: string | null
          mfa_required?: boolean | null
          name?: string | null
          requires_us_person_declaration?: boolean | null
          slug?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles_public: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      apply_ncr_disposition: {
        Args: { _approver_id: string; _ncr_id: string }
        Returns: undefined
      }
      can_act_as: {
        Args: { _actor_id: string; _target_user_id: string }
        Returns: boolean
      }
      can_act_as_oap_mentor: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      can_adjust_wo_quantity: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      can_approve_ncr: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      can_insert_station: {
        Args: { _actor: string; _org_id: string; _team_id: string }
        Returns: boolean
      }
      can_insert_team: {
        Args: { _actor: string; _created_by: string; _org_id: string }
        Returns: boolean
      }
      can_insert_team_member: {
        Args: { _actor: string; _target_user_id: string; _team_id: string }
        Returns: boolean
      }
      can_manage_billing: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      can_manage_dimensions: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      can_manage_station_via_team: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      can_operator_act_on_station: {
        Args: { _station_id: string; _user_id: string }
        Returns: boolean
      }
      can_supervisor_override_in_org: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      can_view_station_via_team: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      check_feature_access: {
        Args: { _feature: string; _org_id: string }
        Returns: boolean
      }
      check_limit_access: {
        Args: { _increment?: number; _limit_key: string; _org_id: string }
        Returns: boolean
      }
      clone_oap_role_program_to_org: {
        Args: {
          _organization_id: string
          _override_name?: string
          _template_id: string
        }
        Returns: string
      }
      compute_smart_alerts: {
        Args: {
          _bottleneck_min_wos?: number
          _enable_bottleneck?: boolean
          _enable_high_priority?: boolean
          _enable_no_operator?: boolean
          _enable_no_routing?: boolean
          _enable_on_hold?: boolean
          _enable_over_time?: boolean
          _enable_overdue?: boolean
          _enable_stale?: boolean
          _enable_unassigned?: boolean
          _org_id: string
          _over_time_critical_pct?: number
          _over_time_pct?: number
          _stale_critical_days?: number
          _stale_days?: number
          _station_id?: string
        }
        Returns: Json
      }
      fetch_display_data: { Args: { _token: string }; Returns: Json }
      get_auth_user_id_by_email: { Args: { _email: string }; Returns: string }
      get_erp_persistence_mode: { Args: { _org_id: string }; Returns: string }
      get_public_employer: {
        Args: { _slug: string }
        Returns: {
          created_at: string
          description: string
          employer_about: string
          employer_cover_url: string
          employer_hiring_email: string
          employer_ideal_certs: string[]
          employer_ideal_experience_min: number
          employer_ideal_machines: string[]
          employer_ideal_notes: string
          employer_ideal_roles: string[]
          employer_ideal_skills: string[]
          employer_industries: string[]
          employer_linkedin: string
          employer_locations: string[]
          employer_logo_url: string
          employer_paid_contact: boolean
          employer_tagline: string
          employer_website: string
          id: string
          logo_url: string
          name: string
          organization_kind: Database["public"]["Enums"]["organization_kind"]
          public_slug: string
        }[]
      }
      get_public_employer_jobs: {
        Args: { _slug: string }
        Returns: {
          description: string
          employment_type: string
          expires_at: string
          id: string
          location: string
          organization_id: string
          published_at: string
          remote: boolean
          required_skills: string[]
          salary_max: number
          salary_min: number
          title: string
        }[]
      }
      get_public_operator_profile: {
        Args: { _username: string }
        Returns: {
          avatar_url: string
          banner_url: string
          bio: string
          display_name: string
          facebook_url: string
          github_url: string
          headline: string
          instagram_url: string
          linkedin_url: string
          location_city: string
          location_country: string
          location_region: string
          open_to_work: boolean
          portfolio_url: string
          preferred_employment_types: string[]
          public_published_at: string
          public_username: string
          resume_pdf_url: string
          show_only_verified_certs: boolean
          social_visibility: Json
          twitter_url: string
          user_id: string
          website_url: string
          willing_to_relocate: boolean
          years_experience: number
          youtube_url: string
        }[]
      }
      get_public_operator_social_counts: {
        Args: { _username: string }
        Returns: {
          follower_count: number
          following_count: number
          recommendation_count: number
        }[]
      }
      get_user_org_id: { Args: { _user_id: string }; Returns: string }
      grade_gca_attempt: {
        Args: { _answers: Json; _bank_id: string; _started_at: string }
        Returns: Json
      }
      grade_oap_quiz_attempt: {
        Args: {
          _answers: Json
          _organization_id?: string
          _quiz_id: string
          _started_at: string
        }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_ai_chat_usage: { Args: { _org_id: string }; Returns: Json }
      increment_erp_sync_usage: { Args: { _org_id: string }; Returns: Json }
      increment_usage: {
        Args: { _count?: number; _metric: string; _org_id: string }
        Returns: undefined
      }
      is_dev_or_admin: { Args: { _user_id: string }; Returns: boolean }
      is_feature_enabled: {
        Args: { _feature_key: string; _org_id: string }
        Returns: boolean
      }
      is_in_same_org: {
        Args: { _caller_id: string; _target_user_id: string }
        Returns: boolean
      }
      is_org_admin: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_admin_via_team: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_assignable_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_member_via_team: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      is_supervisor_for_team: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      is_supervisor_in_org: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_team_admin: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      is_team_member: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      is_team_owner: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      is_verified_employer: { Args: { _user_id: string }; Returns: boolean }
      list_public_employers: {
        Args: {
          _hiring_only?: boolean
          _industry?: string
          _limit?: number
          _location?: string
          _search?: string
          _sort?: string
        }
        Returns: {
          employer_cover_url: string
          employer_industries: string[]
          employer_locations: string[]
          employer_logo_url: string
          employer_tagline: string
          id: string
          name: string
          open_jobs_count: number
          public_slug: string
          published_at: string
        }[]
      }
      list_public_operator_profiles:
        | {
            Args: { _limit?: number; _search?: string }
            Returns: {
              avatar_url: string
              display_name: string
              headline: string
              location_city: string
              location_region: string
              open_to_work: boolean
              public_published_at: string
              public_username: string
              user_id: string
              willing_to_relocate: boolean
              years_experience: number
            }[]
          }
        | {
            Args: {
              _certification?: string
              _city?: string
              _country?: string
              _limit?: number
              _open_to_work?: boolean
              _region?: string
              _search?: string
            }
            Returns: {
              avatar_url: string
              cert_count: number
              display_name: string
              headline: string
              location_city: string
              location_country: string
              location_region: string
              open_to_work: boolean
              public_published_at: string
              public_username: string
              user_id: string
              verified_cert_count: number
              willing_to_relocate: boolean
              years_experience: number
            }[]
          }
        | {
            Args: {
              _certification?: string
              _city?: string
              _country?: string
              _limit?: number
              _machine?: string
              _min_years?: number
              _open_to_work?: boolean
              _region?: string
              _relocate?: boolean
              _search?: string
              _skill?: string
              _sort?: string
              _verified_only?: boolean
            }
            Returns: {
              avatar_url: string
              cert_count: number
              display_name: string
              headline: string
              location_city: string
              location_country: string
              location_region: string
              open_to_work: boolean
              public_published_at: string
              public_username: string
              top_machines: string[]
              top_skills: string[]
              user_id: string
              verified_cert_count: number
              willing_to_relocate: boolean
              years_experience: number
            }[]
          }
      list_public_operator_recommendations: {
        Args: { _username: string }
        Returns: {
          author_avatar_url: string
          author_display_name: string
          author_id: string
          author_public_username: string
          body: string
          created_at: string
          id: string
          relationship: string
        }[]
      }
      lookup_cert_by_stripe_session: {
        Args: { _session_id: string }
        Returns: {
          cert_id: string
          program: string
          recipient_email_masked: string
        }[]
      }
      pass_work_order_to_next_step: {
        Args: {
          _actor_id: string
          _current_station_id: string
          _is_override?: boolean
          _override_reason?: string
          _queue_item_id: string
        }
        Returns: Json
      }
      realtime_topic_org_id: { Args: { _topic: string }; Returns: string }
      realtime_topic_uuid_suffix: { Args: { _topic: string }; Returns: string }
      redeem_invite_code: {
        Args: { _code: string; _user_id: string }
        Returns: Json
      }
      redeem_oap_transfer_token: {
        Args: { _redeeming_org_id: string; _token: string }
        Returns: {
          approved_operations: string[]
          cert_id: string
          credential_id: string
          expires_at: string
          issued_at: string
          issuing_organization_name: string
          machine_tags: string[]
          operator_user_id: string
          role_program_name: string
          status: string
        }[]
      }
      reject_ncr: {
        Args: { _ncr_id: string; _reason: string; _rejector_id: string }
        Returns: undefined
      }
      reorder_queue_item: {
        Args: {
          _item_id: string
          _new_position: number
          _org_id?: string
          _team_id?: string
        }
        Returns: undefined
      }
      report_issue: {
        Args: {
          _console_logs?: Json
          _description?: string
          _error_message?: string
          _error_stack?: string
          _metadata?: Json
          _page_url?: string
          _severity?: Database["public"]["Enums"]["issue_severity"]
          _title: string
        }
        Returns: string
      }
      users_are_connected: {
        Args: { _a: string; _b: string; _org_id: string }
        Returns: boolean
      }
      validate_display_token: { Args: { _token: string }; Returns: Json }
      validate_invite_code: { Args: { _code: string }; Returns: Json }
      verify_gca_certificate: {
        Args: { p_cert_id: string }
        Returns: {
          cert_id: string
          issued_at: string
          program_name: string
          recipient_name: string
          recipient_username: string
          signed_by_name: string
          signed_by_signature_url: string
          signed_by_title: string
          status: string
          valid_from: string
          valid_until: string
        }[]
      }
      verify_gca_certificate_by_qr: {
        Args: { p_qr_token: string }
        Returns: {
          cert_id: string
          issued_at: string
          program_name: string
          recipient_name: string
          recipient_username: string
          signed_by_name: string
          signed_by_signature_url: string
          signed_by_title: string
          status: string
          valid_from: string
          valid_until: string
        }[]
      }
      verify_oap_certificate: {
        Args: { p_cert_id: string }
        Returns: {
          cert_id: string
          issued_at: string
          organization_id: string
          organization_name: string
          program_name: string
          recipient_name: string
          recipient_username: string
          signed_by_name: string
          signed_by_signature_url: string
          signed_by_title: string
          status: string
          valid_from: string
          valid_until: string
          vertical: string
        }[]
      }
      verify_oap_certificate_by_qr: {
        Args: { p_qr_token: string }
        Returns: {
          cert_id: string
          issued_at: string
          organization_id: string
          organization_name: string
          program_name: string
          recipient_name: string
          recipient_username: string
          signed_by_name: string
          signed_by_signature_url: string
          signed_by_title: string
          status: string
          valid_from: string
          valid_until: string
          vertical: string
        }[]
      }
    }
    Enums: {
      activity_type:
        | "login"
        | "logout"
        | "signup"
        | "handoff_created"
        | "handoff_updated"
        | "station_created"
        | "station_updated"
        | "station_deleted"
        | "team_created"
        | "team_updated"
        | "team_deleted"
        | "user_role_changed"
        | "team_member_added"
        | "team_member_removed"
        | "profile_updated"
        | "ncr_created"
        | "ncr_approved"
        | "ncr_rejected"
        | "quantity_override"
        | "rework_wo_created"
        | "work_order_quantity_adjusted"
      app_role:
        | "admin"
        | "operator"
        | "supervisor"
        | "viewer"
        | "developer"
        | "engineering"
        | "programming"
        | "flyer_worker"
      impact_level: "low" | "medium" | "high" | "critical"
      inspection_profession_tag:
        | "machinist"
        | "qc_inspector"
        | "welder"
        | "fabricator"
        | "assembler"
        | "op_lead"
        | "programmer"
        | "toolmaker"
        | "grinder"
        | "edm_operator"
        | "cmm_operator"
        | "maintenance"
      inspection_role_tag:
        | "operator"
        | "supervisor"
        | "qc"
        | "mentor"
        | "trainee"
        | "admin"
      issue_severity: "low" | "medium" | "high" | "critical"
      issue_status:
        | "open"
        | "investigating"
        | "in_progress"
        | "resolved"
        | "closed"
        | "wont_fix"
      oap_checkoff_result: "pass" | "needs_practice" | "fail"
      oap_vertical:
        | "machining"
        | "cabinetry"
        | "automotive"
        | "welding"
        | "construction"
        | "electrical"
        | "plumbing"
        | "hvac"
        | "general"
      operator_profile_visibility: "private" | "employers_only" | "public"
      organization_kind: "manufacturer" | "employer" | "both"
      queue_item_type:
        | "work_order"
        | "station_task"
        | "team_task"
        | "support_ticket"
        | "quote"
      queue_priority: "low" | "normal" | "high" | "urgent" | "critical"
      queue_status:
        | "pending"
        | "queued"
        | "in_progress"
        | "on_hold"
        | "completed"
        | "cancelled"
      team_role: "owner" | "admin" | "member"
      training_media_entity:
        | "inspection_tool"
        | "inspection_tool_category"
        | "oap_lesson"
        | "oap_course"
        | "oap_quiz_question"
        | "oap_walkthrough_item"
        | "oap_walkthrough_section"
        | "gca_question"
        | "gca_question_bank"
        | "machining_operation"
        | "machining_operation_category"
        | "oap_certificate"
        | "gca_certificate"
      training_media_program: "gca" | "oap" | "both"
      training_media_type: "image" | "video" | "audio"
      training_media_visibility: "public" | "private"
      update_category:
        | "feature"
        | "improvement"
        | "bug_fix"
        | "system_notice"
        | "security"
        | "maintenance"
      update_status:
        | "live"
        | "scheduled"
        | "investigating"
        | "resolved"
        | "deprecated"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      activity_type: [
        "login",
        "logout",
        "signup",
        "handoff_created",
        "handoff_updated",
        "station_created",
        "station_updated",
        "station_deleted",
        "team_created",
        "team_updated",
        "team_deleted",
        "user_role_changed",
        "team_member_added",
        "team_member_removed",
        "profile_updated",
        "ncr_created",
        "ncr_approved",
        "ncr_rejected",
        "quantity_override",
        "rework_wo_created",
        "work_order_quantity_adjusted",
      ],
      app_role: [
        "admin",
        "operator",
        "supervisor",
        "viewer",
        "developer",
        "engineering",
        "programming",
        "flyer_worker",
      ],
      impact_level: ["low", "medium", "high", "critical"],
      inspection_profession_tag: [
        "machinist",
        "qc_inspector",
        "welder",
        "fabricator",
        "assembler",
        "op_lead",
        "programmer",
        "toolmaker",
        "grinder",
        "edm_operator",
        "cmm_operator",
        "maintenance",
      ],
      inspection_role_tag: [
        "operator",
        "supervisor",
        "qc",
        "mentor",
        "trainee",
        "admin",
      ],
      issue_severity: ["low", "medium", "high", "critical"],
      issue_status: [
        "open",
        "investigating",
        "in_progress",
        "resolved",
        "closed",
        "wont_fix",
      ],
      oap_checkoff_result: ["pass", "needs_practice", "fail"],
      oap_vertical: [
        "machining",
        "cabinetry",
        "automotive",
        "welding",
        "construction",
        "electrical",
        "plumbing",
        "hvac",
        "general",
      ],
      operator_profile_visibility: ["private", "employers_only", "public"],
      organization_kind: ["manufacturer", "employer", "both"],
      queue_item_type: [
        "work_order",
        "station_task",
        "team_task",
        "support_ticket",
        "quote",
      ],
      queue_priority: ["low", "normal", "high", "urgent", "critical"],
      queue_status: [
        "pending",
        "queued",
        "in_progress",
        "on_hold",
        "completed",
        "cancelled",
      ],
      team_role: ["owner", "admin", "member"],
      training_media_entity: [
        "inspection_tool",
        "inspection_tool_category",
        "oap_lesson",
        "oap_course",
        "oap_quiz_question",
        "oap_walkthrough_item",
        "oap_walkthrough_section",
        "gca_question",
        "gca_question_bank",
        "machining_operation",
        "machining_operation_category",
        "oap_certificate",
        "gca_certificate",
      ],
      training_media_program: ["gca", "oap", "both"],
      training_media_type: ["image", "video", "audio"],
      training_media_visibility: ["public", "private"],
      update_category: [
        "feature",
        "improvement",
        "bug_fix",
        "system_notice",
        "security",
        "maintenance",
      ],
      update_status: [
        "live",
        "scheduled",
        "investigating",
        "resolved",
        "deprecated",
      ],
    },
  },
} as const
