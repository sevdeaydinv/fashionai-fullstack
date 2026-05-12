'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useWardrobe } from '@/lib/hooks/useWardrobe';
import { ClothingForm } from '@/components/wardrobe/ClothingForm';
import { WardrobeService } from '@/lib/services/wardrobe.service';
import type { ClothingItem, ClothingItemPayload } from '@/types/wardrobe.types';

const CATEGORY_LABELS: Record<string, string> = {
  shirt: 'Gömlek', tshirt: 'T-Shirt', blouse: 'Bluz', sweater: 'Kazak',
  pants: 'Pantolon', jeans: 'Kot', skirt: 'Etek', shorts: 'Şort',
  jacket: 'Ceket', coat: 'Mont', dress: 'Elbise',
  shoes: 'Ayakkabı', sneakers: 'Sneaker', boots: 'Bot', heels: 'Topuklu',
  bag: 'Günlük Çanta', sport_bag: 'Spor Çanta', backpack: 'Sırt Çantası', clutch: 'Davet Çantası',
  accessory: 'Aksesuar',
};

const SEASON_LABELS: Record<string, string> = {
  spring: 'İlkbahar', summer: 'Yaz', autumn: 'Sonbahar',
  winter: 'Kış', all_season: 'Tüm Sezonlar',
};

const STYLE_LABELS: Record<string, string> = {
  casual: 'Günlük', formal: 'Resmi', sport: 'Spor',
  streetwear: 'Sokak', elegant: 'Şık', bohemian: 'Bohem',
};

