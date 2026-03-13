import { createClient } from '@/lib/supabase/client';
import type { Profile, BodyMeasurements } from '@/types/profile.types';

const supabase = createClient();

export const ProfileService = {
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) return null;
    return data as Profile;
  },

  async updateProfile(
    userId: string,
    updates: Partial<Pick<Profile, 'full_name' | 'gender' | 'birth_date' | 'style_prefs' | 'username' | 'avatar_url'>>
  ): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    return { error: error?.message ?? null };
  },

  async getBodyMeasurements(userId: string): Promise<BodyMeasurements | null> {
    const { data, error } = await supabase
      .from('body_measurements')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) return null;
    return data as BodyMeasurements;
  },

  async upsertBodyMeasurements(
    userId: string,
    measurements: Partial<Omit<BodyMeasurements, 'id' | 'user_id' | 'bmi' | 'updated_at'>>
  ): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('body_measurements')
      .upsert({ user_id: userId, ...measurements }, { onConflict: 'user_id' });

    return { error: error?.message ?? null };
  },
};
