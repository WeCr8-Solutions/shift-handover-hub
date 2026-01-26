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
      job_performance_updates: {
        Row: {
          affects_cycle_time: boolean | null
          affects_quality: boolean | null
          affects_safety: boolean | null
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
      stations: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          station_id: string
          team_id: string | null
          updated_at: string
          work_center: string
          work_center_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          station_id: string
          team_id?: string | null
          updated_at?: string
          work_center: string
          work_center_type: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          station_id?: string
          team_id?: string | null
          updated_at?: string
          work_center?: string
          work_center_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "stations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
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
        ]
      }
      teams: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
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
      app_role: "admin" | "operator" | "supervisor" | "viewer"
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
      app_role: ["admin", "operator", "supervisor", "viewer"],
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
