import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Image, ActivityIndicator, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageContext';

type FaceShape = 'oval' | 'round' | 'square' | 'heart' | 'diamond' | 'oblong';

interface UserProfile {
  id: string;
  photo_url: string | null;
  face_shape: FaceShape | null;
}

export default function AvatarScreen() {
  const { t } = useLanguage();

  const FACE_SHAPES: { value: FaceShape; label: string; description: string }[] = [
    { value: 'oval',    label: t.avatar.faceShapeDescriptions ? 'Oval' : 'Oval', description: t.avatar.faceShapeDescriptions.oval },
    { value: 'round',   label: 'Yuvarlak', description: t.avatar.faceShapeDescriptions.round },
    { value: 'square',  label: 'Kare', description: t.avatar.faceShapeDescriptions.square },
    { value: 'heart',   label: 'Kalp', description: t.avatar.faceShapeDescriptions.heart },
    { value: 'diamond', label: 'Elmas', description: t.avatar.faceShapeDescriptions.diamond },
    { value: 'oblong',  label: 'Uzun', description: t.avatar.faceShapeDescriptions.oblong },
  ];

  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data } = await supabase
        .from('user_profiles')
        .select('id, photo_url, face_shape')
        .eq('id', user.id)
        .single();

      if (data) setProfile(data);
    })();
  }, []);

  const flash = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Galeri erişimi gerekli.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as any,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0] || !userId) return;

    const uri = result.assets[0].uri;
    setUploading(true);
    setErrorMsg(null);
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' as any });
      const arrayBuffer = decode(base64);
      const filePath = `${userId}/avatar_${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, arrayBuffer, { contentType: 'image/jpeg', upsert: true });

      if (uploadError) {
        setErrorMsg(t.avatar.errorUploadFailed);
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const urlWithTs = `${publicUrl}?t=${Date.now()}`;

      const { error: upsertErr } = await supabase
        .from('user_profiles')
        .upsert({ id: userId, photo_url: urlWithTs }, { onConflict: 'id' });

      if (!upsertErr) {
        setProfile(prev => prev
          ? { ...prev, photo_url: urlWithTs }
          : { id: userId, photo_url: urlWithTs, face_shape: null }
        );
        flash(t.avatar.photoUploaded);
      }
    } catch {
      setErrorMsg(t.avatar.errorUploadFailed);
    } finally {
      setUploading(false);
    }
  };

  const handleSelectFaceShape = async (shape: FaceShape) => {
    if (!userId) return;
    setSaving(true);
    const { error } = await supabase
      .from('user_profiles')
      .upsert({ id: userId, face_shape: shape }, { onConflict: 'id' });
    if (!error) {
      setProfile(prev => prev ? { ...prev, face_shape: shape } : prev);
      flash(t.avatar.faceShapeSaved);
    }
    setSaving(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heading}>{t.avatar.title}</Text>
        <Text style={styles.sub}>{t.avatar.subtitle}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Success / Error */}
        {successMsg ? (
          <View style={styles.successBox}>
            <Text style={styles.successText}>✓ {successMsg}</Text>
          </View>
        ) : null}
        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Photo Upload */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t.avatar.photoUploadTitle}</Text>
          <View style={styles.photoRow}>
            {/* Preview */}
            {profile?.photo_url ? (
              <Image source={{ uri: profile.photo_url }} style={styles.photoPreview} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoPlaceholderIcon}>👤</Text>
                <Text style={styles.photoPlaceholderText}>{t.avatar.noPhoto}</Text>
              </View>
            )}

            {/* Upload zone */}
            <View style={styles.uploadZone}>
              <TouchableOpacity
                style={[styles.uploadBtn, uploading && { opacity: 0.5 }]}
                onPress={handlePickPhoto}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.uploadBtnText}>
                    📷 {profile?.photo_url ? 'Değiştir' : 'Yükle'}
                  </Text>
                )}
              </TouchableOpacity>
              <Text style={styles.uploadHint}>{t.avatar.maxSizeLabel}</Text>
            </View>
          </View>
        </View>

        {/* Face Shape Selection */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t.avatar.faceShapeTitle}</Text>
          <Text style={styles.cardSub}>{t.avatar.faceShapeDesc}</Text>

          <View style={styles.faceShapeGrid}>
            {FACE_SHAPES.map(shape => {
              const isSelected = profile?.face_shape === shape.value;
              return (
                <TouchableOpacity
                  key={shape.value}
                  style={[styles.faceShapeCard, isSelected && styles.faceShapeCardActive]}
                  onPress={() => handleSelectFaceShape(shape.value)}
                  disabled={saving}
                >
                  <Text style={[styles.faceShapeLabel, isSelected && styles.faceShapeLabelActive]}>
                    {shape.label}
                  </Text>
                  <Text style={[styles.faceShapeDesc, isSelected && styles.faceShapeDescActive]}>
                    {shape.description}
                  </Text>
                  {isSelected && (
                    <Text style={styles.selectedBadge}>✓ {t.avatar.selected}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F2EE' },
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 110 },

  header: {
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 24,
    backgroundColor: '#1C1917',
  },
  heading: { fontSize: 26, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.5 },
  sub: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 },

  successBox: {
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)',
    backgroundColor: 'rgba(34,197,94,0.08)',
    padding: 12, marginBottom: 14,
  },
  successText: { fontSize: 13, color: '#22c55e', fontWeight: '600' },
  errorBox: {
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(196,30,58,0.3)',
    backgroundColor: 'rgba(196,30,58,0.07)',
    padding: 12, marginBottom: 14,
  },
  errorText: { fontSize: 13, color: '#C41E3A' },

  card: {
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E2DDD7',
    padding: 20, marginBottom: 16,
    shadowColor: '#141210', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#141210', marginBottom: 12 },
  cardSub: { fontSize: 13, color: '#706A64', marginBottom: 16 },

  photoRow: { flexDirection: 'row', gap: 18, alignItems: 'center' },
  photoPreview: { width: 100, height: 100, borderRadius: 12, borderWidth: 1, borderColor: '#E2DDD7' },
  photoPlaceholder: {
    width: 100, height: 100, borderRadius: 12,
    backgroundColor: '#F5F2EE', borderWidth: 1.5, borderColor: '#E2DDD7', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  photoPlaceholderIcon: { fontSize: 30 },
  photoPlaceholderText: { fontSize: 10, color: '#9E9690' },

  uploadZone: { flex: 1, gap: 10 },
  uploadBtn: {
    backgroundColor: '#C41E3A', paddingVertical: 13, alignItems: 'center', borderRadius: 9,
  },
  uploadBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  uploadHint: { fontSize: 11, color: '#9E9690', lineHeight: 16 },

  faceShapeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  faceShapeCard: {
    width: '47%', borderRadius: 12, borderWidth: 1, borderColor: '#E2DDD7',
    backgroundColor: '#F5F2EE', padding: 16, gap: 5,
  },
  faceShapeCardActive: {
    borderColor: 'rgba(196,30,58,0.35)', backgroundColor: 'rgba(196,30,58,0.08)',
  },
  faceShapeLabel: { fontSize: 14, fontWeight: '700', color: '#141210' },
  faceShapeLabelActive: { color: '#C41E3A' },
  faceShapeDesc: { fontSize: 11, color: '#706A64', lineHeight: 16 },
  faceShapeDescActive: { color: 'rgba(196,30,58,0.7)' },
  selectedBadge: { fontSize: 11, fontWeight: '700', color: '#C41E3A', marginTop: 4 },
});
