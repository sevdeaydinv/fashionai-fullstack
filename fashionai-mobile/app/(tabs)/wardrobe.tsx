import { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList, Image,
  TouchableOpacity, TextInput, ActivityIndicator, Dimensions,
  Modal, ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/lib/supabase/client';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 48) / 2;

// ── Constants
const CATEGORY_LABELS: Record<string, string> = {
  shirt: 'Gömlek', tshirt: 'T-Shirt', blouse: 'Bluz', sweater: 'Kazak',
  pants: 'Pantolon', jeans: 'Kot', skirt: 'Etek', shorts: 'Şort',
  jacket: 'Ceket', coat: 'Mont', dress: 'Elbise', sweatpants: 'Eşofman Altı',
  shoes: 'Ayakkabı', sneakers: 'Sneaker', boots: 'Bot', heels: 'Topuklu',
  bag: 'Günlük Çanta', sport_bag: 'Spor Çanta', backpack: 'Sırt Çantası', clutch: 'Davet Çantası',
  hat: 'Şapka', accessory: 'Aksesuar',
};

const CATEGORIES = [
  { value: 'shirt', label: 'Gömlek' }, { value: 'tshirt', label: 'T-Shirt' },
  { value: 'blouse', label: 'Bluz' }, { value: 'sweater', label: 'Kazak' },
  { value: 'pants', label: 'Pantolon' }, { value: 'jeans', label: 'Kot' },
  { value: 'skirt', label: 'Etek' }, { value: 'shorts', label: 'Şort' },
  { value: 'jacket', label: 'Ceket' }, { value: 'coat', label: 'Mont' },
  { value: 'dress', label: 'Elbise' }, { value: 'sweatpants', label: 'Eşofman Altı' },
  { value: 'shoes', label: 'Ayakkabı' }, { value: 'sneakers', label: 'Sneaker' },
  { value: 'boots', label: 'Bot' }, { value: 'heels', label: 'Topuklu' },
  { value: 'bag', label: 'Günlük Çanta' }, { value: 'sport_bag', label: 'Spor Çanta' },
  { value: 'backpack', label: 'Sırt Çantası' }, { value: 'clutch', label: 'Davet Çantası' },
  { value: 'hat', label: 'Şapka' }, { value: 'accessory', label: 'Aksesuar' },
];

const SEASONS = [
  { value: 'spring', label: 'İlkbahar' }, { value: 'summer', label: 'Yaz' },
  { value: 'autumn', label: 'Sonbahar' }, { value: 'winter', label: 'Kış' },
  { value: 'all_season', label: 'Tüm Sezonlar' },
];

const STYLES = [
  { value: 'casual', label: 'Günlük' }, { value: 'formal', label: 'Resmi' },
  { value: 'sport', label: 'Spor' }, { value: 'streetwear', label: 'Sokak' },
  { value: 'elegant', label: 'Şık' }, { value: 'bohemian', label: 'Bohem' },
];

const FABRICS = [
  { value: 'cotton', label: 'Pamuk' }, { value: 'denim', label: 'Denim' },
  { value: 'linen', label: 'Keten' }, { value: 'silk', label: 'İpek' },
  { value: 'satin', label: 'Saten' }, { value: 'chiffon', label: 'Şifon' },
  { value: 'velvet', label: 'Kadife' }, { value: 'wool', label: 'Yün' },
  { value: 'polyester', label: 'Polyester' }, { value: 'lycra', label: 'Likra' },
  { value: 'leather', label: 'Deri' }, { value: 'lace', label: 'Dantel' },
];

const PRESET_COLORS = [
  '#000000', '#FFFFFF', '#6B7280', '#EF4444', '#F97316',
  '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899',
  '#F5F5DC', '#D2B48C', '#1E3A5F', '#2D5016', '#7C3AED',
];

interface ClothingItem {
  id: string;
  name: string;
  category: string;
  color: string;
  color_name: string | null;
  brand: string | null;
  image_url: string;
  is_favorite: boolean;
  season: string[];
  style: string[];
  tags: string[];
  notes: string | null;
  secondary_color: string | null;
}

interface FormState {
  name: string;
  category: string;
  color: string;
  color_name: string;
  brand: string;
  season: string[];
  style: string[];
  fabric: string;
  notes: string;
}

const defaultForm = (): FormState => ({
  name: '', category: '', color: '#000000', color_name: '',
  brand: '', season: [], style: [], fabric: '', notes: '',
});

export default function WardrobeScreen() {
  const [clothes, setClothes] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [favOnly, setFavOnly] = useState(false);

  // Form modal
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ClothingItem | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm());
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<ClothingItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        fetchClothes(user.id);
      }
    };
    init();
  }, []);

  const getOrCreateWardrobe = async (uid: string): Promise<string> => {
    const { data: existing } = await supabase
      .from('wardrobes')
      .select('id')
      .eq('user_id', uid)
      .eq('is_default', true)
      .single();

    if (existing) return existing.id;

    const { data: created, error } = await supabase
      .from('wardrobes')
      .insert({ user_id: uid, name: 'Gardırobum', is_default: true })
      .select('id')
      .single();

    if (error || !created) throw new Error('Gardırop oluşturulamadı');
    return created.id;
  };

  const fetchClothes = async (uid: string) => {
    const { data } = await supabase
      .from('clothes')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });
    setClothes(data ?? []);
    setLoading(false);
  };

  const openAdd = () => {
    setEditingItem(null);
    setForm(defaultForm());
    setImageUri(null);
    setShowForm(true);
  };

  const openEdit = (item: ClothingItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      category: item.category,
      color: item.color,
      color_name: item.color_name ?? '',
      brand: item.brand ?? '',
      season: item.season ?? [],
      style: item.style ?? [],
      fabric: item.tags?.find(t => t.startsWith('fabric:'))?.replace('fabric:', '') ?? '',
      notes: item.notes ?? '',
    });
    setImageUri(item.image_url);
    setShowForm(true);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin gerekli', 'Fotoğraf seçmek için galeri izni gerekli.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as any,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string, uid: string): Promise<string> => {
    // Ensure we have a valid session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Oturum bulunamadı, lütfen tekrar giriş yapın.');

    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64' as any,
    });

    const fileName = `${uid}/${Date.now()}.jpg`;
    const arrayBuffer = decode(base64);

    const { error: uploadError } = await supabase.storage
      .from('clothes')
      .upload(fileName, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Fotoğraf yüklenemedi: ${uploadError.message}`);
    }

    const { data } = supabase.storage.from('clothes').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { Alert.alert('Hata', 'İsim gerekli'); return; }
    if (!form.category) { Alert.alert('Hata', 'Kategori seçin'); return; }
    if (form.season.length === 0) { Alert.alert('Hata', 'En az bir sezon seçin'); return; }
    if (form.style.length === 0) { Alert.alert('Hata', 'En az bir stil seçin'); return; }
    if (!editingItem && !imageUri) { Alert.alert('Hata', 'Fotoğraf gerekli'); return; }
    if (!userId) return;

    setFormLoading(true);
    try {
      let imageUrl = editingItem?.image_url ?? '';

      if (imageUri && imageUri !== editingItem?.image_url) {
        imageUrl = await uploadImage(imageUri, userId);
      }

      const payload = {
        name: form.name.trim(),
        category: form.category,
        color: form.color,
        color_name: form.color_name || null,
        brand: form.brand || null,
        season: form.season,
        style: form.style,
        tags: form.fabric ? [`fabric:${form.fabric}`] : [],
        notes: form.notes || null,
        image_url: imageUrl,
        secondary_color: null,
        is_favorite: editingItem?.is_favorite ?? false,
      };

      if (editingItem) {
        const { data, error } = await supabase
          .from('clothes')
          .update(payload)
          .eq('id', editingItem.id)
          .select()
          .single();
        if (error) throw new Error(error.message);
        if (data) setClothes(prev => prev.map(c => c.id === editingItem.id ? data : c));
      } else {
        const wardrobeId = await getOrCreateWardrobe(userId);
        const { data, error } = await supabase
          .from('clothes')
          .insert({ ...payload, user_id: userId, wardrobe_id: wardrobeId })
          .select()
          .single();
        if (error) throw new Error(error.message);
        if (data) setClothes(prev => [data, ...prev]);
      }

      setShowForm(false);
      setEditingItem(null);
    } catch (e: any) {
      console.error('Kıyafet kaydetme hatası:', e);
      Alert.alert('Hata', e?.message || 'Kıyafet kaydedilemedi.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !userId) return;
    setDeleteLoading(true);
    await supabase.from('clothes').delete().eq('id', deleteTarget.id);
    setClothes(prev => prev.filter(c => c.id !== deleteTarget.id));
    setDeleteTarget(null);
    setDeleteLoading(false);
  };

  const toggleFavorite = async (item: ClothingItem) => {
    await supabase.from('clothes').update({ is_favorite: !item.is_favorite }).eq('id', item.id);
    setClothes(prev => prev.map(c => c.id === item.id ? { ...c, is_favorite: !c.is_favorite } : c));
  };

  const categories = [...new Set(clothes.map(c => c.category))];

  const filtered = clothes.filter(item => {
    if (favOnly && !item.is_favorite) return false;
    if (activeCategory && item.category !== activeCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return item.name.toLowerCase().includes(q) ||
        (item.brand?.toLowerCase().includes(q) ?? false) ||
        (item.color_name?.toLowerCase().includes(q) ?? false);
    }
    return true;
  });

  const toggleMulti = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.label}>MY COLLECTION</Text>
          <Text style={styles.heading}>Wardrobe</Text>
          <Text style={styles.count}>{clothes.length} items</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Text style={styles.addBtnText}>+ Add Item</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder="Search by name, brand or color..."
          placeholderTextColor="#bbb"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter chips */}
      <View style={{ height: 40, marginBottom: 12 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <TouchableOpacity
            onPress={() => setFavOnly(v => !v)}
            style={[styles.chip, favOnly && styles.chipFav]}
          >
            <Text style={[styles.chipText, favOnly && styles.chipTextActive]}>♥ Favorites</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveCategory(null)}
            style={[styles.chip, !activeCategory && styles.chipActive]}
          >
            <Text style={[styles.chipText, !activeCategory && styles.chipTextActive]}>
              All ({clothes.length})
            </Text>
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              onPress={() => setActiveCategory(activeCategory === cat ? null : cat)}
              style={[styles.chip, activeCategory === cat && styles.chipActive]}
            >
              <Text style={[styles.chipText, activeCategory === cat && styles.chipTextActive]}>
                {CATEGORY_LABELS[cat] ?? cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Grid */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#111" />
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>
            {clothes.length === 0 ? 'Your wardrobe is empty' : 'No items found'}
          </Text>
          <Text style={styles.emptySub}>
            {clothes.length === 0 ? 'Start by adding your first clothing item.' : 'Try clearing some filters.'}
          </Text>
          {clothes.length === 0 && (
            <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
              <Text style={styles.addBtnText}>Add First Item</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          numColumns={2}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.imageWrap}>
                <Image source={{ uri: item.image_url }} style={styles.image} />
                <TouchableOpacity style={styles.favBtn} onPress={() => toggleFavorite(item)}>
                  <Text style={{ fontSize: 14 }}>{item.is_favorite ? '❤️' : '🤍'}</Text>
                </TouchableOpacity>
                <View style={styles.catBadge}>
                  <Text style={styles.catBadgeText}>{CATEGORY_LABELS[item.category] ?? item.category}</Text>
                </View>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                <View style={styles.colorRow}>
                  <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                  <Text style={styles.colorName} numberOfLines={1}>
                    {item.color_name ?? item.color}
                    {item.brand ? ` · ${item.brand}` : ''}
                  </Text>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(item)}>
                    <Text style={styles.actionBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDelete]} onPress={() => setDeleteTarget(item)}>
                    <Text style={[styles.actionBtnText, styles.actionBtnTextDelete]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      )}

      {/* Add / Edit Form Modal */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            {/* Modal header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingItem ? 'Kıyafeti Düzenle' : 'Yeni Kıyafet Ekle'}</Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.formScroll}>
              {/* Image */}
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.imagePickerPreview} />
                ) : (
                  <View style={styles.imagePickerEmpty}>
                    <Text style={styles.imagePickerIcon}>📷</Text>
                    <Text style={styles.imagePickerText}>Fotoğraf seç</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Name */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Ad</Text>
                <TextInput
                  style={styles.input}
                  placeholder="örn. Beyaz gömlek"
                  placeholderTextColor="#bbb"
                  value={form.name}
                  onChangeText={v => setForm(f => ({ ...f, name: v }))}
                />
              </View>

              {/* Category */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Kategori</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {CATEGORIES.map(c => (
                      <TouchableOpacity
                        key={c.value}
                        onPress={() => setForm(f => ({ ...f, category: c.value }))}
                        style={[styles.pill, form.category === c.value && styles.pillActive]}
                      >
                        <Text style={[styles.pillText, form.category === c.value && styles.pillTextActive]}>
                          {c.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Color */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Ana Renk</Text>
                <View style={styles.colorPicker}>
                  {PRESET_COLORS.map(c => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setForm(f => ({ ...f, color: c }))}
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: c },
                        form.color === c && styles.colorSwatchActive,
                        c === '#FFFFFF' && { borderColor: '#e5e5e5' },
                      ]}
                    />
                  ))}
                </View>
                <TextInput
                  style={[styles.input, { marginTop: 8 }]}
                  placeholder="Renk adı (örn. Lacivert)"
                  placeholderTextColor="#bbb"
                  value={form.color_name}
                  onChangeText={v => setForm(f => ({ ...f, color_name: v }))}
                />
              </View>

              {/* Brand */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Marka (opsiyonel)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="örn. Zara, H&M"
                  placeholderTextColor="#bbb"
                  value={form.brand}
                  onChangeText={v => setForm(f => ({ ...f, brand: v }))}
                />
              </View>

              {/* Season */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Sezon</Text>
                <View style={styles.pills}>
                  {SEASONS.map(s => (
                    <TouchableOpacity
                      key={s.value}
                      onPress={() => setForm(f => ({ ...f, season: toggleMulti(f.season, s.value) }))}
                      style={[styles.pill, form.season.includes(s.value) && styles.pillActive]}
                    >
                      <Text style={[styles.pillText, form.season.includes(s.value) && styles.pillTextActive]}>
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Style */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Stil</Text>
                <View style={styles.pills}>
                  {STYLES.map(s => (
                    <TouchableOpacity
                      key={s.value}
                      onPress={() => setForm(f => ({ ...f, style: toggleMulti(f.style, s.value) }))}
                      style={[styles.pill, form.style.includes(s.value) && styles.pillActive]}
                    >
                      <Text style={[styles.pillText, form.style.includes(s.value) && styles.pillTextActive]}>
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Fabric */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Kumaş (opsiyonel)</Text>
                <View style={styles.pills}>
                  {FABRICS.map(f => (
                    <TouchableOpacity
                      key={f.value}
                      onPress={() => setForm(prev => ({ ...prev, fabric: prev.fabric === f.value ? '' : f.value }))}
                      style={[styles.pill, form.fabric === f.value && styles.pillActive]}
                    >
                      <Text style={[styles.pillText, form.fabric === f.value && styles.pillTextActive]}>
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Notes */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Notlar (opsiyonel)</Text>
                <TextInput
                  style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                  placeholder="Bu kıyafet hakkında notlarınız..."
                  placeholderTextColor="#bbb"
                  value={form.notes}
                  onChangeText={v => setForm(f => ({ ...f, notes: v }))}
                  multiline
                />
              </View>

              {/* Actions */}
              <View style={styles.formActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowForm(false)}>
                  <Text style={styles.cancelBtnText}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitBtn, formLoading && { opacity: 0.5 }]}
                  onPress={handleSubmit}
                  disabled={formLoading}
                >
                  {formLoading
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.submitBtnText}>{editingItem ? 'Güncelle' : 'Ekle'}</Text>
                  }
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal transparent visible={!!deleteTarget} animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.deleteModal}>
            <Text style={styles.deleteLbl}>CONFIRM DELETE</Text>
            <Text style={styles.deleteTitle}>{deleteTarget?.name}</Text>
            <Text style={styles.deleteSub}>This item will be permanently removed from your wardrobe.</Text>
            <View style={styles.deleteActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setDeleteTarget(null)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: '#ef4444' }, deleteLoading && { opacity: 0.5 }]}
                onPress={handleDelete}
                disabled={deleteLoading}
              >
                <Text style={styles.submitBtnText}>{deleteLoading ? 'Deleting...' : 'Delete'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: '#bbb', marginBottom: 4 },
  heading: { fontSize: 28, fontWeight: '700', color: '#111', letterSpacing: -0.5 },
  count: { fontSize: 12, color: '#bbb', marginTop: 2 },
  addBtn: { backgroundColor: '#111', paddingHorizontal: 16, paddingVertical: 10 },
  addBtnText: { color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },

  searchWrap: { paddingHorizontal: 24, marginBottom: 10 },
  search: { borderWidth: 1, borderColor: '#e5e5e5', paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#111' },

  chips: { paddingHorizontal: 24, gap: 8, alignItems: 'center' },
  chip: { borderWidth: 1, borderColor: '#e5e5e5', paddingHorizontal: 12, paddingVertical: 5 },
  chipActive: { backgroundColor: '#111', borderColor: '#111' },
  chipFav: { backgroundColor: '#fdf2f8', borderColor: '#ec4899' },
  chipText: { fontSize: 10, fontWeight: '700', letterSpacing: 1, color: '#999' },
  chipTextActive: { color: '#fff' },

  grid: { paddingHorizontal: 24, paddingBottom: 24 },
  row: { gap: 12, marginBottom: 12 },

  card: { width: ITEM_SIZE, borderWidth: 1, borderColor: '#f0f0f0', overflow: 'hidden' },
  imageWrap: { position: 'relative' },
  image: { width: ITEM_SIZE, height: ITEM_SIZE, backgroundColor: '#f5f5f5' },
  favBtn: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(255,255,255,0.9)', padding: 4 },
  catBadge: { position: 'absolute', bottom: 6, left: 6, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 6, paddingVertical: 2 },
  catBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5, color: '#444' },
  cardBody: { padding: 10 },
  cardName: { fontSize: 13, fontWeight: '600', color: '#111', marginBottom: 4 },
  colorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  colorDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1, borderColor: '#e5e5e5' },
  colorName: { fontSize: 11, color: '#999', flex: 1 },
  cardActions: { flexDirection: 'row', gap: 6 },
  actionBtn: { flex: 1, borderWidth: 1, borderColor: '#e5e5e5', paddingVertical: 6, alignItems: 'center' },
  actionBtnDelete: { borderColor: '#fecaca' },
  actionBtnText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, color: '#555' },
  actionBtnTextDelete: { color: '#ef4444' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#bbb', marginBottom: 8, textAlign: 'center' },
  emptySub: { fontSize: 12, color: '#ccc', textAlign: 'center', marginBottom: 20 },

  // Modal
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#111' },
  modalClose: { fontSize: 18, color: '#999' },
  formScroll: { padding: 20, gap: 20 },

  imagePicker: { borderWidth: 2, borderColor: '#e5e5e5', borderStyle: 'dashed', height: 160, overflow: 'hidden' },
  imagePickerPreview: { width: '100%', height: '100%' },
  imagePickerEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  imagePickerIcon: { fontSize: 32 },
  imagePickerText: { fontSize: 13, color: '#bbb' },

  field: { gap: 8 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#555' },
  input: { borderWidth: 1, borderColor: '#e5e5e5', paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#111' },

  colorPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  colorSwatch: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: 'transparent' },
  colorSwatchActive: { borderColor: '#111' },

  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { borderWidth: 1, borderColor: '#e5e5e5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  pillActive: { backgroundColor: '#111', borderColor: '#111' },
  pillText: { fontSize: 12, fontWeight: '600', color: '#666' },
  pillTextActive: { color: '#fff' },

  formActions: { flexDirection: 'row', gap: 12, paddingTop: 8, paddingBottom: 40 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: '#e5e5e5', paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#111' },
  submitBtn: { flex: 1, backgroundColor: '#111', paddingVertical: 14, alignItems: 'center' },
  submitBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  deleteModal: { backgroundColor: '#fff', padding: 32, width: '100%' },
  deleteLbl: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: '#bbb', marginBottom: 8 },
  deleteTitle: { fontSize: 20, fontWeight: '700', color: '#111', marginBottom: 6 },
  deleteSub: { fontSize: 13, color: '#666', marginBottom: 24 },
  deleteActions: { flexDirection: 'row', gap: 12 },
});
