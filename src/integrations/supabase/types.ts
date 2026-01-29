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
      activity_logs: {
        Row: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at: string
          description: string
          id: string
          ip_address: string | null
          metadata: Json | null
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
          user_display_name?: string | null
          user_email?: string | null
          user_id?: string
        }
        Relationships: []
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
            foreignKeyName: "current_station_status_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: true
            referencedRelation: "stations"
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
      departments: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          team_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          team_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
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
          name: string
          slug: string
          stripe_customer_id: string | null
          subscription_status: string | null
          subscription_tier: string | null
          updated_at: string
        }
        Insert: {
          billing_email?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          stripe_customer_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string
        }
        Update: {
          billing_email?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          stripe_customer_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string
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
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          email: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          email?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      queue_item_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          queue_item_id: string
          user_id: string
          user_name: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          queue_item_id: string
          user_id: string
          user_name: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          queue_item_id?: string
          user_id?: string
          user_name?: string
        }
        Relationships: [
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
          queue_item_id?: string
          user_id?: string
          user_name?: string
        }
        Relationships: [
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
          description: string | null
          due_date: string | null
          estimated_duration: number | null
          id: string
          item_type: Database["public"]["Enums"]["queue_item_type"]
          metadata: Json | null
          operation_number: string | null
          organization_id: string | null
          part_number: string | null
          position: number
          priority: Database["public"]["Enums"]["queue_priority"]
          quantity: number | null
          scheduled_end: string | null
          scheduled_start: string | null
          started_at: string | null
          station_id: string | null
          status: Database["public"]["Enums"]["queue_status"]
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
          description?: string | null
          due_date?: string | null
          estimated_duration?: number | null
          id?: string
          item_type?: Database["public"]["Enums"]["queue_item_type"]
          metadata?: Json | null
          operation_number?: string | null
          organization_id?: string | null
          part_number?: string | null
          position?: number
          priority?: Database["public"]["Enums"]["queue_priority"]
          quantity?: number | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          started_at?: string | null
          station_id?: string | null
          status?: Database["public"]["Enums"]["queue_status"]
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
          description?: string | null
          due_date?: string | null
          estimated_duration?: number | null
          id?: string
          item_type?: Database["public"]["Enums"]["queue_item_type"]
          metadata?: Json | null
          operation_number?: string | null
          organization_id?: string | null
          part_number?: string | null
          position?: number
          priority?: Database["public"]["Enums"]["queue_priority"]
          quantity?: number | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          started_at?: string | null
          station_id?: string | null
          status?: Database["public"]["Enums"]["queue_status"]
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
      routing_template_steps: {
        Row: {
          estimated_duration: number | null
          id: string
          instructions: string | null
          operation_name: string
          operation_type: string
          step_number: number
          template_id: string
          work_center_type: string | null
        }
        Insert: {
          estimated_duration?: number | null
          id?: string
          instructions?: string | null
          operation_name: string
          operation_type?: string
          step_number: number
          template_id: string
          work_center_type?: string | null
        }
        Update: {
          estimated_duration?: number | null
          id?: string
          instructions?: string | null
          operation_name?: string
          operation_type?: string
          step_number?: number
          template_id?: string
          work_center_type?: string | null
        }
        Relationships: [
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
      stations: {
        Row: {
          created_at: string
          department_id: string | null
          id: string
          is_active: boolean
          name: string
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
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
          role: Database["public"]["Enums"]["team_role"]
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["team_role"]
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
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
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string | null
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
          id: string
          is_complete: boolean | null
          started_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_steps?: string[] | null
          created_at?: string | null
          current_step?: string | null
          id?: string
          is_complete?: boolean | null
          started_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_steps?: string[] | null
          created_at?: string | null
          current_step?: string | null
          id?: string
          is_complete?: boolean | null
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
      webhook_deliveries: {
        Row: {
          attempt_count: number | null
          created_at: string | null
          delivered_at: string | null
          event_type: string
          id: string
          next_retry_at: string | null
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
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          status?: string | null
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "organization_webhooks"
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
          estimated_duration: number | null
          expected_return_date: string | null
          id: string
          notes: string | null
          operation_name: string
          operation_type: string
          outside_vendor: string | null
          po_number: string | null
          queue_item_id: string
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
          estimated_duration?: number | null
          expected_return_date?: string | null
          id?: string
          notes?: string | null
          operation_name: string
          operation_type?: string
          outside_vendor?: string | null
          po_number?: string | null
          queue_item_id: string
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
          estimated_duration?: number | null
          expected_return_date?: string | null
          id?: string
          notes?: string | null
          operation_name?: string
          operation_type?: string
          outside_vendor?: string | null
          po_number?: string | null
          queue_item_id?: string
          started_at?: string | null
          station_id?: string | null
          status?: string
          step_number?: number
          updated_at?: string
        }
        Relationships: [
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
      increment_usage: {
        Args: { _count?: number; _metric: string; _org_id: string }
        Returns: undefined
      }
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
      is_org_assignable_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
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
      app_role: "admin" | "operator" | "supervisor" | "viewer" | "developer"
      queue_item_type:
        | "work_order"
        | "station_task"
        | "team_task"
        | "support_ticket"
      queue_priority: "low" | "normal" | "high" | "urgent" | "critical"
      queue_status:
        | "pending"
        | "queued"
        | "in_progress"
        | "on_hold"
        | "completed"
        | "cancelled"
      team_role: "owner" | "admin" | "member"
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
      ],
      app_role: ["admin", "operator", "supervisor", "viewer", "developer"],
      queue_item_type: [
        "work_order",
        "station_task",
        "team_task",
        "support_ticket",
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
    },
  },
} as const
