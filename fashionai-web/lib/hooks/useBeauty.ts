import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BeautyService } from '@/lib/services/beauty.service';
import type { BeautyProfile } from '@/types/beauty.types';

export function useBeauty(userId: string | null) {
  const qc = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['beauty_profile', userId],
    queryFn: () => BeautyService.getBeautyProfile(userId!),
    enabled: !!userId,
  });

  const { data: recommendations = [] } = useQuery({
    queryKey: ['recommendations', userId],
    queryFn: () => BeautyService.getRecommendations(userId!),
    enabled: !!userId,
  });

  const updateProfile = useMutation({
    mutationFn: (data: Partial<Omit<BeautyProfile, 'id' | 'user_id' | 'updated_at'>>) =>
      BeautyService.updateBeautyProfile(userId!, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['beauty_profile', userId] }),
  });

  const markAsRead = useMutation({
    mutationFn: (id: string) => BeautyService.markAsRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recommendations', userId] }),
  });

  return {
    profile: profile ?? null,
    recommendations,
    isLoading,
    updateProfile,
    markAsRead,
  };
}
