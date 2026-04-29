import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Image, ActivityIndicator, Alert, Modal, Dimensions,
} from 'react-native';
import { supabase } from '@/lib/supabase/client';
import { API_BASE_URL } from '@/lib/config';

const { width } = Dimensions.get('window');

const EVENTS = [
  { value: 'daily_casual', label: 'Günlük',   icon: '☀️' },
  { value: 'picnic',       label: 'Piknik',    icon: '🌿' },
  { value: 'sport',        label: 'Spor',      icon: '🏃' },
  { value: 'business',     label: 'İş',        icon: '💼' },
  { value: 'date_night',   label: 'Romantik',  icon: '🌙' },
  { value: 'invitation',   label: 'Davet',     icon: '🎉' },
  { value: 'graduation',   label: 'Mezuniyet', icon: '🎓' },
  { value: 'travel',       label: 'Seyahat',   icon: '✈️' },
];

const SEASONS = [
  { value: 'spring', label: 'İlkbahar' },
  { value: 'summer', label: 'Yaz' },
  { value: 'autumn', label: 'Sonbahar' },
  { value: 'winter', label: 'Kış' },
];

interface ClothingItem {
  id: string;
  name: string;
  category: string;
  image_url: string;
  color: string;
  color_name: string | null;
}

interface OutfitResult {
  top: ClothingItem;
  bottom: ClothingItem | null;
  shoes: ClothingItem | null;
  bag: ClothingItem | null;
  score: number;
  reason: string;
}

interface SavedOutfit {
  id: string;
  name: string | null;
  event: string | null;
  season: string | null;
  is_favorite: boolean;
  cover_image_url: string | null;
  ai_score: number | null;
  created_at: string;
}

