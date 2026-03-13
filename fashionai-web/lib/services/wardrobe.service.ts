import { createClient } from '@/lib/supabase/client';
import { StorageService } from '@/lib/supabase/storage';
import type { ClothingItem, ClothingItemPayload } from '@/types/wardrobe.types';

const supabase = createClient();

export const WardrobeService = {
  // ── Varsayılan wardrobe'u al veya oluştur
  async getOrCreateDefaultWardrobe(userId: string): Promise<string> {
    const { data: existing } = await supabase
      .from('wardrobes')
      .select('id')
      .eq('user_id', userId)
      .eq('is_default', true)
      .single();

    if (existing) return existing.id;

    const { data: created } = await supabase
      .from('wardrobes')
      .insert({ user_id: userId, name: 'Gardırobum', is_default: true })
      .select('id')
      .single();

    return created!.id;
  },

  // ── Kıyafetleri getir
  async getClothes(userId: string): Promise<ClothingItem[]> {
    const { data, error } = await supabase
      .from('clothes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) return [];
    return data as ClothingItem[];
  },

  // ── Kıyafet ekle
  async addClothingItem(
    userId: string,
    payload: Omit<ClothingItemPayload, 'wardrobe_id'>
  ): Promise<{ data: ClothingItem | null; error: string | null }> {
    const wardrobeId = await WardrobeService.getOrCreateDefaultWardrobe(userId);

    const { data, error } = await supabase
      .from('clothes')
      .insert({ ...payload, user_id: userId, wardrobe_id: wardrobeId })
      .select()
      .single();

    return { data: data as ClothingItem, error: error?.message ?? null };
  },

  // ── Kıyafet güncelle
  async updateClothingItem(
    id: string,
    updates: Partial<ClothingItemPayload>
  ): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('clothes')
      .update(updates)
      .eq('id', id);

    return { error: error?.message ?? null };
  },

  // ── Kıyafet sil (storage'dan da)
  async deleteClothingItem(
    id: string,
    userId: string,
    imageUrl: string
  ): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('clothes')
      .delete()
      .eq('id', id);

    if (!error) {
      // Storage'dan görseli sil
      const filename = imageUrl.split('/').pop()?.split('?')[0];
      if (filename) {
        await StorageService.remove('clothes', userId, filename);
      }
    }

    return { error: error?.message ?? null };
  },

  // ── Favori toggle
  async toggleFavorite(
    id: string,
    current: boolean
  ): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('clothes')
      .update({ is_favorite: !current })
      .eq('id', id);

    return { error: error?.message ?? null };
  },

  // ── Görsel yükle
  async uploadImage(
    userId: string,
    file: File
  ): Promise<{ url: string | null; error: string | null }> {
    return StorageService.upload('clothes', userId, file);
  },
};
