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
  bag: 'Çanta', backpack: 'Sırt Çantası', clutch: 'El Çantası',
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
        <p className="text-sm text-ink-500">Kıyafet bulunamadı.</p>
        <button
          onClick={() => router.push('/dashboard/wardrobe')}
          className="mt-4 text-sm font-medium text-ink-900 underline underline-offset-2"
        >
          Gardıroba dön
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Header */}
      <div className="bg-white border-b border-ink-100 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard/wardrobe')}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-ink-50 text-ink-400 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <h1 className="text-base font-semibold text-ink-900 truncate">{item.name}</h1>
        </div>
      </div>

      <div className="p-4 sm:p-6 max-w-2xl mx-auto">
        {/* Image */}
        <div className="relative rounded-2xl overflow-hidden bg-ink-100 aspect-square w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          {/* Favorite button */}
          <button
            onClick={handleToggleFavorite}
            className="absolute top-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur shadow-sm hover:bg-white transition-colors"
          >
            <svg
              className={`h-5 w-5 transition-colors ${item.is_favorite ? 'fill-red-500 text-red-500' : 'fill-none text-ink-400'}`}
              viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </button>
          {/* Category badge */}
          <span className="absolute bottom-3 left-3 rounded-lg bg-white/90 backdrop-blur px-2.5 py-1 text-xs font-medium text-ink-700">
            {CATEGORY_LABELS[item.category] ?? item.category}
          </span>
        </div>

        {/* Details card */}
        <div className="mt-4 rounded-2xl bg-white border border-ink-100 divide-y divide-ink-100">
          {/* Name + brand */}
          <div className="p-4">
            <h2 className="text-base font-semibold text-ink-900">{item.name}</h2>
            {item.brand && <p className="text-sm text-ink-400 mt-0.5">{item.brand}</p>}
          </div>

          {/* Color */}
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-xs font-medium text-ink-500">Renk</span>
            <div className="flex items-center gap-2">
              <span
                className="h-4 w-4 rounded-full border border-ink-200"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-ink-700">{item.color_name ?? item.color}</span>
            </div>
          </div>

          {/* Secondary color */}
          {item.secondary_color && (
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs font-medium text-ink-500">İkincil Renk</span>
              <div className="flex items-center gap-2">
                <span
                  className="h-4 w-4 rounded-full border border-ink-200"
                  style={{ backgroundColor: item.secondary_color }}
                />
                <span className="text-sm text-ink-700">{item.secondary_color}</span>
              </div>
            </div>
          )}

          {/* Season */}
          <div className="flex items-start justify-between px-4 py-3">
            <span className="text-xs font-medium text-ink-500 pt-0.5">Sezon</span>
            <div className="flex flex-wrap gap-1.5 justify-end">
              {item.season.map(s => (
                <span key={s} className="rounded-full bg-ink-100 px-2.5 py-0.5 text-xs text-ink-600">
                  {SEASON_LABELS[s] ?? s}
                </span>
              ))}
            </div>
          </div>

          {/* Style */}
          <div className="flex items-start justify-between px-4 py-3">
            <span className="text-xs font-medium text-ink-500 pt-0.5">Stil</span>
            <div className="flex flex-wrap gap-1.5 justify-end">
              {item.style.map(s => (
                <span key={s} className="rounded-full bg-ink-100 px-2.5 py-0.5 text-xs text-ink-600">
                  {STYLE_LABELS[s] ?? s}
                </span>
              ))}
            </div>
          </div>

          {/* Wear count */}
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-xs font-medium text-ink-500">Giyilme Sayısı</span>
            <span className="text-sm text-ink-700">{item.wear_count} kez</span>
          </div>

          {/* Last worn */}
          {item.last_worn_at && (
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs font-medium text-ink-500">Son Giyilme</span>
              <span className="text-sm text-ink-700">
                {new Date(item.last_worn_at).toLocaleDateString('tr-TR')}
              </span>
            </div>
          )}

          {/* Notes */}
          {item.notes && (
            <div className="px-4 py-3">
              <span className="text-xs font-medium text-ink-500 block mb-1">Notlar</span>
              <p className="text-sm text-ink-700">{item.notes}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => setShowEdit(true)}
            className="flex-1 rounded-xl border border-ink-200 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50 transition-colors"
          >
            Düzenle
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex-1 rounded-xl border border-red-100 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-ink-900">Kıyafeti Sil</h3>
            <p className="mt-2 text-sm text-ink-500">
              <span className="font-medium">{item.name}</span> silinsin mi? Bu işlem geri alınamaz.
            </p>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-xl border border-ink-200 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleDelete}
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
