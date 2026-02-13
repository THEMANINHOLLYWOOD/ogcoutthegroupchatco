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
      activity_reactions: {
        Row: {
          activity_index: number
          created_at: string | null
          day_number: number
          id: string
          reaction: string
          trip_id: string
          user_id: string
        }
        Insert: {
          activity_index: number
          created_at?: string | null
          day_number: number
          id?: string
          reaction: string
          trip_id: string
          user_id: string
        }
        Update: {
          activity_index?: number
          created_at?: string | null
          day_number?: number
          id?: string
          reaction?: string
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_reactions_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_addressee_id_fkey"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          from_user_id: string
          id: string
          read: boolean
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          from_user_id: string
          id?: string
          read?: boolean
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          from_user_id?: string
          id?: string
          read?: boolean
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          home_city: string | null
          home_country: string | null
          home_location_set: boolean
          home_state: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          home_city?: string | null
          home_country?: string | null
          home_location_set?: boolean
          home_state?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          home_city?: string | null
          home_country?: string | null
          home_location_set?: boolean
          home_state?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      travel_companions: {
        Row: {
          created_at: string
          date_of_birth: string | null
          document_number: string | null
          document_type: string | null
          expiration_date: string | null
          first_name: string
          full_legal_name: string
          gender: string | null
          home_airport_city: string | null
          home_airport_iata: string | null
          home_airport_name: string | null
          id: string
          last_name: string
          middle_name: string | null
          nationality: string | null
          nickname: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          document_number?: string | null
          document_type?: string | null
          expiration_date?: string | null
          first_name: string
          full_legal_name: string
          gender?: string | null
          home_airport_city?: string | null
          home_airport_iata?: string | null
          home_airport_name?: string | null
          id?: string
          last_name: string
          middle_name?: string | null
          nationality?: string | null
          nickname: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          document_number?: string | null
          document_type?: string | null
          expiration_date?: string | null
          first_name?: string
          full_legal_name?: string
          gender?: string | null
          home_airport_city?: string | null
          home_airport_iata?: string | null
          home_airport_name?: string | null
          id?: string
          last_name?: string
          middle_name?: string | null
          nationality?: string | null
          nickname?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "travel_companions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_media: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          location: string | null
          media_type: Database["public"]["Enums"]["media_type"]
          url: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          location?: string | null
          media_type?: Database["public"]["Enums"]["media_type"]
          url: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          location?: string | null
          media_type?: Database["public"]["Enums"]["media_type"]
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "travel_media_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      traveler_documents: {
        Row: {
          created_at: string
          date_of_birth: string
          document_number: string
          document_type: string
          expiration_date: string
          first_name: string
          full_legal_name: string
          gender: string | null
          id: string
          issue_date: string | null
          issuing_country: string | null
          last_name: string
          middle_name: string | null
          nationality: string | null
          place_of_birth: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date_of_birth: string
          document_number: string
          document_type?: string
          expiration_date: string
          first_name: string
          full_legal_name: string
          gender?: string | null
          id?: string
          issue_date?: string | null
          issuing_country?: string | null
          last_name: string
          middle_name?: string | null
          nationality?: string | null
          place_of_birth?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string
          document_number?: string
          document_type?: string
          expiration_date?: string
          first_name?: string
          full_legal_name?: string
          gender?: string | null
          id?: string
          issue_date?: string | null
          issuing_country?: string | null
          last_name?: string
          middle_name?: string | null
          nationality?: string | null
          place_of_birth?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "traveler_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          accommodation: Json | null
          cost_breakdown: Json | null
          created_at: string
          departure_date: string
          destination_city: string
          destination_country: string
          destination_iata: string
          flights: Json | null
          id: string
          itinerary: Json | null
          itinerary_status: string
          link_created_at: string | null
          link_expires_at: string | null
          organizer_id: string | null
          organizer_name: string
          paid_travelers: Json | null
          return_date: string
          share_code: string
          share_image_url: string | null
          total_per_person: number
          travelers: Json
          trip_total: number
          updated_at: string
        }
        Insert: {
          accommodation?: Json | null
          cost_breakdown?: Json | null
          created_at?: string
          departure_date: string
          destination_city: string
          destination_country: string
          destination_iata: string
          flights?: Json | null
          id?: string
          itinerary?: Json | null
          itinerary_status?: string
          link_created_at?: string | null
          link_expires_at?: string | null
          organizer_id?: string | null
          organizer_name: string
          paid_travelers?: Json | null
          return_date: string
          share_code?: string
          share_image_url?: string | null
          total_per_person?: number
          travelers?: Json
          trip_total?: number
          updated_at?: string
        }
        Update: {
          accommodation?: Json | null
          cost_breakdown?: Json | null
          created_at?: string
          departure_date?: string
          destination_city?: string
          destination_country?: string
          destination_iata?: string
          flights?: Json | null
          id?: string
          itinerary?: Json | null
          itinerary_status?: string
          link_created_at?: string | null
          link_expires_at?: string | null
          organizer_id?: string | null
          organizer_name?: string
          paid_travelers?: Json | null
          return_date?: string
          share_code?: string
          share_image_url?: string | null
          total_per_person?: number
          travelers?: Json
          trip_total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          url: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          url: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      visited_cities: {
        Row: {
          city_name: string
          country: string
          created_at: string
          id: string
          user_id: string
          visited_date: string | null
        }
        Insert: {
          city_name: string
          country: string
          created_at?: string
          id?: string
          user_id: string
          visited_date?: string | null
        }
        Update: {
          city_name?: string
          country?: string
          created_at?: string
          id?: string
          user_id?: string
          visited_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visited_cities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      visited_countries: {
        Row: {
          continent: string
          country_name: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          continent: string
          country_name: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          continent?: string
          country_name?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visited_countries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      visited_states: {
        Row: {
          country: string
          created_at: string
          id: string
          state_name: string
          user_id: string
        }
        Insert: {
          country: string
          created_at?: string
          id?: string
          state_name: string
          user_id: string
        }
        Update: {
          country?: string
          created_at?: string
          id?: string
          state_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visited_states_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_share_code: { Args: never; Returns: string }
      is_friend_of: { Args: { target_user_id: string }; Returns: boolean }
    }
    Enums: {
      media_type: "photo" | "video"
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
      media_type: ["photo", "video"],
    },
  },
} as const
