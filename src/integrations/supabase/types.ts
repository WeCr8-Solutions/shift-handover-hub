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
            foreignKeyName: "app_settings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
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
        ]
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
            foreignKeyName: "operator_station_sessions_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
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
        ]
      }
      organizations: {
        Row: {
          billing_email: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          logo_url: string | null
          mfa_required: boolean
          name: string
          requires_us_person_declaration: boolean
          slug: string
          stripe_customer_id: string | null
          subscription_status: string | null
          subscription_tier: string | null
          trial_ends_at: string
          updated_at: string
        }
        Insert: {
          billing_email?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          logo_url?: string | null
          mfa_required?: boolean
          name: string
          requires_us_person_declaration?: boolean
          slug: string
          stripe_customer_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          trial_ends_at?: string
          updated_at?: string
        }
        Update: {
          billing_email?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          mfa_required?: boolean
          name?: string
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
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          email: string
          id: string
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
          completed_at: string | null
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
          id: string
          is_rework: boolean | null
          item_type: Database["public"]["Enums"]["queue_item_type"]
          material_type: string | null
          metadata: Json | null
          operation_number: string | null
          organization_id: string
          parent_work_order_id: string | null
          part_catalog_id: string | null
          part_height_inches: number | null
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
          completed_at?: string | null
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
          id?: string
          is_rework?: boolean | null
          item_type?: Database["public"]["Enums"]["queue_item_type"]
          material_type?: string | null
          metadata?: Json | null
          operation_number?: string | null
          organization_id: string
          parent_work_order_id?: string | null
          part_catalog_id?: string | null
          part_height_inches?: number | null
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
          completed_at?: string | null
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
          id?: string
          is_rework?: boolean | null
          item_type?: Database["public"]["Enums"]["queue_item_type"]
          material_type?: string | null
          metadata?: Json | null
          operation_number?: string | null
          organization_id?: string
          parent_work_order_id?: string | null
          part_catalog_id?: string | null
          part_height_inches?: number | null
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
            foreignKeyName: "queue_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
            foreignKeyName: "saved_views_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
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
            foreignKeyName: "shift_schedules_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
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
        ]
      }
      work_order_routing: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string
          cycle_time_minutes: number | null
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
          user_display_name?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
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
        ]
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
        ]
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
      get_user_org_id: { Args: { _user_id: string }; Returns: string }
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
      app_role: "admin" | "operator" | "supervisor" | "viewer" | "developer"
      impact_level: "low" | "medium" | "high" | "critical"
      issue_severity: "low" | "medium" | "high" | "critical"
      issue_status:
        | "open"
        | "investigating"
        | "in_progress"
        | "resolved"
        | "closed"
        | "wont_fix"
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
      app_role: ["admin", "operator", "supervisor", "viewer", "developer"],
      impact_level: ["low", "medium", "high", "critical"],
      issue_severity: ["low", "medium", "high", "critical"],
      issue_status: [
        "open",
        "investigating",
        "in_progress",
        "resolved",
        "closed",
        "wont_fix",
      ],
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
