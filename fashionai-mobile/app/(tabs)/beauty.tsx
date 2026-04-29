import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, Image, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase/client';
import { API_BASE_URL } from '@/lib/config';

// ─── Constants ───────────────────────────────────────────────
const FACE_SHAPES = [
  { value: 'oval',    label: 'Oval',     icon: '🥚' },
  { value: 'round',   label: 'Yuvarlak', icon: '⭕' },
  { value: 'square',  label: 'Kare',     icon: '⬛' },
  { value: 'heart',   label: 'Kalp',     icon: '🫀' },
  { value: 'diamond', label: 'Elmas',    icon: '💎' },
  { value: 'oblong',  label: 'Uzun',     icon: '📏' },
];

const SKIN_TONES = [
  { value: 'fair',   label: 'Açık',      color: '#FDDBB4' },
  { value: 'light',  label: 'Açık-Orta', color: '#F0C490' },
  { value: 'medium', label: 'Orta',      color: '#D4956A' },
  { value: 'tan',    label: 'Buğday',    color: '#C07A4A' },
  { value: 'dark',   label: 'Koyu',      color: '#8B5A2B' },
  { value: 'deep',   label: 'Çok Koyu',  color: '#4A2C0A' },
];

const SKIN_TYPES = [
  { value: 'normal',      label: 'Normal' },
  { value: 'dry',         label: 'Kuru' },
  { value: 'oily',        label: 'Yağlı' },
  { value: 'combination', label: 'Karma' },
];

const HAIR_TYPES = [
  { value: 'straight', label: 'Düz' },
  { value: 'wavy',     label: 'Dalgalı' },
  { value: 'curly',    label: 'Kıvırcık' },
  { value: 'coily',    label: 'Afro' },
];

const HAIR_LENGTHS = [
  { value: 'short',  label: 'Kısa' },
  { value: 'medium', label: 'Orta' },
  { value: 'long',   label: 'Uzun' },
];

type Tab = 'profile' | 'face_analysis';

interface BeautyProfile {
  face_shape?: string;
  skin_tone?: string;
  skin_type?: string;
  hair_type?: string;
  hair_length?: string;
}

interface FaceAnalysisHairstyle {
  name: string;
  description: string;
  suitable_for: string;
}

interface FaceAnalysisResult {
  face_shape: string;
  face_shape_label: string;
  face_shape_description: string;
  confidence: number;
  hairstyle_suggestions: FaceAnalysisHairstyle[];
  styling_tips: string[];
  avoid_tips: string[];
}

