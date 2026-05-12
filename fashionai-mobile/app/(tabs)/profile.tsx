import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, ActivityIndicator,
  Image, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { Lang } from '@/lib/i18n/translations';

const RED   = '#C41E3A';
const RED_BG = 'rgba(196,30,58,0.08)';

const ALL_STYLES = [
  { value: 'casual',     label: 'Casual' },
  { value: 'sport',      label: 'Sportif' },
  { value: 'formal',     label: 'Formal' },
  { value: 'bohemian',   label: 'Bohemian' },
  { value: 'elegant',    label: 'Elegant' },
  { value: 'streetwear', label: 'Streetwear' },
];

const GENDER_MAP: Record<string, string> = {
  male: 'Erkek', female: 'Kadın',
  non_binary: 'Non-binary', prefer_not_to_say: 'Belirtmek istemiyorum',
};

function calcAge(birthDate: string | null, ageUnit: string): string {
  if (!birthDate) return '—';
  const diff = Date.now() - new Date(birthDate).getTime();
  return `${Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))} ${ageUnit}`;
}

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  gender: string | null;
  birth_date: string | null;
  style_prefs: string[] | null;
}

interface BodyMeasurements {
  height_cm: number | null;
  weight_kg: number | null;
  waist_cm: number | null;
  hip_cm: number | null;
  shoe_size: number | null;
  bmi: number | null;
}

// ── Sub-components ────────────────────────────────────────────
function ViewField({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, paddingBottom: 14 }}>
      <Text style={{ fontSize: 11, color: '#9E9690', marginBottom: 2 }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#141210' }}>{value}</Text>
    </View>
  );
}

function MeasureCard({ iconName, label, value }: { iconName: string; label: string; value: string }) {
  return (
    <View style={styles.measureCard}>
      <View style={styles.measureIcon}>
        <Ionicons name={iconName as any} size={18} color={RED} />
      </View>
      <View>
        <Text style={{ fontSize: 11, color: '#9E9690', marginBottom: 2 }}>{label}</Text>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#141210' }}>{value}</Text>
      </View>
    </View>
  );
}

