import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, ActivityIndicator,
  Image, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/lib/supabase/client';

// ─── Constants ───────────────────────────────────────────────
const GENDER_OPTIONS = [
  { value: 'female',           label: 'Kadın' },
  { value: 'male',             label: 'Erkek' },
  { value: 'non_binary',       label: 'Non-binary' },
  { value: 'prefer_not_to_say', label: 'Belirtmek istemiyorum' },
];

const STYLE_LABELS: Record<string, string> = {
  casual: 'Casual', formal: 'Formal', sport: 'Sportif',
  streetwear: 'Streetwear', elegant: 'Elegant', bohemian: 'Bohemian',
};

const GENDER_LABELS: Record<string, string> = {
  male: 'Erkek', female: 'Kadın',
  non_binary: 'Non-binary', prefer_not_to_say: 'Belirtmek istemiyorum',
};

function calcAge(birthDate: string | null): string {
  if (!birthDate) return '—';
  const diff = Date.now() - new Date(birthDate).getTime();
  return `${Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))} yaş`;
}

// ─── Interfaces ──────────────────────────────────────────────
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

// ─── Component ───────────────────────────────────────────────
export default function ProfileScreen() {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [measurements, setMeasurements] = useState<BodyMeasurements | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit modes
  const [editProfile, setEditProfile] = useState(false);
  const [editMeasure, setEditMeasure] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Profile edit form
  const [editName, setEditName] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editBirthDate, setEditBirthDate] = useState('');

  // Measurements edit form
  const [editHeight, setEditHeight] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editWaist, setEditWaist] = useState('');
  const [editHip, setEditHip] = useState('');
  const [editShoeSize, setEditShoeSize] = useState('');

  // ── Load data
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

  // ── Start editing profile
  const startEditProfile = () => {
    setEditName(profile?.full_name ?? '');
    setEditGender(profile?.gender ?? '');
    setEditBirthDate(profile?.birth_date ?? '');
    setEditProfile(true);
  };

  // ── Save profile
  const handleSaveProfile = async () => {
    if (!userId) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      full_name: editName,
      gender: editGender || null,
      birth_date: editBirthDate || null,
    }).eq('id', userId);
    if (!error) {
      setProfile(prev => prev ? {
        ...prev,
        full_name: editName,
        gender: editGender || null,
        birth_date: editBirthDate || null,
      } : prev);
      setEditProfile(false);
      flash('Profil güncellendi.');
    }
    setSaving(false);
  };

  // ── Start editing measurements
  const startEditMeasure = () => {
    setEditHeight(measurements?.height_cm?.toString() ?? '');
    setEditWeight(measurements?.weight_kg?.toString() ?? '');
    setEditWaist(measurements?.waist_cm?.toString() ?? '');
    setEditHip(measurements?.hip_cm?.toString() ?? '');
    setEditShoeSize(measurements?.shoe_size?.toString() ?? '');
    setEditMeasure(true);
  };

  // ── Save measurements
  const handleSaveMeasurements = async () => {
    if (!userId) return;
    setSaving(true);
    const data = {
      user_id: userId,
      height_cm: editHeight ? parseFloat(editHeight) : null,
      weight_kg: editWeight ? parseFloat(editWeight) : null,
      waist_cm: editWaist ? parseFloat(editWaist) : null,
      hip_cm: editHip ? parseFloat(editHip) : null,
      shoe_size: editShoeSize ? parseFloat(editShoeSize) : null,
    };

    // Calculate BMI
    let bmi: number | null = null;
    if (data.height_cm && data.weight_kg) {
      const heightM = data.height_cm / 100;
      bmi = Math.round((data.weight_kg / (heightM * heightM)) * 10) / 10;
    }

    const { error } = await supabase.from('body_measurements').upsert(
      { ...data, bmi },
      { onConflict: 'user_id' }
    );
    if (!error) {
      setMeasurements({ ...data, bmi });
      setEditMeasure(false);
      flash('Ölçüler güncellendi.');
    }
    setSaving(false);
  };

  // ── Upload avatar
  const handlePickAvatar = async () => {
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
    if (result.canceled || !result.assets[0] || !userId) return;

    setUploadingPhoto(true);
    const uri = result.assets[0].uri;
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64' as any,
      });
      const arrayBuffer = decode(base64);
      const filePath = `${userId}/avatar.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        flash('Fotoğraf yüklenemedi, tekrar dene.');
      } else {
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
        const urlWithTimestamp = `${publicUrl}?t=${Date.now()}`;
        await supabase.from('profiles').update({ avatar_url: urlWithTimestamp }).eq('id', userId);
        setProfile(prev => prev ? { ...prev, avatar_url: urlWithTimestamp } : prev);
        flash('Profil fotoğrafı güncellendi.');
      }
    } catch {
      flash('Fotoğraf yüklenemedi, tekrar dene.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // ── Logout
  const handleLogout = async () => {
    Alert.alert('Çıkış', 'Çıkış yapmak istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ]);
  };

  if (loading) {
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
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profilim</Text>
          <Text style={styles.headerSub}>Kişisel bilgilerini ve ölçülerini yönet.</Text>
        </View>

        {/* Success message */}
        {successMsg && (
          <View style={styles.successBox}>
            <Text style={styles.successText}>✓ {successMsg}</Text>
          </View>
        )}

        {/* ── Avatar ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Profil Fotoğrafı</Text>
          <View style={styles.avatarRow}>
            <TouchableOpacity onPress={handlePickAvatar} disabled={uploadingPhoto}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                    {profile?.full_name?.charAt(0).toUpperCase() ?? '?'}
                  </Text>
                </View>
              )}
              {uploadingPhoto && (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator color="#fff" size="small" />
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.avatarInfo}>
              <TouchableOpacity style={styles.btnOutline} onPress={handlePickAvatar} disabled={uploadingPhoto}>
                <Text style={styles.btnOutlineText}>Fotoğraf Yükle</Text>
              </TouchableOpacity>
              <Text style={styles.hint}>JPG, PNG veya WebP · Maks. 5 MB</Text>
            </View>
          </View>
        </View>

        {/* ── Personal Info ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Kişisel Bilgiler</Text>
            {!editProfile && (
              <TouchableOpacity onPress={startEditProfile}>
                <Text style={styles.editBtn}>Düzenle</Text>
              </TouchableOpacity>
            )}
          </View>

          {!editProfile ? (
            <View style={styles.infoGrid}>
              <InfoRow label="Ad Soyad" value={profile?.full_name ?? '—'} />
              <InfoRow label="Cinsiyet" value={profile?.gender ? GENDER_LABELS[profile.gender] : '—'} />
              <InfoRow
                label="Doğum Tarihi"
                value={profile?.birth_date ? new Date(profile.birth_date).toLocaleDateString('tr-TR') : '—'}
              />
              <InfoRow label="Yaş" value={calcAge(profile?.birth_date ?? null)} />
              <View style={styles.fullWidth}>
                <Text style={styles.infoLabel}>Stil Tercihleri</Text>
                <View style={styles.styleTagsRow}>
                  {profile?.style_prefs?.length
                    ? profile.style_prefs.map(s => (
                        <View key={s} style={styles.styleTag}>
                          <Text style={styles.styleTagText}>{STYLE_LABELS[s] ?? s}</Text>
                        </View>
                      ))
                    : <Text style={styles.emptyValue}>—</Text>
                  }
                </View>
              </View>
            </View>
          ) : (
            <View>
              <Text style={styles.fieldLabel}>Ad Soyad</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Adınız Soyadınız"
              />

              <Text style={styles.fieldLabel}>Cinsiyet</Text>
              <View style={styles.genderGrid}>
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

              <Text style={styles.fieldLabel}>Doğum Tarihi (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={editBirthDate}
                onChangeText={setEditBirthDate}
                placeholder="1990-01-15"
                keyboardType="numeric"
              />

              <View style={styles.editButtons}>
                <TouchableOpacity style={styles.btnCancel} onPress={() => setEditProfile(false)}>
                  <Text style={styles.btnCancelText}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnSave, saving && styles.btnDisabled]}
                  onPress={handleSaveProfile}
                  disabled={saving}
                >
                  {saving
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.btnSaveText}>Kaydet</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* ── Body Measurements ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Vücut Ölçüleri</Text>
            {!editMeasure && (
              <TouchableOpacity onPress={startEditMeasure}>
                <Text style={styles.editBtn}>Düzenle</Text>
              </TouchableOpacity>
            )}
          </View>

          {!editMeasure ? (
            <View style={styles.infoGrid}>
              <InfoRow label="Boy" value={measurements?.height_cm ? `${measurements.height_cm} cm` : '—'} />
              <InfoRow label="Kilo" value={measurements?.weight_kg ? `${measurements.weight_kg} kg` : '—'} />
              <InfoRow label="Bel" value={measurements?.waist_cm ? `${measurements.waist_cm} cm` : '—'} />
              <InfoRow label="Kalça" value={measurements?.hip_cm ? `${measurements.hip_cm} cm` : '—'} />
              <InfoRow label="Ayak No" value={measurements?.shoe_size ? `${measurements.shoe_size} EU` : '—'} />
              <InfoRow label="BMI" value={measurements?.bmi ? `${measurements.bmi}` : '—'} />
            </View>
          ) : (
            <View>
              <View style={styles.measureGrid}>
                <View style={styles.measureField}>
                  <Text style={styles.fieldLabel}>Boy (cm)</Text>
                  <TextInput
                    style={styles.input}
                    value={editHeight}
                    onChangeText={setEditHeight}
                    placeholder="168"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.measureField}>
                  <Text style={styles.fieldLabel}>Kilo (kg)</Text>
                  <TextInput
                    style={styles.input}
                    value={editWeight}
                    onChangeText={setEditWeight}
                    placeholder="62"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.measureField}>
                  <Text style={styles.fieldLabel}>Bel (cm)</Text>
                  <TextInput
                    style={styles.input}
                    value={editWaist}
                    onChangeText={setEditWaist}
                    placeholder="70"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.measureField}>
                  <Text style={styles.fieldLabel}>Kalça (cm)</Text>
                  <TextInput
                    style={styles.input}
                    value={editHip}
                    onChangeText={setEditHip}
                    placeholder="95"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.measureField}>
                  <Text style={styles.fieldLabel}>Ayak No (EU)</Text>
                  <TextInput
                    style={styles.input}
                    value={editShoeSize}
                    onChangeText={setEditShoeSize}
                    placeholder="38"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.editButtons}>
                <TouchableOpacity style={styles.btnCancel} onPress={() => setEditMeasure(false)}>
                  <Text style={styles.btnCancelText}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnSave, saving && styles.btnDisabled]}
                  onPress={handleSaveMeasurements}
                  disabled={saving}
                >
                  {saving
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.btnSaveText}>Kaydet</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* ── Logout ── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── InfoRow ────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },

  header: { paddingVertical: 20 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#111', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: '#888', marginTop: 4 },

  successBox: {
    borderWidth: 1, borderColor: '#bbf7d0', backgroundColor: '#f0fdf4',
    padding: 12, marginBottom: 12, borderRadius: 8,
  },
  successText: { fontSize: 13, color: '#15803d', fontWeight: '600' },

  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111' },
  editBtn: { fontSize: 13, fontWeight: '600', color: '#6366f1' },

  // Avatar
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  avatarPlaceholder: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#ede9fe',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: { fontSize: 28, fontWeight: '700', color: '#7c3aed' },
  avatarOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 36, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInfo: { flex: 1, gap: 6 },
  hint: { fontSize: 11, color: '#bbb' },

  // Info grid
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 0 },
  infoRow: { width: '50%', paddingBottom: 14 },
  fullWidth: { width: '100%', paddingBottom: 8 },
  infoLabel: { fontSize: 11, color: '#888', marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#111' },
  emptyValue: { fontSize: 14, color: '#bbb' },

  styleTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  styleTag: {
    borderRadius: 6, borderWidth: 1, borderColor: '#ddd6fe',
    backgroundColor: '#f5f3ff', paddingHorizontal: 8, paddingVertical: 3,
  },
  styleTagText: { fontSize: 11, fontWeight: '600', color: '#7c3aed' },

  // Edit form
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#888', marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1, borderColor: '#e5e5e5', backgroundColor: '#f9f9f9',
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111', borderRadius: 8,
  },
  genderGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  genderOption: {
    borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8, minWidth: '45%',
  },
  genderSelected: { borderColor: '#6366f1', backgroundColor: '#ede9fe' },
  genderText: { fontSize: 13, color: '#555' },
  genderTextSelected: { color: '#6366f1', fontWeight: '700' },

  // Measurements grid
  measureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  measureField: { width: '47%' },

  // Edit buttons
  editButtons: { flexDirection: 'row', gap: 10, marginTop: 16 },
  btnCancel: {
    flex: 1, borderWidth: 1, borderColor: '#e5e5e5',
    paddingVertical: 12, alignItems: 'center', borderRadius: 8,
  },
  btnCancelText: { fontSize: 13, fontWeight: '600', color: '#666' },
  btnSave: {
    flex: 1, backgroundColor: '#111',
    paddingVertical: 12, alignItems: 'center', borderRadius: 8,
  },
  btnSaveText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  btnDisabled: { opacity: 0.6 },

  btnOutline: {
    borderWidth: 1, borderColor: '#e5e5e5',
    paddingVertical: 8, paddingHorizontal: 16, alignItems: 'center', borderRadius: 8,
  },
  btnOutlineText: { fontSize: 13, fontWeight: '600', color: '#111' },

  logoutBtn: {
    borderWidth: 1, borderColor: '#fecaca', backgroundColor: '#fff5f5',
    paddingVertical: 14, alignItems: 'center', borderRadius: 12, marginTop: 8,
  },
  logoutText: { fontSize: 13, fontWeight: '700', color: '#dc2626' },
});