// ─── Component ───────────────────────────────────────────────
export default function BeautyScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [userId, setUserId] = useState<string | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const [birthDate, setBirthDate] = useState<string | null>(null);
  const [beautyProfile, setBeautyProfile] = useState<BeautyProfile>({});
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // AI recommendations
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Face analysis
  const [faceUri, setFaceUri] = useState<string | null>(null);
  const [faceLoading, setFaceLoading] = useState(false);
  const [faceResult, setFaceResult] = useState<FaceAnalysisResult | null>(null);
  const [faceError, setFaceError] = useState<string | null>(null);

  // ── Load user & beauty profile
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Get profile data (gender, birth_date)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('gender, birth_date')
        .eq('id', user.id)
        .single();
      if (profileData) {
        setGender(profileData.gender);
        setBirthDate(profileData.birth_date);
      }

      // Get beauty profile
      const { data: bp } = await supabase
        .from('beauty_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (bp) setBeautyProfile(bp);

      setProfileLoading(false);
    })();
  }, []);

  // ── Save beauty profile
  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    await supabase.from('beauty_profiles').upsert({
      user_id: userId,
      ...beautyProfile,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // ── AI Recommendations
  const handleGetRecommendations = async () => {
    if (!userId) return;
    setAiLoading(true);
    setAiError(null);
    setAiResult(null);

    let age: number | null = null;
    if (birthDate) {
      const birth = new Date(birthDate);
      age = new Date().getFullYear() - birth.getFullYear();
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/beauty-recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: beautyProfile, gender, age }),
      });
      if (res.ok) {
        const { payload } = await res.json();
        setAiResult(payload);
      } else {
        setAiError('AI önerileri alınamadı. Profil bilgilerinizi doldurun.');
      }
    } catch {
      setAiError('Bağlantı hatası. Tekrar deneyin.');
    } finally {
      setAiLoading(false);
    }
  };

  // ── Pick face photo
  const handlePickFacePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Galeri erişimi gerekli.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setFaceUri(result.assets[0].uri);
      setFaceResult(null);
      setFaceError(null);
    }
  };

  // ── Face Analysis
  const handleFaceAnalysis = async () => {
    if (!faceUri) return;
    setFaceLoading(true);
    setFaceError(null);
    setFaceResult(null);

    try {
      const formData = new FormData();
      formData.append('image', {
        uri: faceUri,
        name: 'face.jpg',
        type: 'image/jpeg',
      } as any);

      const res = await fetch(`${API_BASE_URL}/api/face-analysis`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const { result } = await res.json();
        setFaceResult(result);
      } else {
        setFaceError('Yüz analizi yapılamadı. Lütfen net bir yüz fotoğrafı yükleyin.');
      }
    } catch {
      setFaceError('Bağlantı hatası. Tekrar deneyin.');
    } finally {
      setFaceLoading(false);
    }
  };

  const isGenderMale = gender === 'male';

  if (profileLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#111" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerLabel}>PERSONALIZATION</Text>
        <Text style={styles.headerTitle}>Beauty Assistant</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'profile' && styles.tabActive]}
          onPress={() => setActiveTab('profile')}
        >
          <Text style={[styles.tabText, activeTab === 'profile' && styles.tabTextActive]}>
            Beauty Profile
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'face_analysis' && styles.tabActive]}
          onPress={() => setActiveTab('face_analysis')}
        >
          <Text style={[styles.tabText, activeTab === 'face_analysis' && styles.tabTextActive]}>
            Yüz Analizi
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Face Analysis Tab ── */}
        {activeTab === 'face_analysis' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Fotoğraf Yükle</Text>
            <Text style={styles.hint}>Net, ön cepheden çekilmiş bir yüz fotoğrafı yükleyin. Yapay zeka yüz şeklinizi analiz edecek.</Text>

            {faceUri ? (
              <View style={styles.facePreviewContainer}>
                <Image source={{ uri: faceUri }} style={styles.facePreview} />
                <TouchableOpacity
                  style={styles.btnOutline}
                  onPress={() => { setFaceUri(null); setFaceResult(null); setFaceError(null); }}
                >
                  <Text style={styles.btnOutlineText}>Fotoğrafı Değiştir</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.uploadArea} onPress={handlePickFacePhoto}>
                <Text style={styles.uploadIcon}>📷</Text>
                <Text style={styles.uploadText}>Fotoğraf seçmek için dokunun</Text>
                <Text style={styles.uploadHint}>JPG, PNG veya WebP</Text>
              </TouchableOpacity>
            )}

            {faceUri && (
              <TouchableOpacity
                style={[styles.btnBrand, faceLoading && styles.btnDisabled]}
                onPress={handleFaceAnalysis}
                disabled={faceLoading}
              >
                {faceLoading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.btnBrandText}>✨ Yüzümü Analiz Et</Text>
                }
              </TouchableOpacity>
            )}

            {faceError && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{faceError}</Text>
              </View>
            )}

            {/* Face Analysis Results */}
            {faceResult && (
              <View>
                {/* Face Shape */}
                <View style={styles.card}>
                  <Text style={styles.sectionLabel}>Yüz Şekli Analizi</Text>
                  <View style={styles.faceShapeRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.faceShapeTitle}>{faceResult.face_shape_label}</Text>
                      <Text style={styles.faceShapeDesc}>{faceResult.face_shape_description}</Text>
                    </View>
                    <View style={styles.confidenceBox}>
                      <Text style={styles.confidenceLabel}>GÜVEN</Text>
                      <Text style={styles.confidenceValue}>{Math.round(faceResult.confidence * 100)}%</Text>
                    </View>
                  </View>
                </View>

                {/* Hairstyle Suggestions */}
                <View style={styles.card}>
                  <Text style={styles.sectionLabel}>Saç Modeli Önerileri</Text>
                  {faceResult.hairstyle_suggestions.map((style, i) => (
                    <View key={i} style={styles.hairstyleItem}>
                      <Text style={styles.hairstyleName}>{style.name}</Text>
                      <Text style={styles.hairstyleDesc}>{style.description}</Text>
                      <Text style={styles.hairstyleSuitable}>{style.suitable_for}</Text>
                    </View>
                  ))}
                </View>

                {/* Styling Tips */}
                {faceResult.styling_tips.length > 0 && (
                  <View style={styles.card}>
                    <Text style={styles.sectionLabel}>Stil İpuçları</Text>
                    {faceResult.styling_tips.map((tip, i) => (
                      <View key={i} style={styles.tipRow}>
                        <Text style={styles.tipCheck}>✓</Text>
                        <Text style={styles.tipText}>{tip}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Avoid Tips */}
                {faceResult.avoid_tips.length > 0 && (
                  <View style={styles.card}>
                    <Text style={styles.sectionLabel}>Kaçınılması Gerekenler</Text>
                    {faceResult.avoid_tips.map((tip, i) => (
                      <View key={i} style={styles.tipRow}>
                        <Text style={[styles.tipCheck, { color: '#f59e0b' }]}>✗</Text>
                        <Text style={styles.tipText}>{tip}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* ── Beauty Profile Tab ── */}
        {activeTab === 'profile' && (
          <View>
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>Beauty Profile</Text>

              {/* Face Shape */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Face Shape</Text>
                <View style={styles.faceShapeGrid}>
                  {FACE_SHAPES.map(s => (
                    <TouchableOpacity
                      key={s.value}
                      style={[
                        styles.faceShapeChip,
                        beautyProfile.face_shape === s.value && styles.chipSelected,
                      ]}
                      onPress={() => setBeautyProfile(p => ({ ...p, face_shape: s.value }))}
                    >
                      <Text style={styles.faceShapeIcon}>{s.icon}</Text>
                      <Text style={[
                        styles.chipText,
                        beautyProfile.face_shape === s.value && styles.chipTextSelected,
                      ]}>{s.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Skin Tone */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Skin Tone</Text>
                <View style={styles.row}>
                  {SKIN_TONES.map(t => (
                    <TouchableOpacity
                      key={t.value}
                      style={[
                        styles.skinToneChip,
                        beautyProfile.skin_tone === t.value && styles.chipSelected,
                      ]}
                      onPress={() => setBeautyProfile(p => ({ ...p, skin_tone: t.value }))}
                    >
                      <View style={[styles.skinDot, { backgroundColor: t.color }]} />
                      <Text style={[
                        styles.chipTextSmall,
                        beautyProfile.skin_tone === t.value && styles.chipTextSelected,
                      ]}>{t.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Skin Type */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Skin Type</Text>
                <View style={styles.row}>
                  {SKIN_TYPES.map(t => (
                    <TouchableOpacity
                      key={t.value}
                      style={[
                        styles.flexChip,
                        beautyProfile.skin_type === t.value && styles.chipSelected,
                      ]}
                      onPress={() => setBeautyProfile(p => ({ ...p, skin_type: t.value }))}
                    >
                      <Text style={[
                        styles.chipText,
                        beautyProfile.skin_type === t.value && styles.chipTextSelected,
                      ]}>{t.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Hair Type */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Hair Type</Text>
                <View style={styles.row}>
                  {HAIR_TYPES.map(t => (
                    <TouchableOpacity
                      key={t.value}
                      style={[
                        styles.flexChip,
                        beautyProfile.hair_type === t.value && styles.chipSelected,
                      ]}
                      onPress={() => setBeautyProfile(p => ({ ...p, hair_type: t.value }))}
                    >
                      <Text style={[
                        styles.chipText,
                        beautyProfile.hair_type === t.value && styles.chipTextSelected,
                      ]}>{t.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Hair Length */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Hair Length</Text>
                <View style={styles.row}>
                  {HAIR_LENGTHS.map(l => (
                    <TouchableOpacity
                      key={l.value}
                      style={[
                        styles.flexChip,
                        beautyProfile.hair_length === l.value && styles.chipSelected,
                      ]}
                      onPress={() => setBeautyProfile(p => ({ ...p, hair_length: l.value }))}
                    >
                      <Text style={[
                        styles.chipText,
                        beautyProfile.hair_length === l.value && styles.chipTextSelected,
                      ]}>{l.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Save */}
              <TouchableOpacity
                style={[styles.btnPrimary, saving && styles.btnDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.btnPrimaryText}>{saved ? '✓ Kaydedildi' : 'Profili Kaydet'}</Text>
                }
              </TouchableOpacity>
            </View>

            {/* AI Recommendations Button */}
            <TouchableOpacity
              style={[styles.btnBrand, aiLoading && styles.btnDisabled]}
              onPress={handleGetRecommendations}
              disabled={aiLoading}
            >
              {aiLoading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.btnBrandText}>✨ AI Güzellik Önerileri Al</Text>
              }
            </TouchableOpacity>

            {aiError && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{aiError}</Text>
              </View>
            )}

            {/* AI Results */}
            {aiResult && (
              <View>
                <Text style={[styles.sectionLabel, { marginBottom: 12 }]}>Kişisel Önerileriniz</Text>

                {/* Makeup (female) */}
                {aiResult.makeup && !isGenderMale && (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>💄 Makyaj Önerileri</Text>
                    {aiResult.makeup.foundation && (
                      <View style={styles.aiItem}>
                        <Text style={styles.aiItemLabel}>Fondöten</Text>
                        <Text style={styles.aiItemText}>{aiResult.makeup.foundation}</Text>
                      </View>
                    )}
                    {aiResult.makeup.lipstick && (
                      <View style={styles.aiItem}>
                        <Text style={styles.aiItemLabel}>Ruj</Text>
                        <Text style={styles.aiItemText}>{aiResult.makeup.lipstick}</Text>
                      </View>
                    )}
                    {aiResult.makeup.eyeshadow && (
                      <View style={styles.aiItem}>
                        <Text style={styles.aiItemLabel}>Göz Farı</Text>
                        <Text style={styles.aiItemText}>{aiResult.makeup.eyeshadow}</Text>
                      </View>
                    )}
                    {aiResult.makeup.blush && (
                      <View style={styles.aiItem}>
                        <Text style={styles.aiItemLabel}>Allık</Text>
                        <Text style={styles.aiItemText}>{aiResult.makeup.blush}</Text>
                      </View>
                    )}
                    {aiResult.makeup.tips && aiResult.makeup.tips.map((tip: string, i: number) => (
                      <View key={i} style={styles.tipRow}>
                        <Text style={styles.tipCheck}>✓</Text>
                        <Text style={styles.tipText}>{tip}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Hairstyle */}
                {aiResult.hairstyle && (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>💇 Saç Önerileri</Text>
                    {aiResult.hairstyle.recommended_style && (
                      <View style={styles.aiItem}>
                        <Text style={styles.aiItemLabel}>Önerilen Stil</Text>
                        <Text style={styles.aiItemText}>{aiResult.hairstyle.recommended_style}</Text>
                      </View>
                    )}
                    {aiResult.hairstyle.color_suggestion && (
                      <View style={styles.aiItem}>
                        <Text style={styles.aiItemLabel}>Renk Önerisi</Text>
                        <Text style={styles.aiItemText}>{aiResult.hairstyle.color_suggestion}</Text>
                      </View>
                    )}
                    {aiResult.hairstyle.care_tips && aiResult.hairstyle.care_tips.map((tip: string, i: number) => (
                      <View key={i} style={styles.tipRow}>
                        <Text style={styles.tipCheck}>✓</Text>
                        <Text style={styles.tipText}>{tip}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Grooming (male) */}
                {aiResult.grooming && isGenderMale && (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>🧔 Bakım Önerileri</Text>
                    {aiResult.grooming.beard_style && (
                      <View style={styles.aiItem}>
                        <Text style={styles.aiItemLabel}>Sakal Stili</Text>
                        <Text style={styles.aiItemText}>{aiResult.grooming.beard_style}</Text>
                      </View>
                    )}
                    {aiResult.grooming.skincare && (
                      <View style={styles.aiItem}>
                        <Text style={styles.aiItemLabel}>Cilt Bakımı</Text>
                        <Text style={styles.aiItemText}>{aiResult.grooming.skincare}</Text>
                      </View>
                    )}
                    {aiResult.grooming.tips && aiResult.grooming.tips.map((tip: string, i: number) => (
                      <View key={i} style={styles.tipRow}>
                        <Text style={styles.tipCheck}>✓</Text>
                        <Text style={styles.tipText}>{tip}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  headerLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: '#bbb', marginBottom: 4 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#111', letterSpacing: -0.5 },

  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginRight: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  },
  tabActive: { borderBottomColor: '#111' },
  tabText: { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: '#bbb', textTransform: 'uppercase' },
  tabTextActive: { color: '#111' },

  section: {},
  card: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#111', marginBottom: 12 },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: '#bbb', textTransform: 'uppercase', marginBottom: 12 },
  hint: { fontSize: 12, color: '#888', marginBottom: 16, lineHeight: 18 },

  // Upload area
  uploadArea: {
    borderWidth: 2,
    borderColor: '#e5e5e5',
    borderStyle: 'dashed',
    paddingVertical: 48,
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadIcon: { fontSize: 32, marginBottom: 8 },
  uploadText: { fontSize: 13, fontWeight: '600', color: '#888', marginBottom: 4 },
  uploadHint: { fontSize: 11, color: '#bbb' },

  facePreviewContainer: { alignItems: 'center', marginBottom: 16 },
  facePreview: { width: 160, height: 160, marginBottom: 12 },

  // Face analysis results
  faceShapeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  faceShapeTitle: { fontSize: 22, fontWeight: '700', color: '#111', marginBottom: 4 },
  faceShapeDesc: { fontSize: 13, color: '#666', lineHeight: 18 },
  confidenceBox: { alignItems: 'flex-end' },
  confidenceLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1, color: '#bbb', marginBottom: 2 },
  confidenceValue: { fontSize: 18, fontWeight: '700', color: '#111' },

  hairstyleItem: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    padding: 12,
    marginBottom: 8,
  },
  hairstyleName: { fontSize: 13, fontWeight: '700', color: '#111', marginBottom: 4 },
  hairstyleDesc: { fontSize: 12, color: '#666', marginBottom: 4 },
  hairstyleSuitable: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5, color: '#bbb', textTransform: 'uppercase' },

  tipRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  tipCheck: { fontSize: 13, color: '#22c55e', fontWeight: '700', width: 16 },
  tipText: { fontSize: 13, color: '#444', flex: 1, lineHeight: 18 },

  // Profile form
  fieldGroup: { marginBottom: 20 },
  fieldLabel: { fontSize: 11, fontWeight: '600', color: '#888', marginBottom: 10 },

  faceShapeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  faceShapeChip: {
    width: '30%',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    paddingVertical: 12,
    alignItems: 'center',
    gap: 4,
  },
  faceShapeIcon: { fontSize: 18 },

  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skinToneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  skinDot: { width: 10, height: 10 },
  flexChip: {
    flex: 1,
    minWidth: '22%',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    paddingVertical: 9,
    alignItems: 'center',
  },

  chipSelected: { borderColor: '#111', backgroundColor: '#111' },
  chipText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, color: '#666', textTransform: 'uppercase' },
  chipTextSmall: { fontSize: 10, fontWeight: '600', color: '#666' },
  chipTextSelected: { color: '#fff' },

  // Buttons
  btnPrimary: {
    backgroundColor: '#111',
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  btnPrimaryText: { fontSize: 13, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  btnBrand: {
    backgroundColor: '#111',
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  btnBrandText: { fontSize: 13, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  btnOutline: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  btnOutlineText: { fontSize: 12, fontWeight: '600', color: '#111' },
  btnDisabled: { opacity: 0.6 },

  errorBox: {
    borderWidth: 1,
    borderColor: '#fde68a',
    backgroundColor: '#fffbeb',
    padding: 12,
    marginBottom: 12,
  },
  errorText: { fontSize: 13, color: '#b45309' },

  aiItem: { marginBottom: 10 },
  aiItemLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, color: '#bbb', marginBottom: 2, textTransform: 'uppercase' },
  aiItemText: { fontSize: 13, color: '#444', lineHeight: 18 },
});
