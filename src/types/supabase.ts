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
      appointments: {
        Row: {
          created_at: string | null
          end_time: string
          id: string
          salon_id: string | null
          service_id: string | null
          start_time: string
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          end_time: string
          id?: string
          salon_id?: string | null
          service_id?: string | null
          start_time: string
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          end_time?: string
          id?: string
          salon_id?: string | null
          service_id?: string | null
          start_time?: string
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          date: string | null
          description: string
          id: string
          salon_id: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          date?: string | null
          description: string
          id?: string
          salon_id?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          date?: string | null
          description?: string
          id?: string
          salon_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_transactions: {
        Row: {
          amount: number
          client_name: string | null
          client_phone: string | null
          created_at: string | null
          description: string | null
          id: string
          payment_method: string | null
          professional_commission: number | null
          professional_id: string | null
          salon_id: string | null
          slot_id: string | null
          transaction_type: string
          type: string | null
        }
        Insert: {
          amount: number
          client_name?: string | null
          client_phone?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          payment_method?: string | null
          professional_commission?: number | null
          professional_id?: string | null
          salon_id?: string | null
          slot_id?: string | null
          transaction_type?: string
          type?: string | null
        }
        Update: {
          amount?: number
          client_name?: string | null
          client_phone?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          payment_method?: string | null
          professional_commission?: number | null
          professional_id?: string | null
          salon_id?: string | null
          slot_id?: string | null
          transaction_type?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_transactions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "slots"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          commission_rate: number | null
          created_at: string | null
          id: string
          min_stock: number
          name: string
          price: number
          salon_id: string | null
          stock: number
          stock_quantity: number | null
        }
        Insert: {
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          min_stock?: number
          name: string
          price: number
          salon_id?: string | null
          stock?: number
          stock_quantity?: number | null
        }
        Update: {
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          min_stock?: number
          name?: string
          price?: number
          salon_id?: string | null
          stock?: number
          stock_quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_services: {
        Row: {
          professional_id: string
          service_id: string
        }
        Insert: {
          professional_id: string
          service_id: string
        }
        Update: {
          professional_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_services_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_work_hours: {
        Row: {
          created_at: string | null
          end_time: string
          id: string
          professional_id: string
          start_time: string
          weekday: number
        }
        Insert: {
          created_at?: string | null
          end_time: string
          id?: string
          professional_id: string
          start_time: string
          weekday: number
        }
        Update: {
          created_at?: string | null
          end_time?: string
          id?: string
          professional_id?: string
          start_time?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "professional_work_hours_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          active: boolean | null
          avatar_url: string | null
          avg_rating: number | null
          bio: string | null
          commission_rate: number | null
          created_at: string | null
          id: string
          name: string
          salon_id: string
          specialty: string | null
          total_reviews: number | null
        }
        Insert: {
          active?: boolean | null
          avatar_url?: string | null
          avg_rating?: number | null
          bio?: string | null
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          name: string
          salon_id: string
          specialty?: string | null
          total_reviews?: number | null
        }
        Update: {
          active?: boolean | null
          avatar_url?: string | null
          avg_rating?: number | null
          bio?: string | null
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          name?: string
          salon_id?: string
          specialty?: string | null
          total_reviews?: number | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          client_avatar_url: string | null
          client_id: string | null
          comment: string | null
          created_at: string | null
          id: string
          professional_id: string | null
          rating: number | null
          salon_id: string | null
          slot_id: string | null
        }
        Insert: {
          client_avatar_url?: string | null
          client_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          professional_id?: string | null
          rating?: number | null
          salon_id?: string | null
          slot_id?: string | null
        }
        Update: {
          client_avatar_url?: string | null
          client_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          professional_id?: string | null
          rating?: number | null
          salon_id?: string | null
          slot_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: true
            referencedRelation: "slots"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          client_name: string | null
          client_phone: string | null
          created_at: string
          id: string
          payment_method: string
          salon_id: string
          slot_id: string | null
          total_amount: number
        }
        Insert: {
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          id?: string
          payment_method: string
          salon_id: string
          slot_id?: string | null
          total_amount: number
        }
        Update: {
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          id?: string
          payment_method?: string
          salon_id?: string
          slot_id?: string | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "slots"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_users: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["salon_role"]
          salon_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["salon_role"]
          salon_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["salon_role"]
          salon_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "salon_users_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salons: {
        Row: {
          address: string | null
          api_key: string | null
          banner_url: string | null
          cep: string | null
          closing_time: string | null
          created_at: string | null
          description: string | null
          id: string
          instagram_handle: string | null
          instagram_user: string | null
          logo_url: string | null
          min_booking_hours: number | null
          name: string
          opening_time: string | null
          owner_id: string
          phone: string | null
          plan_type: string
          slot_interval: number | null
          slug: string | null
          theme_name: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          api_key?: string | null
          banner_url?: string | null
          cep?: string | null
          closing_time?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          instagram_handle?: string | null
          instagram_user?: string | null
          logo_url?: string | null
          min_booking_hours?: number | null
          name: string
          opening_time?: string | null
          owner_id: string
          phone?: string | null
          plan_type?: string
          slot_interval?: number | null
          slug?: string | null
          theme_name?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          api_key?: string | null
          banner_url?: string | null
          cep?: string | null
          closing_time?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          instagram_handle?: string | null
          instagram_user?: string | null
          logo_url?: string | null
          min_booking_hours?: number | null
          name?: string
          opening_time?: string | null
          owner_id?: string
          phone?: string | null
          plan_type?: string
          slot_interval?: number | null
          slug?: string | null
          theme_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string | null
          duration_minutes: number
          id: string
          image_url: string | null
          name: string
          price: number | null
          salon_id: string | null
        }
        Insert: {
          created_at?: string | null
          duration_minutes: number
          id?: string
          image_url?: string | null
          name: string
          price?: number | null
          salon_id?: string | null
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number
          id?: string
          image_url?: string | null
          name?: string
          price?: number | null
          salon_id?: string | null
        }
        Relationships: []
      }
      slots: {
        Row: {
          client_id: string | null
          client_name: string | null
          client_phone: string | null
          created_at: string | null
          end_time: string | null
          id: string
          notes: string | null
          payment_method: string
          price: number | null
          professional_id: string | null
          salon_id: string | null
          service_id: string | null
          start_time: string
          status: string | null
          time: string | null
        }
        Insert: {
          client_id?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string | null
          end_time?: string | null
          id?: string
          notes?: string | null
          payment_method?: string
          price?: number | null
          professional_id?: string | null
          salon_id?: string | null
          service_id?: string | null
          start_time: string
          status?: string | null
          time?: string | null
        }
        Update: {
          client_id?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string | null
          end_time?: string | null
          id?: string
          notes?: string | null
          payment_method?: string
          price?: number | null
          professional_id?: string | null
          salon_id?: string | null
          service_id?: string | null
          start_time?: string
          status?: string | null
          time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_slots_salon"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slots_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slots_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_advances: {
        Row: {
          amount: number
          created_at: string
          date: string | null
          description: string | null
          id: string
          professional_id: string | null
          salon_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          date?: string | null
          description?: string | null
          id?: string
          professional_id?: string | null
          salon_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string | null
          description?: string | null
          id?: string
          professional_id?: string | null
          salon_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_advances_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_advances_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string
          phone: string | null
          salon_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          salon_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          salon_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      waiting_list: {
        Row: {
          client_name: string
          client_phone: string | null
          created_at: string
          id: string
          notes: string | null
          professional_id: string | null
          salon_id: string
          service_preference: string | null
        }
        Insert: {
          client_name: string
          client_phone?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          professional_id?: string | null
          salon_id: string
          service_preference?: string | null
        }
        Update: {
          client_name?: string
          client_phone?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          professional_id?: string | null
          salon_id?: string
          service_preference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "waiting_list_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waiting_list_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      clean_old_slots: { Args: never; Returns: undefined }
      create_salon_for_user: {
        Args: { salon_name: string; salon_slug: string }
        Returns: string
      }
      decrement_product_stock: {
        Args: { pid: string; qty: number }
        Returns: undefined
      }
      get_client_analytics: {
        Args: { target_salon_id: string }
        Returns: {
          last_visit: string
          name: string
          phone: string
          total_spent: number
          total_visits: number
        }[]
      }
      get_full_analytics: { Args: { days_param: number }; Returns: Json }
      get_low_stock_products: {
        Args: { p_salon_id: string }
        Returns: {
          id: string
          min_stock: number
          name: string
          stock: number
        }[]
      }
      is_salon_member: {
        Args: {
          accepted_roles: string[]
          salon_id_to_check: string
          user_id_to_check: string
        }
        Returns: boolean
      }
      process_sale: {
        Args: {
          p_advance_amount: number
          p_items: Json
          p_payment_method: string
          p_salon_id: string
          p_slot_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      salon_role: "owner" | "admin" | "staff"
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
      salon_role: ["owner", "admin", "staff"],
    },
  },
} as const
