import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Image, ActivityIndicator, Alert, Modal, Dimensions, FlatList, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase/client';
import { API_BASE_URL } from '@/lib/config';
import { useLanguage } from '@/lib/i18n/LanguageContext';

const { width } = Dimensions.get('window');

const EVENT_VALUES = ['daily_casual', 'picnic', 'sport', 'business', 'date_night', 'invitation', 'graduation', 'travel'] as const;
const SEASON_VALUES = ['spring', 'summer', 'autumn', 'winter'] as const;

const EVENTS = [
  { value: 'daily_casual', label: 'Günlük' }, { value: 'picnic', label: 'Piknik' },
  { value: 'sport', label: 'Spor' }, { value: 'business', label: 'İş' },
  { value: 'date_night', label: 'Romantik' }, { value: 'invitation', label: 'Davet' },
  { value: 'graduation', label: 'Mezuniyet' }, { value: 'travel', label: 'Seyahat' },
];
const SEASONS = [
  { value: 'spring', label: 'İlkbahar' }, { value: 'summer', label: 'Yaz' },
  { value: 'autumn', label: 'Sonbahar' }, { value: 'winter', label: 'Kış' },
];
type EventValue = typeof EVENT_VALUES[number];
type SeasonValue = typeof SEASON_VALUES[number];

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

interface OutfitItem {
  id: string;
  role: string;
  cloth_id: string;
  clothes: { image_url: string; name: string; category: string } | null;
}

// ── Trendyol "Kombini tamamla" helper ────────────────────────
function getTrendyolSuggestions({
  topCategory, hasBottom, hasShoes, hasBag, hasOuterwear, hasAccessories, event, season, score,
}: {
  topCategory: string; hasBottom: boolean; hasShoes: boolean; hasBag: boolean;
  hasOuterwear: boolean; hasAccessories: boolean; event: string; season: string; score: number;
}): { label: string; search: string }[] {
  const suggestions: { label: string; search: string }[] = [];
  const isFormal   = event === 'invitation' || event === 'date_night' || event === 'graduation';
  const isBusiness = event === 'business';
  const isSport    = event === 'sport';
  const isWinter   = season === 'winter';
  const isAutumn   = season === 'autumn';
  const isSummer   = season === 'summer';
  const topIsDress = topCategory === 'dress';
  const formalTops = ['blouse', 'shirt', 'dress'];
  const warmTops   = ['sweater', 'coat', 'jacket'];

  if (isFormal && !formalTops.includes(topCategory))
    suggestions.push({ label: 'şık bluz/gömlek', search: 'kadın şık bluz' });
  if ((isWinter || isAutumn) && !warmTops.includes(topCategory))
    suggestions.push({ label: 'kazak/sweatshirt', search: 'kadın kazak' });

  if (!hasBottom && !topIsDress) {
    if (isFormal)        suggestions.push({ label: 'şık etek/pantolon', search: 'kadın şık etek' });
    else if (isBusiness) suggestions.push({ label: 'kumaş pantolon',    search: 'kadın kumaş pantolon' });
    else if (isSport)    suggestions.push({ label: 'eşofman altı',       search: 'eşofman altı' });
    else if (isWinter)   suggestions.push({ label: 'kalın pantolon',     search: 'kadın kışlık pantolon' });
    else                 suggestions.push({ label: 'pantolon/jean',       search: 'kadın jean pantolon' });
  }

  if (!hasShoes) {
    if (isFormal)        suggestions.push({ label: 'topuklu ayakkabı', search: 'kadın topuklu ayakkabı' });
    else if (isBusiness) suggestions.push({ label: 'şık ayakkabı',     search: 'kadın ofis ayakkabısı' });
    else if (isSport)    suggestions.push({ label: 'spor ayakkabı',    search: 'kadın spor ayakkabı' });
    else if (isWinter)   suggestions.push({ label: 'kışlık bot/çizme', search: 'kadın kışlık bot' });
    else if (isSummer)   suggestions.push({ label: 'sandalet',          search: 'kadın sandalet' });
    else                 suggestions.push({ label: 'sneaker/ayakkabı',  search: 'kadın sneaker' });
  }

  if (!hasBag) {
    if (isFormal)        suggestions.push({ label: 'clutch çanta', search: 'kadın clutch çanta' });
    else if (isBusiness) suggestions.push({ label: 'kol çantası',  search: 'kadın kol çantası' });
    else if (isSport)    suggestions.push({ label: 'sırt çantası', search: 'kadın spor sırt çantası' });
    else                 suggestions.push({ label: 'omuz çantası', search: 'kadın omuz çantası' });
  }

  if (!hasOuterwear) {
    if (isWinter && isFormal) suggestions.push({ label: 'şık pelerin/ceket', search: 'kadın şık pelerin' });
    else if (isWinter)        suggestions.push({ label: 'mont/kaban',         search: 'kadın mont' });
    else if (isAutumn)        suggestions.push({ label: 'kaban/trençkot',     search: 'kadın trençkot' });
  }

  if (!hasAccessories) {
    if (isFormal)      suggestions.push({ label: 'takı seti',     search: 'kadın takı seti' });
    else if (isWinter) suggestions.push({ label: 'atkı/bere',      search: 'kadın atkı bere set' });
    else if (isSummer) suggestions.push({ label: 'güneş gözlüğü', search: 'kadın güneş gözlüğü' });
    else               suggestions.push({ label: 'aksesuar',       search: 'kadın aksesuar' });
  }

  if (suggestions.length === 0 && score < 0.7) {
    suggestions.push({ label: 'şal/fular', search: 'kadın şal' });
    suggestions.push({ label: 'aksesuar',  search: 'kadın aksesuar' });
  }

  return suggestions;
}

