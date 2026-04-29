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
  sweatpants: 'Eşofman Altı',
  bag: 'Günlük Çanta', sport_bag: 'Spor Çanta', backpack: 'Sırt Çantası', clutch: 'Davet Çantası',
  hat: 'Şapka',
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
    <div>
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="section-label mb-1">My Collection</p>
          <h1 className="editorial-heading text-3xl text-ink-900">Wardrobe</h1>
          <p className="text-sm text-ink-400 mt-1">{clothes.length} items</p>
        </div>
        <button
          onClick={() => { setEditingItem(null); setShowForm(true); }}
          className="btn-primary"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Item
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6">

        {/* Search */}
        <div className="relative mb-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, brand or color..."
            value={filters.search ?? ''}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value || undefined }))}
            className="w-full border border-ink-200 bg-white pl-9 pr-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-300 focus:outline-none focus:border-ink-400 transition-colors"
          />
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setFilters(f => ({ ...f, favorites_only: f.favorites_only ? undefined : true }))}
            className={`flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-[0.65rem] font-semibold tracking-wider uppercase border transition-colors ${
              filters.favorites_only ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-ink-500 border-ink-200 hover:border-ink-400'
            }`}
          >
            <svg viewBox="0 0 24 24" className={`h-3 w-3 ${filters.favorites_only ? 'fill-white' : 'fill-none'}`} stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
            Favorites
          </button>
          <button
            onClick={() => setFilters(f => ({ ...f, category: undefined }))}
            className={`shrink-0 px-3 py-1.5 text-[0.65rem] font-semibold tracking-wider uppercase border transition-colors ${
              !filters.category ? 'bg-ink-900 text-white border-ink-900' : 'bg-white text-ink-500 border-ink-200 hover:border-ink-400'
            }`}
          >
            All ({clothes.length})
          </button>
          {Object.entries(categoryCounts).map(([cat, count]) => (
            <button
              key={cat}
              onClick={() => setFilters(f => ({ ...f, category: f.category === cat ? undefined : cat as ClothingCategory }))}
              className={`shrink-0 px-3 py-1.5 text-[0.65rem] font-semibold tracking-wider uppercase border transition-colors ${
                filters.category === cat ? 'bg-ink-900 text-white border-ink-900' : 'bg-white text-ink-500 border-ink-200 hover:border-ink-400'
              }`}
            >
              {CATEGORY_LABELS[cat] ?? cat} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div>
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square bg-ink-100 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-px bg-ink-300 mb-8" />
            <p className="editorial-heading text-xl text-ink-400 mb-2">
              {clothes.length === 0 ? 'Your wardrobe is empty' : 'No items found'}
            </p>
            <p className="text-xs text-ink-400 mb-8">
              {clothes.length === 0 ? 'Start by adding your first clothing item.' : 'Try clearing some filters.'}
            </p>
            {clothes.length === 0 && (
              <button
                onClick={() => { setEditingItem(null); setShowForm(true); }}
                className="btn-primary"
              >
                Add First Item
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white p-8 shadow-2xl">
            <p className="section-label mb-3">Confirm Delete</p>
            <h3 className="editorial-heading text-xl text-ink-900 mb-2">{deleteConfirm.name}</h3>
            <p className="text-sm text-ink-500 mb-6">This item will be permanently removed from your wardrobe.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="btn-outline flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleteItem.isPending}
                className="btn-brand flex-1 disabled:opacity-50"
              >
                {deleteItem.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
