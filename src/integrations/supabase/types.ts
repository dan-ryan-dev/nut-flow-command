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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      alert_rules: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string
          name: string
          org_id: string | null
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          id?: string
          name: string
          org_id?: string | null
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          name?: string
          org_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alert_rules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          acknowledged: boolean
          booking_ref: string | null
          code: string
          container_ref: string | null
          created_at: string
          id: string
          occurred_at: string
          org_id: string | null
          status_text: string
          tag: string
          tone: Database["public"]["Enums"]["alert_tone"]
        }
        Insert: {
          acknowledged?: boolean
          booking_ref?: string | null
          code: string
          container_ref?: string | null
          created_at?: string
          id?: string
          occurred_at?: string
          org_id?: string | null
          status_text: string
          tag: string
          tone?: Database["public"]["Enums"]["alert_tone"]
        }
        Update: {
          acknowledged?: boolean
          booking_ref?: string | null
          code?: string
          container_ref?: string | null
          created_at?: string
          id?: string
          occurred_at?: string
          org_id?: string | null
          status_text?: string
          tag?: string
          tone?: Database["public"]["Enums"]["alert_tone"]
        }
        Relationships: [
          {
            foreignKeyName: "alerts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      buyers: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string
          name: string
          org_id: string | null
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          id?: string
          name: string
          org_id?: string | null
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          name?: string
          org_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "buyers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      carriers: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          org_id: string | null
          scac: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          org_id?: string | null
          scac: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          org_id?: string | null
          scac?: string
        }
        Relationships: [
          {
            foreignKeyName: "carriers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      containers: {
        Row: {
          alert: string | null
          booking_id: string
          buyer: string
          carrier_last_synced_at: string | null
          container_id: string
          created_at: string
          cutoff: string
          destination: string
          erd: string | null
          eta: string
          eta_delayed: boolean
          facility: string
          logistics_status: Database["public"]["Enums"]["logistics_status"]
          lots: string[]
          lrd: string | null
          org_id: string | null
          phyto_complete: boolean
          pod: string
          pol: string
          product: string
          shipment_week: string
          status: Database["public"]["Enums"]["container_status"]
          updated_at: string
          vessel: string
          voyage: string
          weight_kg: number
        }
        Insert: {
          alert?: string | null
          booking_id: string
          buyer: string
          carrier_last_synced_at?: string | null
          container_id: string
          created_at?: string
          cutoff: string
          destination: string
          erd?: string | null
          eta: string
          eta_delayed?: boolean
          facility: string
          logistics_status?: Database["public"]["Enums"]["logistics_status"]
          lots?: string[]
          lrd?: string | null
          org_id?: string | null
          phyto_complete?: boolean
          pod: string
          pol: string
          product: string
          shipment_week: string
          status?: Database["public"]["Enums"]["container_status"]
          updated_at?: string
          vessel: string
          voyage: string
          weight_kg: number
        }
        Update: {
          alert?: string | null
          booking_id?: string
          buyer?: string
          carrier_last_synced_at?: string | null
          container_id?: string
          created_at?: string
          cutoff?: string
          destination?: string
          erd?: string | null
          eta?: string
          eta_delayed?: boolean
          facility?: string
          logistics_status?: Database["public"]["Enums"]["logistics_status"]
          lots?: string[]
          lrd?: string | null
          org_id?: string | null
          phyto_complete?: boolean
          pod?: string
          pol?: string
          product?: string
          shipment_week?: string
          status?: Database["public"]["Enums"]["container_status"]
          updated_at?: string
          vessel?: string
          voyage?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "containers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_briefings: {
        Row: {
          briefing_date: string
          cards: Json
          generated_at: string
          id: string
          org_id: string | null
        }
        Insert: {
          briefing_date: string
          cards?: Json
          generated_at?: string
          id?: string
          org_id?: string | null
        }
        Update: {
          briefing_date?: string
          cards?: Json
          generated_at?: string
          id?: string
          org_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_briefings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          booking_id: string
          created_at: string
          doc_type: Database["public"]["Enums"]["doc_type"]
          file_url: string | null
          id: string
          notes: string | null
          org_id: string | null
          status: Database["public"]["Enums"]["doc_status"]
          updated_at: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          doc_type: Database["public"]["Enums"]["doc_type"]
          file_url?: string | null
          id?: string
          notes?: string | null
          org_id?: string | null
          status?: Database["public"]["Enums"]["doc_status"]
          updated_at?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          doc_type?: Database["public"]["Enums"]["doc_type"]
          file_url?: string | null
          id?: string
          notes?: string | null
          org_id?: string | null
          status?: Database["public"]["Enums"]["doc_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      drayage_carriers: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string
          name: string
          org_id: string | null
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          id?: string
          name: string
          org_id?: string | null
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          name?: string
          org_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drayage_carriers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      intake_metrics: {
        Row: {
          accuracy_pct: number
          booking_id: string
          created_at: string
          duration_ms: number
          fields_extracted: number
          id: string
          org_id: string | null
          pdf_filename: string | null
        }
        Insert: {
          accuracy_pct: number
          booking_id: string
          created_at?: string
          duration_ms: number
          fields_extracted: number
          id?: string
          org_id?: string | null
          pdf_filename?: string | null
        }
        Update: {
          accuracy_pct?: number
          booking_id?: string
          created_at?: string
          duration_ms?: number
          fields_extracted?: number
          id?: string
          org_id?: string | null
          pdf_filename?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "intake_metrics_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_snapshots: {
        Row: {
          action_count: number
          containers_count: number
          demurrage_usd: number
          id: string
          logged_realtime: number
          org_id: string | null
          shipment_week: string
          taken_at: string
        }
        Insert: {
          action_count?: number
          containers_count?: number
          demurrage_usd?: number
          id?: string
          logged_realtime?: number
          org_id?: string | null
          shipment_week: string
          taken_at?: string
        }
        Update: {
          action_count?: number
          containers_count?: number
          demurrage_usd?: number
          id?: string
          logged_realtime?: number
          org_id?: string | null
          shipment_week?: string
          taken_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kpi_snapshots_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      labs: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string
          name: string
          org_id: string | null
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          id?: string
          name: string
          org_id?: string | null
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          name?: string
          org_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "labs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      logistics_events: {
        Row: {
          container_id: string
          created_at: string
          id: string
          notes: string | null
          occurred_at: string
          org_id: string | null
          status: Database["public"]["Enums"]["logistics_status"]
        }
        Insert: {
          container_id: string
          created_at?: string
          id?: string
          notes?: string | null
          occurred_at?: string
          org_id?: string | null
          status: Database["public"]["Enums"]["logistics_status"]
        }
        Update: {
          container_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          occurred_at?: string
          org_id?: string | null
          status?: Database["public"]["Enums"]["logistics_status"]
        }
        Relationships: [
          {
            foreignKeyName: "logistics_events_container_id_fkey"
            columns: ["container_id"]
            isOneToOne: false
            referencedRelation: "containers"
            referencedColumns: ["container_id"]
          },
          {
            foreignKeyName: "logistics_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      pack_types: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string
          name: string
          org_id: string | null
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          id?: string
          name: string
          org_id?: string | null
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          name?: string
          org_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pack_types_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_terms: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string
          name: string
          org_id: string | null
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          id?: string
          name: string
          org_id?: string | null
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          name?: string
          org_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_terms_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ports: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          unlocode: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          unlocode: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          unlocode?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string
          name: string
          org_id: string | null
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          id?: string
          name: string
          org_id?: string | null
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          name?: string
          org_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          org_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          org_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          org_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      terminals: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string
          name: string
          org_id: string | null
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          id?: string
          name: string
          org_id?: string | null
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          name?: string
          org_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "terminals_org_id_fkey"
            columns: ["org_id"]
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
          org_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      vessels: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string
          name: string
          org_id: string | null
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          id?: string
          name: string
          org_id?: string | null
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          name?: string
          org_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vessels_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _org_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_anywhere: { Args: { _user_id: string }; Returns: boolean }
      is_any_org_member: { Args: { _user_id: string }; Returns: boolean }
      is_coord_or_admin: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      shares_org: { Args: { _a: string; _b: string }; Returns: boolean }
    }
    Enums: {
      alert_tone: "danger" | "warning" | "info"
      app_role: "admin" | "coordinator" | "viewer"
      container_status:
        | "action"
        | "in-transit"
        | "at-port"
        | "delivered"
        | "draft"
      doc_status: "attached" | "draft" | "missing"
      doc_type: "phyto" | "bol" | "commercial-invoice" | "packing-list"
      logistics_status:
        | "pending-load"
        | "origin-received"
        | "gated-in"
        | "loaded-vessel"
        | "arrived-discharge"
        | "closed"
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
      alert_tone: ["danger", "warning", "info"],
      app_role: ["admin", "coordinator", "viewer"],
      container_status: [
        "action",
        "in-transit",
        "at-port",
        "delivered",
        "draft",
      ],
      doc_status: ["attached", "draft", "missing"],
      doc_type: ["phyto", "bol", "commercial-invoice", "packing-list"],
      logistics_status: [
        "pending-load",
        "origin-received",
        "gated-in",
        "loaded-vessel",
        "arrived-discharge",
        "closed",
      ],
    },
  },
} as const
