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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          description: string
          earned_at: string
          id: number
          title: string
          user_id: string
        }
        Insert: {
          description: string
          earned_at?: string
          id?: number
          title: string
          user_id: string
        }
        Update: {
          description?: string
          earned_at?: string
          id?: number
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      agent_logs: {
        Row: {
          ai_action: string
          created_at: string
          id: number
          summary: string
          user_id: string
        }
        Insert: {
          ai_action: string
          created_at?: string
          id?: number
          summary: string
          user_id: string
        }
        Update: {
          ai_action?: string
          created_at?: string
          id?: number
          summary?: string
          user_id?: string
        }
        Relationships: []
      }
      bills: {
        Row: {
          ai_summary: string | null
          created_at: string
          energy_usage: number
          id: string
          month: string
          predicted_next_bill: number | null
          predicted_saving_percent: number | null
          total_amount: number
          uploaded_file: string | null
          user_id: string
          water_usage: number
        }
        Insert: {
          ai_summary?: string | null
          created_at?: string
          energy_usage?: number
          id?: string
          month: string
          predicted_next_bill?: number | null
          predicted_saving_percent?: number | null
          total_amount?: number
          uploaded_file?: string | null
          user_id: string
          water_usage?: number
        }
        Update: {
          ai_summary?: string | null
          created_at?: string
          energy_usage?: number
          id?: string
          month?: string
          predicted_next_bill?: number | null
          predicted_saving_percent?: number | null
          total_amount?: number
          uploaded_file?: string | null
          user_id?: string
          water_usage?: number
        }
        Relationships: [
          {
            foreignKeyName: "bills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          created_at: string
          description: string
          end_date: string
          id: number
          is_active: boolean
          reward_points: number
          start_date: string
          title: string
        }
        Insert: {
          created_at?: string
          description: string
          end_date: string
          id?: number
          is_active?: boolean
          reward_points?: number
          start_date?: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          end_date?: string
          id?: number
          is_active?: boolean
          reward_points?: number
          start_date?: string
          title?: string
        }
        Relationships: []
      }
      eco_points: {
        Row: {
          badge_level: string
          id: number
          points: number
          streak_days: number
          updated_at: string
          user_id: string
        }
        Insert: {
          badge_level?: string
          id?: number
          points?: number
          streak_days?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          badge_level?: string
          id?: number
          points?: number
          streak_days?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      forecasts: {
        Row: {
          created_at: string
          id: number
          period_end: string
          period_start: string
          predicted_co2_kg: number
          predicted_energy_kwh: number
          predicted_water_liters: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          period_end: string
          period_start: string
          predicted_co2_kg?: number
          predicted_energy_kwh?: number
          predicted_water_liters?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          period_end?: string
          period_start?: string
          predicted_co2_kg?: number
          predicted_energy_kwh?: number
          predicted_water_liters?: number
          user_id?: string
        }
        Relationships: []
      }
      global_impact: {
        Row: {
          id: number
          last_updated: string
          total_co2_saved: number
          total_users: number
        }
        Insert: {
          id?: number
          last_updated?: string
          total_co2_saved?: number
          total_users?: number
        }
        Update: {
          id?: number
          last_updated?: string
          total_co2_saved?: number
          total_users?: number
        }
        Relationships: []
      }
      goals: {
        Row: {
          created_at: string
          id: string
          target_energy_saving: number
          target_water_saving: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          target_energy_saving?: number
          target_water_saving?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          target_energy_saving?: number
          target_water_saving?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      metrics: {
        Row: {
          co2_emission: number
          energy_usage: number
          id: string
          timestamp: string
          user_id: string
          water_usage: number
        }
        Insert: {
          co2_emission?: number
          energy_usage?: number
          id?: string
          timestamp?: string
          user_id: string
          water_usage?: number
        }
        Update: {
          co2_emission?: number
          energy_usage?: number
          id?: string
          timestamp?: string
          user_id?: string
          water_usage?: number
        }
        Relationships: [
          {
            foreignKeyName: "metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          eco_score: number | null
          email: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          eco_score?: number | null
          email: string
          id: string
          name: string
        }
        Update: {
          created_at?: string
          eco_score?: number | null
          email?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          ai_insight: string
          created_at: string
          id: string
          predicted_saving: number
          user_id: string
        }
        Insert: {
          ai_insight: string
          created_at?: string
          id?: string
          predicted_saving?: number
          user_id: string
        }
        Update: {
          ai_insight?: string
          created_at?: string
          id?: string
          predicted_saving?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      streaks: {
        Row: {
          best_streak: number
          created_at: string
          current_streak: number
          id: number
          last_active_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          best_streak?: number
          created_at?: string
          current_streak?: number
          id?: number
          last_active_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          best_streak?: number
          created_at?: string
          current_streak?: number
          id?: number
          last_active_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          id: number
          joined_at: string
          role: string
          team_id: number
          user_id: string
        }
        Insert: {
          id?: number
          joined_at?: string
          role?: string
          team_id: number
          user_id: string
        }
        Update: {
          id?: number
          joined_at?: string
          role?: string
          team_id?: number
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
          created_by: string
          description: string | null
          id: number
          team_name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: number
          team_name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: number
          team_name?: string
        }
        Relationships: []
      }
      user_feedback: {
        Row: {
          created_at: string
          feedback_type: string
          id: number
          report_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback_type: string
          id?: number
          report_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          feedback_type?: string
          id?: number
          report_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_feedback_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