export default function OutfitsScreen() {
  const [event, setEvent] = useState('daily_casual');
  const [season, setSeason] = useState('spring');
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<OutfitResult[]>([]);
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const [savedIdxs, setSavedIdxs] = useState<Set<number>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<SavedOutfit | null>(null);
  const [loadingOutfits, setLoadingOutfits] = useState(true);

  useEffect(() => {
    fetchSavedOutfits();
  }, []);

  const fetchSavedOutfits = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('outfits')
      .select('id, name, event, season, is_favorite, cover_image_url, ai_score, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setSavedOutfits(data ?? []);
    setLoadingOutfits(false);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setResults([]);
    setSavedIdxs(new Set());

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: clothes } = await supabase
        .from('clothes')
        .select('*')
        .eq('user_id', user.id);

      if (!clothes || clothes.length === 0) {
        Alert.alert('Gardırop boş', 'Önce kıyafet ekleyin.');
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/generate-outfit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clothes, event, season }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.error || `Sunucu hatası (${res.status})`);
      }
      const body = await res.json();
      const generated = body.results ?? [];
      setResults(generated);

      if (generated.length === 0) {
        Alert.alert('Kombin bulunamadı', 'Bu etkinlik için gardırobunuzda yeterli kıyafet yok. Daha fazla kıyafet ekleyin.');
      }
    } catch (e: any) {
      console.error('Generate outfit error:', e);
      Alert.alert('Hata', e?.message || 'Kombin oluşturulamadı. Web sunucusunun çalıştığından emin olun.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async (result: OutfitResult, idx: number) => {
    setSavingIdx(idx);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const eventLabel = EVENTS.find(e => e.value === event)?.label ?? event;
      const coverUrl = result.top.image_url;

      const { data: outfit } = await supabase
        .from('outfits')
        .insert({
          user_id: user.id,
          name: `${eventLabel} Kombini`,
          event,
          season,
          ai_generated: true,
          ai_score: result.score,
          cover_image_url: coverUrl,
        })
        .select('id')
        .single();

      if (outfit) {
        const items = [
          { outfit_id: outfit.id, cloth_id: result.top.id, role: 'top', layer_order: 0 },
          result.bottom && { outfit_id: outfit.id, cloth_id: result.bottom.id, role: 'bottom', layer_order: 1 },
          result.shoes && { outfit_id: outfit.id, cloth_id: result.shoes.id, role: 'shoes', layer_order: 2 },
          result.bag && { outfit_id: outfit.id, cloth_id: result.bag.id, role: 'bag', layer_order: 3 },
        ].filter(Boolean);

        await supabase.from('outfit_items').insert(items);
        setSavedIdxs(prev => new Set(prev).add(idx));
        fetchSavedOutfits();
      }
    } finally {
      setSavingIdx(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from('outfits').delete().eq('id', deleteTarget.id);
    setSavedOutfits(prev => prev.filter(o => o.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const toggleFavorite = async (outfit: SavedOutfit) => {
    await supabase.from('outfits').update({ is_favorite: !outfit.is_favorite }).eq('id', outfit.id);
    setSavedOutfits(prev => prev.map(o => o.id === outfit.id ? { ...o, is_favorite: !o.is_favorite } : o));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.label}>AI STYLING</Text>
          <Text style={styles.heading}>Outfit Generator</Text>
          <Text style={styles.sub}>AI-powered combinations from your wardrobe</Text>
        </View>

        <View style={styles.divider} />

        {/* Form */}
        <View style={styles.card}>
          {/* Event */}
          <Text style={styles.sectionLabel}>OCCASION</Text>
          <View style={styles.eventsGrid}>
            {EVENTS.map(e => (
              <TouchableOpacity
                key={e.value}
                onPress={() => setEvent(e.value)}
                style={[styles.eventBtn, event === e.value && styles.eventBtnActive]}
              >
                <Text style={styles.eventIcon}>{e.icon}</Text>
                <Text style={[styles.eventLabel, event === e.value && styles.eventLabelActive]}>
                  {e.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Season */}
          <Text style={[styles.sectionLabel, { marginTop: 20 }]}>SEASON</Text>
          <View style={styles.seasonsRow}>
            {SEASONS.map(s => (
              <TouchableOpacity
                key={s.value}
                onPress={() => setSeason(s.value)}
                style={[styles.seasonBtn, season === s.value && styles.seasonBtnActive]}
              >
                <Text style={[styles.seasonLabel, season === s.value && styles.seasonLabelActive]}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Generate Button */}
          <TouchableOpacity
            style={[styles.generateBtn, generating && styles.generateBtnDisabled]}
            onPress={handleGenerate}
            disabled={generating}
          >
            {generating ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.generateBtnText}>✨  Generate Outfit</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Generated Results */}
        {results.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SUGGESTED OUTFITS</Text>
            {results.map((result, i) => (
              <View key={i} style={styles.resultCard}>
                {/* Items row */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.itemsRow}>
                  {[result.top, result.bottom, result.shoes, result.bag]
                    .filter(Boolean)
                    .map((item, j) => (
                      <View key={j} style={styles.itemThumb}>
                        <Image source={{ uri: item!.image_url }} style={styles.itemImage} />
                        <Text style={styles.itemName} numberOfLines={1}>{item!.name}</Text>
                      </View>
                    ))}
                </ScrollView>

                {/* Score + reason */}
                <View style={styles.resultMeta}>
                  <View style={styles.scoreWrap}>
                    <Text style={styles.scoreText}>{Math.round(result.score * 100)}%</Text>
                    <Text style={styles.scoreLabel}>MATCH</Text>
                  </View>
                  <Text style={styles.reason} numberOfLines={2}>{result.reason}</Text>
                </View>

                {/* Save button */}
                <TouchableOpacity
                  style={[styles.saveBtn, savedIdxs.has(i) && styles.saveBtnSaved]}
                  onPress={() => !savedIdxs.has(i) && handleSave(result, i)}
                  disabled={savingIdx === i || savedIdxs.has(i)}
                >
                  {savingIdx === i ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.saveBtnText}>
                      {savedIdxs.has(i) ? '✓ Kaydedildi' : 'Kaydet'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Saved Outfits */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionLabel}>SAVED OUTFITS</Text>
              <Text style={styles.sectionCount}>{savedOutfits.length} combinations</Text>
            </View>
          </View>

          {loadingOutfits ? (
            <ActivityIndicator color="#111" style={{ marginTop: 20 }} />
          ) : savedOutfits.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No saved outfits yet</Text>
              <Text style={styles.emptySub}>Generate and save outfits above.</Text>
            </View>
          ) : (
            <View style={styles.savedGrid}>
              {savedOutfits.map(outfit => (
                <View key={outfit.id} style={styles.savedCard}>
                  {outfit.cover_image_url ? (
                    <Image source={{ uri: outfit.cover_image_url }} style={styles.savedImage} />
                  ) : (
                    <View style={[styles.savedImage, { backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center' }]}>
                      <Text style={{ fontSize: 28 }}>✨</Text>
                    </View>
                  )}
                  <TouchableOpacity style={styles.savedFav} onPress={() => toggleFavorite(outfit)}>
                    <Text>{outfit.is_favorite ? '❤️' : '🤍'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.savedDelete} onPress={() => setDeleteTarget(outfit)}>
                    <Text style={styles.savedDeleteText}>✕</Text>
                  </TouchableOpacity>
                  <View style={styles.savedInfo}>
                    <Text style={styles.savedName} numberOfLines={1}>
                      {outfit.name ?? 'Outfit'}
                    </Text>
                    <Text style={styles.savedMeta}>
                      {EVENTS.find(e => e.value === outfit.event)?.label ?? outfit.event}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

      </ScrollView>

      {/* Delete Modal */}
      <Modal transparent visible={!!deleteTarget} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalLabel}>CONFIRM DELETE</Text>
            <Text style={styles.modalTitle}>Remove Outfit</Text>
            <Text style={styles.modalSub}>This outfit will be permanently deleted.</Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setDeleteTarget(null)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalDelete} onPress={handleDelete}>
                <Text style={styles.modalDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const CARD_W = (width - 48 - 12) / 2;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24 },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: '#bbb', marginBottom: 4 },
  heading: { fontSize: 28, fontWeight: '700', color: '#111', letterSpacing: -0.5 },
  sub: { fontSize: 13, color: '#999', marginTop: 4 },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginHorizontal: 24, marginBottom: 24 },

  card: { marginHorizontal: 24, borderWidth: 1, borderColor: '#f0f0f0', padding: 20, marginBottom: 24 },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: '#bbb', marginBottom: 12 },

  eventsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  eventBtn: {
    width: (width - 48 - 24 - 24) / 4,
    borderWidth: 1, borderColor: '#e5e5e5',
    paddingVertical: 10, alignItems: 'center', gap: 4,
  },
  eventBtnActive: { backgroundColor: '#111', borderColor: '#111' },
  eventIcon: { fontSize: 18 },
  eventLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5, color: '#999' },
  eventLabelActive: { color: '#fff' },

  seasonsRow: { flexDirection: 'row', gap: 8 },
  seasonBtn: { flex: 1, borderWidth: 1, borderColor: '#e5e5e5', paddingVertical: 10, alignItems: 'center' },
  seasonBtnActive: { backgroundColor: '#111', borderColor: '#111' },
  seasonLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, color: '#999' },
  seasonLabelActive: { color: '#fff' },

  generateBtn: { backgroundColor: '#111', paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  generateBtnDisabled: { opacity: 0.6 },
  generateBtnText: { color: '#fff', fontSize: 13, fontWeight: '700', letterSpacing: 1 },

  section: { paddingHorizontal: 24, marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  sectionCount: { fontSize: 11, color: '#bbb', marginTop: 2 },

  resultCard: { borderWidth: 1, borderColor: '#f0f0f0', marginBottom: 16, padding: 16 },
  itemsRow: { marginBottom: 12 },
  itemThumb: { width: 80, marginRight: 12, alignItems: 'center' },
  itemImage: { width: 80, height: 80, backgroundColor: '#f5f5f5' },
  itemName: { fontSize: 10, color: '#666', marginTop: 4, textAlign: 'center' },
  resultMeta: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 12 },
  scoreWrap: { alignItems: 'center', minWidth: 48 },
  scoreText: { fontSize: 20, fontWeight: '700', color: '#111' },
  scoreLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 1, color: '#bbb' },
  reason: { flex: 1, fontSize: 12, color: '#666', lineHeight: 18 },
  saveBtn: { backgroundColor: '#111', paddingVertical: 12, alignItems: 'center' },
  saveBtnSaved: { backgroundColor: '#666' },
  saveBtnText: { color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },

  savedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  savedCard: { width: CARD_W },
  savedImage: { width: CARD_W, height: CARD_W },
  savedFav: { position: 'absolute', top: 8, right: 32 },
  savedDelete: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)', width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  savedDeleteText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  savedInfo: { paddingTop: 8 },
  savedName: { fontSize: 12, fontWeight: '600', color: '#111' },
  savedMeta: { fontSize: 10, color: '#bbb', marginTop: 2 },

  emptyBox: { borderWidth: 1, borderColor: '#e5e5e5', borderStyle: 'dashed', padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#bbb', marginBottom: 4 },
  emptySub: { fontSize: 12, color: '#ccc' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { backgroundColor: '#fff', padding: 32, width: '100%' },
  modalLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: '#bbb', marginBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#111', marginBottom: 8 },
  modalSub: { fontSize: 13, color: '#666', marginBottom: 24 },
  modalBtns: { flexDirection: 'row', gap: 12 },
  modalCancel: { flex: 1, borderWidth: 1, borderColor: '#e5e5e5', paddingVertical: 14, alignItems: 'center' },
  modalCancelText: { fontSize: 13, fontWeight: '600', color: '#111' },
  modalDelete: { flex: 1, backgroundColor: '#111', paddingVertical: 14, alignItems: 'center' },
  modalDeleteText: { fontSize: 13, fontWeight: '600', color: '#fff' },
});
