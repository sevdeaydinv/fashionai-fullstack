'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { WardrobeService } from '@/lib/services/wardrobe.service';
import type { ClothingItem, ClothingItemPayload } from '@/types/wardrobe.types';

export function useWardrobe(userId: string | null) {
  const qc = useQueryClient();
  const key = ['clothes', userId];

  // ── Fetch
  const { data: clothes = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: () => WardrobeService.getClothes(userId!),
    enabled: !!userId,
  });

  // ── Add
  const addItem = useMutation({
    mutationFn: (payload: Omit<ClothingItemPayload, 'wardrobe_id'>) =>
      WardrobeService.addClothingItem(userId!, payload),
    onSuccess: ({ data }) => {
      if (data) qc.setQueryData<ClothingItem[]>(key, (prev = []) => [data, ...prev]);
    },
  });

  // ── Update
  const updateItem = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ClothingItemPayload> }) =>
      WardrobeService.updateClothingItem(id, updates),
    onSuccess: (_, { id, updates }) => {
      qc.setQueryData<ClothingItem[]>(key, (prev = []) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      );
    },
  });

  // ── Delete
  const deleteItem = useMutation({
    mutationFn: ({ id, imageUrl }: { id: string; imageUrl: string }) =>
      WardrobeService.deleteClothingItem(id, userId!, imageUrl),
    onSuccess: (_, { id }) => {
      qc.setQueryData<ClothingItem[]>(key, (prev = []) =>
        prev.filter((item) => item.id !== id)
      );
    },
  });

  // ── Favorite toggle
  const toggleFavorite = useMutation({
    mutationFn: ({ id, current }: { id: string; current: boolean }) =>
      WardrobeService.toggleFavorite(id, current),
    onSuccess: (_, { id, current }) => {
      qc.setQueryData<ClothingItem[]>(key, (prev = []) =>
        prev.map((item) => (item.id === id ? { ...item, is_favorite: !current } : item))
      );
    },
  });

  return {
    clothes,
    isLoading,
    addItem,
    updateItem,
    deleteItem,
    toggleFavorite,
  };
}