export default function ClothingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const { data: userData } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });
  const userId = userData?.id ?? null;

  const { clothes, updateItem, deleteItem, toggleFavorite } = useWardrobe(userId);
  const item = clothes.find(c => c.id === id);

  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const handleEditSubmit = async (
    payload: Omit<ClothingItemPayload, 'wardrobe_id'>,
    imageFile?: File
  ) => {
    if (!userId || !item) return;
    setFormLoading(true);
    try {
      let imageUrl = item.image_url;
      if (imageFile) {
        const { url } = await WardrobeService.uploadImage(userId, imageFile);
        if (url) imageUrl = url;
      }
      await updateItem.mutateAsync({ id: item.id, updates: { ...payload, image_url: imageUrl } });
      setShowEdit(false);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    await deleteItem.mutateAsync({ id: item.id, imageUrl: item.image_url });
    router.push('/dashboard/wardrobe');
  };

  const handleToggleFavorite = () => {
    if (!item) return;
    toggleFavorite.mutate({ id: item.id, current: item.is_favorite });
  };

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <p style={{ color: '#706A64', fontSize: '0.875rem' }}>Kıyafet bulunamadı.</p>
        <button
          onClick={() => router.push('/dashboard/wardrobe')}
          style={{ marginTop: 16, color: '#706A64', fontSize: '0.875rem', fontWeight: 500, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Gardıroba dön
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#F5F2EE' }}>
      {/* Header */}
      <div
        className="px-4 py-4 sm:px-6"
        style={{ background: '#FFFFFF', borderBottom: '1px solid #E2DDD7' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard/wardrobe')}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
            style={{ background: '#F5F2EE', border: 'none', color: '#706A64', cursor: 'pointer' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <h1 style={{ color: '#141210', fontSize: '1rem', fontWeight: 600 }} className="truncate">{item.name}</h1>
        </div>
      </div>

      <div className="p-4 sm:p-6 max-w-2xl mx-auto">
        {/* Image */}
        <div className="relative rounded-2xl overflow-hidden aspect-square w-full" style={{ background: '#EAE6E1' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
          {/* Favorite button */}
          <button
            onClick={handleToggleFavorite}
            className="absolute top-3 right-3 flex h-10 w-10 items-center justify-center rounded-full backdrop-blur shadow-sm transition-colors"
            style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }}
          >
            <svg
              className="h-5 w-5 transition-colors"
              style={{ fill: item.is_favorite ? '#C41E3A' : 'none', color: item.is_favorite ? '#C41E3A' : 'rgba(255,255,255,0.7)' }}
              viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </button>
          {/* Category badge */}
          <span
            className="absolute bottom-3 left-3 px-2.5 py-1 text-xs font-medium backdrop-blur"
            style={{ borderRadius: 8, background: 'rgba(0,0,0,0.6)', color: 'white', border: '1px solid rgba(0,0,0,0.1)' }}
          >
            {CATEGORY_LABELS[item.category] ?? item.category}
          </span>
        </div>

        {/* Details card */}
        <div className="mt-4" style={{ background: '#FFFFFF', border: '1px solid #E2DDD7', borderRadius: 16 }}>
          {/* Name + brand */}
          <div className="p-4" style={{ borderBottom: '1px solid #E2DDD7' }}>
            <h2 style={{ color: '#141210', fontSize: '1rem', fontWeight: 600 }}>{item.name}</h2>
            {item.brand && <p style={{ color: '#706A64', fontSize: '0.875rem', marginTop: 2 }}>{item.brand}</p>}
          </div>

          {/* Color */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #E2DDD7' }}>
            <span style={{ color: '#706A64', fontSize: '0.75rem', fontWeight: 500 }}>Renk</span>
            <div className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-full" style={{ backgroundColor: item.color, border: '1px solid rgba(0,0,0,0.1)' }} />
              <span style={{ color: '#141210', fontSize: '0.875rem' }}>{item.color_name ?? item.color}</span>
            </div>
          </div>

          {/* Secondary color */}
          {item.secondary_color && (
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #E2DDD7' }}>
              <span style={{ color: '#706A64', fontSize: '0.75rem', fontWeight: 500 }}>İkincil Renk</span>
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full" style={{ backgroundColor: item.secondary_color, border: '1px solid rgba(0,0,0,0.1)' }} />
                <span style={{ color: '#141210', fontSize: '0.875rem' }}>{item.secondary_color}</span>
              </div>
            </div>
          )}

          {/* Season */}
          <div className="flex items-start justify-between px-4 py-3" style={{ borderBottom: '1px solid #E2DDD7' }}>
            <span style={{ color: '#706A64', fontSize: '0.75rem', fontWeight: 500, paddingTop: 2 }}>Sezon</span>
            <div className="flex flex-wrap gap-1.5 justify-end">
              {item.season.map(s => (
                <span key={s} className="px-2.5 py-0.5 text-xs" style={{ background: '#F5F2EE', color: '#706A64', borderRadius: 8 }}>
                  {SEASON_LABELS[s] ?? s}
                </span>
              ))}
            </div>
          </div>

          {/* Style */}
          <div className="flex items-start justify-between px-4 py-3" style={{ borderBottom: '1px solid #E2DDD7' }}>
            <span style={{ color: '#706A64', fontSize: '0.75rem', fontWeight: 500, paddingTop: 2 }}>Stil</span>
            <div className="flex flex-wrap gap-1.5 justify-end">
              {item.style.map(s => (
                <span key={s} className="px-2.5 py-0.5 text-xs" style={{ background: '#F5F2EE', color: '#706A64', borderRadius: 8 }}>
                  {STYLE_LABELS[s] ?? s}
                </span>
              ))}
            </div>
          </div>

          {/* Wear count */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #E2DDD7' }}>
            <span style={{ color: '#706A64', fontSize: '0.75rem', fontWeight: 500 }}>Giyilme Sayısı</span>
            <span style={{ color: '#141210', fontSize: '0.875rem' }}>{item.wear_count} kez</span>
          </div>

          {/* Last worn */}
          {item.last_worn_at && (
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #E2DDD7' }}>
              <span style={{ color: '#706A64', fontSize: '0.75rem', fontWeight: 500 }}>Son Giyilme</span>
              <span style={{ color: '#141210', fontSize: '0.875rem' }}>
                {new Date(item.last_worn_at).toLocaleDateString('tr-TR')}
              </span>
            </div>
          )}

          {/* Notes */}
          {item.notes && (
            <div className="px-4 py-3">
              <span style={{ color: '#706A64', fontSize: '0.75rem', fontWeight: 500, display: 'block', marginBottom: 4 }}>Notlar</span>
              <p style={{ color: '#706A64', fontSize: '0.875rem' }}>{item.notes}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => setShowEdit(true)}
            className="flex-1 py-2.5 text-sm font-medium transition-colors"
            style={{
              borderRadius: 12,
              border: '1px solid #E2DDD7',
              background: '#F5F2EE',
              color: '#141210',
              cursor: 'pointer',
            }}
          >
            Düzenle
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex-1 py-2.5 text-sm font-medium transition-colors"
            style={{
              borderRadius: 12,
              border: '1px solid rgba(196,30,58,0.3)',
              background: 'rgba(196,30,58,0.08)',
              color: '#C41E3A',
              cursor: 'pointer',
            }}
          >
            Sil
          </button>
        </div>
      </div>

      {/* Edit modal */}
      {showEdit && (
        <ClothingForm
          item={item}
          onSubmit={handleEditSubmit}
          onCancel={() => setShowEdit(false)}
          isLoading={formLoading}
        />
      )}

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-sm p-6" style={{ background: '#FFFFFF', border: '1px solid #E2DDD7', borderRadius: 16 }}>
            <h3 style={{ color: '#141210', fontSize: '1rem', fontWeight: 600 }}>Kıyafeti Sil</h3>
            <p style={{ color: '#706A64', fontSize: '0.875rem', marginTop: 8 }}>
              <span style={{ fontWeight: 500, color: '#141210' }}>{item.name}</span> silinsin mi? Bu işlem geri alınamaz.
            </p>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 text-sm font-medium transition-colors"
                style={{
                  borderRadius: 12,
                  border: '1px solid #E2DDD7',
                  background: '#F5F2EE',
                  color: '#141210',
                  cursor: 'pointer',
                }}
              >
                İptal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteItem.isPending}
                className="flex-1 py-2 text-sm font-medium transition-colors"
                style={{
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #7a0020 0%, #C41E3A 60%, #e8294a 100%)',
                  border: 'none',
                  color: 'white',
                  cursor: deleteItem.isPending ? 'not-allowed' : 'pointer',
                  opacity: deleteItem.isPending ? 0.6 : 1,
                }}
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
