'use client';

import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import {
  useFeed, usePostComments, useShareOutfit,
  useLikePost, useAddComment, useDeletePost,
} from '@/lib/hooks/useCommunity';
import type { CommunityPost } from '@/types/community.types';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'az önce';
  if (m < 60) return `${m}dk`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}sa`;
  return `${Math.floor(h / 24)}g`;
}

function UserAvatar({ avatarUrl, name, size = 32 }: { avatarUrl?: string | null; name?: string | null; size?: number }) {
  const initials = name ? name.charAt(0).toUpperCase() : '?';
  if (avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatarUrl} alt={name ?? ''} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#C41E3A', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.4, fontWeight: 700, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

// Outfit collage: büyük ana parça solda, diğerleri sağda yığılı
// Uniform grid — each piece fully visible (contain), absolutely positioned to fill parent
function OutfitCollage({ images }: { images: string[] }) {
  const imgs = images.filter(Boolean).slice(0, 4);

  const wrapStyle: React.CSSProperties = {
    width: '100%', height: '100%',
    display: 'grid',
    gap: 2,
    background: '#E8E2DB',
    overflow: 'hidden',
  };

  const imgStyle: React.CSSProperties = {
    width: '100%', height: '100%',
    minHeight: 0, minWidth: 0,
    objectFit: 'contain',
    display: 'block',
    background: '#F8F5F2',
    padding: 8,
    boxSizing: 'border-box',
  };

  if (imgs.length === 0) return <div style={{ width: '100%', height: '100%', background: '#F8F5F2' }} />;

  if (imgs.length === 1) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={imgs[0]} alt="kombin" style={{ ...imgStyle, padding: 20 }} />;
  }

  if (imgs.length === 2) {
    return (
      <div style={{ ...wrapStyle, gridTemplateColumns: '1fr 1fr' }}>
        {imgs.map((url, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={url} alt={`parça ${i + 1}`} style={imgStyle} />
        ))}
      </div>
    );
  }

  const twoRowStyle = { ...wrapStyle, gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gridTemplateRows: 'repeat(2, minmax(0,1fr))' };

  if (imgs.length === 3) {
    return (
      <div style={twoRowStyle}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imgs[0]} alt="parça 1" style={imgStyle} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imgs[1]} alt="parça 2" style={imgStyle} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imgs[2]} alt="parça 3" style={{ ...imgStyle, gridColumn: '1 / 3' }} />
      </div>
    );
  }

  // 4 items: 2x2
  return (
    <div style={twoRowStyle}>
      {imgs.map((url, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={i} src={url} alt={`parça ${i + 1}`} style={imgStyle} />
      ))}
    </div>
  );
}

// ── Post Detail Modal
function PostDetailModal({ post, currentUserId, onClose, onLike }: {
  post: CommunityPost;
  currentUserId: string | null;
  onClose: () => void;
  onLike: (postId: string, isLiked: boolean) => void;
}) {
  const [commentText, setCommentText] = useState('');
  const { data: comments = [], isLoading: commentsLoading } = usePostComments(post.id);
  const addComment = useAddComment(currentUserId);

  const displayImages = post.item_images?.length > 0 ? post.item_images : [post.image_url];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || addComment.isPending) return;
    try {
      await addComment.mutateAsync({ postId: post.id, content: commentText.trim() });
      setCommentText('');
    } catch { /* ignore */ }
  };

  return (
    <div className="post-modal-overlay" onClick={onClose}>
      <div className="post-modal-inner" onClick={e => e.stopPropagation()}>

        {/* Left: Outfit collage — fills full modal height */}
        <div className="post-modal-image">
          <OutfitCollage images={displayImages} />
        </div>

        {/* Right */}
        <div className="post-modal-right">
          {/* Header */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #E2DDD7', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <UserAvatar avatarUrl={post.profile?.avatar_url} name={post.profile?.full_name ?? post.profile?.username} size={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 600, fontSize: 13, color: '#1A1410', margin: 0 }}>{post.profile?.full_name ?? post.profile?.username ?? 'Kullanıcı'}</p>
              <p style={{ fontSize: 11, color: '#9B8FA0', margin: 0 }}>{timeAgo(post.created_at)}</p>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#9B8FA0' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 20, height: 20 }}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Caption + like + comment count */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #E2DDD7', flexShrink: 0 }}>
            {post.caption && <p style={{ fontSize: 13, color: '#1A1410', margin: '0 0 10px' }}>{post.caption}</p>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button onClick={() => onLike(post.id, post.is_liked ?? false)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, padding: 0 }}>
                <svg viewBox="0 0 24 24" stroke={post.is_liked ? '#C41E3A' : '#9B8FA0'} strokeWidth={2} fill={post.is_liked ? '#C41E3A' : 'none'} style={{ width: 20, height: 20 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
                <span style={{ fontSize: 13, color: post.is_liked ? '#C41E3A' : '#9B8FA0', fontWeight: 600 }}>{post.like_count}</span>
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#9B8FA0" strokeWidth={2} style={{ width: 18, height: 18 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
                </svg>
                <span style={{ fontSize: 13, color: '#9B8FA0', fontWeight: 600 }}>{post.comment_count}</span>
              </div>
            </div>
          </div>

          {/* Comments */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {commentsLoading && <p style={{ fontSize: 12, color: '#9B8FA0', textAlign: 'center' }}>Yükleniyor...</p>}
            {!commentsLoading && comments.length === 0 && (
              <p style={{ fontSize: 12, color: '#9B8FA0', textAlign: 'center', marginTop: 16 }}>İlk yorumu sen yap!</p>
            )}
            {comments.map(c => (
              <div key={c.id} style={{ display: 'flex', gap: 8 }}>
                <UserAvatar avatarUrl={c.profile?.avatar_url} name={c.profile?.full_name ?? c.profile?.username} size={28} />
                <div style={{ flex: 1 }}>
                  <div style={{ background: '#F0EBE3', borderRadius: 10, padding: '6px 10px' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#1A1410' }}>{c.profile?.full_name ?? c.profile?.username ?? 'Kullanıcı'}</span>
                    <p style={{ fontSize: 12, color: '#3D2B1F', margin: '2px 0 0' }}>{c.content}</p>
                  </div>
                  <p style={{ fontSize: 10, color: '#9B8FA0', margin: '3px 0 0 4px' }}>{timeAgo(c.created_at)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Comment input */}
          {currentUserId ? (
            <form onSubmit={handleSubmit} style={{ padding: '10px 12px', borderTop: '1px solid #E2DDD7', display: 'flex', gap: 8, flexShrink: 0 }}>
              <input
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Yorum yaz..."
                disabled={addComment.isPending}
                style={{ flex: 1, border: '1px solid #E2DDD7', borderRadius: 20, padding: '7px 14px', fontSize: 13, outline: 'none', background: '#F0EBE3', color: '#1A1410' }}
              />
              <button type="submit" disabled={!commentText.trim() || addComment.isPending}
                style={{ background: commentText.trim() ? '#C41E3A' : '#E2DDD7', color: commentText.trim() ? '#fff' : '#9B8FA0', border: 'none', borderRadius: 20, padding: '7px 16px', fontSize: 12, fontWeight: 600, cursor: commentText.trim() ? 'pointer' : 'default' }}>
                {addComment.isPending ? '...' : 'Gönder'}
              </button>
            </form>
          ) : (
            <div style={{ padding: '10px 16px', borderTop: '1px solid #E2DDD7', flexShrink: 0 }}>
              <p style={{ fontSize: 12, color: '#9B8FA0', textAlign: 'center', margin: 0 }}>Yorum yapmak için giriş yapın</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Post Card
function PostCard({ post, currentUserId, onOpenDetail, onLike, onDelete }: {
  post: CommunityPost;
  currentUserId: string | null;
  onOpenDetail: (post: CommunityPost) => void;
  onLike: (postId: string, isLiked: boolean) => void;
  onDelete: (postId: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [heartVisible, setHeartVisible] = useState(false);
  const lastTapRef = useRef<number>(0);
  const singleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isOwn = currentUserId === post.user_id;
  const displayImages = post.item_images?.length > 0 ? post.item_images : [post.image_url];

  const handleImageTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap — like + heart animation
      if (singleTapTimer.current) clearTimeout(singleTapTimer.current);
      onLike(post.id, post.is_liked ?? false);
      setHeartVisible(true);
      setTimeout(() => setHeartVisible(false), 900);
    } else {
      // Potential single tap — wait to confirm not double tap
      singleTapTimer.current = setTimeout(() => {
        onOpenDetail(post);
      }, 300);
    }
    lastTapRef.current = now;
  };

  return (
    <div
      style={{ borderRadius: 16, border: '1px solid #E2DDD7', background: '#fff', overflow: 'hidden', boxShadow: hovered ? '0 8px 24px rgba(26,20,16,0.12)' : '0 2px 8px rgba(26,20,16,0.05)', transition: 'box-shadow 0.2s' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Outfit collage — padding-bottom trick for reliable square */}
      <div style={{ position: 'relative', width: '100%', paddingBottom: '100%', overflow: 'hidden', cursor: 'pointer', background: '#F8F5F2' }} onClick={handleImageTap}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <OutfitCollage images={displayImages} />
        </div>

        {/* Double-tap heart animation */}
        {heartVisible && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 10 }}>
            <svg viewBox="0 0 24 24" fill="#C41E3A" style={{ width: 80, height: 80, filter: 'drop-shadow(0 2px 8px rgba(196,30,58,0.5))', animation: 'heartPop 0.9s ease forwards' }}>
              <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </div>
        )}

        {/* Hover overlay */}
        {hovered && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,20,16,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: 10, gap: 6 }}>
            <button onClick={e => { e.stopPropagation(); onLike(post.id, post.is_liked ?? false); }}
              style={{ background: 'rgba(255,255,255,0.92)', border: 'none', borderRadius: 99, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
              <svg viewBox="0 0 24 24" stroke={post.is_liked ? '#C41E3A' : '#1A1410'} strokeWidth={2} fill={post.is_liked ? '#C41E3A' : 'none'} style={{ width: 14, height: 14 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
              {post.like_count}
            </button>
            <button onClick={e => { e.stopPropagation(); onOpenDetail(post); }}
              style={{ background: 'rgba(255,255,255,0.92)', border: 'none', borderRadius: 99, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#1A1410" strokeWidth={2} style={{ width: 14, height: 14 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
              </svg>
              {post.comment_count}
            </button>
          </div>
        )}

        {/* Delete own post */}
        {isOwn && (
          <button onClick={e => { e.stopPropagation(); onDelete(post.id); }}
            style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#C41E3A" strokeWidth={2} style={{ width: 13, height: 13 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserAvatar avatarUrl={post.profile?.avatar_url} name={post.profile?.full_name ?? post.profile?.username} size={24} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#1A1410', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {post.profile?.full_name ?? post.profile?.username ?? 'Kullanıcı'}
          </span>
          <span style={{ fontSize: 11, color: '#9B8FA0', flexShrink: 0 }}>{timeAgo(post.created_at)}</span>
        </div>
        {post.caption && (
          <p style={{ fontSize: 12, color: '#3D2B1F', margin: '6px 0 0', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {post.caption}
          </p>
        )}
        {post.tags?.length > 0 && (
          <p style={{ fontSize: 11, color: '#9B8FA0', margin: '4px 0 0' }}>
            🏷️ {post.tags[0]}
          </p>
        )}
        {/* Like + comment — clickable */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
          <button
            onClick={() => onLike(post.id, post.is_liked ?? false)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: post.is_liked ? '#C41E3A' : '#9B8FA0', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600 }}
          >
            <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} fill={post.is_liked ? 'currentColor' : 'none'} style={{ width: 15, height: 15 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
            {post.like_count}
          </button>
          <button
            onClick={() => onOpenDetail(post)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#9B8FA0', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600 }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 15, height: 15 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
            </svg>
            {post.comment_count}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page
export default function KesfetPage() {
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [showOwnOnly, setShowOwnOnly] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ['current_user'],
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });
  const currentUserId = currentUser?.id ?? null;

  const { data: rawPosts = [], isLoading } = useFeed(currentUserId);
  const likePost = useLikePost(currentUserId);
  const deletePost = useDeletePost(currentUserId);

  const posts = showOwnOnly ? rawPosts.filter(p => p.user_id === currentUserId) : rawPosts;

  // Derive selectedPost live from feed — always up-to-date after refetch
  const selectedPost = rawPosts.find(p => p.id === selectedPostId) ?? null;

  const handleLike = (postId: string, isLiked: boolean) => {
    if (!currentUserId) return;
    likePost.mutate({ postId, isLiked });
  };

  const handleDelete = (postId: string) => {
    if (!confirm('Bu gönderiyi silmek istediğine emin misin?')) return;
    deletePost.mutate(postId);
    if (selectedPostId === postId) setSelectedPostId(null);
  };

  return (
    <div className="kesfet-page" style={{ minHeight: '100vh', background: '#F0EBE3' }}>
      <style>{`
        /* ── Double-tap heart animation ── */
        @keyframes heartPop {
          0%   { opacity: 0; transform: scale(0.4); }
          30%  { opacity: 1; transform: scale(1.2); }
          60%  { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.1); }
        }

        /* ── Ana sayfa ── */
        .kesfet-page { padding: 24px 20px 80px; }
        @media (max-width: 640px) { .kesfet-page { padding: 16px 12px 90px; } }

        .kesfet-header { max-width: 1100px; margin: 0 auto 28px; }
        @media (max-width: 640px) { .kesfet-header { margin-bottom: 16px; } }

        .kesfet-title { font-size: 28px; font-weight: 800; color: #1A1410; margin: 0 0 4px; }
        @media (max-width: 640px) { .kesfet-title { font-size: 22px; } }

        /* ── Grid ── */
        .kesfet-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        @media (max-width: 900px) { .kesfet-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; } }
        @media (max-width: 540px) { .kesfet-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; } }

        /* ── Post detail modal overlay ── */
        .post-modal-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(0,0,0,0.8);
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
        }
        @media (max-width: 640px) {
          .post-modal-overlay { align-items: flex-end; padding: 0; }
        }

        /* ── Post detail modal inner ── */
        .post-modal-inner {
          display: flex; flex-direction: row;
          max-width: 860px; width: 100%;
          height: min(560px, 90vh);
          background: #fff; border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 25px 50px rgba(0,0,0,0.5);
        }
        @media (max-width: 640px) {
          .post-modal-inner {
            flex-direction: column;
            height: 92vh; max-width: 100%;
            border-radius: 20px 20px 0 0;
          }
        }

        .post-modal-image { flex: 0 0 48%; position: relative; overflow: hidden; background: #F8F5F2; }
        @media (max-width: 640px) { .post-modal-image { flex: 0 0 42%; width: 100%; } }

        .post-modal-right { flex: 1; display: flex; flex-direction: column; min-width: 0; overflow: hidden; }

        /* ── Share modal overlay ── */
        .share-modal-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(0,0,0,0.75);
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
        }
        @media (max-width: 640px) {
          .share-modal-overlay { align-items: flex-end; padding: 0; }
        }

        /* ── Share modal inner ── */
        .share-modal-inner {
          background: #fff; border-radius: 16px; padding: 24px;
          width: 100%; max-width: 520px;
          max-height: 90vh; overflow-y: auto;
          box-shadow: 0 25px 50px rgba(0,0,0,0.4);
        }
        @media (max-width: 640px) {
          .share-modal-inner {
            border-radius: 20px 20px 0 0;
            max-width: 100%; height: 92vh; max-height: 92vh;
            padding: 20px 16px;
          }
        }

        /* ── Floating share button ── */
        .kesfet-fab { position: fixed; bottom: 28px; right: 28px; z-index: 100; }
        @media (max-width: 640px) { .kesfet-fab { bottom: 80px; right: 16px; } }

        /* ── Clothes grid in share modal ── */
        .clothes-share-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
        @media (max-width: 400px) { .clothes-share-grid { grid-template-columns: repeat(2, 1fr); } }
      `}</style>

      {/* Header */}
      <div className="kesfet-header">
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="kesfet-title">Keşfet</h1>
            <p style={{ fontSize: 14, color: '#9B8FA0', margin: 0 }}>Topluluğun stilini keşfet</p>
          </div>
          <button onClick={() => setShowOwnOnly(v => !v)}
            style={{ border: `1.5px solid ${showOwnOnly ? '#C41E3A' : '#E2DDD7'}`, background: showOwnOnly ? 'rgba(196,30,58,0.07)' : '#fff', color: showOwnOnly ? '#C41E3A' : '#3D2B1F', borderRadius: 20, padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {showOwnOnly ? '✓ Paylaştıklarım' : 'Paylaştıklarım'}
          </button>
        </div>
      </div>

      {/* Feed */}
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {isLoading ? (
          <div className="kesfet-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ borderRadius: 16, background: '#E8E2DB', aspectRatio: '1' }} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ fontSize: 16, color: '#9B8FA0', marginBottom: 8 }}>
              {showOwnOnly ? 'Henüz bir şey paylaşmadın.' : 'Toplulukta henüz gönderi yok.'}
            </p>
            {currentUserId && (
              <p style={{ fontSize: 14, color: '#C41E3A', cursor: 'pointer', fontWeight: 600 }} onClick={() => setShareOpen(true)}>
                İlk kombini sen paylaş!
              </p>
            )}
          </div>
        ) : (
          <div className="kesfet-grid">
            {posts.map(post => (
              <PostCard key={post.id} post={post} currentUserId={currentUserId} onOpenDetail={p => setSelectedPostId(p.id)} onLike={handleLike} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {/* Floating share button */}
      {currentUserId && (
        <button onClick={() => setShareOpen(true)} className="kesfet-fab"
          style={{ background: '#C41E3A', color: '#fff', border: 'none', borderRadius: 99, padding: '13px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 20px rgba(196,30,58,0.4)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Paylaş
        </button>
      )}

      {selectedPost && (
        <PostDetailModal post={selectedPost} currentUserId={currentUserId} onClose={() => setSelectedPostId(null)} onLike={handleLike} />
      )}

      {shareOpen && currentUserId && (
        <ShareFromKesfet currentUserId={currentUserId} onClose={() => setShareOpen(false)} />
      )}
    </div>
  );
}

// ── Share modal (from Keşfet page)
function ShareFromKesfet({ currentUserId, onClose }: { currentUserId: string; onClose: () => void }) {
  const [caption, setCaption] = useState('');
  const [sourceInput, setSourceInput] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const shareOutfit = useShareOutfit(currentUserId);

  interface ClothOption { id: string; image_url: string; name: string | null; category: string | null; }
  const { data: clothes = [] } = useQuery<ClothOption[]>({
    queryKey: ['user_clothes_for_share', currentUserId],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('clothes')
        .select('id, image_url, name, category')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false });
      return (data ?? []) as ClothOption[];
    },
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectedItems = clothes.filter(c => selectedIds.has(c.id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) return;
    const tags = sourceInput.trim() ? [sourceInput.trim()] : [];
    const itemImages = selectedItems.map(c => c.image_url);
    await shareOutfit.mutateAsync({
      outfit_id: null,
      image_url: itemImages[0],
      item_images: itemImages,
      caption,
      tags,
    });
    onClose();
  };

  return (
    <div className="share-modal-overlay" onClick={onClose}>
      <div className="share-modal-inner" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A1410', margin: 0 }}>Kombin Paylaş</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9B8FA0', padding: 4 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 20, height: 20 }}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <p style={{ fontSize: 13, color: '#3D2B1F', marginBottom: 10, fontWeight: 500 }}>
            Parçayı seç
            {selectedIds.size > 0 && <span style={{ color: '#C41E3A', marginLeft: 8 }}>({selectedIds.size} seçildi)</span>}
          </p>
          {clothes.length === 0 ? (
            <p style={{ fontSize: 12, color: '#9B8FA0', padding: '12px 0' }}>Dolabında henüz kıyafet yok.</p>
          ) : (
            <div className="clothes-share-grid">
              {clothes.map(c => (
                <button key={c.id} type="button" onClick={() => toggleSelect(c.id)}
                  style={{ border: selectedIds.has(c.id) ? '2.5px solid #C41E3A' : '2px solid #E2DDD7', borderRadius: 12, overflow: 'hidden', padding: 0, cursor: 'pointer', aspectRatio: '1', background: '#F8F5F2', position: 'relative' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.image_url} alt={c.name ?? ''} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8, boxSizing: 'border-box' }} />
                  {selectedIds.has(c.id) && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(196,30,58,0.12)', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', padding: 4 }}>
                      <div style={{ background: '#C41E3A', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} style={{ width: 11, height: 11 }}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
          <textarea value={caption} onChange={e => setCaption(e.target.value)} placeholder="Kombini anlat..." rows={2}
            style={{ width: '100%', border: '1px solid #E2DDD7', borderRadius: 10, padding: '10px 12px', fontSize: 13, outline: 'none', background: '#F0EBE3', color: '#1A1410', resize: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 15, pointerEvents: 'none' }}>🏷️</span>
            <input
              value={sourceInput}
              onChange={e => setSourceInput(e.target.value)}
              placeholder="Bu kıyafetleri nereden aldın? (Zara, Trendyol...)"
              style={{ width: '100%', border: '1px solid #E2DDD7', borderRadius: 10, padding: '9px 12px 9px 34px', fontSize: 13, outline: 'none', background: '#F0EBE3', color: '#1A1410', boxSizing: 'border-box' }}
            />
          </div>
          <button type="submit" disabled={selectedIds.size === 0 || shareOutfit.isPending}
            style={{ width: '100%', background: selectedIds.size > 0 ? '#C41E3A' : '#E2DDD7', color: selectedIds.size > 0 ? '#fff' : '#9B8FA0', border: 'none', borderRadius: 10, padding: '12px 0', fontSize: 14, fontWeight: 700, cursor: selectedIds.size > 0 ? 'pointer' : 'default' }}>
            {shareOutfit.isPending ? 'Paylaşılıyor...' : 'Paylaş'}
          </button>
        </form>
      </div>
    </div>
  );
}
