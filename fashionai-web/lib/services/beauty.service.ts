import { createClient } from '@/lib/supabase/client';
import type { BeautyProfile, Recommendation, RecommendationPayload } from '@/types/beauty.types';

const supabase = createClient();

export const BeautyService = {

  // ── Güzellik profilini getir
  async getBeautyProfile(userId: string): Promise<BeautyProfile | null> {
    const { data, error } = await supabase
      .from('beauty_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;
    return data as BeautyProfile;
  },

  // ── Güzellik profilini oluştur / güncelle
  async updateBeautyProfile(
    userId: string,
    profile: Partial<Omit<BeautyProfile, 'id' | 'user_id' | 'updated_at'>>
  ): Promise<{ data: BeautyProfile | null; error: string | null }> {
    const { data, error } = await supabase
      .from('beauty_profiles')
      .upsert({ ...profile, user_id: userId, updated_at: new Date().toISOString() })
      .select()
      .single();

    if (error || !data) return { data: null, error: error?.message ?? 'Güncelleme hatası' };
    return { data: data as BeautyProfile, error: null };
  },

  // ── AI önerilerini getir (kaydedilmiş)
  async getRecommendations(userId: string): Promise<Recommendation[]> {
    const { data, error } = await supabase
      .from('recommendations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error || !data) return [];
    return data as Recommendation[];
  },

  // ── Öneriyi okundu olarak işaretle
  async markAsRead(recommendationId: string): Promise<void> {
    await supabase
      .from('recommendations')
      .update({ is_read: true })
      .eq('id', recommendationId);
  },

  // ── AI öneri kaydet
  async saveRecommendation(
    userId: string,
    type: 'makeup' | 'hairstyle' | 'grooming',
    title: string,
    payload: RecommendationPayload
  ): Promise<{ data: Recommendation | null; error: string | null }> {
    const { data, error } = await supabase
      .from('recommendations')
      .insert({ user_id: userId, type, title, payload, is_read: false })
      .select()
      .single();

    if (error || !data) return { data: null, error: error?.message ?? 'Kayıt hatası' };
    return { data: data as Recommendation, error: null };
  },
};