function QuickAction({ iconName, label, onPress }: { iconName: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.quickIcon}>
        <Ionicons name={iconName as any} size={16} color={RED} />
      </View>
      <Text style={{ fontSize: 12, fontWeight: '500', color: '#2C2320', flex: 1 }}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function ProfileScreen() {
  const { t, lang, setLang } = useLanguage();

  const GENDER_OPTIONS = [
    { value: 'female',            label: t.profile.genderLabels.female },
    { value: 'male',              label: t.profile.genderLabels.male },
    { value: 'non_binary',        label: t.profile.genderLabels.non_binary },
    { value: 'prefer_not_to_say', label: t.profile.genderLabels.prefer_not_to_say },
  ];

  const [userId, setUserId]             = useState<string | null>(null);
  const [profile, setProfile]           = useState<Profile | null>(null);
  const [measurements, setMeasurements] = useState<BodyMeasurements | null>(null);
  const [loading, setLoading]           = useState(true);

  const [editProfile, setEditProfile]   = useState(false);
  const [editMeasure, setEditMeasure]   = useState(false);
  const [saving, setSaving]             = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [successMsg, setSuccessMsg]     = useState<string | null>(null);

  const [editName, setEditName]         = useState('');
  const [editGender, setEditGender]     = useState('');
  const [editBirthDate, setEditBirthDate] = useState('');

  const [editHeight, setEditHeight]     = useState('');
  const [editWeight, setEditWeight]     = useState('');
  const [editWaist, setEditWaist]       = useState('');
  const [editHip, setEditHip]           = useState('');
  const [editShoeSize, setEditShoeSize] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const [{ data: p }, { data: m }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('body_measurements').select('*').eq('user_id', user.id).single(),
      ]);
      if (p) setProfile(p);
      if (m) setMeasurements(m);
      setLoading(false);
    })();
  }, []);

  const flash = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const startEditProfile = () => {
    setEditName(profile?.full_name ?? '');
    setEditGender(profile?.gender ?? '');
    setEditBirthDate(profile?.birth_date ?? '');
    setEditProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!userId) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      full_name: editName,
      gender: editGender || null,
      birth_date: editBirthDate || null,
    }).eq('id', userId);
    if (!error) {
      setProfile(prev => prev ? { ...prev, full_name: editName, gender: editGender || null, birth_date: editBirthDate || null } : prev);
      setEditProfile(false);
      flash(t.profile.profileUpdated);
    }
    setSaving(false);
  };

  const startEditMeasure = () => {
    setEditHeight(measurements?.height_cm?.toString() ?? '');
    setEditWeight(measurements?.weight_kg?.toString() ?? '');
    setEditWaist(measurements?.waist_cm?.toString() ?? '');
    setEditHip(measurements?.hip_cm?.toString() ?? '');
    setEditShoeSize(measurements?.shoe_size?.toString() ?? '');
    setEditMeasure(true);
  };

  const handleSaveMeasurements = async () => {
    if (!userId) return;
    setSaving(true);
    const data = {
      user_id: userId,
      height_cm: editHeight   ? parseFloat(editHeight)   : null,
      weight_kg: editWeight   ? parseFloat(editWeight)   : null,
      waist_cm:  editWaist    ? parseFloat(editWaist)    : null,
      hip_cm:    editHip      ? parseFloat(editHip)      : null,
      shoe_size: editShoeSize ? parseFloat(editShoeSize) : null,
    };
    let bmi: number | null = null;
    if (data.height_cm && data.weight_kg) {
      const h = data.height_cm / 100;
      bmi = Math.round((data.weight_kg / (h * h)) * 10) / 10;
    }
    const { error } = await supabase.from('body_measurements').upsert({ ...data, bmi }, { onConflict: 'user_id' });
    if (!error) {
      setMeasurements({ ...data, bmi });
      setEditMeasure(false);
      flash(t.profile.measurementsUpdated);
    }
    setSaving(false);
  };

  const handleStyleToggle = async (styleValue: string) => {
    if (!userId) return;
    const current = profile?.style_prefs ?? [];
    const updated = current.includes(styleValue)
      ? current.filter(s => s !== styleValue)
      : [...current, styleValue];
    const { error } = await supabase.from('profiles').update({ style_prefs: updated }).eq('id', userId);
    if (!error) setProfile(prev => prev ? { ...prev, style_prefs: updated } : prev);
  };

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('İzin Gerekli', 'Galeri erişimi gerekli.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as any, allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (result.canceled || !result.assets[0] || !userId) return;
    setUploadingPhoto(true);
    try {
      const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, { encoding: 'base64' as any });
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(`${userId}/avatar.jpg`, decode(base64), { contentType: 'image/jpeg', upsert: true });
      if (uploadError) { flash(t.profile.errorUploadFailed); }
      else {
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(`${userId}/avatar.jpg`);
        const url = `${publicUrl}?t=${Date.now()}`;
        await supabase.from('profiles').update({ avatar_url: url }).eq('id', userId);
        setProfile(prev => prev ? { ...prev, avatar_url: url } : prev);
        flash(t.profile.photoUpdated);
      }
    } catch { flash(t.profile.errorUploadFailed); }
    finally { setUploadingPhoto(false); }
  };

  const handleLogout = async () => {
    Alert.alert(t.profile.logout,
      lang === 'tr' ? 'Çıkış yapmak istediğinize emin misiniz?' : 'Are you sure you want to sign out?',
      [
        { text: t.profile.cancel, style: 'cancel' },
        { text: t.profile.logout, style: 'destructive', onPress: async () => { await supabase.auth.signOut(); } },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={RED} />
        </View>
      </SafeAreaView>
    );
  }

  const initial = profile?.full_name?.charAt(0).toUpperCase() ?? '?';

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 4, height: 32, backgroundColor: RED, borderRadius: 2 }} />
          <Text style={styles.headerTitle}>{t.profile.title}</Text>
        </View>
        <Text style={styles.headerSub}>{t.profile.subtitle}</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>

        {/* ── Success toast ── */}
        {successMsg && (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={16} color="#006030" />
            <Text style={styles.successText}>{successMsg}</Text>
          </View>
        )}

        {/* ── Dil Seçici ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t.profile.language}</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {(['tr', 'en'] as Lang[]).map(l => (
              <TouchableOpacity
                key={l}
                style={[styles.langBtn, lang === l && styles.langBtnActive]}
                onPress={() => setLang(l)}
              >
                <Text style={[styles.langBtnText, lang === l && styles.langBtnTextActive]}>
                  {l === 'tr' ? '🇹🇷 Türkçe' : '🇬🇧 English'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Kart 1: Fotoğraf + Kişisel Bilgiler ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Profil Fotoğrafı</Text>

          {/* Avatar + Kişisel Bilgiler — 2 sütun */}
          <View style={{ flexDirection: 'row', gap: 16 }}>

            {/* Sol: Avatar */}
            <View style={{ alignItems: 'center', gap: 10, minWidth: 110 }}>
              <View style={{ position: 'relative' }}>
                {profile?.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitial}>{initial}</Text>
                  </View>
                )}
                {uploadingPhoto && (
                  <View style={styles.avatarOverlay}>
                    <ActivityIndicator color="#fff" size="small" />
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.uploadBtn}
                onPress={handlePickAvatar}
                disabled={uploadingPhoto}
                activeOpacity={0.8}
              >
                <Text style={styles.uploadBtnText}>
                  {uploadingPhoto ? 'Yükleniyor…' : 'Fotoğraf Yükle'}
                </Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 10, color: '#9E9690', textAlign: 'center', lineHeight: 14 }}>
                JPG, PNG veya WebP{'\n'}Maks. 5 MB
              </Text>
            </View>

            {/* Sağ: Kişisel Bilgiler */}
            <View style={{ flex: 1, borderLeftWidth: 1, borderLeftColor: '#F0EBE6', paddingLeft: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#141210' }}>Kişisel Bilgiler</Text>
                {!editProfile && (
                  <TouchableOpacity onPress={startEditProfile}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: RED }}>Düzenle</Text>
                  </TouchableOpacity>
                )}
              </View>

              {!editProfile ? (
                <View style={{ gap: 10 }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <ViewField label="Ad Soyad" value={profile?.full_name ?? '—'} />
                    <ViewField label="Cinsiyet" value={profile?.gender ? (GENDER_MAP[profile.gender] ?? '—') : '—'} />
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <ViewField
                      label="Doğum Tarihi"
                      value={profile?.birth_date ? new Date(profile.birth_date).toLocaleDateString('tr-TR') : '—'}
                    />
                    <ViewField label="Yaş" value={calcAge(profile?.birth_date ?? null, t.profile.ageUnit)} />
                  </View>
                </View>
              ) : (
                <View style={{ gap: 10 }}>
                  <View>
                    <Text style={styles.fieldLabel}>Ad Soyad</Text>
                    <TextInput style={styles.input} value={editName} onChangeText={setEditName} placeholder="Ad Soyad" />
                  </View>
                  <View>
                    <Text style={styles.fieldLabel}>Cinsiyet</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {GENDER_OPTIONS.map(opt => (
                        <TouchableOpacity
                          key={opt.value}
                          style={[styles.genderOption, editGender === opt.value && styles.genderSelected]}
                          onPress={() => setEditGender(opt.value)}
                        >
                          <Text style={[styles.genderText, editGender === opt.value && styles.genderTextSelected]}>
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <View>
                    <Text style={styles.fieldLabel}>Doğum Tarihi (YYYY-MM-DD)</Text>
                    <TextInput
                      style={styles.input}
                      value={editBirthDate}
                      onChangeText={setEditBirthDate}
                      placeholder="1990-01-15"
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                    <TouchableOpacity style={styles.btnCancel} onPress={() => setEditProfile(false)}>
                      <Text style={styles.btnCancelText}>{t.profile.cancel}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.btnSave, saving && { opacity: 0.6 }]}
                      onPress={handleSaveProfile}
                      disabled={saving}
                    >
                      {saving
                        ? <ActivityIndicator color="#fff" size="small" />
                        : <Text style={styles.btnSaveText}>{t.profile.save}</Text>
                      }
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Stil Tercihleri */}
          <View style={{ borderTopWidth: 1, borderTopColor: '#F0EBE6', marginTop: 20, paddingTop: 18 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#141210', marginBottom: 12 }}>Stil Tercihleri</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {ALL_STYLES.map(s => {
                const selected = profile?.style_prefs?.includes(s.value);
                return (
                  <TouchableOpacity
                    key={s.value}
                    onPress={() => handleStyleToggle(s.value)}
                    activeOpacity={0.75}
                    style={[
                      styles.stylePill,
                      selected && styles.stylePillSelected,
                    ]}
                  >
                    <Text style={[styles.stylePillText, selected && styles.stylePillTextSelected]}>
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* ── Kart 2: Vücut Ölçüleri ── */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <Text style={styles.cardTitle}>{t.profile.measurementsTitle}</Text>
            {!editMeasure && (
              <TouchableOpacity onPress={startEditMeasure}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: RED }}>Düzenle</Text>
              </TouchableOpacity>
            )}
          </View>

          {!editMeasure ? (
            <View style={styles.measureGrid}>
              <MeasureCard iconName="resize-outline"         label="Boy"           value={measurements?.height_cm ? `${measurements.height_cm} cm` : '—'} />
              <MeasureCard iconName="scale-outline"          label="Kilo"          value={measurements?.weight_kg ? `${measurements.weight_kg} kg` : '—'} />
              <MeasureCard iconName="body-outline"           label="Bel"           value={measurements?.waist_cm  ? `${measurements.waist_cm} cm`  : '—'} />
              <MeasureCard iconName="man-outline"            label="Kalça"         value={measurements?.hip_cm    ? `${measurements.hip_cm} cm`    : '—'} />
              <MeasureCard iconName="footsteps-outline"      label="Ayak No"       value={measurements?.shoe_size ? `${measurements.shoe_size} EU` : '—'} />
              <MeasureCard iconName="calculator-outline"     label="BMI"           value={measurements?.bmi       ? `${measurements.bmi}`          : '—'} />
            </View>
          ) : (
            <View>
              <View style={styles.measureEditGrid}>
                {[
                  { label: 'Boy (cm)',     value: editHeight,   set: setEditHeight,   ph: '168' },
                  { label: 'Kilo (kg)',    value: editWeight,   set: setEditWeight,   ph: '62'  },
                  { label: 'Bel (cm)',     value: editWaist,    set: setEditWaist,    ph: '70'  },
                  { label: 'Kalça (cm)',   value: editHip,      set: setEditHip,      ph: '95'  },
                  { label: 'Ayak No (EU)', value: editShoeSize, set: setEditShoeSize, ph: '38'  },
                ].map(({ label, value, set, ph }) => (
                  <View key={label} style={{ width: '47%' }}>
                    <Text style={styles.fieldLabel}>{label}</Text>
                    <TextInput style={styles.input} value={value} onChangeText={set} placeholder={ph} keyboardType="numeric" />
                  </View>
                ))}
              </View>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                <TouchableOpacity style={styles.btnCancel} onPress={() => setEditMeasure(false)}>
                  <Text style={styles.btnCancelText}>{t.profile.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnSave, saving && { opacity: 0.6 }]}
                  onPress={handleSaveMeasurements}
                  disabled={saving}
                >
                  {saving
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.btnSaveText}>{t.profile.save}</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* ── Kart 3: Hızlı İşlemler ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Hızlı İşlemler</Text>
          <View style={{ gap: 10 }}>
            <QuickAction iconName="pencil-outline"  label="Ölçümlerimi Güncelle"        onPress={startEditMeasure} />
            <QuickAction iconName="color-palette-outline" label="Stil Tercihlerimi Düzenle"  onPress={() => {}} />
            <QuickAction iconName="person-outline"  label="Profil Bilgilerimi Güncelle"  onPress={startEditProfile} />
          </View>
        </View>

        {/* ── Çıkış ── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={17} color={RED} />
          <Text style={styles.logoutText}>{t.profile.logout}</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F2EE' },

  header: {
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14,
    backgroundColor: '#1C1917',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.3 },
  headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4, paddingLeft: 14 },

  successBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(0,120,60,0.08)', borderWidth: 1, borderColor: 'rgba(0,120,60,0.2)',
    borderRadius: 12, padding: 12, marginTop: 12, marginBottom: 4,
  },
  successText: { fontSize: 13, color: '#006030', fontWeight: '600', flex: 1 },

  card: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)',
    borderRadius: 18, padding: 20, marginTop: 14,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#141210', marginBottom: 14 },

  langBtn: {
    flex: 1, borderWidth: 1, borderColor: '#E2DDD7', borderRadius: 12,
    paddingVertical: 10, alignItems: 'center', backgroundColor: '#F5F2EE',
  },
  langBtnActive:     { borderColor: RED, backgroundColor: RED },
  langBtnText:       { fontSize: 13, fontWeight: '600', color: '#706A64' },
  langBtnTextActive: { color: '#fff' },

  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: RED, justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: { fontSize: 36, fontWeight: '700', color: '#fff' },
  avatarOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 48, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center',
  },

  uploadBtn: {
    backgroundColor: RED, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  uploadBtnText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#706A64', marginBottom: 5 },
  input: {
    borderWidth: 1, borderColor: '#E2DDD7', borderRadius: 10,
    backgroundColor: '#FAF7F5', paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: '#141210',
  },

  genderOption: {
    borderWidth: 1, borderColor: '#E2DDD7', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 7, backgroundColor: '#F5F2EE',
  },
  genderSelected:     { borderColor: RED, backgroundColor: RED },
  genderText:         { fontSize: 12, color: '#706A64' },
  genderTextSelected: { color: '#fff', fontWeight: '700' },

  stylePill: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 50,
    borderWidth: 1.5, borderColor: '#D6CFC9', backgroundColor: 'transparent',
  },
  stylePillSelected: { backgroundColor: RED, borderColor: RED },
  stylePillText:     { fontSize: 13, fontWeight: '600', color: '#706A64' },
  stylePillTextSelected: { color: '#fff' },

  measureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  measureCard: {
    width: '47%', backgroundColor: '#FAF7F5', borderWidth: 1, borderColor: '#EDE8E3',
    borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  measureIcon: {
    width: 38, height: 38, borderRadius: 10, backgroundColor: RED_BG,
    justifyContent: 'center', alignItems: 'center',
  },

  measureEditGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },

  quickAction: {
    backgroundColor: '#FAF7F5', borderWidth: 1, borderColor: '#EDE8E3',
    borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  quickIcon: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: RED_BG,
    justifyContent: 'center', alignItems: 'center',
  },

  btnCancel: {
    flex: 1, borderWidth: 1, borderColor: '#E2DDD7', borderRadius: 10,
    paddingVertical: 11, alignItems: 'center', backgroundColor: '#F5F2EE',
  },
  btnCancelText: { fontSize: 13, fontWeight: '600', color: '#706A64' },
  btnSave: {
    flex: 1, backgroundColor: RED, borderRadius: 10,
    paddingVertical: 11, alignItems: 'center',
  },
  btnSaveText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  logoutBtn: {
    borderWidth: 1, borderColor: 'rgba(196,30,58,0.3)', backgroundColor: 'rgba(196,30,58,0.08)',
    borderRadius: 14, paddingVertical: 14, marginTop: 14,
    flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center',
  },
  logoutText: { fontSize: 13, fontWeight: '700', color: RED },
});
