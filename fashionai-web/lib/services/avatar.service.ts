import { createClient } from '@/lib/supabase/client';
import { StorageService } from '@/lib/supabase/storage';
import type { Avatar } from '@/types/profile.types';
import type { FaceShape } from '@/types/common.types';

const supabase = createClient();

export const AvatarService = {
  async getAvatar(userId: string): Promise<Avatar | null> {
    const { data, error } = await supabase
      .from('avatars')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) return null;
    return data as Avatar;
  },

  async upsertAvatar(
    userId: string,
    updates: Partial<Pick<Avatar, 'photo_url' | 'avatar_url' | 'face_shape' | 'skin_tone' | 'hair_color' | 'eye_color'>>
  ): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('avatars')
      .upsert({ user_id: userId, ...updates }, { onConflict: 'user_id' });

    return { error: error?.message ?? null };
  },

  async uploadPhoto(userId: string, file: File): Promise<{ url: string | null; error: string | null }> {
    return StorageService.upload('avatars', userId, file, 'photo.jpg');
  },

  async updateFaceShape(userId: string, faceShape: FaceShape): Promise<{ error: string | null }> {
    return AvatarService.upsertAvatar(userId, { face_shape: faceShape });
  },
};