function TrendyolRow({ suggestions }: { suggestions: { label: string; search: string }[] }) {
  if (suggestions.length === 0) return null;
  return (
    <View style={{ marginTop: 12, borderRadius: 12, borderWidth: 1, borderColor: '#FCD34D', backgroundColor: '#FFFBEB', padding: 10 }}>
      <Text style={{ fontSize: 9, fontWeight: '700', letterSpacing: 1.5, color: '#D97706', textTransform: 'uppercase', marginBottom: 8 }}>
        Kombini tamamla
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {suggestions.map((s, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => Linking.openURL(`https://www.trendyol.com/sr?q=${encodeURIComponent(s.search)}`)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#FCD34D', borderRadius: 8, backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 6 }}
          >
            <Text style={{ fontSize: 14 }}>🛍️</Text>
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#B45309' }}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function OutfitsScreen() {
  const { t } = useLanguage();
  const [event, setEvent] = useState<EventValue>('daily_casual');
  const [season, setSeason] = useState<SeasonValue>('spring');
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<OutfitResult[]>([]);
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const [savedIdxs, setSavedIdxs] = useState<Set<number>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<SavedOutfit | null>(null);
  const [loadingOutfits, setLoadingOutfits] = useState(true);
  const [detailOutfit, setDetailOutfit] = useState<SavedOutfit | null>(null);
  const [detailItems, setDetailItems] = useState<OutfitItem[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [sharedIds, setSharedIds] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUserId(user?.id ?? null));
  }, []);

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

  const openDetail = async (outfit: SavedOutfit) => {
    setDetailOutfit(outfit);
    setLoadingDetail(true);
    const { data } = await supabase
      .from('outfit_items')
      .select('id, role, cloth_id, clothes(image_url, name, category)')
      .eq('outfit_id', outfit.id)
      .order('layer_order');
    setDetailItems((data as any) ?? []);
    setLoadingDetail(false);
  };

  const shareOutfit = async (outfit: SavedOutfit, items: OutfitItem[]) => {
    if (!currentUserId) return;
    setSharing(true);
    const itemImages = items.map(it => it.clothes?.image_url).filter(Boolean) as string[];
    const imageUrl = outfit.cover_image_url ?? (itemImages[0] ?? '');
    const eventLabel = EVENTS.find(e => e.value === outfit.event)?.label ?? outfit.event ?? '';
    const { error } = await supabase.from('community_posts').insert({
      user_id: currentUserId,
      outfit_id: outfit.id,
      image_url: imageUrl,
      item_images: itemImages,
      caption: outfit.name ?? null,
      tags: eventLabel ? [eventLabel] : [],
      like_count: 0,
      comment_count: 0,
    });
    setSharing(false);
    if (error) { Alert.alert('Hata', 'Paylaşım başarısız.'); return; }
    setSharedIds(prev => new Set(prev).add(outfit.id));
    Alert.alert('Paylaşıldı!', 'Kombinin Keşfet\'te yayınlandı.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.label}>{t.outfits.sectionLabel.toUpperCase()}</Text>
          <Text style={styles.heading}>{t.outfits.title}</Text>
          <Text style={styles.sub}>{t.outfits.subtitle}</Text>
        </View>

        <View style={styles.divider} />

        {/* Form */}
        <View style={styles.card}>
          {/* Event */}
          <Text style={styles.sectionLabel}>{t.outfits.occasionLabel.toUpperCase()}</Text>
          <View style={styles.eventsGrid}>
            {EVENT_VALUES.map(value => (
              <TouchableOpacity
                key={value}
                onPress={() => setEvent(value)}
                style={[styles.eventBtn, event === value && styles.eventBtnActive]}
              >
                <Text style={[styles.eventLabel, event === value && styles.eventLabelActive]}>
                  {t.outfits.eventLabels[value]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Season */}
          <Text style={[styles.sectionLabel, { marginTop: 20 }]}>{t.outfits.seasonLabel.toUpperCase()}</Text>
          <View style={styles.seasonsRow}>
            {SEASON_VALUES.map(value => (
              <TouchableOpacity
                key={value}
                onPress={() => setSeason(value)}
                style={[styles.seasonBtn, season === value && styles.seasonBtnActive]}
              >
                <Text style={[styles.seasonLabel, season === value && styles.seasonLabelActive]}>
                  {t.outfits.seasonLabels[value]}
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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="sparkles" size={16} color="#fff" />
                <Text style={styles.generateBtnText}>{t.outfits.generateBtn}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Generated Results */}
        {results.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t.outfits.suggestedOutfits.toUpperCase()}</Text>
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
                    <Text style={styles.scoreLabel}>UYUM</Text>
                  </View>
                  <Text style={styles.reason} numberOfLines={2}>{result.reason}</Text>
                </View>

                {/* Trendyol — Kombini tamamla */}
                <TrendyolRow suggestions={getTrendyolSuggestions({
                  topCategory:    result.top.category,
                  hasBottom:      !!result.bottom,
                  hasShoes:       !!result.shoes,
                  hasBag:         !!result.bag,
                  hasOuterwear:   ['jacket','coat'].includes(result.top.category),
                  hasAccessories: false,
                  event, season,
                  score:          result.score,
                })} />

                {/* Save button */}
                <TouchableOpacity
                  style={[styles.saveBtn, savedIdxs.has(i) && styles.saveBtnSaved, { marginTop: 12 }]}
                  onPress={() => !savedIdxs.has(i) && handleSave(result, i)}
                  disabled={savingIdx === i || savedIdxs.has(i)}
                >
                  {savingIdx === i ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.saveBtnText}>
                      {savedIdxs.has(i) ? `✓ ${t.outfits.savedOutfits}` : 'Kaydet'}
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
              <Text style={styles.sectionLabel}>{t.outfits.savedOutfits.toUpperCase()}</Text>
              <Text style={styles.sectionCount}>{savedOutfits.length} {t.outfits.combinations}</Text>
            </View>
          </View>

          {loadingOutfits ? (
            <ActivityIndicator color="#C41E3A" style={{ marginTop: 20 }} />
          ) : savedOutfits.length === 0 ? (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="sparkles-outline" size={36} color="#C41E3A" />
              </View>
              <Text style={styles.emptyText}>{t.outfits.noSavedOutfits}</Text>
              <Text style={styles.emptySub}>{t.outfits.generateAndSave}</Text>
            </View>
          ) : (
            <View style={styles.savedGrid}>
              {savedOutfits.map(outfit => (
                <View key={outfit.id} style={styles.savedCard}>
                  <TouchableOpacity onPress={() => openDetail(outfit)} activeOpacity={0.85}>
                    {outfit.cover_image_url ? (
                      <Image source={{ uri: outfit.cover_image_url }} style={styles.savedImage} resizeMode="cover" />
                    ) : (
                      <View style={[styles.savedImage, { backgroundColor: '#F5F2EE', alignItems: 'center', justifyContent: 'center' }]}>
                        <Ionicons name="sparkles" size={32} color="#C41E3A" />
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* Fav */}
                  <TouchableOpacity style={styles.savedFav} onPress={() => toggleFavorite(outfit)}>
                    <Ionicons name={outfit.is_favorite ? 'heart' : 'heart-outline'} size={16} color={outfit.is_favorite ? '#C41E3A' : 'rgba(255,255,255,0.85)'} />
                  </TouchableOpacity>
                  {/* Delete */}
                  <TouchableOpacity style={styles.savedDelete} onPress={() => setDeleteTarget(outfit)}>
                    <Ionicons name="close" size={12} color="#fff" />
                  </TouchableOpacity>

                  <View style={styles.savedInfo}>
                    <Text style={styles.savedName} numberOfLines={1}>{outfit.name ?? t.outfits.title}</Text>
                    <Text style={styles.savedMeta}>{outfit.event ? t.outfits.eventLabels[outfit.event as EventValue] ?? outfit.event : ''}</Text>

                    {/* Action buttons */}
                    <View style={styles.savedActions}>
                      <TouchableOpacity style={styles.savedActionBtn} onPress={() => openDetail(outfit)}>
                        <Ionicons name="eye-outline" size={13} color="#706A64" />
                        <Text style={styles.savedActionText}>Detay</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.savedActionBtn, styles.savedShareBtn, sharedIds.has(outfit.id) && styles.savedSharedBtn]}
                        onPress={() => !sharedIds.has(outfit.id) && openDetail(outfit)}
                      >
                        <Ionicons name={sharedIds.has(outfit.id) ? 'checkmark' : 'share-social-outline'} size={13} color={sharedIds.has(outfit.id) ? '#fff' : '#C41E3A'} />
                        <Text style={[styles.savedActionText, { color: sharedIds.has(outfit.id) ? '#fff' : '#C41E3A' }]}>
                          {sharedIds.has(outfit.id) ? 'Paylaşıldı' : 'Paylaş'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

      </ScrollView>

      {/* Detail Modal */}
      <Modal visible={!!detailOutfit} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setDetailOutfit(null)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F2EE' }}>
          {/* Header */}
          <View style={styles.detailHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailTitle} numberOfLines={1}>{detailOutfit?.name ?? 'Kombin Detayı'}</Text>
              <Text style={styles.detailMeta}>
                {detailOutfit?.event ? EVENTS.find(e => e.value === detailOutfit.event)?.label : ''}
                {detailOutfit?.season ? ` · ${SEASONS.find(s => s.value === detailOutfit.season)?.label ?? ''}` : ''}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setDetailOutfit(null)} style={{ padding: 4 }}>
              <Ionicons name="close" size={22} color="#706A64" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            {loadingDetail ? (
              <ActivityIndicator color="#C41E3A" style={{ marginTop: 40 }} />
            ) : (
              <>
                {/* Items grid */}
                <View style={styles.detailGrid}>
                  {detailItems.map((item, i) => (
                    <View key={i} style={styles.detailItem}>
                      <Image
                        source={{ uri: item.clothes?.image_url ?? '' }}
                        style={styles.detailItemImage}
                        resizeMode="contain"
                      />
                      <Text style={styles.detailItemName} numberOfLines={2}>{item.clothes?.name ?? ''}</Text>
                      <Text style={styles.detailItemRole}>{item.role}</Text>
                    </View>
                  ))}
                </View>

                {/* Score */}
                {detailOutfit?.ai_score != null && (
                  <View style={styles.scoreBlock}>
                    <Text style={styles.scoreBlockValue}>{Math.round(detailOutfit.ai_score * 100)}%</Text>
                    <Text style={styles.scoreBlockLabel}>AI UYUM PUANI</Text>
                  </View>
                )}

                {/* Trendyol — Kombini tamamla */}
                {detailOutfit && (() => {
                  const roles = new Set(detailItems.map(it => it.role));
                  const topItem = detailItems.find(it => it.role === 'top');
                  const outerCats = ['jacket', 'coat'];
                  return (
                    <TrendyolRow suggestions={getTrendyolSuggestions({
                      topCategory:    topItem?.clothes?.category ?? '',
                      hasBottom:      roles.has('bottom'),
                      hasShoes:       roles.has('shoes'),
                      hasBag:         roles.has('bag'),
                      hasOuterwear:   outerCats.includes(topItem?.clothes?.category ?? '') || detailItems.some(it => outerCats.includes(it.clothes?.category ?? '')),
                      hasAccessories: roles.has('accessory') || roles.has('accessories'),
                      event:          detailOutfit.event ?? '',
                      season:         detailOutfit.season ?? '',
                      score:          detailOutfit.ai_score ?? 1,
                    })} />
                  );
                })()}

                {/* Action buttons */}
                <View style={styles.detailBtns}>
                  <TouchableOpacity
                    style={[styles.detailFavBtn, detailOutfit?.is_favorite && styles.detailFavBtnActive]}
                    onPress={() => { if (detailOutfit) { toggleFavorite(detailOutfit); setDetailOutfit(prev => prev ? { ...prev, is_favorite: !prev.is_favorite } : prev); } }}
                  >
                    <Ionicons name={detailOutfit?.is_favorite ? 'heart' : 'heart-outline'} size={18} color={detailOutfit?.is_favorite ? '#C41E3A' : '#706A64'} />
                    <Text style={[styles.detailFavText, detailOutfit?.is_favorite && { color: '#C41E3A' }]}>
                      {detailOutfit?.is_favorite ? 'Favorilerde' : 'Favorile'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.detailShareBtn, sharedIds.has(detailOutfit?.id ?? '') && styles.detailSharedBtn]}
                    onPress={() => { if (detailOutfit && !sharedIds.has(detailOutfit.id)) shareOutfit(detailOutfit, detailItems); }}
                    disabled={sharing || sharedIds.has(detailOutfit?.id ?? '')}
                  >
                    {sharing ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Ionicons name={sharedIds.has(detailOutfit?.id ?? '') ? 'checkmark-circle' : 'share-social'} size={18} color="#fff" />
                        <Text style={styles.detailShareText}>
                          {sharedIds.has(detailOutfit?.id ?? '') ? 'Paylaşıldı' : 'Keşfette Paylaş'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Delete */}
                <TouchableOpacity
                  style={styles.detailDeleteBtn}
                  onPress={() => { setDetailOutfit(null); if (detailOutfit) setDeleteTarget(detailOutfit); }}
                >
                  <Ionicons name="trash-outline" size={16} color="#C41E3A" />
                  <Text style={styles.detailDeleteText}>Kombini Sil</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Delete Modal */}
      <Modal transparent visible={!!deleteTarget} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalLabel}>{t.outfits.confirmDelete.toUpperCase()}</Text>
            <Text style={styles.modalTitle}>{t.outfits.removeOutfit}</Text>
            <Text style={styles.modalSub}>{t.outfits.deleteOutfitConfirm}</Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setDeleteTarget(null)}>
                <Text style={styles.modalCancelText}>{t.outfits.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalDelete} onPress={handleDelete}>
                <Text style={styles.modalDeleteText}>{t.outfits.delete}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const CARD_W = (width - 40 - 12) / 2;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F2EE' },
  header: {
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14,
    backgroundColor: '#1C1917',
  },
  label: { fontSize: 9, fontWeight: '700', letterSpacing: 2.5, color: 'rgba(196,30,58,0.9)', marginBottom: 3 },
  heading: { fontSize: 21, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.3 },
  sub: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 3 },
  divider: { height: 1, backgroundColor: '#E2DDD7', marginHorizontal: 20, marginBottom: 24 },

  card: {
    marginHorizontal: 20, borderRadius: 12, padding: 20, marginBottom: 24,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2DDD7',
    shadowColor: '#141210', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: '#9E9690', marginBottom: 14 },

  eventsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  eventBtn: {
    borderWidth: 1,
    borderColor: '#E2DDD7',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    backgroundColor: '#F5F2EE',
  },
  eventBtnActive: { backgroundColor: '#1A1410', borderColor: '#1A1410' },
  eventLabel: { fontSize: 12, fontWeight: '600', color: '#706A64', letterSpacing: 0.2 },
  eventLabelActive: { color: '#fff' },

  seasonsRow: { flexDirection: 'row', gap: 8 },
  seasonBtn: { flex: 1, borderWidth: 1, borderColor: '#E2DDD7', borderRadius: 8, paddingVertical: 11, alignItems: 'center', backgroundColor: '#F5F2EE' },
  seasonBtnActive: { backgroundColor: '#C41E3A', borderColor: '#C41E3A' },
  seasonLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, color: '#9E9690' },
  seasonLabelActive: { color: '#fff' },

  generateBtn: { backgroundColor: '#C41E3A', paddingVertical: 17, alignItems: 'center', marginTop: 20, borderRadius: 10 },
  generateBtnDisabled: { opacity: 0.6 },
  generateBtnText: { color: '#fff', fontSize: 13, fontWeight: '700', letterSpacing: 1 },

  section: { paddingHorizontal: 20, marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  sectionCount: { fontSize: 11, color: '#9E9690', marginTop: 2 },

  resultCard: {
    borderRadius: 12, marginBottom: 16, padding: 16,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2DDD7',
    shadowColor: '#141210', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  itemsRow: { marginBottom: 12 },
  itemThumb: { width: 84, marginRight: 12, alignItems: 'center' },
  itemImage: { width: 84, height: 84, backgroundColor: '#F5F2EE', borderRadius: 8 },
  itemName: { fontSize: 10, color: '#706A64', marginTop: 4, textAlign: 'center' },
  resultMeta: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 12 },
  scoreWrap: { alignItems: 'center', minWidth: 52 },
  scoreText: { fontSize: 22, fontWeight: '700', color: '#C41E3A' },
  scoreLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 1, color: '#9E9690' },
  reason: { flex: 1, fontSize: 12, color: '#706A64', lineHeight: 18 },
  saveBtn: { backgroundColor: '#C41E3A', paddingVertical: 13, alignItems: 'center', borderRadius: 8 },
  saveBtnSaved: { backgroundColor: '#9E9690' },
  saveBtnText: { color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },

  savedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  savedCard: { width: CARD_W },
  savedImage: { width: CARD_W, height: CARD_W, borderRadius: 10, backgroundColor: '#F5F2EE' },
  savedFav: { position: 'absolute', top: 8, right: 36 },
  savedDelete: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(28,25,23,0.65)', width: 22, height: 22,
    borderRadius: 11, alignItems: 'center', justifyContent: 'center',
  },
  savedDeleteText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  savedInfo: { paddingTop: 8 },
  savedName: { fontSize: 12, fontWeight: '600', color: '#141210' },
  savedMeta: { fontSize: 10, color: '#9E9690', marginTop: 2 },

  emptyBox: {
    borderWidth: 1,
    borderColor: '#EDE6DC',
    borderStyle: 'dashed',
    borderRadius: 18,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    backgroundColor: '#FDFAF8',
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(196,30,58,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(196,30,58,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1108',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 12,
    color: '#A89F96',
    textAlign: 'center',
    lineHeight: 18,
  },

  savedActions: { flexDirection: 'row', gap: 6, marginTop: 8 },
  savedActionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#E2DDD7', backgroundColor: '#F5F2EE',
  },
  savedShareBtn: { borderColor: '#C41E3A', backgroundColor: 'rgba(196,30,58,0.06)' },
  savedSharedBtn: { backgroundColor: '#9E9690', borderColor: '#9E9690' },
  savedActionText: { fontSize: 10, fontWeight: '600', color: '#706A64' },

  // Detail modal
  detailHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#E2DDD7', backgroundColor: '#fff',
  },
  detailTitle: { fontSize: 16, fontWeight: '700', color: '#1A1410' },
  detailMeta: { fontSize: 12, color: '#9E9690', marginTop: 2 },

  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  detailItem: {
    width: (width - 52) / 2, backgroundColor: '#fff',
    borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: '#E2DDD7',
  },
  detailItemImage: { width: '100%', height: (width - 52) / 2, backgroundColor: '#F8F5F2' },
  detailItemName: { fontSize: 12, fontWeight: '600', color: '#1A1410', padding: 8, paddingBottom: 2 },
  detailItemRole: { fontSize: 10, color: '#9E9690', paddingHorizontal: 8, paddingBottom: 8 },

  scoreBlock: {
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E2DDD7',
    padding: 16, alignItems: 'center', marginBottom: 16,
  },
  scoreBlockValue: { fontSize: 32, fontWeight: '800', color: '#C41E3A' },
  scoreBlockLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 2, color: '#9E9690', marginTop: 2 },

  detailBtns: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  detailFavBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 13, borderRadius: 10, borderWidth: 1.5, borderColor: '#E2DDD7', backgroundColor: '#fff',
  },
  detailFavBtnActive: { borderColor: '#C41E3A', backgroundColor: 'rgba(196,30,58,0.06)' },
  detailFavText: { fontSize: 13, fontWeight: '600', color: '#706A64' },

  detailShareBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 13, borderRadius: 10, backgroundColor: '#C41E3A',
  },
  detailSharedBtn: { backgroundColor: '#9E9690' },
  detailShareText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  detailDeleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 13, borderRadius: 10, borderWidth: 1.5, borderColor: '#C41E3A',
    backgroundColor: 'rgba(196,30,58,0.05)',
  },
  detailDeleteText: { fontSize: 13, fontWeight: '600', color: '#C41E3A' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(14,10,8,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { backgroundColor: '#fff', padding: 32, width: '100%', borderRadius: 16 },
  modalLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: '#9E9690', marginBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#141210', marginBottom: 8 },
  modalSub: { fontSize: 13, color: '#706A64', marginBottom: 24 },
  modalBtns: { flexDirection: 'row', gap: 12 },
  modalCancel: { flex: 1, borderWidth: 1, borderColor: '#E2DDD7', paddingVertical: 14, alignItems: 'center', borderRadius: 8 },
  modalCancelText: { fontSize: 13, fontWeight: '600', color: '#706A64' },
  modalDelete: { flex: 1, backgroundColor: '#C41E3A', paddingVertical: 14, alignItems: 'center', borderRadius: 8 },
  modalDeleteText: { fontSize: 13, fontWeight: '700', color: '#fff' },
});
