'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { CommunityPost, PostComment } from '@/types/community.types';

// ── Feed ────────────────────────────────────────────────────────────────────

export function useFeed(userId: string | null) {
  return useQuery<CommunityPost[]>({
    queryKey: ['community_feed', userId],
    queryFn: async () => {
      const supabase = createClient();

      // Fetch posts
      const { data: posts, error } = await supabase
        .from('community_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(40);

      if (error) throw error;
      if (!posts || posts.length === 0) return [];

      // Fetch profiles separately
      const userIds = [...new Set(posts.map((p) => p.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', userIds);

      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

      // Check liked posts
      let likedSet = new Set<string>();
      if (userId) {
        const postIds = posts.map((p) => p.id);
        const { data: likes } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', userId)
          .in('post_id', postIds);
        likedSet = new Set((likes ?? []).map((l) => l.post_id));
      }

      return posts.map((p) => ({
        ...p,
        profile: profileMap.get(p.user_id) ?? null,
        is_liked: likedSet.has(p.id),
      })) as CommunityPost[];
    },
    enabled: true,
  });
}

// ── Comments ─────────────────────────────────────────────────────────────────

export function usePostComments(postId: string | null) {
  return useQuery<PostComment[]>({
    queryKey: ['post_comments', postId],
    queryFn: async () => {
      if (!postId) return [];
      const supabase = createClient();
      const { data: comments, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      if (!comments || comments.length === 0) return [];

      const userIds = [...new Set(comments.map((c) => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', userIds);
      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

      return comments.map((c) => ({ ...c, profile: profileMap.get(c.user_id) ?? null })) as PostComment[];
    },
    enabled: !!postId,
  });
}

// ── Share outfit ─────────────────────────────────────────────────────────────

interface ShareOutfitPayload {
  outfit_id: string | null;
  image_url: string;
  item_images: string[];
  caption: string;
  tags: string[];
}

export function useShareOutfit(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ShareOutfitPayload) => {
      if (!userId) throw new Error('Giriş yapmalısınız');
      const supabase = createClient();
      const { data, error } = await supabase
        .from('community_posts')
        .insert({
          user_id: userId,
          outfit_id: payload.outfit_id,
          image_url: payload.image_url,
          item_images: payload.item_images,
          caption: payload.caption || null,
          tags: payload.tags,
          like_count: 0,
          comment_count: 0,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community_feed'] });
    },
  });
}

// ── Like post ─────────────────────────────────────────────────────────────────

interface LikePostPayload {
  postId: string;
  isLiked: boolean;
}

export function useLikePost(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, isLiked }: LikePostPayload) => {
      if (!userId) throw new Error('Giriş yapmalısınız');
      const supabase = createClient();

      if (isLiked) {
        await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId);
      } else {
        await supabase.from('post_likes').insert({ post_id: postId, user_id: userId });
      }
      // Trigger handles like_count update automatically
    },
    onMutate: async ({ postId, isLiked }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['community_feed'] });
      const previous = queryClient.getQueriesData<CommunityPost[]>({ queryKey: ['community_feed'] });

      queryClient.setQueriesData<CommunityPost[]>({ queryKey: ['community_feed'] }, (old) => {
        if (!old) return old;
        return old.map((post) => {
          if (post.id !== postId) return post;
          return {
            ...post,
            is_liked: !isLiked,
            like_count: isLiked
              ? Math.max(0, post.like_count - 1)
              : post.like_count + 1,
          };
        });
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        for (const [queryKey, data] of context.previous) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['community_feed'] });
    },
  });
}

// ── Add comment ───────────────────────────────────────────────────────────────

interface AddCommentPayload {
  postId: string;
  content: string;
}

export function useAddComment(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, content }: AddCommentPayload) => {
      if (!userId) throw new Error('Giriş yapmalısınız');
      if (!content.trim()) throw new Error('Yorum boş olamaz');
      const supabase = createClient();

      const { data: comment, error } = await supabase
        .from('post_comments')
        .insert({ post_id: postId, user_id: userId, content: content.trim() })
        .select('*')
        .single();
      if (error) throw error;

      // Trigger handles comment_count update automatically
      return comment;
    },
    onSuccess: (_data, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['post_comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['community_feed'] });
    },
  });
}

// ── Delete post ───────────────────────────────────────────────────────────────

export function useDeletePost(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!userId) throw new Error('Giriş yapmalısınız');
      const supabase = createClient();
      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community_feed'] });
    },
  });
}
