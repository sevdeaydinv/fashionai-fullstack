'use client';

import { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useWardrobe } from '@/lib/hooks/useWardrobe';
import { ClothingCard } from '@/components/wardrobe/ClothingCard';
import { ClothingForm } from '@/components/wardrobe/ClothingForm';
import { WardrobeService } from '@/lib/services/wardrobe.service';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { ClothingItem, ClothingItemPayload, WardrobeFilters } from '@/types/wardrobe.types';
import type { ClothingCategory } from '@/types/common.types';

const sectionLabelStyle: React.CSSProperties = {
  color: '#9E9690',
  fontSize: '0.6rem',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  fontWeight: 700,
};

export default function WardrobePage() {
  const supabase = createClient();
  const { t } = useLanguage();
  const CATEGORY_LABELS: Record<string, string> = t.wardrobe.categoryLabels;

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
        if (!imageFile) { alert(t.wardrobe.photoRequired); return; }
        const { url, error: uploadErr } = await WardrobeService.uploadImage(userId, imageFile);
        if (uploadErr || !url) { alert(t.wardrobe.uploadFailed); return; }
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
          <p style={sectionLabelStyle} className="mb-1">{t.wardrobe.sectionLabel}</p>
          <h1 style={{ color: '#141210', fontFamily: 'serif', fontWeight: 700, fontSize: '1.875rem' }}>{t.wardrobe.title}</h1>
          <p style={{ color: '#706A64', fontSize: '0.875rem', marginTop: 4 }}>{clothes.length} {t.wardrobe.itemsCount}</p>
        </div>
        <button
          onClick={() => { setEditingItem(null); setShowForm(true); }}
          className="flex items-center gap-2"
          style={{
            background: 'linear-gradient(135deg, #7a0020 0%, #C41E3A 60%, #e8294a 100%)',
            borderRadius: 12,
            boxShadow: '0 4px 20px rgba(196,30,58,0.4)',
            border: 'none',
            color: 'white',
            fontWeight: 600,
            fontSize: '0.8rem',
            padding: '10px 18px',
            cursor: 'pointer',
            letterSpacing: '0.05em',
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {t.wardrobe.addItem}
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6">
        {/* Search */}
        <div className="relative mb-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#9E9690' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 0z" />
          </svg>
          <input
            type="text"
            placeholder={t.wardrobe.searchPlaceholder}
            value={filters.search ?? ''}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value || undefined }))}
            style={{
              width: '100%',
              background: '#FFFFFF',
              border: '1px solid #E2DDD7',
              borderRadius: 12,
              paddingLeft: 36,
              paddingRight: 12,
              paddingTop: 10,
              paddingBottom: 10,
              color: '#141210',
              fontSize: '0.875rem',
              outline: 'none',
            }}
            onFocus={(e) => { e.target.style.borderColor = 'rgba(196,30,58,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(196,30,58,0.1)'; }}
            onBlur={(e) => { e.target.style.borderColor = '#E2DDD7'; e.target.style.boxShadow = 'none'; }}
          />
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setFilters(f => ({ ...f, favorites_only: f.favorites_only ? undefined : true }))}
            className="flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-[0.65rem] font-semibold tracking-wider uppercase transition-colors"
            style={{
              borderRadius: 8,
              border: filters.favorites_only ? '1px solid #C41E3A' : '1px solid #E2DDD7',
              background: filters.favorites_only ? '#C41E3A' : '#F5F2EE',
              color: filters.favorites_only ? 'white' : '#706A64',
              cursor: 'pointer',
            }}
          >
            <svg viewBox="0 0 24 24" className="h-3 w-3" style={{ fill: filters.favorites_only ? 'white' : 'none' }} stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
            {t.wardrobe.favorites}
          </button>
          <button
            onClick={() => setFilters(f => ({ ...f, category: undefined }))}
            className="shrink-0 px-3 py-1.5 text-[0.65rem] font-semibold tracking-wider uppercase transition-colors"
            style={{
              borderRadius: 8,
              border: !filters.category ? '1px solid rgba(196,30,58,0.3)' : '1px solid #E2DDD7',
              background: !filters.category ? 'rgba(196,30,58,0.1)' : '#F5F2EE',
              color: !filters.category ? '#C41E3A' : '#706A64',
              cursor: 'pointer',
            }}
          >
            {t.wardrobe.all} ({clothes.length})
          </button>
          {Object.entries(categoryCounts).map(([cat, count]) => (
            <button
              key={cat}
              onClick={() => setFilters(f => ({ ...f, category: f.category === cat ? undefined : cat as ClothingCategory }))}
              className="shrink-0 px-3 py-1.5 text-[0.65rem] font-semibold tracking-wider uppercase transition-colors"
              style={{
                borderRadius: 8,
                border: filters.category === cat ? '1px solid rgba(196,30,58,0.3)' : '1px solid #E2DDD7',
                background: filters.category === cat ? 'rgba(196,30,58,0.1)' : '#F5F2EE',
                color: filters.category === cat ? '#C41E3A' : '#706A64',
                cursor: 'pointer',
              }}
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
              <div key={i} className="aspect-square animate-pulse" style={{ background: '#EAE6E1', borderRadius: 12 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div style={{ width: 64, height: 1, background: '#E2DDD7', marginBottom: 32 }} />
            <p style={{ color: '#9E9690', fontFamily: 'serif', fontWeight: 700, fontSize: '1.25rem', marginBottom: 8 }}>
              {clothes.length === 0 ? t.wardrobe.emptyTitle : t.wardrobe.noItemsFound}
            </p>
            <p style={{ color: '#9E9690', fontSize: '0.75rem', marginBottom: 32 }}>
              {clothes.length === 0 ? t.wardrobe.emptyNoFilter : t.wardrobe.emptyWithFilter}
            </p>
            {clothes.length === 0 && (
              <button
                onClick={() => { setEditingItem(null); setShowForm(true); }}
                className="flex items-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #7a0020 0%, #C41E3A 60%, #e8294a 100%)',
                  borderRadius: 12,
                  border: 'none',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  padding: '10px 18px',
                  cursor: 'pointer',
                }}
              >
                {t.wardrobe.addFirstItem}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-sm p-8" style={{ background: '#FFFFFF', border: '1px solid #E2DDD7', borderRadius: 16 }}>
            <p style={sectionLabelStyle} className="mb-3">{t.wardrobe.confirmDelete}</p>
            <h3 style={{ color: '#141210', fontFamily: 'serif', fontWeight: 700, fontSize: '1.25rem', marginBottom: 8 }}>{deleteConfirm.name}</h3>
            <p style={{ color: '#706A64', fontSize: '0.875rem', marginBottom: 24 }}>{t.wardrobe.deleteItemConfirm}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  flex: 1,
                  background: '#F5F2EE',
                  border: '1px solid #E2DDD7',
                  borderRadius: 12,
                  color: '#141210',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  padding: '10px 16px',
                  cursor: 'pointer',
                }}
              >
                {t.wardrobe.cancel}
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleteItem.isPending}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #7a0020 0%, #C41E3A 60%, #e8294a 100%)',
                  borderRadius: 12,
                  border: 'none',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  padding: '10px 16px',
                  cursor: deleteItem.isPending ? 'not-allowed' : 'pointer',
                  opacity: deleteItem.isPending ? 0.6 : 1,
                }}
              >
                {deleteItem.isPending ? t.wardrobe.deleting : t.wardrobe.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
