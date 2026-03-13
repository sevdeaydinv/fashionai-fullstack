import { createClient } from './client';

const supabase = createClient();

type Bucket = 'avatars' | 'clothes' | 'outfits';

export const StorageService = {
  /** Dosya yükle — path: {userId}/{filename} */
  async upload(
    bucket: Bucket,
    userId: string,
    file: File,
    filename?: string
  ): Promise<{ url: string | null; error: string | null }> {
    const ext = file.name.split('.').pop();
    const path = `${userId}/${filename ?? `${Date.now()}.${ext}`}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true });

    if (error) return { url: null, error: error.message };

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return { url: data.publicUrl, error: null };
  },

  /** Dosya sil */
  async remove(
    bucket: Bucket,
    userId: string,
    filename: string
  ): Promise<{ error: string | null }> {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([`${userId}/${filename}`]);

    return { error: error?.message ?? null };
  },

  /** Public URL al */
  getPublicUrl(bucket: Bucket, userId: string, filename: string): string {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(`${userId}/${filename}`);
    return data.publicUrl;
  },
};
