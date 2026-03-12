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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      avatars: {
        Row: {
          avatar_url: string | null
          created_at: string
          eye_color: string | null
          face_shape: Database["public"]["Enums"]["face_shape_type"] | null
          generation_meta: Json | null
          hair_color: string | null
          id: string
          photo_url: string | null
          skin_tone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          eye_color?: string | null
          face_shape?: Database["public"]["Enums"]["face_shape_type"] | null
          generation_meta?: Json | null
          hair_color?: string | null
          id?: string
          photo_url?: string | null
          skin_tone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          eye_color?: string | null
          face_shape?: Database["public"]["Enums"]["face_shape_type"] | null
          generation_meta?: Json | null
          hair_color?: string | null
          id?: string
          photo_url?: string | null
          skin_tone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "avatars_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      beauty_profiles: {
        Row: {
          allergies: string[] | null
          eye_color: string | null
          face_shape: Database["public"]["Enums"]["face_shape_type"] | null
          hair_length: string | null
          hair_type: string | null
          id: string
          skin_tone: string | null
          skin_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allergies?: string[] | null
          eye_color?: string | null
          face_shape?: Database["public"]["Enums"]["face_shape_type"] | null
          hair_length?: string | null
          hair_type?: string | null
          id?: string
          skin_tone?: string | null
          skin_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allergies?: string[] | null
          eye_color?: string | null
          face_shape?: Database["public"]["Enums"]["face_shape_type"] | null
          hair_length?: string | null
          hair_type?: string | null
          id?: string
          skin_tone?: string | null
          skin_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "beauty_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      body_measurements: {
        Row: {
          bmi: number | null
          chest_cm: number | null
          height_cm: number | null
          hip_cm: number | null
          id: string
          inseam_cm: number | null
          shoe_size: number | null
          shoulder_cm: number | null
          updated_at: string
          user_id: string
          waist_cm: number | null
          weight_kg: number | null
        }
        Insert: {
          bmi?: number | null
          chest_cm?: number | null
          height_cm?: number | null
          hip_cm?: number | null
          id?: string
          inseam_cm?: number | null
          shoe_size?: number | null
          shoulder_cm?: number | null
          updated_at?: string
          user_id: string
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Update: {
          bmi?: number | null
          chest_cm?: number | null
          height_cm?: number | null
          hip_cm?: number | null
          id?: string
          inseam_cm?: number | null
          shoe_size?: number | null
          shoulder_cm?: number | null
          updated_at?: string
          user_id?: string
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "body_measurements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clothes: {
        Row: {
          brand: string | null
          category: Database["public"]["Enums"]["clothing_category"]
          color: string
          color_name: string | null
          created_at: string
          id: string
          image_url: string
          is_favorite: boolean
          last_worn_at: string | null
          name: string
          notes: string | null
          season: Database["public"]["Enums"]["season_type"][]
          secondary_color: string | null
          style: Database["public"]["Enums"]["style_type"][]
          tags: string[] | null
          updated_at: string
          user_id: string
          wardrobe_id: string
          wear_count: number
        }
        Insert: {
          brand?: string | null
          category: Database["public"]["Enums"]["clothing_category"]
          color: string
          color_name?: string | null
          created_at?: string
          id?: string
          image_url: string
          is_favorite?: boolean
          last_worn_at?: string | null
          name: string
          notes?: string | null
          season?: Database["public"]["Enums"]["season_type"][]
          secondary_color?: string | null
          style: Database["public"]["Enums"]["style_type"][]
          tags?: string[] | null
          updated_at?: string
          user_id: string
          wardrobe_id: string
          wear_count?: number
        }
        Update: {
          brand?: string | null
          category?: Database["public"]["Enums"]["clothing_category"]
          color?: string
          color_name?: string | null
          created_at?: string
          id?: string
          image_url?: string
          is_favorite?: boolean
          last_worn_at?: string | null
          name?: string
          notes?: string | null
          season?: Database["public"]["Enums"]["season_type"][]
          secondary_color?: string | null
          style?: Database["public"]["Enums"]["style_type"][]
          tags?: string[] | null
          updated_at?: string
          user_id?: string
          wardrobe_id?: string
          wear_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "clothes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clothes_wardrobe_id_fkey"
            columns: ["wardrobe_id"]
            isOneToOne: false
            referencedRelation: "wardrobes"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          event_date: string
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          location: string | null
          notes: string | null
          outfit_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_date: string
          event_type: Database["public"]["Enums"]["event_type"]
          id?: string
          location?: string | null
          notes?: string | null
          outfit_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_date?: string
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          location?: string | null
          notes?: string | null
          outfit_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "outfits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      outfit_items: {
        Row: {
          cloth_id: string
          id: string
          layer_order: number
          outfit_id: string
          role: string
        }
        Insert: {
          cloth_id: string
          id?: string
          layer_order?: number
          outfit_id: string
          role: string
        }
        Update: {
          cloth_id?: string
          id?: string
          layer_order?: number
          outfit_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "outfit_items_cloth_id_fkey"
            columns: ["cloth_id"]
            isOneToOne: false
            referencedRelation: "clothes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outfit_items_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "outfits"
            referencedColumns: ["id"]
          },
        ]
      }
      outfits: {
        Row: {
          ai_generated: boolean
          ai_score: number | null
          cover_image_url: string | null
          created_at: string
          event: Database["public"]["Enums"]["event_type"] | null
          id: string
          is_favorite: boolean
          name: string | null
          occasion_note: string | null
          season: Database["public"]["Enums"]["season_type"] | null
          updated_at: string
          user_id: string
          weather_cond: string | null
          weather_temp: number | null
          worn_at: string | null
        }
        Insert: {
          ai_generated?: boolean
          ai_score?: number | null
          cover_image_url?: string | null
          created_at?: string
          event?: Database["public"]["Enums"]["event_type"] | null
          id?: string
          is_favorite?: boolean
          name?: string | null
          occasion_note?: string | null
          season?: Database["public"]["Enums"]["season_type"] | null
          updated_at?: string
          user_id: string
          weather_cond?: string | null
          weather_temp?: number | null
          worn_at?: string | null
        }
        Update: {
          ai_generated?: boolean
          ai_score?: number | null
          cover_image_url?: string | null
          created_at?: string
          event?: Database["public"]["Enums"]["event_type"] | null
          id?: string
          is_favorite?: boolean
          name?: string | null
          occasion_note?: string | null
          season?: Database["public"]["Enums"]["season_type"] | null
          updated_at?: string
          user_id?: string
          weather_cond?: string | null
          weather_temp?: number | null
          worn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outfits_user_id_fkey"
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
          birth_date: string | null
          created_at: string
          full_name: string | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          id: string
          onboarded: boolean
          style_prefs: Database["public"]["Enums"]["style_type"][] | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          full_name?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id: string
          onboarded?: boolean
          style_prefs?: Database["public"]["Enums"]["style_type"][] | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          full_name?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          onboarded?: boolean
          style_prefs?: Database["public"]["Enums"]["style_type"][] | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_read: boolean
          payload: Json
          related_event: string | null
          related_outfit: string | null
          title: string
          type: Database["public"]["Enums"]["recommendation_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_read?: boolean
          payload: Json
          related_event?: string | null
          related_outfit?: string | null
          title: string
          type: Database["public"]["Enums"]["recommendation_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_read?: boolean
          payload?: Json
          related_event?: string | null
          related_outfit?: string | null
          title?: string
          type?: Database["public"]["Enums"]["recommendation_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_related_event_fkey"
            columns: ["related_event"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_related_outfit_fkey"
            columns: ["related_outfit"]
            isOneToOne: false
            referencedRelation: "outfits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wardrobes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_default: boolean
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wardrobes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      weather_cache: {
        Row: {
          expires_at: string
          fetched_at: string
          id: string
          lat: number
          lon: number
          payload: Json
        }
        Insert: {
          expires_at: string
          fetched_at?: string
          id?: string
          lat: number
          lon: number
          payload: Json
        }
        Update: {
          expires_at?: string
          fetched_at?: string
          id?: string
          lat?: number
          lon?: number
          payload?: Json
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      clothing_category:
        | "shirt"
        | "tshirt"
        | "blouse"
        | "sweater"
        | "pants"
        | "jeans"
        | "skirt"
        | "shorts"
        | "jacket"
        | "coat"
        | "dress"
        | "shoes"
        | "sneakers"
        | "boots"
        | "heels"
        | "bag"
        | "backpack"
        | "clutch"
        | "accessory"
      event_type:
        | "daily_casual"
        | "picnic"
        | "sport"
        | "graduation"
        | "invitation"
        | "travel"
        | "business"
        | "date_night"
      face_shape_type:
        | "oval"
        | "round"
        | "square"
        | "heart"
        | "diamond"
        | "oblong"
      gender_type: "male" | "female" | "non_binary" | "prefer_not_to_say"
      recommendation_type: "outfit" | "makeup" | "hairstyle" | "grooming"
      season_type: "spring" | "summer" | "autumn" | "winter" | "all_season"
      style_type:
        | "casual"
        | "formal"
        | "sport"
        | "streetwear"
        | "elegant"
        | "bohemian"
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
      clothing_category: [
        "shirt",
        "tshirt",
        "blouse",
        "sweater",
        "pants",
        "jeans",
        "skirt",
        "shorts",
        "jacket",
        "coat",
        "dress",
        "shoes",
        "sneakers",
        "boots",
        "heels",
        "bag",
        "backpack",
        "clutch",
        "accessory",
      ],
      event_type: [
        "daily_casual",
        "picnic",
        "sport",
        "graduation",
        "invitation",
        "travel",
        "business",
        "date_night",
      ],
      face_shape_type: [
        "oval",
        "round",
        "square",
        "heart",
        "diamond",
        "oblong",
      ],
      gender_type: ["male", "female", "non_binary", "prefer_not_to_say"],
      recommendation_type: ["outfit", "makeup", "hairstyle", "grooming"],
      season_type: ["spring", "summer", "autumn", "winter", "all_season"],
      style_type: [
        "casual",
        "formal",
        "sport",
        "streetwear",
        "elegant",
        "bohemian",
      ],
    },
  },
} as const
