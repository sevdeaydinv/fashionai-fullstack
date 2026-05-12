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
  const [wardrobeLoading, setWardrobeLoading] = useState(false);
  const [swapError, setSwapError] = useState<string | null>(null);
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
  const loadWardrobe = async (uid: string) => {
    if (wardrobe.length > 0) return;
    setWardrobeLoading(true);
    const items = await WardrobeService.getClothes(uid);
    setWardrobe(items);
    setWardrobeLoading(false);
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
    const newCloth = wardrobe.find(c => c.id === newClothId);
    if (!newCloth) return;

    setSwapError(null);
    const { error } = await OutfitService.swapItem(swapRole.outfitItemId, newClothId);
    if (error) {
      setSwapError(error);
      return;
    }

    setOutfit(prev => prev ? {
      ...prev,
      items: prev.items.map(item =>
        item.id === swapRole.outfitItemId
          ? { ...item, cloth_id: newClothId, cloth: newCloth as OutfitWithItems['items'][0]['cloth'] }
          : item
      ),
    } : prev);
    setSwapRole(null);
  };

  const handleDelete = async () => {
    await deleteOutfit.mutateAsync(outfit!.id);
    router.push('/dashboard/outfits');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <svg className="h-6 w-6 animate-spin" style={{ color: '#9E9690' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
      </div>
    );
  }

  if (!outfit) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <p style={{ color: '#706A64', fontSize: '0.875rem' }}>Kombin bulunamadı.</p>
        <button
          onClick={() => router.push('/dashboard/outfits')}
          style={{ marginTop: 16, color: '#706A64', fontSize: '0.875rem', fontWeight: 500, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Geri dön
        </button>
      </div>
    );
  }

  const scorePercent = outfit.ai_score ? Math.round(outfit.ai_score * 100) : null;

  return (
    <div className="min-h-screen" style={{ background: '#F5F2EE' }}>
      {/* Header */}
      <div
        className="px-4 py-4 sm:px-6"
        style={{ background: '#FFFFFF', borderBottom: '1px solid #E2DDD7' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard/outfits')}
              className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
              style={{ background: '#F5F2EE', border: 'none', color: '#706A64', cursor: 'pointer' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </button>
            <h1 style={{ color: '#141210', fontSize: '1rem', fontWeight: 600 }} className="truncate">
              {outfit.name ?? (outfit.event ? EVENT_LABELS[outfit.event] : 'Kombin')}
            </h1>
          </div>
          <button
            onClick={handleToggleFavorite}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
            style={{ background: '#F5F2EE', border: 'none', cursor: 'pointer' }}
          >
            <svg
              className="h-5 w-5 transition-colors"
              style={{ fill: outfit.is_favorite ? '#C41E3A' : 'none', color: outfit.is_favorite ? '#C41E3A' : '#706A64' }}
              viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-4">

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          {scorePercent !== null && (
            <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: '#C41E3A', color: 'white' }}>
              {scorePercent}% uyum
            </span>
          )}
          {outfit.event && (
            <span className="rounded-full px-3 py-1 text-xs" style={{ background: '#F5F2EE', color: '#706A64' }}>
              {EVENT_LABELS[outfit.event]}
            </span>
          )}
          {outfit.season && (
            <span className="rounded-full px-3 py-1 text-xs" style={{ background: '#F5F2EE', color: '#706A64' }}>
              {SEASON_LABELS[outfit.season]}
            </span>
          )}
          {outfit.worn_at && (
            <span className="rounded-full px-3 py-1 text-xs" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#4ade80' }}>
              Giyildi · {new Date(outfit.worn_at).toLocaleDateString('tr-TR')}
            </span>
          )}
        </div>

        {/* Outfit items */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2DDD7', borderRadius: 16 }}>
          {outfit.items.map((outfitItem, idx) => (
            <div
              key={outfitItem.id}
              className="flex items-center gap-4 p-4"
              style={{ borderBottom: idx < outfit.items.length - 1 ? '1px solid #E2DDD7' : 'none' }}
            >
              {/* Thumbnail */}
              <div className="h-16 w-16 shrink-0 overflow-hidden" style={{ borderRadius: 12, background: '#EAE6E1' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={outfitItem.cloth.image_url} alt={outfitItem.cloth.name} className="h-full w-full object-cover" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p style={{ color: '#706A64', fontSize: '0.75rem', fontWeight: 500 }}>{ROLE_LABELS[outfitItem.role] ?? outfitItem.role}</p>
                <p style={{ color: '#141210', fontSize: '0.875rem', fontWeight: 500 }} className="truncate">{outfitItem.cloth.name}</p>
                {outfitItem.cloth.brand && (
                  <p style={{ color: '#706A64', fontSize: '0.75rem' }}>{outfitItem.cloth.brand}</p>
                )}
              </div>

              {/* Swap button */}
              <button
                onClick={() => {
                  setSwapRole({ outfitItemId: outfitItem.id, role: outfitItem.role });
                  if (userId) loadWardrobe(userId);
                }}
                className="shrink-0 px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  borderRadius: 8,
                  border: '1px solid #E2DDD7',
                  background: '#F5F2EE',
                  color: '#706A64',
                  cursor: 'pointer',
                }}
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
            className="flex-1 py-2.5 text-sm font-medium transition-colors"
            style={{
              borderRadius: 12,
              border: outfit.worn_at ? '1px solid rgba(34,197,94,0.3)' : '1px solid #E2DDD7',
              background: outfit.worn_at ? 'rgba(34,197,94,0.1)' : 'linear-gradient(135deg, #7a0020 0%, #C41E3A 60%, #e8294a 100%)',
              color: outfit.worn_at ? '#4ade80' : 'white',
              cursor: (markingWorn || !!outfit.worn_at) ? 'not-allowed' : 'pointer',
              opacity: markingWorn ? 0.7 : 1,
            }}
          >
            {markingWorn ? 'İşaretleniyor...' : outfit.worn_at ? 'Giyildi' : 'Giyildi İşaretle'}
          </button>
          <button
            onClick={() => setDeleteConfirm(true)}
            className="px-5 py-2.5 text-sm font-medium transition-colors"
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

      {/* ── Swap modal */}
      {swapRole && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div
            className="w-full max-w-sm max-h-[70vh] flex flex-col"
            style={{ background: '#FFFFFF', border: '1px solid #E2DDD7', borderRadius: 16 }}
          >
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid #E2DDD7' }}
            >
              <h3 style={{ color: '#141210', fontSize: '0.875rem', fontWeight: 600 }}>
                {ROLE_LABELS[swapRole.role]} Değiştir
              </h3>
              <button
                onClick={() => { setSwapRole(null); setSwapError(null); }}
                className="flex h-7 w-7 items-center justify-center rounded-full transition-colors"
                style={{ background: '#F5F2EE', border: 'none', color: '#706A64', cursor: 'pointer' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {swapError && (
              <div className="mx-4 mt-3 rounded-xl px-4 py-2 text-xs" style={{ background: 'rgba(196,30,58,0.08)', border: '1px solid rgba(196,30,58,0.2)', color: '#C41E3A' }}>
                {swapError}
              </div>
            )}
            <div className="overflow-y-auto p-4 space-y-2">
              {wardrobeLoading && (
                <div className="flex items-center justify-center py-8">
                  <svg className="h-5 w-5 animate-spin" style={{ color: '#9E9690' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                </div>
              )}
              {!wardrobeLoading && wardrobe
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
                    className="flex w-full items-center gap-3 p-3 text-left transition-all"
                    style={{
                      borderRadius: 12,
                      border: '1px solid #E2DDD7',
                      background: '#F5F2EE',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#EAE6E1'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#F5F2EE'; }}
                  >
                    <div className="h-12 w-12 shrink-0 overflow-hidden" style={{ borderRadius: 8, background: '#EAE6E1' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p style={{ color: '#141210', fontSize: '0.875rem', fontWeight: 500 }} className="truncate">{item.name}</p>
                      {item.brand && <p style={{ color: '#706A64', fontSize: '0.75rem' }}>{item.brand}</p>}
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-sm p-6" style={{ background: '#FFFFFF', border: '1px solid #E2DDD7', borderRadius: 16 }}>
            <h3 style={{ color: '#141210', fontSize: '1rem', fontWeight: 600 }}>Kombini Sil</h3>
            <p style={{ color: '#706A64', fontSize: '0.875rem', marginTop: 8 }}>Bu kombin silinsin mi? Bu işlem geri alınamaz.</p>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setDeleteConfirm(false)}
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
                disabled={deleteOutfit.isPending}
                className="flex-1 py-2 text-sm font-medium transition-colors"
                style={{
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #7a0020 0%, #C41E3A 60%, #e8294a 100%)',
                  border: 'none',
                  color: 'white',
                  cursor: deleteOutfit.isPending ? 'not-allowed' : 'pointer',
                  opacity: deleteOutfit.isPending ? 0.6 : 1,
                }}
              >
                {deleteOutfit.isPending ? 'Siliniyor...' : 'Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
