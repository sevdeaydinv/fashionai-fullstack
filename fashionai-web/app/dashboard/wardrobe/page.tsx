'use client';

import { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useWardrobe } from '@/lib/hooks/useWardrobe';
import { ClothingCard } from '@/components/wardrobe/ClothingCard';
import { ClothingForm } from '@/components/wardrobe/ClothingForm';
import { WardrobeService } from '@/lib/services/wardrobe.service';
import type { ClothingItem, ClothingItemPayload, WardrobeFilters } from '@/types/wardrobe.types';
import type { ClothingCategory } from '@/types/common.types';

const CATEGORY_LABELS: Record<string, string> = {
  shirt: 'Gömlek', tshirt: 'T-Shirt', blouse: 'Bluz', sweater: 'Kazak',
  pants: 'Pantolon', jeans: 'Kot', skirt: 'Etek', shorts: 'Şort',
  jacket: 'Ceket', coat: 'Mont', dress: 'Elbise',
  shoes: 'Ayakkabı', sneakers: 'Sneaker', boots: 'Bot', heels: 'Topuklu',
  bag: 'Günlük Çanta', sport_bag: 'Spor Çanta', backpack: 'Sırt Çantası', clutch: 'Davet Çantası',
  accessory: 'Aksesuar',
};

export default function WardrobePage() {
  const supabase = createClient();

  // Get current user
  const { data: userData } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });
  const userId = userData?.id ?? null;

  const { clothes, isLoading, addItem, updateItem, deleteItem, toggleFavorite } = useWardrobe(userId);

  // ── UI state
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ClothingItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ClothingItem | null>(null);
  const [filters, setFilters] = useState<WardrobeFilters>({});
  const [formLoading, setFormLoading] = useState(false);

  // ── Filtered list
  const filtered = useMemo(() => {
    return clothes.filter(item => {
      if (filters.category && item.category !== filters.category) return false;
      if (filters.favorites_only && !item.is_favorite) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (
          !item.name.toLowerCase().includes(q) &&
          !(item.brand?.toLowerCase().includes(q)) &&
          !(item.color_name?.toLowerCase().includes(q))
        ) return false;
      }
      return true;
    });
  }, [clothes, filters]);

  // ── Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of clothes) {
      counts[item.category] = (counts[item.category] ?? 0) + 1;
    }
    return counts;
  }, [clothes]);

  // ── Add / Edit submit
  const handleFormSubmit = async (
    payload: Omit<ClothingItemPayload, 'wardrobe_id'>,
    imageFile?: File
  ) => {
    if (!userId) return;
    setFormLoading(true);
    try {
      if (editingItem) {
        // Update
        let imageUrl = editingItem.image_url;
        if (imageFile) {
          const { url } = await WardrobeService.uploadImage(userId, imageFile);
          if (url) imageUrl = url;
        }
        await updateItem.mutateAsync({ id: editingItem.id, updates: { ...payload, image_url: imageUrl } });
      } else {
        // Add — image required
        if (!imageFile) { alert('Lütfen bir fotoğraf seçin.'); return; }
        const { url, error: uploadErr } = await WardrobeService.uploadImage(userId, imageFile);
        if (uploadErr || !url) { alert('Fotoğraf yüklenemedi.'); return; }
        await addItem.mutateAsync({ ...payload, image_url: url });
      }
      setShowForm(false);
      setEditingItem(null);
    } finally {
      setFormLoading(false);
    }
  };

  // ── Delete
  const handleDelete = async (item: ClothingItem) => {
    await deleteItem.mutateAsync({ id: item.id, imageUrl: item.image_url });
    setDeleteConfirm(null);
  };

  // ── Toggle favorite
  const handleToggleFavorite = (item: ClothingItem) => {
    toggleFavorite.mutate({ id: item.id, current: item.is_favorite });
  };

  const openEdit = (item: ClothingItem) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Header */}
      <div className="bg-white border-b border-ink-100 px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-ink-900">Gardırobum</h1>
            <p className="text-xs text-ink-400 mt-0.5">{clothes.length} kıyafet</p>
          </div>
          <button
            onClick={() => { setEditingItem(null); setShowForm(true); }}
            className="flex items-center gap-1.5 rounded-xl bg-ink-900 px-4 py-2 text-sm font-medium text-white hover:bg-ink-800 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Ekle
          </button>
        </div>

        {/* Search */}
        <div className="mt-3 relative">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 0z" />
          </svg>
          <input
            type="text"
            placeholder="Ad, marka veya renk ara..."
            value={filters.search ?? ''}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value || undefined }))}
            className="w-full rounded-xl border border-ink-200 bg-ink-50 pl-9 pr-3 py-2 text-sm text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-ink-400/30"
          />
        </div>

        {/* Filter chips */}
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setFilters(f => ({ ...f, favorites_only: f.favorites_only ? undefined : true }))}
            className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
              filters.favorites_only ? 'bg-red-500 text-white border-red-500' : 'bg-white text-ink-600 border-ink-200'
            }`}
          >
            <svg viewBox="0 0 24 24" className={`h-3 w-3 ${filters.favorites_only ? 'fill-white' : 'fill-none'}`} stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
            Favoriler
          </button>
          <button
            onClick={() => setFilters(f => ({ ...f, category: undefined }))}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
              !filters.category ? 'bg-ink-900 text-white border-ink-900' : 'bg-white text-ink-600 border-ink-200'
            }`}
          >
            Tümü ({clothes.length})
          </button>
          {Object.entries(categoryCounts).map(([cat, count]) => (
            <button
              key={cat}
              onClick={() => setFilters(f => ({ ...f, category: f.category === cat ? undefined : cat as ClothingCategory }))}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                filters.category === cat ? 'bg-ink-900 text-white border-ink-900' : 'bg-white text-ink-600 border-ink-200'
              }`}
            >
              {CATEGORY_LABELS[cat] ?? cat} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-2xl bg-ink-100 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ink-100 mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-8 w-8 text-ink-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-8.25zM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-2.25z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-ink-600">
              {clothes.length === 0 ? 'Gardırobunuz boş' : 'Sonuç bulunamadı'}
            </p>
            <p className="text-xs text-ink-400 mt-1">
              {clothes.length === 0 ? 'İlk kıyafetinizi eklemek için + Ekle butonuna tıklayın.' : 'Filtreleri temizlemeyi deneyin.'}
            </p>
            {clothes.length === 0 && (
              <button
                onClick={() => { setEditingItem(null); setShowForm(true); }}
                className="mt-4 rounded-xl bg-ink-900 px-5 py-2 text-sm font-medium text-white hover:bg-ink-800 transition-colors"
              >
                Kıyafet Ekle
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map(item => (
              <ClothingCard
                key={item.id}
                item={item}
                onEdit={openEdit}
                onDelete={setDeleteConfirm}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit form modal */}
      {showForm && (
        <ClothingForm
          item={editingItem ?? undefined}
          onSubmit={handleFormSubmit}
          onCancel={closeForm}
          isLoading={formLoading}
        />
      )}

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-ink-900">Kıyafeti Sil</h3>
            <p className="mt-2 text-sm text-ink-500">
              <span className="font-medium">{deleteConfirm.name}</span> silinsin mi? Bu işlem geri alınamaz.
            </p>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-xl border border-ink-200 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleteItem.isPending}
                className="flex-1 rounded-xl bg-red-500 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {deleteItem.isPending ? 'Siliniyor...' : 'Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
