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
      appointments: {
        Row: {
          buyer_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_time: string | null
          id: string
          location: string | null
          seller_lead_id: string | null
          start_time: string
          status: string | null
          title: string
          type: Database["public"]["Enums"]["appointment_type"] | null
          updated_at: string
        }
        Insert: {
          buyer_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          location?: string | null
          seller_lead_id?: string | null
          start_time: string
          status?: string | null
          title: string
          type?: Database["public"]["Enums"]["appointment_type"] | null
          updated_at?: string
        }
        Update: {
          buyer_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          location?: string | null
          seller_lead_id?: string | null
          start_time?: string
          status?: string | null
          title?: string
          type?: Database["public"]["Enums"]["appointment_type"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "buyers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_seller_lead_id_fkey"
            columns: ["seller_lead_id"]
            isOneToOne: false
            referencedRelation: "seller_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      buyers: {
        Row: {
          created_at: string
          created_by: string | null
          credit_score: number | null
          email: string | null
          home_types: Database["public"]["Enums"]["home_type"][] | null
          id: string
          locations: string[] | null
          max_price: number | null
          min_price: number | null
          name: string
          notes: string | null
          phone: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          credit_score?: number | null
          email?: string | null
          home_types?: Database["public"]["Enums"]["home_type"][] | null
          id?: string
          locations?: string[] | null
          max_price?: number | null
          min_price?: number | null
          name: string
          notes?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          credit_score?: number | null
          email?: string | null
          home_types?: Database["public"]["Enums"]["home_type"][] | null
          id?: string
          locations?: string[] | null
          max_price?: number | null
          min_price?: number | null
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["expense_category"] | null
          created_at: string
          created_by: string | null
          description: string
          expense_date: string | null
          id: string
          receipt_url: string | null
          seller_lead_id: string | null
        }
        Insert: {
          amount: number
          category?: Database["public"]["Enums"]["expense_category"] | null
          created_at?: string
          created_by?: string | null
          description: string
          expense_date?: string | null
          id?: string
          receipt_url?: string | null
          seller_lead_id?: string | null
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["expense_category"] | null
          created_at?: string
          created_by?: string | null
          description?: string
          expense_date?: string | null
          id?: string
          receipt_url?: string | null
          seller_lead_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_seller_lead_id_fkey"
            columns: ["seller_lead_id"]
            isOneToOne: false
            referencedRelation: "seller_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_timeline: {
        Row: {
          action: string
          created_at: string
          id: string
          seller_lead_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          seller_lead_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          seller_lead_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_timeline_seller_lead_id_fkey"
            columns: ["seller_lead_id"]
            isOneToOne: false
            referencedRelation: "seller_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      seller_leads: {
        Row: {
          address: string
          asking_price: number
          city: string | null
          condition: number | null
          created_at: string
          created_by: string | null
          email: string | null
          estimated_value: number | null
          home_type: Database["public"]["Enums"]["home_type"] | null
          id: string
          length_ft: number | null
          lot_rent: number | null
          name: string
          notes: string | null
          owed_amount: number | null
          park_owned: boolean | null
          phone: string | null
          state: string | null
          status: Database["public"]["Enums"]["lead_status"] | null
          target_offer: number | null
          updated_at: string
          width_ft: number | null
          year_built: number | null
          zip: string | null
        }
        Insert: {
          address: string
          asking_price: number
          city?: string | null
          condition?: number | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          estimated_value?: number | null
          home_type?: Database["public"]["Enums"]["home_type"] | null
          id?: string
          length_ft?: number | null
          lot_rent?: number | null
          name: string
          notes?: string | null
          owed_amount?: number | null
          park_owned?: boolean | null
          phone?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          target_offer?: number | null
          updated_at?: string
          width_ft?: number | null
          year_built?: number | null
          zip?: string | null
        }
        Update: {
          address?: string
          asking_price?: number
          city?: string | null
          condition?: number | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          estimated_value?: number | null
          home_type?: Database["public"]["Enums"]["home_type"] | null
          id?: string
          length_ft?: number | null
          lot_rent?: number | null
          name?: string
          notes?: string | null
          owed_amount?: number | null
          park_owned?: boolean | null
          phone?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          target_offer?: number | null
          updated_at?: string
          width_ft?: number | null
          year_built?: number | null
          zip?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      is_admin_or_agent: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "agent" | "viewer"
      appointment_type: "call" | "meeting" | "property_viewing" | "closing"
      expense_category:
        | "marketing"
        | "travel"
        | "repairs"
        | "legal"
        | "closing"
        | "other"
      home_type: "single" | "double" | "triple"
      lead_status:
        | "new"
        | "contacted"
        | "offer_made"
        | "under_contract"
        | "closed"
        | "lost"
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
      app_role: ["admin", "agent", "viewer"],
      appointment_type: ["call", "meeting", "property_viewing", "closing"],
      expense_category: [
        "marketing",
        "travel",
        "repairs",
        "legal",
        "closing",
        "other",
      ],
      home_type: ["single", "double", "triple"],
      lead_status: [
        "new",
        "contacted",
        "offer_made",
        "under_contract",
        "closed",
        "lost",
      ],
    },
  },
} as const
