import type { Gender, Style, FaceShape } from './common.types';

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  gender: Gender | null;
  birth_date: string | null;          // ISO date string
  style_prefs: Style[];
  onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export interface BodyMeasurements {
  id: string;
  user_id: string;
  height_cm: number | null;
  weight_kg: number | null;
  waist_cm: number | null;
  hip_cm: number | null;
  chest_cm: number | null;
  shoulder_cm: number | null;
  inseam_cm: number | null;
  shoe_size: number | null;
  bmi: number | null;                 // computed column
  updated_at: string;
}

export interface Avatar {
  id: string;
  user_id: string;
  photo_url: string | null;
  avatar_url: string | null;
  face_shape: FaceShape | null;
  skin_tone: string | null;
  hair_color: string | null;
  eye_color: string | null;
  generation_meta: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// Onboarding multi-step form state
export interface OnboardingData {
  full_name: string;
  gender: Gender;
  birth_date: string;
  style_prefs: Style[];
  measurements: Omit<BodyMeasurements, 'id' | 'user_id' | 'bmi' | 'updated_at'>;
}
