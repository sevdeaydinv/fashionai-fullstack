import { createClient } from '@/lib/supabase/client';
import { generateOutfitCombinations } from '@/lib/utils/outfit.utils';
import type { Outfit, OutfitWithItems, OutfitGenerationResult } from '@/types/outfit.types';
import type { EventType, Season, WeatherCondition } from '@/types/common.types';
import type { ClothingItem } from '@/types/wardrobe.types';

const supabase = createClient();

export const OutfitService = {

  // ── Kombin üret (AI destekli, client-side fallback)
  async generateOutfit(
    userId: string,
    request: {
      event: EventType;
      season: Season;
      weather_cond?: WeatherCondition;
      weather_temp?: number;
    }
  ): Promise<OutfitGenerationResult[]> {
    const { data, error } = await supabase
      .from('clothes')
      .select('*')
      .eq('user_id', userId);

    if (error || !data || data.length === 0) return [];

    const clothes = data as ClothingItem[];

    // AI API'yi dene
    try {
      const res = await fetch('/api/generate-outfit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clothes,
          event: request.event,
          season: request.season,
          weather_cond: request.weather_cond,
          weather_temp: request.weather_temp,
        }),
      });

      if (res.ok) {
        const { results } = await res.json();
        if (results && results.length > 0) return results;
      }
    } catch {
      // AI başarısız olursa kural tabanlı algoritmaya düş
    }

    // Fallback: kural tabanlı algoritma
    return generateOutfitCombinations(
      clothes,
      request.event,
      request.season,
      request.weather_cond,
      request.weather_temp
    );
  },

  // ── Kombini kaydet
  async saveOutfit(
    userId: string,
    result: OutfitGenerationResult,
    params: { event: EventType; season: Season; weather_cond?: WeatherCondition; weather_temp?: number; name?: string }
  ): Promise<{ data: Outfit | null; error: string | null }> {
    // 1. outfits tablosuna kaydet
    const { data: outfit, error: outfitErr } = await supabase
      .from('outfits')
      .insert({
        user_id: userId,
        name: params.name ?? null,
        event: params.event,
        season: params.season,
        weather_cond: params.weather_cond ?? null,
        weather_temp: params.weather_temp ?? null,
        ai_generated: true,
        ai_score: result.score,
        cover_image_url: result.top.image_url,
      })
      .select()
      .single();

    if (outfitErr || !outfit) return { data: null, error: outfitErr?.message ?? 'Kayıt hatası' };

    // 2. outfit_items tablosuna parçaları kaydet
    const items = [
      { cloth_id: result.top.id, role: 'top', layer_order: 1 },
      result.bottom ? { cloth_id: result.bottom.id, role: 'bottom', layer_order: 2 } : null,
      result.shoes ? { cloth_id: result.shoes.id, role: 'shoes', layer_order: 3 } : null,
      result.bag ? { cloth_id: result.bag.id, role: 'bag', layer_order: 4 } : null,
      ...result.accessories.map((a, i) => ({ cloth_id: a.id, role: 'accessory', layer_order: 5 + i })),
    ]
      .filter(Boolean)
      .map(item => ({ ...item, outfit_id: outfit.id }));

    await supabase.from('outfit_items').insert(items);

    return { data: outfit as Outfit, error: null };
  },

  // ── Tüm kombinleri getir
  async getOutfits(userId: string): Promise<Outfit[]> {
    const { data, error } = await supabase
      .from('outfits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) return [];
    return data as Outfit[];
  },

  // ── Kombin + parçalar (join)
  async getOutfitWithItems(outfitId: string): Promise<OutfitWithItems | null> {
    const { data: outfit, error: outfitErr } = await supabase
      .from('outfits')
      .select('*')
      .eq('id', outfitId)
      .single();

    if (outfitErr || !outfit) return null;

    const { data: outfitItems, error: itemsErr } = await supabase
      .from('outfit_items')
      .select('*, cloth:clothes(*)')
      .eq('outfit_id', outfitId)
      .order('layer_order');

    if (itemsErr) return null;

    return {
      ...(outfit as Outfit),
      items: outfitItems as OutfitWithItems['items'],
    };
  },

  // ── Kombini sil
  async deleteOutfit(outfitId: string): Promise<{ error: string | null }> {
    // outfit_items cascade ile silinir (FK ON DELETE CASCADE)
    const { error } = await supabase
      .from('outfits')
      .delete()
      .eq('id', outfitId);

    return { error: error?.message ?? null };
  },

  // ── Favori toggle
  async toggleFavorite(outfitId: string, current: boolean): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('outfits')
      .update({ is_favorite: !current })
      .eq('id', outfitId);

    return { error: error?.message ?? null };
  },

  // ── "Giyildi" işaretle — worn_at + wear_count güncelle
  async markAsWorn(outfitId: string, clothIds: string[]): Promise<{ error: string | null }> {
    const now = new Date().toISOString();

    // outfit.worn_at güncelle
    const { error: outfitErr } = await supabase
      .from('outfits')
      .update({ worn_at: now })
      .eq('id', outfitId);

    if (outfitErr) return { error: outfitErr.message };

    // her parçanın wear_count + last_worn_at güncelle
    for (const clothId of clothIds) {
      const { data } = await supabase
        .from('clothes')
        .select('wear_count')
        .eq('id', clothId)
        .single();

      await supabase
        .from('clothes')
        .update({ wear_count: (data?.wear_count ?? 0) + 1, last_worn_at: now })
        .eq('id', clothId);
    }

    return { error: null };
  },

  // ── Outfit parça değiştir (swap)
  async swapItem(
    outfitItemId: string,
    newClothId: string
  ): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('outfit_items')
      .update({ cloth_id: newClothId })
      .eq('id', outfitItemId);

    return { error: error?.message ?? null };
  },
};
