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
      alerts: {
        Row: {
          acknowledged: boolean
          booking_ref: string | null
          code: string
          container_ref: string | null
          created_at: string
          id: string
          occurred_at: string
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
          status_text?: string
          tag?: string
          tone?: Database["public"]["Enums"]["alert_tone"]
        }
        Relationships: []
      }
      carriers: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          scac: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          scac: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          scac?: string
        }
        Relationships: []
      }
      containers: {
        Row: {
          alert: string | null
          booking_id: string
          buyer: string
          container_id: string
          created_at: string
          cutoff: string
          destination: string
          eta: string
          eta_delayed: boolean
          facility: string
          logistics_status: Database["public"]["Enums"]["logistics_status"]
          lots: string[]
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
          container_id: string
          created_at?: string
          cutoff: string
          destination: string
          eta: string
          eta_delayed?: boolean
          facility: string
          logistics_status?: Database["public"]["Enums"]["logistics_status"]
          lots?: string[]
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
          container_id?: string
          created_at?: string
          cutoff?: string
          destination?: string
          eta?: string
          eta_delayed?: boolean
          facility?: string
          logistics_status?: Database["public"]["Enums"]["logistics_status"]
          lots?: string[]
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
        Relationships: []
      }
      documents: {
        Row: {
          booking_id: string
          created_at: string
          doc_type: Database["public"]["Enums"]["doc_type"]
          file_url: string | null
          id: string
          notes: string | null
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
          status?: Database["public"]["Enums"]["doc_status"]
          updated_at?: string
        }
        Relationships: []
      }
      logistics_events: {
        Row: {
          container_id: string
          created_at: string
          id: string
          notes: string | null
          occurred_at: string
          status: Database["public"]["Enums"]["logistics_status"]
        }
        Insert: {
          container_id: string
          created_at?: string
          id?: string
          notes?: string | null
          occurred_at?: string
          status: Database["public"]["Enums"]["logistics_status"]
        }
        Update: {
          container_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          occurred_at?: string
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
      alert_tone: "danger" | "warning" | "info"
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
