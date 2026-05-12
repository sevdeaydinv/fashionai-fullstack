import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Image, ActivityIndicator, Modal, Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface ClothingItem {
  id: string;
  name: string;
  category: string;
  image_url: string;
  brand: string | null;
  color: string;
}

interface OutfitItem {
  id: string;
  cloth_id: string;
  role: string;
  layer_order: number;
  cloth: ClothingItem;
}

interface Outfit {
  id: string;
  name: string | null;
  event: string | null;
  season: string | null;
  is_favorite: boolean;
  cover_image_url: string | null;
  ai_score: number | null;
  worn_at: string | null;
  items: OutfitItem[];
}

const ROLE_FILTER: Record<string, string[]> = {
  top:    ['shirt','tshirt','blouse','sweater','jacket','coat','dress'],
  bottom: ['pants','jeans','skirt','shorts'],
  shoes:  ['shoes','sneakers','boots','heels','sandals','slippers'],
  bag:    ['bag','backpack','clutch','sport_bag'],
};

export default function OutfitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useLanguage();

  const [outfit, setOutfit] = useState<Outfit | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Swap
  const [swapTarget, setSwapTarget] = useState<{ outfitItemId: string; role: string } | null>(null);
  const [wardrobe, setWardrobe] = useState<ClothingItem[]>([]);
  const [wardrobeLoading, setWardrobeLoading] = useState(false);

  // Mark worn
  const [markingWorn, setMarkingWorn] = useState(false);

  // Delete
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);

      if (!id) { setLoading(false); return; }

      const { data: outfitData } = await supabase
        .from('outfits')
        .select('id, name, event, season, is_favorite, cover_image_url, ai_score, worn_at')
        .eq('id', id)
        .single();

      if (!outfitData) { setLoading(false); return; }

      const { data: itemsData } = await supabase
        .from('outfit_items')
        .select('id, cloth_id, role, layer_order, clothes(id, name, category, image_url, brand, color)')
        .eq('outfit_id', id)
        .order('layer_order', { ascending: true });

      const items: OutfitItem[] = (itemsData ?? []).map((item: any) => ({
        id: item.id,
        cloth_id: item.cloth_id,
        role: item.role,
        layer_order: item.layer_order,
        cloth: item.clothes,
      }));

      setOutfit({ ...outfitData, items });
      setLoading(false);
    };
    load();
  }, [id]);

  const loadWardrobe = async () => {
    if (wardrobe.length > 0 || !userId) return;
    setWardrobeLoading(true);
    const { data } = await supabase
      .from('clothes')
      .select('id, name, category, image_url, brand, color')
      .eq('user_id', userId);
    setWardrobe(data ?? []);
    setWardrobeLoading(false);
  };

  const handleSwap = async (newClothId: string) => {
    if (!swapTarget) return;
    const newCloth = wardrobe.find(c => c.id === newClothId);
    if (!newCloth) return;

    const { error } = await supabase
      .from('outfit_items')
      .update({ cloth_id: newClothId })
      .eq('id', swapTarget.outfitItemId)
      .select();

    if (error) {
      Alert.alert('Hata', error.message);
      return;
    }

    setOutfit(prev => prev ? {
      ...prev,
      items: prev.items.map(item =>
        item.id === swapTarget.outfitItemId
          ? { ...item, cloth_id: newClothId, cloth: newCloth }
          : item
      ),
    } : prev);
    setSwapTarget(null);
  };

  const handleToggleFavorite = async () => {
    if (!outfit) return;
    const newVal = !outfit.is_favorite;
    await supabase.from('outfits').update({ is_favorite: newVal }).eq('id', outfit.id);
    setOutfit(prev => prev ? { ...prev, is_favorite: newVal } : prev);
  };

  const handleMarkWorn = async () => {
    if (!outfit || outfit.worn_at) return;
    setMarkingWorn(true);
    const now = new Date().toISOString();
    await supabase.from('outfits').update({ worn_at: now }).eq('id', outfit.id);
    const clothIds = outfit.items.map(i => i.cloth_id);
    for (const clothId of clothIds) {
      await supabase.from('clothes').update({ last_worn_at: now }).eq('id', clothId);
    }
    setOutfit(prev => prev ? { ...prev, worn_at: now } : prev);
    setMarkingWorn(false);
  };

  const handleDelete = async () => {
    if (!outfit) return;
    setDeleting(true);
    await supabase.from('outfits').delete().eq('id', outfit.id);
    router.back();
  };

  const EVENT_LABEL = (event: string | null) =>
    event ? (t.outfitDetail.eventLabels as Record<string, string>)[event] ?? event : '';

  const SEASON_LABEL = (season: string | null) =>
    season ? (t.outfitDetail.seasonLabels as Record<string, string>)[season] ?? season : '';

  const ROLE_LABEL = (role: string) =>
    (t.outfitDetail.roleLabels as Record<string, string>)[role] ?? role;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#C41E3A" />
        </View>
      </SafeAreaView>
    );
  }

  if (!outfit) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.notFoundText}>{t.outfitDetail.notFound}</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>{t.outfitDetail.back}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const scorePercent = outfit.ai_score ? Math.round(outfit.ai_score * 100) : null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {outfit.name ?? EVENT_LABEL(outfit.event) ?? 'Kombin'}
        </Text>
        <TouchableOpacity style={styles.favBtn} onPress={handleToggleFavorite}>
          <Ionicons name={outfit.is_favorite ? 'heart' : 'heart-outline'} size={20} color={outfit.is_favorite ? '#C41E3A' : 'rgba(255,255,255,0.7)'} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Badges */}
        <View style={styles.badges}>
          {scorePercent !== null && (
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreBadgeText}>{scorePercent}{t.outfitDetail.match}</Text>
            </View>
          )}
          {outfit.event ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{EVENT_LABEL(outfit.event)}</Text>
            </View>
          ) : null}
          {outfit.season ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{SEASON_LABEL(outfit.season)}</Text>
            </View>
          ) : null}
          {outfit.worn_at ? (
            <View style={styles.wornBadge}>
              <Text style={styles.wornBadgeText}>
                Giyildi · {new Date(outfit.worn_at).toLocaleDateString('tr-TR')}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Outfit Items */}
        <View style={styles.itemsCard}>
          {outfit.items.map((outfitItem, idx) => (
            <View
              key={outfitItem.id}
              style={[
                styles.itemRow,
                idx < outfit.items.length - 1 && styles.itemRowBorder,
              ]}
            >
              {outfitItem.cloth?.image_url ? (
                <Image source={{ uri: outfitItem.cloth.image_url }} style={styles.itemImage} />
              ) : (
                <View style={[styles.itemImage, styles.itemImageEmpty]}>
                  <Text>👗</Text>
                </View>
              )}
              <View style={styles.itemInfo}>
                <Text style={styles.itemRole}>{ROLE_LABEL(outfitItem.role)}</Text>
                <Text style={styles.itemName} numberOfLines={1}>{outfitItem.cloth?.name}</Text>
                {outfitItem.cloth?.brand ? (
                  <Text style={styles.itemBrand}>{outfitItem.cloth.brand}</Text>
                ) : null}
              </View>
              <TouchableOpacity
                style={styles.swapBtn}
                onPress={() => {
                  setSwapTarget({ outfitItemId: outfitItem.id, role: outfitItem.role });
                  loadWardrobe();
                }}
              >
                <Text style={styles.swapBtnText}>{t.outfitDetail.swap}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.wornBtn,
              outfit.worn_at ? styles.wornBtnDone : null,
              (markingWorn || !!outfit.worn_at) ? { opacity: 0.7 } : null,
            ]}
            onPress={handleMarkWorn}
            disabled={markingWorn || !!outfit.worn_at}
          >
            <Text style={[styles.wornBtnText, outfit.worn_at ? styles.wornBtnTextDone : null]}>
              {markingWorn ? t.outfitDetail.markingWorn : outfit.worn_at ? t.outfitDetail.worn : t.outfitDetail.markWorn}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => setShowDelete(true)}>
            <Text style={styles.deleteBtnText}>{t.outfitDetail.delete}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Swap Modal */}
      <Modal visible={!!swapTarget} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {swapTarget ? `${ROLE_LABEL(swapTarget.role)} ${t.outfitDetail.swapTitle}` : ''}
            </Text>
            <TouchableOpacity onPress={() => setSwapTarget(null)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          {wardrobeLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#C41E3A" />
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
              {wardrobe
                .filter(c => {
                  if (!swapTarget) return true;
                  const role = swapTarget.role;
                  const filter = ROLE_FILTER[role];
                  if (filter) return filter.includes(c.category);
                  return c.category === 'accessory';
                })
                .map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.wardrobeItem}
                    onPress={() => handleSwap(item.id)}
                  >
                    <Image source={{ uri: item.image_url }} style={styles.wardrobeItemImage} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.wardrobeItemName} numberOfLines={1}>{item.name}</Text>
                      {item.brand ? <Text style={styles.wardrobeItemBrand}>{item.brand}</Text> : null}
                    </View>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal transparent visible={showDelete} animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.deleteModal}>
            <Text style={styles.deleteModalTitle}>{t.outfitDetail.deleteTitle}</Text>
            <Text style={styles.deleteModalDesc}>{t.outfitDetail.deleteDesc}</Text>
            <View style={styles.deleteModalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowDelete(false)}
              >
                <Text style={styles.cancelBtnText}>{t.outfitDetail.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteConfirmBtn, deleting && { opacity: 0.5 }]}
                onPress={handleDelete}
                disabled={deleting}
              >
                <Text style={styles.deleteConfirmBtnText}>
                  {deleting ? t.outfitDetail.deleting : t.outfitDetail.delete}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F2EE' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontSize: 16, color: '#706A64', marginBottom: 12 },
  backLink: { fontSize: 14, color: '#C41E3A', fontWeight: '600', textDecorationLine: 'underline' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#1C1917', paddingHorizontal: 16, paddingVertical: 14,
    paddingTop: 56,
  },
  backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 19 },
  backBtnText: { fontSize: 20, color: '#fff' },
  headerTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#fff', marginHorizontal: 12 },
  favBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 19 },

  scroll: { padding: 16, gap: 14, paddingBottom: 48 },

  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  scoreBadge: { backgroundColor: '#C41E3A', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  scoreBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  badge: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2DDD7', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  badgeText: { color: '#706A64', fontSize: 11 },
  wornBadge: { backgroundColor: 'rgba(34,197,94,0.08)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.25)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  wornBadgeText: { color: '#22c55e', fontSize: 11, fontWeight: '600' },

  itemsCard: {
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E2DDD7',
    overflow: 'hidden',
    shadowColor: '#141210', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  itemRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F0EBE4' },
  itemImage: { width: 60, height: 60, backgroundColor: '#F5F2EE', borderRadius: 8 },
  itemImageEmpty: { alignItems: 'center', justifyContent: 'center' },
  itemInfo: { flex: 1 },
  itemRole: { fontSize: 10, fontWeight: '700', letterSpacing: 1, color: '#9E9690', marginBottom: 3, textTransform: 'uppercase' },
  itemName: { fontSize: 13, fontWeight: '600', color: '#141210' },
  itemBrand: { fontSize: 11, color: '#9E9690', marginTop: 2 },
  swapBtn: {
    borderWidth: 1, borderColor: 'rgba(196,30,58,0.25)', backgroundColor: 'rgba(196,30,58,0.06)',
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
  },
  swapBtnText: { fontSize: 11, fontWeight: '700', color: '#C41E3A' },

  actions: { flexDirection: 'row', gap: 10 },
  wornBtn: {
    flex: 1, backgroundColor: '#C41E3A', paddingVertical: 15, alignItems: 'center', borderRadius: 10,
  },
  wornBtnDone: {
    backgroundColor: 'rgba(34,197,94,0.08)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)',
  },
  wornBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  wornBtnTextDone: { color: '#22c55e' },
  deleteBtn: {
    paddingHorizontal: 20, paddingVertical: 15, alignItems: 'center', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(196,30,58,0.3)', backgroundColor: 'rgba(196,30,58,0.07)',
  },
  deleteBtnText: { fontSize: 13, fontWeight: '700', color: '#C41E3A' },

  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 18,
    borderBottomWidth: 1, borderBottomColor: '#E2DDD7', backgroundColor: '#fff',
  },
  modalTitle: { fontSize: 15, fontWeight: '700', color: '#141210' },
  modalClose: { fontSize: 20, color: '#9E9690', paddingHorizontal: 4 },

  wardrobeItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 12, borderWidth: 1, borderColor: '#E2DDD7',
    backgroundColor: '#fff', padding: 14, marginBottom: 10,
    shadowColor: '#141210', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  wardrobeItemImage: { width: 52, height: 52, backgroundColor: '#F5F2EE', borderRadius: 8 },
  wardrobeItemName: { fontSize: 13, fontWeight: '600', color: '#141210' },
  wardrobeItemBrand: { fontSize: 11, color: '#9E9690', marginTop: 2 },

  overlay: { flex: 1, backgroundColor: 'rgba(14,10,8,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  deleteModal: { backgroundColor: '#fff', padding: 28, width: '100%', borderRadius: 18 },
  deleteModalTitle: { fontSize: 18, fontWeight: '700', color: '#141210', marginBottom: 8 },
  deleteModalDesc: { fontSize: 13, color: '#706A64', marginBottom: 24 },
  deleteModalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: '#E2DDD7', paddingVertical: 13, alignItems: 'center', borderRadius: 8 },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#706A64' },
  deleteConfirmBtn: { flex: 1, backgroundColor: '#C41E3A', paddingVertical: 13, alignItems: 'center', borderRadius: 8 },
  deleteConfirmBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
