import type { FaceShape, RecommendationType } from './common.types';

export interface BeautyProfile {
  id: string;
  user_id: string;
  face_shape: FaceShape | null;
  skin_tone: string | null;
  skin_type: 'dry' | 'oily' | 'combination' | 'normal' | null;
  hair_type: 'straight' | 'wavy' | 'curly' | 'coily' | null;
  hair_length: 'short' | 'medium' | 'long' | null;
  eye_color: string | null;
  allergies: string[];
  updated_at: string;
}

export interface Recommendation {
  id: string;
  user_id: string;
  type: RecommendationType;
  title: string;
  description: string | null;
  payload: RecommendationPayload;
  related_outfit: string | null;
  related_event: string | null;
  is_read: boolean;
  created_at: string;
}

export interface RecommendationPayload {
  makeup?: MakeupRecommendation;
  hairstyle?: HairstyleRecommendation;
  grooming?: GroomingRecommendation;
}

export interface MakeupRecommendation {
  foundation_shade: string;
  lip_color: string;
  eye_shadow_palette: string[];
  blush_tone: string;
  style_tips: string[];
}

export interface HairstyleRecommendation {
  suggested_styles: string[];
  products: string[];
  styling_tips: string[];
}

export interface GroomingRecommendation {
  beard_style: string | null;
  skincare_routine: string[];
  tips: string[];
}

export interface FaceAnalysisHairstyle {
  name: string;
  description: string;
  suitable_for: string;
}

export interface FaceAnalysisResult {
  face_shape: string;
  face_shape_label: string;
  face_shape_description: string;
  confidence: number;
  hairstyle_suggestions: FaceAnalysisHairstyle[];
  styling_tips: string[];
  avoid_tips: string[];
}
