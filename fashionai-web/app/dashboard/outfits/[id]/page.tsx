'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useOutfits } from '@/lib/hooks/useOutfits';
import { OutfitService } from '@/lib/services/outfit.service';
import { WardrobeService } from '@/lib/services/wardrobe.service';
import type { OutfitWithItems } from '@/types/outfit.types';
import type { ClothingItem } from '@/types/wardrobe.types';

const EVENT_LABELS: Record<string, string> = {
  daily_casual: 'Günlük', picnic: 'Piknik', sport: 'Spor',
  graduation: 'Mezuniyet', invitation: 'Davet', travel: 'Seyahat',
  business: 'İş', date_night: 'Romantik',
};
const SEASON_LABELS: Record<string, string> = {
  spring: 'İlkbahar', summer: 'Yaz', autumn: 'Sonbahar', winter: 'Kış', all_season: 'Tüm Sezonlar',
};
const ROLE_LABELS: Record<string, string> = {
  top: 'Üst', bottom: 'Alt', shoes: 'Ayakkabı', bag: 'Çanta', accessory: 'Aksesuar',
};

export default function OutfitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const { data: userData } = useQuery({
    queryKey: ['user'],
    queryFn: async () => { const { data: { user } } = await supabase.auth.getUser(); return user; },
  });
  const userId = userData?.id ?? null;

  const { toggleFavorite, markAsWorn, swapItem, deleteOutfit } = useOutfits(userId);

  const [outfit, setOutfit] = useState<OutfitWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [swapRole, setSwapRole] = useState<{ outfitItemId: string; role: string } | null>(null);
  const [wardrobe, setWardrobe] = useState<ClothingItem[]>([]);
  const [markingWorn, setMarkingWorn] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // ── Load outfit
  useEffect(() => {
    OutfitService.getOutfitWithItems(id).then(data => {
      setOutfit(data);
      setLoading(false);
    });
  }, [id]);

  // ── Load wardrobe for swap
  const loadWardrobe = async () => {
    if (!userId || wardrobe.length > 0) return;
    const items = await WardrobeService.getClothes(userId);
    setWardrobe(items);
  };

  const handleToggleFavorite = () => {
    if (!outfit) return;
    toggleFavorite.mutate({ id: outfit.id, current: outfit.is_favorite });
    setOutfit(prev => prev ? { ...prev, is_favorite: !prev.is_favorite } : prev);
  };

  const handleMarkAsWorn = async () => {
    if (!outfit) return;
    setMarkingWorn(true);
    const clothIds = outfit.items.map(i => i.cloth_id);
    await markAsWorn.mutateAsync({ outfitId: outfit.id, clothIds });
    setOutfit(prev => prev ? { ...prev, worn_at: new Date().toISOString() } : prev);
    setMarkingWorn(false);
  };

  const handleSwap = async (newClothId: string) => {
    if (!swapRole) return;
    await swapItem.mutateAsync({ outfitItemId: swapRole.outfitItemId, newClothId });
    // Reload outfit
    const updated = await OutfitService.getOutfitWithItems(id);
    setOutfit(updated);
    setSwapRole(null);
  };

  const handleDelete = async () => {
    await deleteOutfit.mutateAsync(outfit!.id);
    router.push('/dashboard/outfits');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <svg className="h-6 w-6 animate-spin text-ink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
      </div>
    );
  }

  if (!outfit) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <p className="text-sm text-ink-500">Kombin bulunamadı.</p>
        <button onClick={() => router.push('/dashboard/outfits')} className="mt-4 text-sm font-medium text-ink-900 underline underline-offset-2">
          Geri dön
        </button>
      </div>
    );
  }

  const scorePercent = outfit.ai_score ? Math.round(outfit.ai_score * 100) : null;

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Header */}
      <div className="bg-white border-b border-ink-100 px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard/outfits')} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-ink-50 text-ink-400">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </button>
            <h1 className="text-base font-semibold text-ink-900 truncate">
              {outfit.name ?? (outfit.event ? EVENT_LABELS[outfit.event] : 'Kombin')}
            </h1>
          </div>
          <button onClick={handleToggleFavorite} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-ink-50">
            <svg className={`h-5 w-5 transition-colors ${outfit.is_favorite ? 'fill-red-500 text-red-500' : 'fill-none text-ink-400'}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-4">

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          {scorePercent !== null && (
            <span className="rounded-full bg-ink-900 px-3 py-1 text-xs font-semibold text-white">
              {scorePercent}% uyum
            </span>
          )}
          {outfit.event && <span className="rounded-full bg-ink-100 px-3 py-1 text-xs text-ink-600">{EVENT_LABELS[outfit.event]}</span>}
          {outfit.season && <span className="rounded-full bg-ink-100 px-3 py-1 text-xs text-ink-600">{SEASON_LABELS[outfit.season]}</span>}
          {outfit.worn_at && (
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs text-emerald-600">
              Giyildi · {new Date(outfit.worn_at).toLocaleDateString('tr-TR')}
            </span>
          )}
        </div>

        {/* Outfit items */}
        <div className="rounded-2xl bg-white border border-ink-100 divide-y divide-ink-100">
          {outfit.items.map(outfitItem => (
            <div key={outfitItem.id} className="flex items-center gap-4 p-4">
              {/* Thumbnail */}
              <div className="h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-ink-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={outfitItem.cloth.image_url} alt={outfitItem.cloth.name} className="h-full w-full object-cover" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-ink-400">{ROLE_LABELS[outfitItem.role] ?? outfitItem.role}</p>
                <p className="text-sm font-medium text-ink-900 truncate">{outfitItem.cloth.name}</p>
                {outfitItem.cloth.brand && (
                  <p className="text-xs text-ink-400">{outfitItem.cloth.brand}</p>
                )}
              </div>

              {/* Swap button */}
              <button
                onClick={async () => {
                  await loadWardrobe();
                  setSwapRole({ outfitItemId: outfitItem.id, role: outfitItem.role });
                }}
                className="shrink-0 rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-50 transition-colors"
              >
                Değiştir
              </button>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleMarkAsWorn}
            disabled={markingWorn || !!outfit.worn_at}
            className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition-colors ${
              outfit.worn_at
                ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                : 'border-ink-900 bg-ink-900 text-white hover:bg-ink-800 disabled:opacity-50'
            }`}
          >
            {markingWorn ? 'İşaretleniyor...' : outfit.worn_at ? '✓ Giyildi' : 'Giyildi İşaretle'}
          </button>
          <button
            onClick={() => setDeleteConfirm(true)}
            className="rounded-xl border border-red-100 px-5 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            Sil
          </button>
        </div>
      </div>

      {/* ── Swap modal */}
      {swapRole && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
              <h3 className="text-sm font-semibold text-ink-900">
                {ROLE_LABELS[swapRole.role]} Değiştir
              </h3>
              <button onClick={() => setSwapRole(null)} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-ink-50 text-ink-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-2">
              {wardrobe
                .filter(c => {
                  const role = swapRole.role;
                  if (role === 'top') return ['shirt','tshirt','blouse','sweater','jacket','coat','dress'].includes(c.category);
                  if (role === 'bottom') return ['pants','jeans','skirt','shorts'].includes(c.category);
                  if (role === 'shoes') return ['shoes','sneakers','boots','heels'].includes(c.category);
                  if (role === 'bag') return ['bag','backpack','clutch'].includes(c.category);
                  return c.category === 'accessory';
                })
                .map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleSwap(item.id)}
                    className="flex w-full items-center gap-3 rounded-xl border border-ink-100 p-3 hover:bg-ink-50 transition-colors text-left"
                  >
                    <div className="h-12 w-12 shrink-0 rounded-lg overflow-hidden bg-ink-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink-900 truncate">{item.name}</p>
                      {item.brand && <p className="text-xs text-ink-400">{item.brand}</p>}
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-ink-900">Kombini Sil</h3>
            <p className="mt-2 text-sm text-ink-500">Bu kombin silinsin mi? Bu işlem geri alınamaz.</p>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setDeleteConfirm(false)} className="flex-1 rounded-xl border border-ink-200 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50 transition-colors">
                İptal
              </button>
              <button onClick={handleDelete} disabled={deleteOutfit.isPending} className="flex-1 rounded-xl bg-red-500 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50 transition-colors">
                {deleteOutfit.isPending ? 'Siliniyor...' : 'Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
