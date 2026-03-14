'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { OutfitService } from '@/lib/services/outfit.service';
import type { Outfit, OutfitGenerationResult } from '@/types/outfit.types';
import type { EventType, Season, WeatherCondition } from '@/types/common.types';

export function useOutfits(userId: string | null) {
  const qc = useQueryClient();
  const key = ['outfits', userId];

  // ── Kayıtlı kombinleri getir
  const { data: outfits = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: () => OutfitService.getOutfits(userId!),
    enabled: !!userId,
  });

  // ── Kombin üret
  const generateOutfit = useMutation({
    mutationFn: (params: {
      event: EventType;
      season: Season;
      weather_cond?: WeatherCondition;
      weather_temp?: number;
    }) => OutfitService.generateOutfit(userId!, params),
  });

  // ── Kombini kaydet
  const saveOutfit = useMutation({
    mutationFn: ({
      result,
      params,
    }: {
      result: OutfitGenerationResult;
      params: { event: EventType; season: Season; weather_cond?: WeatherCondition; weather_temp?: number; name?: string };
    }) => OutfitService.saveOutfit(userId!, result, params),
    onSuccess: ({ data }) => {
      if (data) qc.setQueryData<Outfit[]>(key, (prev = []) => [data, ...prev]);
    },
  });

  // ── Kombini sil
  const deleteOutfit = useMutation({
    mutationFn: (outfitId: string) => OutfitService.deleteOutfit(outfitId),
    onSuccess: (_, outfitId) => {
      qc.setQueryData<Outfit[]>(key, (prev = []) => prev.filter(o => o.id !== outfitId));
    },
  });

  // ── Favori toggle
  const toggleFavorite = useMutation({
    mutationFn: ({ id, current }: { id: string; current: boolean }) =>
      OutfitService.toggleFavorite(id, current),
    onSuccess: (_, { id, current }) => {
      qc.setQueryData<Outfit[]>(key, (prev = []) =>
        prev.map(o => (o.id === id ? { ...o, is_favorite: !current } : o))
      );
    },
  });

  // ── "Giyildi" işaretle
  const markAsWorn = useMutation({
    mutationFn: ({ outfitId, clothIds }: { outfitId: string; clothIds: string[] }) =>
      OutfitService.markAsWorn(outfitId, clothIds),
    onSuccess: (_, { outfitId }) => {
      const now = new Date().toISOString();
      qc.setQueryData<Outfit[]>(key, (prev = []) =>
        prev.map(o => (o.id === outfitId ? { ...o, worn_at: now } : o))
      );
      // Kıyafet wear_count'ları da güncellendi — wardrobe cache'i invalidate et
      qc.invalidateQueries({ queryKey: ['clothes', userId] });
    },
  });

  // ── Parça değiştir (swap)
  const swapItem = useMutation({
    mutationFn: ({ outfitItemId, newClothId }: { outfitItemId: string; newClothId: string }) =>
      OutfitService.swapItem(outfitItemId, newClothId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
    },
  });

  return {
    outfits,
    isLoading,
    generateOutfit,
    saveOutfit,
    deleteOutfit,
    toggleFavorite,
    markAsWorn,
    swapItem,
  };
}
