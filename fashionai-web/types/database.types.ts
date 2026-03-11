// Auto-generated Supabase database types placeholder.
// Replace this file with the output of:
//   npx supabase gen types typescript --project-id <YOUR_PROJECT_ID>
//
// This gives you full type-safe access to every table and RPC.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles:            { Row: unknown; Insert: unknown; Update: unknown };
      body_measurements:   { Row: unknown; Insert: unknown; Update: unknown };
      avatars:             { Row: unknown; Insert: unknown; Update: unknown };
      wardrobes:           { Row: unknown; Insert: unknown; Update: unknown };
      clothes:             { Row: unknown; Insert: unknown; Update: unknown };
      outfits:             { Row: unknown; Insert: unknown; Update: unknown };
      outfit_items:        { Row: unknown; Insert: unknown; Update: unknown };
      beauty_profiles:     { Row: unknown; Insert: unknown; Update: unknown };
      events:              { Row: unknown; Insert: unknown; Update: unknown };
      recommendations:     { Row: unknown; Insert: unknown; Update: unknown };
      weather_cache:       { Row: unknown; Insert: unknown; Update: unknown };
    };
    Enums: {
      gender_type:         'male' | 'female' | 'non_binary' | 'prefer_not_to_say';
      season_type:         'spring' | 'summer' | 'autumn' | 'winter' | 'all_season';
      style_type:          'casual' | 'formal' | 'sport' | 'streetwear' | 'elegant' | 'bohemian';
      clothing_category:   string;
      event_type:          string;
      face_shape_type:     'oval' | 'round' | 'square' | 'heart' | 'diamond' | 'oblong';
      recommendation_type: 'outfit' | 'makeup' | 'hairstyle' | 'grooming';
    };
  };
}
