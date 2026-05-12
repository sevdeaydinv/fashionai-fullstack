'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity,
  Modal, ScrollView, TextInput, ActivityIndicator, Alert,
  Dimensions, KeyboardAvoidingView, Platform, RefreshControl,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase/client';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 36) / 2;

// ── Types ────────────────────────────────────────────────────────────────────

interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

interface CommunityPost {
  id: string;
  user_id: string;
  outfit_id: string | null;
  caption: string | null;
  image_url: string;
  item_images: string[];
  tags: string[];
  like_count: number;
  comment_count: number;
  created_at: string;
  profile: Profile | null;
  is_liked: boolean;
}

interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile: Profile | null;
}

interface ClothOption {
  id: string;
  image_url: string;
  name: string | null;
  category: string | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'az önce';
  if (m < 60) return `${m}dk`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}sa`;
  return `${Math.floor(h / 24)}g`;
}

// ── UserAvatar ────────────────────────────────────────────────────────────────

function UserAvatar({ url, name, size = 32 }: { url?: string | null; name?: string | null; size?: number }) {
  const initials = name ? name.charAt(0).toUpperCase() : '?';
  if (url) {
    return <Image source={{ uri: url }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#C41E3A', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontSize: size * 0.4, fontWeight: '700' }}>{initials}</Text>
    </View>
  );
}

// ── OutfitCollage ─────────────────────────────────────────────────────────────

function OutfitCollage({ images, size }: { images: string[]; size: number }) {
  const imgs = images.filter(Boolean).slice(0, 4);

  if (imgs.length === 0) {
    return <View style={{ width: size, height: size, backgroundColor: '#F8F5F2' }} />;
  }

  const imgStyle = { backgroundColor: '#F8F5F2' };

  if (imgs.length === 1) {
    return (
      <Image
        source={{ uri: imgs[0] }}
        style={{ width: size, height: size, ...imgStyle }}
        resizeMode="contain"
      />
    );
  }

  if (imgs.length === 2) {
    const half = (size - 1) / 2;
    return (
      <View style={{ width: size, height: size, flexDirection: 'row', gap: 1, backgroundColor: '#E8E2DB' }}>
        {imgs.map((url, i) => (
          <Image key={i} source={{ uri: url }} style={{ width: half, height: size, ...imgStyle }} resizeMode="contain" />
        ))}
      </View>
    );
  }

  const half = (size - 1) / 2;

  if (imgs.length === 3) {
    return (
      <View style={{ width: size, height: size, backgroundColor: '#E8E2DB', gap: 1 }}>
        <View style={{ flexDirection: 'row', gap: 1, height: half }}>
          <Image source={{ uri: imgs[0] }} style={{ width: half, height: half, ...imgStyle }} resizeMode="contain" />
          <Image source={{ uri: imgs[1] }} style={{ width: half, height: half, ...imgStyle }} resizeMode="contain" />
        </View>
        <Image source={{ uri: imgs[2] }} style={{ width: size, height: half, ...imgStyle }} resizeMode="contain" />
      </View>
    );
  }

  // 4 items
  return (
    <View style={{ width: size, height: size, backgroundColor: '#E8E2DB', gap: 1 }}>
      <View style={{ flexDirection: 'row', gap: 1, height: half }}>
        <Image source={{ uri: imgs[0] }} style={{ width: half, height: half, ...imgStyle }} resizeMode="contain" />
        <Image source={{ uri: imgs[1] }} style={{ width: half, height: half, ...imgStyle }} resizeMode="contain" />
      </View>
      <View style={{ flexDirection: 'row', gap: 1, height: half }}>
        <Image source={{ uri: imgs[2] }} style={{ width: half, height: half, ...imgStyle }} resizeMode="contain" />
        <Image source={{ uri: imgs[3] }} style={{ width: half, height: half, ...imgStyle }} resizeMode="contain" />
      </View>
    </View>
  );
}

// ── Post Detail Modal ─────────────────────────────────────────────────────────

function PostDetailModal({
  post, currentUserId, onClose, onLike, onRefresh,
}: {
  post: CommunityPost;
  currentUserId: string | null;
  onClose: () => void;
  onLike: (postId: string, isLiked: boolean) => void;
  onRefresh: () => void;
}) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const displayImages = post.item_images?.length > 0 ? post.item_images : [post.image_url];
  const collageSize = width - 48;

  useEffect(() => {
    loadComments();
  }, [post.id]);

  const loadComments = async () => {
    setLoadingComments(true);
    const { data: rows } = await supabase
      .from('post_comments')
      .select('*')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });

    if (!rows || rows.length === 0) { setComments([]); setLoadingComments(false); return; }

    const userIds = [...new Set(rows.map((c: any) => c.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url')
      .in('id', userIds);

    const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    setComments(rows.map((c: any) => ({ ...c, profile: profileMap.get(c.user_id) ?? null })));
    setLoadingComments(false);
  };

  const handleSubmit = async () => {
    if (!commentText.trim() || !currentUserId || submitting) return;
    setSubmitting(true);
    await supabase.from('post_comments').insert({ post_id: post.id, user_id: currentUserId, content: commentText.trim() });
    setCommentText('');
    setSubmitting(false);
    loadComments();
    onRefresh();
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <UserAvatar url={post.profile?.avatar_url} name={post.profile?.full_name ?? post.profile?.username} size={36} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.modalUsername}>{post.profile?.full_name ?? post.profile?.username ?? 'Kullanıcı'}</Text>
            <Text style={styles.modalTime}>{timeAgo(post.created_at)}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color="#9B8FA0" />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <ScrollView style={{ flex: 1 }}>
            {/* Outfit collage */}
            <View style={{ alignItems: 'center', backgroundColor: '#F8F5F2', padding: 12 }}>
              <OutfitCollage images={displayImages} size={collageSize} />
            </View>

            {/* Caption + likes */}
            <View style={styles.captionBlock}>
              {post.caption ? <Text style={styles.captionText}>{post.caption}</Text> : null}
              {post.tags?.length > 0 && (
                <Text style={styles.tagText}>🏷️ {post.tags[0]}</Text>
              )}
              <View style={styles.likeRow}>
                <TouchableOpacity onPress={() => { onLike(post.id, post.is_liked); }} style={styles.likeBtn}>
                  <Ionicons name={post.is_liked ? 'heart' : 'heart-outline'} size={22} color={post.is_liked ? '#C41E3A' : '#9B8FA0'} />
                  <Text style={[styles.likeBtnText, post.is_liked && { color: '#C41E3A' }]}>{post.like_count}</Text>
                </TouchableOpacity>
                <View style={styles.likeBtn}>
                  <Ionicons name="chatbubble-outline" size={20} color="#9B8FA0" />
                  <Text style={styles.likeBtnText}>{post.comment_count}</Text>
                </View>
              </View>
            </View>

            {/* Comments */}
            <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
              <Text style={styles.commentsTitle}>Yorumlar</Text>
              {loadingComments && <ActivityIndicator color="#C41E3A" style={{ marginVertical: 12 }} />}
              {!loadingComments && comments.length === 0 && (
                <Text style={styles.emptyComment}>İlk yorumu sen yap!</Text>
              )}
              {comments.map(c => (
                <View key={c.id} style={styles.commentRow}>
                  <UserAvatar url={c.profile?.avatar_url} name={c.profile?.full_name ?? c.profile?.username} size={28} />
                  <View style={styles.commentBubble}>
                    <Text style={styles.commentUser}>{c.profile?.full_name ?? c.profile?.username ?? 'Kullanıcı'}</Text>
                    <Text style={styles.commentText}>{c.content}</Text>
                    <Text style={styles.commentTime}>{timeAgo(c.created_at)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Comment input */}
          {currentUserId ? (
            <View style={styles.commentInputRow}>
              <TextInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Yorum yaz..."
                placeholderTextColor="#9B8FA0"
                style={styles.commentInput}
                multiline={false}
                returnKeyType="send"
                onSubmitEditing={handleSubmit}
              />
              <TouchableOpacity onPress={handleSubmit} disabled={!commentText.trim() || submitting} style={[styles.sendBtn, !commentText.trim() && { opacity: 0.4 }]}>
                {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={18} color="#fff" />}
              </TouchableOpacity>
            </View>
          ) : null}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

// ── Share Modal ───────────────────────────────────────────────────────────────

function ShareModal({
  currentUserId, onClose, onShared,
}: {
  currentUserId: string;
  onClose: () => void;
  onShared: () => void;
}) {
  const [clothes, setClothes] = useState<ClothOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [caption, setCaption] = useState('');
  const [source, setSource] = useState('');
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    supabase
      .from('clothes')
      .select('id, image_url, name, category')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setClothes(data ?? []); setLoading(false); });
  }, []);

  const toggle = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleShare = async () => {
    if (selectedIds.size === 0) return;
    setSharing(true);
    const selectedItems = clothes.filter(c => selectedIds.has(c.id));
    const itemImages = selectedItems.map(c => c.image_url);
    const tags = source.trim() ? [source.trim()] : [];

    const { error } = await supabase.from('community_posts').insert({
      user_id: currentUserId,
      outfit_id: null,
      image_url: itemImages[0],
      item_images: itemImages,
      caption: caption.trim() || null,
      tags,
      like_count: 0,
      comment_count: 0,
    });

    setSharing(false);
    if (error) { Alert.alert('Hata', 'Paylaşım başarısız.'); return; }
    onShared();
    onClose();
  };

  const itemSize = (width - 32 - 20) / 3;

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1410', flex: 1 }}>Kombin Paylaş</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color="#9B8FA0" />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>

            {/* Clothes grid */}
            <Text style={styles.sectionLabel}>
              Parçayı seç
              {selectedIds.size > 0 && <Text style={{ color: '#C41E3A' }}> ({selectedIds.size} seçildi)</Text>}
            </Text>

            {loading ? (
              <ActivityIndicator color="#C41E3A" style={{ marginVertical: 20 }} />
            ) : clothes.length === 0 ? (
              <Text style={{ color: '#9B8FA0', fontSize: 13, marginVertical: 12 }}>Dolabında henüz kıyafet yok.</Text>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {clothes.map(c => (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => toggle(c.id)}
                    style={[
                      styles.clothThumb,
                      { width: itemSize, height: itemSize },
                      selectedIds.has(c.id) && styles.clothThumbSelected,
                    ]}
                  >
                    <Image source={{ uri: c.image_url }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                    {selectedIds.has(c.id) && (
                      <View style={styles.checkOverlay}>
                        <View style={styles.checkBadge}>
                          <Ionicons name="checkmark" size={12} color="#fff" />
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Caption */}
            <TextInput
              value={caption}
              onChangeText={setCaption}
              placeholder="Kombini anlat..."
              placeholderTextColor="#9B8FA0"
              style={styles.textArea}
              multiline
              numberOfLines={3}
            />

            {/* Source */}
            <View style={styles.inputWithIcon}>
              <Text style={styles.inputIcon}>🏷️</Text>
              <TextInput
                value={source}
                onChangeText={setSource}
                placeholder="Bu kıyafetleri nereden aldın? (Zara, Trendyol...)"
                placeholderTextColor="#9B8FA0"
                style={styles.inputInner}
              />
            </View>

            {/* Submit */}
            <TouchableOpacity
              onPress={handleShare}
              disabled={selectedIds.size === 0 || sharing}
              style={[styles.shareBtn, selectedIds.size === 0 && styles.shareBtnDisabled]}
            >
              {sharing
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.shareBtnText}>Paylaş</Text>
              }
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

// ── Post Card ─────────────────────────────────────────────────────────────────

function PostCard({
  post, currentUserId, onOpenDetail, onLike, onDelete,
}: {
  post: CommunityPost;
  currentUserId: string | null;
  onOpenDetail: () => void;
  onLike: (postId: string, isLiked: boolean) => void;
  onDelete: (postId: string) => void;
}) {
  const displayImages = post.item_images?.length > 0 ? post.item_images : [post.image_url];
  const isOwn = currentUserId === post.user_id;
  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={onOpenDetail} activeOpacity={0.85}>
        <OutfitCollage images={displayImages} size={CARD_SIZE} />
      </TouchableOpacity>

      {/* Delete button */}
      {isOwn && (
        <TouchableOpacity
          onPress={() => Alert.alert('Sil', 'Bu gönderiyi silmek istediğine emin misin?', [
            { text: 'İptal', style: 'cancel' },
            { text: 'Sil', style: 'destructive', onPress: () => onDelete(post.id) },
          ])}
          style={styles.deleteBtn}
        >
          <Ionicons name="trash-outline" size={13} color="#C41E3A" />
        </TouchableOpacity>
      )}

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.cardUser}>
          <UserAvatar url={post.profile?.avatar_url} name={post.profile?.full_name ?? post.profile?.username} size={20} />
          <Text style={styles.cardUsername} numberOfLines={1}>
            {post.profile?.full_name ?? post.profile?.username ?? 'Kullanıcı'}
          </Text>
        </View>

        {post.caption ? (
          <Text style={styles.cardCaption} numberOfLines={2}>{post.caption}</Text>
        ) : null}

        {post.tags?.length > 0 && (
          <Text style={styles.cardTag} numberOfLines={1}>🏷️ {post.tags[0]}</Text>
        )}

        <View style={styles.cardActions}>
          <TouchableOpacity onPress={() => onLike(post.id, post.is_liked)} style={styles.actionBtn}>
            <Ionicons name={post.is_liked ? 'heart' : 'heart-outline'} size={15} color={post.is_liked ? '#C41E3A' : '#9B8FA0'} />
            <Text style={[styles.actionCount, post.is_liked && { color: '#C41E3A' }]}>{post.like_count}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onOpenDetail} style={styles.actionBtn}>
            <Ionicons name="chatbubble-outline" size={14} color="#9B8FA0" />
            <Text style={styles.actionCount}>{post.comment_count}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function KesfetPage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showOwnOnly, setShowOwnOnly] = useState(false);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id ?? null);
    });
  }, []);

  const loadFeed = useCallback(async () => {
    const { data: rawPosts } = await supabase
      .from('community_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(60);

    if (!rawPosts || rawPosts.length === 0) { setPosts([]); return; }

    const userIds = [...new Set(rawPosts.map((p: any) => p.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url')
      .in('id', userIds);

    const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

    let likedSet = new Set<string>();
    const uid = (await supabase.auth.getUser()).data.user?.id;
    if (uid) {
      const postIds = rawPosts.map((p: any) => p.id);
      const { data: likes } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', uid)
        .in('post_id', postIds);
      likedSet = new Set((likes ?? []).map((l: any) => l.post_id));
    }

    const mapped: CommunityPost[] = rawPosts.map((p: any) => ({
      ...p,
      item_images: p.item_images ?? [],
      tags: p.tags ?? [],
      profile: profileMap.get(p.user_id) ?? null,
      is_liked: likedSet.has(p.id),
    }));

    setPosts(mapped);
    // Keep selected post in sync
    setSelectedPost(prev => prev ? (mapped.find(p => p.id === prev.id) ?? null) : null);
  }, []);

  useEffect(() => {
    setLoading(true);
    loadFeed().finally(() => setLoading(false));
  }, [loadFeed]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFeed();
    setRefreshing(false);
  }, [loadFeed]);

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!currentUserId) return;

    // Optimistic update
    setPosts(prev => prev.map(p => p.id !== postId ? p : {
      ...p,
      is_liked: !isLiked,
      like_count: isLiked ? Math.max(0, p.like_count - 1) : p.like_count + 1,
    }));
    setSelectedPost(prev => prev?.id !== postId ? prev : {
      ...prev!,
      is_liked: !isLiked,
      like_count: isLiked ? Math.max(0, prev!.like_count - 1) : prev!.like_count + 1,
    });

    if (isLiked) {
      await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', currentUserId);
    } else {
      await supabase.from('post_likes').insert({ post_id: postId, user_id: currentUserId });
    }
  };

  const handleDelete = async (postId: string) => {
    await supabase.from('community_posts').delete().eq('id', postId).eq('user_id', currentUserId!);
    setPosts(prev => prev.filter(p => p.id !== postId));
    if (selectedPost?.id === postId) setSelectedPost(null);
  };

  const filtered = showOwnOnly ? posts.filter(p => p.user_id === currentUserId) : posts;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Keşfet</Text>
          <Text style={styles.headerSub}>Topluluğun stilini keşfet</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowOwnOnly(v => !v)}
          style={[styles.filterBtn, showOwnOnly && styles.filterBtnActive]}
        >
          {showOwnOnly && <Ionicons name="checkmark" size={13} color="#C41E3A" style={{ marginRight: 3 }} />}
          <Text style={[styles.filterBtnText, showOwnOnly && { color: '#C41E3A' }]}>
            Paylaştıklarım
          </Text>
        </TouchableOpacity>
      </View>

      {/* Feed */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#C41E3A" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          extraData={posts}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C41E3A" />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="shirt-outline" size={48} color="#C9BEB5" />
              <Text style={styles.emptyText}>
                {showOwnOnly ? 'Henüz bir şey paylaşmadın.' : 'Toplulukta henüz gönderi yok.'}
              </Text>
              {currentUserId && !showOwnOnly && (
                <TouchableOpacity onPress={() => setShareOpen(true)}>
                  <Text style={styles.emptyAction}>İlk kombini sen paylaş!</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <PostCard
              post={item}
              currentUserId={currentUserId}
              onOpenDetail={() => setSelectedPost(item)}
              onLike={handleLike}
              onDelete={handleDelete}
            />
          )}
        />
      )}

      {/* Floating share button */}
      {currentUserId && (
        <TouchableOpacity onPress={() => setShareOpen(true)} style={styles.fab}>
          <Ionicons name="add" size={22} color="#fff" />
          <Text style={styles.fabText}>Paylaş</Text>
        </TouchableOpacity>
      )}

      {/* Post detail modal */}
      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          currentUserId={currentUserId}
          onClose={() => setSelectedPost(null)}
          onLike={handleLike}
          onRefresh={loadFeed}
        />
      )}

      {/* Share modal */}
      {shareOpen && currentUserId && (
        <ShareModal
          currentUserId={currentUserId}
          onClose={() => setShareOpen(false)}
          onShared={loadFeed}
        />
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0EBE3' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1A1410' },
  headerSub: { fontSize: 13, color: '#9B8FA0', marginTop: 2 },
  filterBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E2DDD7', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#fff',
  },
  filterBtnActive: { borderColor: '#C41E3A', backgroundColor: 'rgba(196,30,58,0.07)' },
  filterBtnText: { fontSize: 12, fontWeight: '600', color: '#3D2B1F' },

  listContent: { paddingHorizontal: 12, paddingBottom: 100 },
  row: { justifyContent: 'space-between', marginBottom: 12 },

  card: {
    width: CARD_SIZE, borderRadius: 14,
    backgroundColor: '#fff', overflow: 'hidden',
    borderWidth: 1, borderColor: '#E2DDD7',
    shadowColor: '#1A1410', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  deleteBtn: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 99,
    width: 26, height: 26, alignItems: 'center', justifyContent: 'center',
    zIndex: 2,
  },
  cardFooter: { padding: 10 },
  cardUser: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  cardUsername: { fontSize: 11, fontWeight: '600', color: '#1A1410', flex: 1 },
  cardCaption: { fontSize: 11, color: '#3D2B1F', marginBottom: 2, lineHeight: 15 },
  cardTag: { fontSize: 10, color: '#9B8FA0', marginBottom: 4 },
  cardActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  actionCount: { fontSize: 11, color: '#9B8FA0', fontWeight: '600' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyText: { fontSize: 14, color: '#9B8FA0', marginTop: 12, textAlign: 'center' },
  emptyAction: { fontSize: 14, color: '#C41E3A', fontWeight: '700', marginTop: 8 },

  fab: {
    position: 'absolute', bottom: 16, right: 16,
    backgroundColor: '#C41E3A', borderRadius: 99,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 18, paddingVertical: 13,
    shadowColor: '#C41E3A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
  },
  fabText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Modal
  modalHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#E2DDD7',
  },
  modalUsername: { fontSize: 14, fontWeight: '700', color: '#1A1410' },
  modalTime: { fontSize: 11, color: '#9B8FA0', marginTop: 1 },
  closeBtn: { padding: 4, marginLeft: 8 },

  captionBlock: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#E2DDD7' },
  captionText: { fontSize: 14, color: '#1A1410', marginBottom: 6, lineHeight: 20 },
  tagText: { fontSize: 12, color: '#9B8FA0', marginBottom: 8 },
  likeRow: { flexDirection: 'row', gap: 16 },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  likeBtnText: { fontSize: 14, color: '#9B8FA0', fontWeight: '600' },

  commentsTitle: { fontSize: 13, fontWeight: '700', color: '#1A1410', marginBottom: 12 },
  emptyComment: { fontSize: 12, color: '#9B8FA0', textAlign: 'center', marginVertical: 16 },
  commentRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  commentBubble: { flex: 1, backgroundColor: '#F0EBE3', borderRadius: 10, padding: 8 },
  commentUser: { fontSize: 11, fontWeight: '700', color: '#1A1410', marginBottom: 2 },
  commentText: { fontSize: 13, color: '#3D2B1F', lineHeight: 18 },
  commentTime: { fontSize: 10, color: '#9B8FA0', marginTop: 3 },

  commentInputRow: {
    flexDirection: 'row', gap: 8, padding: 12,
    borderTopWidth: 1, borderTopColor: '#E2DDD7', backgroundColor: '#fff',
  },
  commentInput: {
    flex: 1, backgroundColor: '#F0EBE3', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, color: '#1A1410',
  },
  sendBtn: {
    backgroundColor: '#C41E3A', borderRadius: 99,
    width: 38, height: 38, alignItems: 'center', justifyContent: 'center',
  },

  // Share modal
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#3D2B1F', marginBottom: 10 },
  clothThumb: {
    borderRadius: 10, overflow: 'hidden',
    borderWidth: 2, borderColor: '#E2DDD7', backgroundColor: '#F8F5F2',
  },
  clothThumbSelected: { borderColor: '#C41E3A', borderWidth: 2.5 },
  checkOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(196,30,58,0.12)',
    alignItems: 'flex-end', justifyContent: 'flex-start', padding: 4,
  },
  checkBadge: {
    backgroundColor: '#C41E3A', borderRadius: 99,
    width: 18, height: 18, alignItems: 'center', justifyContent: 'center',
  },
  textArea: {
    backgroundColor: '#F0EBE3', borderRadius: 10, borderWidth: 1, borderColor: '#E2DDD7',
    padding: 12, fontSize: 14, color: '#1A1410', marginBottom: 10,
    minHeight: 70, textAlignVertical: 'top',
  },
  inputWithIcon: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F0EBE3', borderRadius: 10, borderWidth: 1, borderColor: '#E2DDD7',
    paddingLeft: 12, marginBottom: 16,
  },
  inputIcon: { fontSize: 16, marginRight: 6 },
  inputInner: { flex: 1, paddingVertical: 10, paddingRight: 12, fontSize: 14, color: '#1A1410' },
  shareBtn: {
    backgroundColor: '#C41E3A', borderRadius: 10,
    paddingVertical: 14, alignItems: 'center',
  },
  shareBtnDisabled: { backgroundColor: '#E2DDD7' },
  shareBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
