import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, Image, Modal,
} from 'react-native';
import { supabase } from '@/lib/supabase/client';
import { API_BASE_URL } from '@/lib/config';
import { useLanguage } from '@/lib/i18n/LanguageContext';

type Tab = 'ai_analysis' | 'profile';

interface BeautyProfile {
  face_shape?: string; skin_tone?: string; skin_type?: string;
  hair_type?: string;  hair_length?: string;
}

interface ClothingItem { name?: string; color_name?: string; image_url?: string; }
interface OutfitItem { id: string; layer_order?: number; cloth?: ClothingItem; }
interface Outfit {
  id: string; name?: string | null; event?: string; season?: string;
  cover_image_url?: string | null;
  outfit_items?: OutfitItem[];
}

// ─── Static data ─────────────────────────────────────────────
const ZODIAC_IMG_MAP: Record<string, string> = {
  aries: 'zodiac-koc.jpg',       taurus: 'zodiac-boga.jpg',      gemini: 'zodiac-ikizler.jpg',
  cancer: 'zodiac-yengec.jpg',   leo: 'zodiac-aslan.jpg',         virgo: 'zodiac-basak.jpg',
  libra: 'zodiac-terazi.jpg',    scorpio: 'zodiac-akrep.jpg',     sagittarius: 'zodiac-yay.jpg',
  capricorn: 'zodiac-oglak.jpg', aquarius: 'zodiac-kova.jpg',     pisces: 'zodiac-balik.jpg',
};

const MAKEUP_REF_MAP: Record<string, string> = {
  'fair-graduation':  'makeup-acik-graduation.jpg',
  'fair-glamorous':   'makeup-acik-glamorous.jpg',
  'fair-soft':        'makeup-acik-soft.jpg',
  'medium-graduation':'makeup-orta-graduation.jpg',
  'medium-glamorous': 'makeup-orta-glamorous.jpg',
  'medium-soft':      'makeup-orta-soft.jpg',
  'dark-glamorous':   'makeup-koyu-glamorous.jpg',
  'dark-soft':        'makeup-koyu-soft.jpg',
};

const HAIR_DATA = [
  { img: 'hair-dusuk-topuz.jpg',    title: 'Dağınık Topuz',          desc: 'Dağınık topuz modeli, zarif ve modern bir görünüm sunar.',                          tags: ['Romantik','Soft','Zarif'],   recommended: false },
  { img: 'hair-yarim-toplu.jpg',    title: 'Yarı Toplu Dalgalı',     desc: 'Yarı toplu dalgalı saç modeli, hem sade hem de romantik bir stil oluşturur.',         tags: ['Romantik','Soft','Günlük'],  recommended: false },
  { img: 'hair-at-kuyrugu.jpg',     title: 'At Kuyruğu',             desc: 'Toplanmış at kuyruğu modeli, şık ve güçlü bir görünüm sağlar.',                      tags: ['Şık','Modern','Minimal'],    recommended: false },
  { img: 'hair-dalgali.jpg',        title: 'Doğal Dalgalı',          desc: 'Doğal dalgalar, feminen ve zarif bir görünüm kazandırır.',                            tags: ['Doğal','Soft','Zarif'],      recommended: false },
  { img: 'hair-balik-sirti.jpg',    title: 'Balık Sırtı Örgü',       desc: 'Boyun ve sırt hattını vurgulayan bu stil, zarif ve feminen bir hava katar.',          tags: ['Zarif','Örgülü','Şık'],      recommended: false },
  { img: 'hair-tac-orgu.jpg',       title: 'Örgülü Taç',             desc: 'Yüz hatlarını ve boyun bölgesini öne çıkaran romantik bir stil.',                     tags: ['Romantik','Davet','Zarif'],  recommended: false },
  { img: 'hair-yandan-orgu.jpg',    title: 'Yandan Örgü',            desc: 'Yüz hattını yumuşak bir şekilde çerçeveleyen zarif bir saç modeli.',                 tags: ['Soft','Günlük','Feminen'],   recommended: false },
  { img: 'hair-kisa-bob.jpg',       title: 'Kahküllü Kısa Bob',      desc: 'Genç bir ifade kazandıran, modern ve dikkat çekici bir stil.',                        tags: ['Modern','Çarpıcı','Şık'],    recommended: false },
  { img: 'hair-at-kuyrugu-duz.jpg', title: 'Yüksek Düz At Kuyruğu', desc: 'Yüz hatlarını belirginleştiren güçlü ve enerjik bir görünüm.',                       tags: ['Modern','Minimal','Şık'],    recommended: false },
  { img: 'hair-at-kuyrugu-2.jpg',   title: 'Dalgalı At Kuyruğu',    desc: 'Dinamik ve göz alıcı, hacimli bir at kuyruğu modeli.',                                tags: ['Enerjik','Modern','Şık'],    recommended: false },
];

const STEP_COLORS = ['#E8547A','#D4547A','#E8A0B4','#7B9FD4','#8BC4A0','#E8547A'];

const PINK        = '#D4547A';
const PINK_BG     = 'rgba(212,84,122,0.06)';
const PINK_BORDER = 'rgba(212,84,122,0.2)';

// ─── Component ───────────────────────────────────────────────
export default function BeautyScreen() {
  const { t } = useLanguage();
  const ZODIAC_OPTIONS = Object.entries(t.beauty.zodiacOptions) as [string, string][];

  const [activeTab,       setActiveTab]       = useState<Tab>('ai_analysis');
  const [beautyProfile,   setBeautyProfile]   = useState<BeautyProfile>({});
  const [outfits,         setOutfits]         = useState<Outfit[]>([]);
  const [profileLoading,  setProfileLoading]  = useState(true);

  // Burç Modu
  const [aiAnalysisZodiac, setAiAnalysisZodiac] = useState('');

  // AI Makyaj Asistanı
  const [selectedOutfitId,  setSelectedOutfitId]  = useState('');
  const [outfitModalOpen,   setOutfitModalOpen]   = useState(false);
  const [makeupLoading,     setMakeupLoading]     = useState(false);
  const [makeupResult,      setMakeupResult]      = useState<{
    look_name: string; formality: string; description: string;
    steps: string[]; key_colors: string[]; tips: string[];
  } | null>(null);
  const [makeupError, setMakeupError] = useState<string | null>(null);

  // Saç Stillerim
  const [expandedHairIdx, setExpandedHairIdx] = useState<number | null>(null);

  // ── Load outfits (runs every time screen comes into focus) ─
  const loadOutfits = useCallback(async (uid: string) => {
    const { data: outfitData } = await supabase
      .from('outfits')
      .select('id, name, event, season, cover_image_url, outfit_items(id, layer_order, cloth:cloth_id(name, color_name, image_url))')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });

    if (outfitData) {
      setOutfits(outfitData as Outfit[]);
      // If selected outfit was deleted, clear selection
      setSelectedOutfitId(prev =>
        (outfitData as Outfit[]).find((o) => o.id === prev) ? prev : ''
      );
    }
  }, []);

  // ── Initial load (beauty profile + outfits) ───────────────
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: bp } = await supabase
        .from('beauty_profiles').select('*').eq('user_id', user.id).single();

      if (bp) setBeautyProfile(bp);
      await loadOutfits(user.id);
      setProfileLoading(false);
    })();
  }, []);

  // ── Refresh outfits whenever beauty tab is focused ────────
  useFocusEffect(
    useCallback(() => {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) loadOutfits(user.id);
      });
    }, [loadOutfits])
  );

  // ── AI Makyaj Asistanı ────────────────────────────────────
  const handleMakeupRecommendation = async () => {
    setMakeupLoading(true);
    setMakeupError(null);
    setMakeupResult(null);
    const selectedOutfit = outfits.find(o => o.id === selectedOutfitId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/beauty-recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'makeup',
          profile: beautyProfile,
          outfit: selectedOutfit ? { event: selectedOutfit.event, season: selectedOutfit.season } : null,
        }),
      });
      if (res.ok) {
        const { payload } = await res.json();
        setMakeupResult(payload);
      } else {
        setMakeupError('Makyaj önerisi alınamadı.');
      }
    } catch {
      setMakeupError('Bağlantı hatası.');
    } finally {
      setMakeupLoading(false);
    }
  };

  // ── Derived values ────────────────────────────────────────
  const selOutfit   = outfits.find(o => o.id === selectedOutfitId);
  const skinToneKey = beautyProfile.skin_tone ?? 'medium';
  const ev          = selOutfit?.event ?? '';
  const formality   = ['invitation','date_night','business','graduation'].includes(ev) ? 'glamorous' : 'soft';
  const refImg = MAKEUP_REF_MAP[`${skinToneKey}-${ev}`]
    ?? MAKEUP_REF_MAP[`${skinToneKey}-${formality}`]
    ?? MAKEUP_REF_MAP[`${skinToneKey}-soft`]
    ?? MAKEUP_REF_MAP['medium-soft'];

  const hairGroup1 = HAIR_DATA.slice(0, 5);
  const hairGroup2 = HAIR_DATA.slice(5, 10);

  if (profileLoading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.loadingBox}><ActivityIndicator color="#C41E3A" /></View>
      </SafeAreaView>
    );
  }

  // ── Outfit item grid helper (sol kutu içi) ───────────────
  const OutfitItemGrid = ({ outfit }: { outfit: Outfit }) => {
    const items = (outfit.outfit_items ?? [])
      .sort((a, b) => (a.layer_order ?? 0) - (b.layer_order ?? 0))
      .map(oi => oi.cloth)
      .filter(Boolean) as ClothingItem[];

    // 4 hücrelik 2×2 grid — her zaman 4 kutu göster
    const slots = [0, 1, 2, 3];
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 3, width: '100%', height: '100%', padding: 5 }}>
        {slots.map(i => {
          const item = items[i];
          return (
            <View key={i} style={{ width: '47%', height: '47%', borderRadius: 6, overflow: 'hidden', backgroundColor: '#EDE8E3' }}>
              {item?.image_url ? (
                <Image source={{ uri: item.image_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : item ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 3 }}>
                  <Text style={{ fontSize: 8, color: '#9E9690', textAlign: 'center' }} numberOfLines={2}>
                    {item.name ?? item.color_name ?? '—'}
                  </Text>
                </View>
              ) : (
                <View style={{ flex: 1, backgroundColor: '#F0EDE9' }} />
              )}
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={s.container}>

      {/* ── Header ── */}
      <View style={s.header}>
        <Text style={s.headerLabel}>{t.beauty.sectionLabel.toUpperCase()}</Text>
        <Text style={s.headerTitle}>{t.beauty.title}</Text>
      </View>

      {/* ── Tabs ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabBar} contentContainerStyle={s.tabBarContent}>
        {([
          { key: 'ai_analysis', label: 'Burç Modu' },
          { key: 'profile',     label: 'Güzellik Modu' },
        ] as { key: Tab; label: string }[]).map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[s.tab, activeTab === tab.key && s.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[s.tabText, activeTab === tab.key && s.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ══════════ BURÇ MODU ══════════ */}
        {activeTab === 'ai_analysis' && (
          <View style={s.section}>

            <View style={[s.card, { gap: 18 }]}>
              <View>
                <Text style={s.sectionLabel}>{t.beauty.zodiacLabel}</Text>
                <Text style={[s.hint, { marginTop: 4 }]}>{t.beauty.zodiacOptional}</Text>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {ZODIAC_OPTIONS.map(([val, label]) => {
                  const active = aiAnalysisZodiac === val;
                  return (
                    <TouchableOpacity
                      key={val}
                      onPress={() => setAiAnalysisZodiac(active ? '' : val)}
                      style={{
                        width: '30.5%', paddingVertical: 10, borderRadius: 12,
                        alignItems: 'center', borderWidth: 1.5,
                        borderColor: active ? '#C41E3A' : '#E2DDD7',
                        backgroundColor: active ? 'rgba(196,30,58,0.06)' : '#FAFAF9',
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: active ? '#C41E3A' : '#706A64' }}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {aiAnalysisZodiac && ZODIAC_IMG_MAP[aiAnalysisZodiac] ? (
              <View style={{ borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#E2DDD7', backgroundColor: '#0A0A0A' }}>
                <Image
                  source={{ uri: `${API_BASE_URL}/beauty/${ZODIAC_IMG_MAP[aiAnalysisZodiac]}` }}
                  style={{ width: '100%', height: 480 }}
                  resizeMode="contain"
                />
              </View>
            ) : (
              <View style={{ borderRadius: 20, borderWidth: 1, borderStyle: 'dashed', borderColor: '#D5CFCB', alignItems: 'center', justifyContent: 'center', paddingVertical: 52, backgroundColor: '#FAFAF9', gap: 10 }}>
                <Text style={{ fontSize: 32 }}>✨</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#9E9690', textAlign: 'center' }}>Burcunu seç</Text>
                <Text style={{ fontSize: 11, color: '#C8C2BB', textAlign: 'center', paddingHorizontal: 32 }}>
                  Burç seçince makyaj ilham fotoğrafı burada görünür
                </Text>
              </View>
            )}

          </View>
        )}

        {/* ══════════ GÜZELLİK MODU ══════════ */}
        {activeTab === 'profile' && (
          <View style={s.section}>

            {/* ── AI Makyaj Asistanı header ── */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4, paddingHorizontal: 2 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#141210' }}>AI Makyaj Asistanı</Text>
              <Text style={{ color: PINK, fontSize: 16 }}>✦</Text>
            </View>
            <Text style={[s.hint, { paddingHorizontal: 2, marginBottom: 12 }]}>Kişisel makyaj önerilerini keşfet.</Text>

            {/* ── Main card: 2-column (outfit left | skin tone + button right) ── */}
            <View style={s.card}>
              <View style={{ flexDirection: 'row', gap: 14 }}>

                {/* Left — Outfit selector box */}
                <View style={{ width: 120 }}>
                  <Text style={[s.fieldLabel, { marginBottom: 8 }]}>KOMBİNİN</Text>
                  <TouchableOpacity
                    onPress={() => setOutfitModalOpen(true)}
                    style={{
                      width: 120, height: 120, borderRadius: 14, borderWidth: 1.5,
                      borderStyle: selectedOutfitId ? 'solid' : 'dashed',
                      borderColor: selectedOutfitId ? PINK : '#D5CFCB',
                      backgroundColor: selectedOutfitId ? PINK_BG : '#F9F7F5',
                      overflow: 'hidden',
                      alignItems: 'center', justifyContent: 'center',
                    }}
                    activeOpacity={0.7}
                  >
                    {selectedOutfitId && selOutfit ? (
                      <View style={{ padding: 6, width: '100%', height: '100%' }}>
                        <OutfitItemGrid outfit={selOutfit} />
                      </View>
                    ) : (
                      <View style={{ alignItems: 'center', gap: 4 }}>
                        <Text style={{ fontSize: 26, color: PINK, lineHeight: 30 }}>+</Text>
                        <Text style={{ fontSize: 10, fontWeight: '600', color: '#9E9690' }}>Kombin Seç</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  {selectedOutfitId && (
                    <TouchableOpacity onPress={() => setSelectedOutfitId('')} style={{ marginTop: 6, alignItems: 'center' }}>
                      <Text style={{ fontSize: 10, color: '#9E9690' }}>✕ Kaldır</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Right — Skin tone + generate button */}
                <View style={{ flex: 1, justifyContent: 'space-between' }}>
                  <View>
                    <Text style={[s.fieldLabel, { marginBottom: 8 }]}>CİLT TONUN</Text>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {[
                        { value: 'fair',   label: 'Açık',  color: '#FDDBB4' },
                        { value: 'medium', label: 'Orta',  color: '#D4956A' },
                        { value: 'dark',   label: 'Koyu',  color: '#8B5A2B' },
                      ].map(st => {
                        const active = beautyProfile.skin_tone === st.value;
                        return (
                          <TouchableOpacity key={st.value}
                            onPress={() => setBeautyProfile(p => ({ ...p, skin_tone: st.value }))}
                            style={{
                              flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                              gap: 4, borderWidth: 1.5, borderRadius: 20, paddingVertical: 8,
                              borderColor: active ? PINK : '#E2DDD7',
                              backgroundColor: active ? PINK_BG : '#F5F2EE',
                            }}
                          >
                            <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: st.color }} />
                            <Text style={{ fontSize: 11, fontWeight: '700', color: active ? PINK : '#706A64' }}>{st.label}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Generate button */}
                  <TouchableOpacity
                    onPress={handleMakeupRecommendation}
                    disabled={makeupLoading}
                    style={{
                      marginTop: 12,
                      backgroundColor: makeupLoading ? '#E2DDD7' : '#C41E3A',
                      borderRadius: 14, paddingVertical: 13,
                      alignItems: 'center', justifyContent: 'center',
                      flexDirection: 'row', gap: 6,
                    }}
                  >
                    {makeupLoading
                      ? <><ActivityIndicator color="#fff" size="small" /><Text style={[s.btnBrandText, { marginLeft: 6 }]}>Oluşturuluyor...</Text></>
                      : <Text style={s.btnBrandText}>Makyaj Önerisi Oluştur ✦</Text>
                    }
                  </TouchableOpacity>
                </View>

              </View>

              {makeupError && <View style={[s.errorBox, { marginTop: 12 }]}><Text style={s.errorText}>{makeupError}</Text></View>}
            </View>

            {/* Makeup result */}
            {makeupResult && (
              <View style={s.card}>
                <Text style={[s.sectionLabel, { marginBottom: 12 }]}>Senin AI Makyaj Önerin ✦</Text>

                {refImg && (
                  <View style={{ borderRadius: 10, overflow: 'hidden', backgroundColor: '#F5F2EE', marginBottom: 14 }}>
                    <Image source={{ uri: `${API_BASE_URL}/beauty/${refImg}` }} style={{ width: '100%', height: 240 }} resizeMode="contain" />
                  </View>
                )}

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#141210' }}>{makeupResult.look_name}</Text>
                  {makeupResult.formality && (
                    <View style={{ backgroundColor: PINK_BG, borderWidth: 1, borderColor: PINK_BORDER, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 2 }}>
                      <Text style={{ fontSize: 9, fontWeight: '700', color: PINK, textTransform: 'uppercase', letterSpacing: 1 }}>
                        {makeupResult.formality === 'glamorous' ? 'ŞIK' : makeupResult.formality === 'soft' ? 'SOFT' : 'DOĞAL'}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[s.subCardDesc, { marginBottom: 14 }]}>{makeupResult.description}</Text>

                <View style={{ marginBottom: 14 }}>
                  <Text style={[s.sectionLabel, { marginBottom: 8 }]}>Renk Paleti</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {['#F4879B','#D4547A','#E8A0B4','#C07060','#B07060','#F5DDD0'].map((c, i) => (
                      <View key={i} style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: c, borderWidth: 2, borderColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2, elevation: 2 }} />
                    ))}
                  </View>
                </View>

                {makeupResult.steps?.length > 0 && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={[s.sectionLabel, { marginBottom: 10 }]}>Makyaj Adımları</Text>
                    {makeupResult.steps.map((step, i) => (
                      <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: STEP_COLORS[i % STEP_COLORS.length], alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                          <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>{i + 1}</Text>
                        </View>
                        <Text style={[s.subCardDesc, { flex: 1 }]}>{step}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {makeupResult.tips?.slice(0, 3).map((tip, i) => (
                  <View key={i} style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-start', marginBottom: 5 }}>
                    <Text style={{ color: PINK, fontSize: 12, flexShrink: 0 }}>✦</Text>
                    <Text style={[s.subCardDesc, { flex: 1 }]}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* ── Saç Stillerim ── */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, marginBottom: 4, paddingHorizontal: 2 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#141210' }}>Saç Stillerim</Text>
              <Text style={{ color: PINK, fontSize: 16 }}>✦</Text>
            </View>
            <Text style={[s.hint, { paddingHorizontal: 2, marginBottom: 12 }]}>Saç uzunluğuna ve kombinin stiline göre öneriler.</Text>

            {/* Group 1 */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              {hairGroup1.map((hair, i) => {
                const isSelected = expandedHairIdx === i;
                return (
                  <TouchableOpacity key={i} onPress={() => setExpandedHairIdx(isSelected ? null : i)}
                    style={{ width: '30%', borderRadius: 12, borderWidth: 1.5, overflow: 'hidden', borderColor: isSelected ? PINK : '#E2DDD7', backgroundColor: isSelected ? PINK_BG : '#fff' }}>
                    <View style={{ width: '100%', aspectRatio: 1, backgroundColor: '#F5F2EE' }}>
                      <Image source={{ uri: `${API_BASE_URL}/beauty/${hair.img}` }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                    </View>
                    <View style={{ padding: 6 }}>
                      <Text style={{ fontSize: 9, fontWeight: '700', color: '#141210' }} numberOfLines={2}>{hair.title}</Text>
                      {hair.recommended && <Text style={{ fontSize: 8, color: PINK, fontWeight: '700', marginTop: 1 }}>✦ Önerilen</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {expandedHairIdx !== null && expandedHairIdx < 5 && (
              <View style={{ backgroundColor: PINK_BG, borderWidth: 1, borderColor: PINK_BORDER, borderRadius: 12, padding: 14, flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                <View style={{ width: 76, height: 76, borderRadius: 10, overflow: 'hidden', backgroundColor: '#F5F2EE' }}>
                  <Image source={{ uri: `${API_BASE_URL}/beauty/${HAIR_DATA[expandedHairIdx].img}` }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#141210', marginBottom: 5 }}>{HAIR_DATA[expandedHairIdx].title}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 7 }}>
                    {HAIR_DATA[expandedHairIdx].tags.map(tag => (
                      <View key={tag} style={{ borderWidth: 1, borderColor: '#E2DDD7', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: '#fff' }}>
                        <Text style={{ fontSize: 10, color: '#706A64' }}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={s.subCardDesc}>{HAIR_DATA[expandedHairIdx].desc}</Text>
                </View>
              </View>
            )}

            {/* Group 2 */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              {hairGroup2.map((hair, i) => {
                const idx = i + 5;
                const isSelected = expandedHairIdx === idx;
                return (
                  <TouchableOpacity key={idx} onPress={() => setExpandedHairIdx(isSelected ? null : idx)}
                    style={{ width: '30%', borderRadius: 12, borderWidth: 1.5, overflow: 'hidden', borderColor: isSelected ? PINK : '#E2DDD7', backgroundColor: isSelected ? PINK_BG : '#fff' }}>
                    <View style={{ width: '100%', aspectRatio: 1, backgroundColor: '#F5F2EE' }}>
                      <Image source={{ uri: `${API_BASE_URL}/beauty/${hair.img}` }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                    </View>
                    <View style={{ padding: 6 }}>
                      <Text style={{ fontSize: 9, fontWeight: '700', color: '#141210' }} numberOfLines={2}>{hair.title}</Text>
                      {hair.recommended && <Text style={{ fontSize: 8, color: PINK, fontWeight: '700', marginTop: 1 }}>✦ Önerilen</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {expandedHairIdx !== null && expandedHairIdx >= 5 && (
              <View style={{ backgroundColor: PINK_BG, borderWidth: 1, borderColor: PINK_BORDER, borderRadius: 12, padding: 14, flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                <View style={{ width: 76, height: 76, borderRadius: 10, overflow: 'hidden', backgroundColor: '#F5F2EE' }}>
                  <Image source={{ uri: `${API_BASE_URL}/beauty/${HAIR_DATA[expandedHairIdx].img}` }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#141210', marginBottom: 5 }}>{HAIR_DATA[expandedHairIdx].title}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 7 }}>
                    {HAIR_DATA[expandedHairIdx].tags.map(tag => (
                      <View key={tag} style={{ borderWidth: 1, borderColor: '#E2DDD7', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: '#fff' }}>
                        <Text style={{ fontSize: 10, color: '#706A64' }}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={s.subCardDesc}>{HAIR_DATA[expandedHairIdx].desc}</Text>
                </View>
              </View>
            )}

          </View>
        )}

      </ScrollView>

      {/* ══════════ KOMBİN SEÇME MODAL ══════════ */}
      <Modal
        visible={outfitModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setOutfitModalOpen(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F2EE' }}>

          {/* Modal header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2DDD7' }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#141210', letterSpacing: -0.3 }}>Kombin Seç</Text>
            <TouchableOpacity onPress={() => setOutfitModalOpen(false)} style={{ padding: 4 }}>
              <Text style={{ fontSize: 18, color: '#706A64', fontWeight: '600' }}>✕</Text>
            </TouchableOpacity>
          </View>

          {outfits.length === 0 ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <Text style={{ fontSize: 32 }}>👗</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#9E9690' }}>Henüz kombininiz yok</Text>
              <Text style={{ fontSize: 12, color: '#C8C2BB', textAlign: 'center', paddingHorizontal: 40 }}>
                Gardırop ekranından kombinlerinizi oluşturun
              </Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
              {outfits.map(o => {
                const isSelected = selectedOutfitId === o.id;
                const clothItems = (o.outfit_items ?? [])
                  .sort((a, b) => (a.layer_order ?? 0) - (b.layer_order ?? 0))
                  .map(oi => oi.cloth)
                  .filter(Boolean) as ClothingItem[];
                return (
                  <TouchableOpacity key={o.id}
                    onPress={() => { setSelectedOutfitId(o.id); setOutfitModalOpen(false); }}
                    style={{
                      backgroundColor: '#fff', borderRadius: 16, borderWidth: 2,
                      borderColor: isSelected ? PINK : '#E2DDD7',
                      padding: 14,
                      shadowColor: '#141210', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
                    }}
                    activeOpacity={0.75}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>

                      {/* Clothing items — 4-slot grid */}
                      <View style={{ width: 90, height: 90, flexDirection: 'row', flexWrap: 'wrap', gap: 3, borderRadius: 10, overflow: 'hidden', backgroundColor: '#F0EDE9', borderWidth: 1, borderColor: '#E2DDD7', padding: 4 }}>
                        {[0,1,2,3].map(i => {
                          const item = clothItems[i];
                          return (
                            <View key={i} style={{ width: '47%', height: '47%', borderRadius: 4, overflow: 'hidden', backgroundColor: '#E2DDD7' }}>
                              {item?.image_url ? (
                                <Image source={{ uri: item.image_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                              ) : item ? (
                                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                  <Text style={{ fontSize: 7, color: '#9E9690', textAlign: 'center', paddingHorizontal: 1 }} numberOfLines={2}>
                                    {item.name ?? item.color_name ?? '—'}
                                  </Text>
                                </View>
                              ) : (
                                <View style={{ flex: 1, backgroundColor: '#EDE8E3' }} />
                              )}
                            </View>
                          );
                        })}
                      </View>

                      {/* Outfit info */}
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: '#141210', marginBottom: 3 }} numberOfLines={1}>
                          {o.name ?? `Kombin #${o.id.slice(-4)}`}
                        </Text>
                        {(o.event || o.season) && (
                          <Text style={{ fontSize: 11, color: '#9E9690' }}>
                            {[o.event, o.season].filter(Boolean).join(' · ')}
                          </Text>
                        )}
                      </View>

                      {/* Check mark */}
                      {isSelected && (
                        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: PINK, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>✓</Text>
                        </View>
                      )}

                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#F5F2EE' },
  loadingBox:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 110 },
  section:       { gap: 12 },

  header:      { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, backgroundColor: '#1C1917' },
  headerLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2.5, color: 'rgba(196,30,58,0.9)', marginBottom: 4 },
  headerTitle: { fontSize: 26, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.5 },

  tabBar:        { borderBottomWidth: 1, borderBottomColor: '#E2DDD7', backgroundColor: '#fff', flexGrow: 0 },
  tabBarContent: { paddingHorizontal: 16 },
  tab:           { paddingVertical: 12, paddingHorizontal: 4, marginRight: 16, borderBottomWidth: 2.5, borderBottomColor: 'transparent', marginBottom: -1 },
  tabActive:     { borderBottomColor: '#C41E3A' },
  tabText:       { fontSize: 10, fontWeight: '700', letterSpacing: 1, color: '#9E9690', textTransform: 'uppercase' },
  tabTextActive: { color: '#141210' },

  card: {
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E2DDD7',
    padding: 18, marginBottom: 12,
    shadowColor: '#141210', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },

  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: '#9E9690', textTransform: 'uppercase', marginBottom: 12 },
  hint:         { fontSize: 12, color: '#706A64', marginBottom: 14, lineHeight: 18 },
  fieldLabel:   { fontSize: 11, fontWeight: '700', color: '#706A64', letterSpacing: 0.5, marginBottom: 10 },

  subCardDesc:  { fontSize: 12, color: '#706A64', lineHeight: 17 },

  btnBrandText: { fontSize: 13, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },

  errorBox:  { borderWidth: 1, borderColor: 'rgba(196,30,58,0.3)', borderRadius: 10, backgroundColor: 'rgba(196,30,58,0.06)', padding: 12, marginBottom: 8 },
  errorText: { fontSize: 13, color: '#C41E3A' },
});
