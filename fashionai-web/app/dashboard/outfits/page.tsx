'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useOutfits } from '@/lib/hooks/useOutfits';
import { useWeather } from '@/lib/hooks/useWeather';
import { useShareOutfit } from '@/lib/hooks/useCommunity';
import { GeneratedOutfitCard, SavedOutfitCard } from '@/components/outfit/OutfitCard';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { OutfitGenerationResult, Outfit } from '@/types/outfit.types';
import type { EventType, Season, WeatherCondition } from '@/types/common.types';

const sectionLabelStyle: React.CSSProperties = {
  color: '#9E9690',
  fontSize: '0.6rem',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  fontWeight: 700,
};

const cardStyle: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid rgba(0,0,0,0.07)',
  borderRadius: 16,
};

export default function OutfitsPage() {
  const supabase = createClient();
  const { t } = useLanguage();

  const EVENTS: { value: EventType; label: string }[] = [
    { value: 'daily_casual', label: t.outfits.eventLabels.daily_casual },
    { value: 'picnic',       label: t.outfits.eventLabels.picnic },
    { value: 'sport',        label: t.outfits.eventLabels.sport },
    { value: 'business',     label: t.outfits.eventLabels.business },
    { value: 'date_night',   label: t.outfits.eventLabels.date_night },
    { value: 'invitation',   label: t.outfits.eventLabels.invitation },
    { value: 'graduation',   label: t.outfits.eventLabels.graduation },
    { value: 'travel',       label: t.outfits.eventLabels.travel },
  ];

  const SEASONS: { value: Season; label: string }[] = [
    { value: 'spring', label: t.outfits.seasonLabels.spring },
    { value: 'summer', label: t.outfits.seasonLabels.summer },
    { value: 'autumn', label: t.outfits.seasonLabels.autumn },
    { value: 'winter', label: t.outfits.seasonLabels.winter },
  ];

  const WEATHER_CONDITIONS: { value: WeatherCondition; label: string }[] = [
    { value: 'sunny',         label: t.outfits.weatherLabels.sunny },
    { value: 'partly_cloudy', label: t.outfits.weatherLabels.partly_cloudy },
    { value: 'cloudy',        label: t.outfits.weatherLabels.cloudy },
    { value: 'rainy',         label: t.outfits.weatherLabels.rainy },
    { value: 'snowy',         label: t.outfits.weatherLabels.snowy },
  ];
  const { data: userData } = useQuery({
    queryKey: ['user'],
    queryFn: async () => { const { data: { user } } = await supabase.auth.getUser(); return user; },
  });
  const userId = userData?.id ?? null;

  const { outfits, isLoading, generateOutfit, saveOutfit, deleteOutfit, toggleFavorite } = useOutfits(userId);
  const { weather } = useWeather();

  // ── Form state
  const [event, setEvent]       = useState<EventType>('daily_casual');
  const [season, setSeason]     = useState<Season>('spring');
  const [weatherCond, setWeatherCond]   = useState<WeatherCondition | undefined>();
  const [weatherTemp, setWeatherTemp]   = useState<number | undefined>();
  const [showWeather, setShowWeather]   = useState(false);

  // Hava durumu gelince otomatik doldur
  useEffect(() => {
    if (weather && !weatherCond) {
      setWeatherCond(weather.condition);
      setWeatherTemp(weather.temp);
      setShowWeather(true);
    }
  }, [weather]);

  // ── Share
  const shareOutfit = useShareOutfit(userId);
  const [shareModal, setShareModal] = useState<{ imageUrl: string; itemImages: string[]; idx: number; outfitId?: string } | null>(null);
  const [shareCaption, setShareCaption] = useState('');
  const [sharingIdx, setSharingIdx] = useState<number | null>(null);
  const [sharedIdxs, setSharedIdxs] = useState<Set<number>>(new Set());
  const [savedSharedIds, setSavedSharedIds] = useState<Set<string>>(new Set());
  const [savingSavedShareId, setSavingSavedShareId] = useState<string | null>(null);

  const handleSavedOutfitShare = async (outfit: Outfit) => {
    // Fetch outfit items to build collage
    const supabaseClient = createClient();
    const { data: items } = await supabaseClient
      .from('outfit_items')
      .select('cloth_id, clothes(image_url)')
      .eq('outfit_id', outfit.id)
      .limit(4);

    const itemImages: string[] = (items ?? [])
      .map((it: any) => it.clothes?.image_url)
      .filter(Boolean);

    const imageUrl = outfit.cover_image_url ?? (itemImages[0] ?? '');
    setShareModal({ imageUrl, itemImages, idx: -1, outfitId: outfit.id });
    setShareCaption('');
  };

  // ── Generated results
  const [results, setResults] = useState<OutfitGenerationResult[]>([]);
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const [savedIdxs, setSavedIdxs] = useState<Set<number>>(new Set());
  const [noResults, setNoResults] = useState(false);

  // ── Filter state for saved outfits
  const [filterFav, setFilterFav] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Outfit | null>(null);

  // ── Generate
  const handleGenerate = async () => {
    setResults([]);
    setNoResults(false);
    setSavedIdxs(new Set());
    const res = await generateOutfit.mutateAsync({
      event, season,
      weather_cond: showWeather ? weatherCond : undefined,
      weather_temp: showWeather ? weatherTemp : undefined,
    });
    if (res.length === 0) setNoResults(true);
    else setResults(res);
  };

  // ── Save single result
  const handleSave = async (result: OutfitGenerationResult, idx: number) => {
    setSavingIdx(idx);
    await saveOutfit.mutateAsync({
      result,
      params: { event, season, weather_cond: showWeather ? weatherCond : undefined, weather_temp: showWeather ? weatherTemp : undefined },
    });
    setSavedIdxs(prev => new Set(prev).add(idx));
    setSavingIdx(null);
  };

  // ── Share to Keşfet
  const [shareError, setShareError] = useState<string | null>(null);
  const handleShareConfirm = async () => {
    if (!shareModal) return;
    setShareError(null);
    if (shareModal.idx >= 0) setSharingIdx(shareModal.idx);
    else if (shareModal.outfitId) setSavingSavedShareId(shareModal.outfitId);
    try {
      await shareOutfit.mutateAsync({
        outfit_id: shareModal.outfitId ?? null,
        image_url: shareModal.imageUrl,
        item_images: shareModal.itemImages,
        caption: shareCaption,
        tags: [],
      });
      if (shareModal.idx >= 0) setSharedIdxs(prev => new Set(prev).add(shareModal.idx));
      else if (shareModal.outfitId) setSavedSharedIds(prev => new Set(prev).add(shareModal.outfitId!));
      setShareModal(null);
      setShareCaption('');
    } catch (err: any) {
      setShareError(err?.message ?? 'Paylaşım sırasında hata oluştu');
    } finally {
      setSharingIdx(null);
      setSavingSavedShareId(null);
    }
  };

  // ── Delete
  const handleDelete = async (outfit: Outfit) => {
    await deleteOutfit.mutateAsync(outfit.id);
    setDeleteConfirm(null);
  };

  const filteredOutfits = filterFav ? outfits.filter(o => o.is_favorite) : outfits;

  const chipStyle = (active: boolean): React.CSSProperties => ({
    border: active ? '1px solid rgba(196,30,58,0.4)' : '1px solid #E2DDD7',
    background: active ? 'rgba(196,30,58,0.1)' : '#F5F2EE',
    color: active ? '#C41E3A' : '#706A64',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: '0.65rem',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    cursor: 'pointer',
    transition: 'all 0.15s',
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <p style={sectionLabelStyle} className="mb-1">{t.outfits.sectionLabel}</p>
        <h1 style={{ color: '#141210', fontFamily: 'serif', fontWeight: 700, fontSize: '2.25rem' }}>{t.outfits.title}</h1>
        <p style={{ color: '#706A64', fontSize: '0.875rem', marginTop: 4 }}>{t.outfits.subtitle}</p>
      </div>

      <div style={{ height: 1, background: 'rgba(0,0,0,0.07)' }} className="mb-8" />

      {/* ── Top row: form card + seasons card side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 16, alignItems: 'stretch' }}>

        {/* Generation form — event + weather (no button) */}
        <div style={{ ...cardStyle, padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Event */}
          <div>
            <label style={sectionLabelStyle} className="mb-3 block">{t.outfits.occasionLabel}</label>
            <div className="grid grid-cols-4 gap-2">
              {EVENTS.map(e => (
                <button
                  key={e.value}
                  onClick={() => setEvent(e.value)}
                  style={chipStyle(event === e.value)}
                  className="flex flex-col items-center gap-1.5 py-3 transition-all"
                >
                  {e.label}
                </button>
              ))}
            </div>
          </div>

          {/* Weather (optional) */}
          <div style={{ marginTop: 'auto' }}>
            <button
              onClick={() => setShowWeather(v => !v)}
              className="flex items-center gap-2 transition-colors"
              style={{ ...sectionLabelStyle, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3">
                <path strokeLinecap="round" strokeLinejoin="round" d={showWeather ? 'M19.5 8.25l-7.5 7.5-7.5-7.5' : 'M8.25 4.5l7.5 7.5-7.5 7.5'} />
              </svg>
              {t.outfits.weatherFilter}
              {weather && (
                <span style={{ color: '#2a7aad', textTransform: 'none', fontSize: '0.75rem', fontWeight: 400, letterSpacing: 0 }}>
                  {weather.temp}°C · {weather.city}
                </span>
              )}
            </button>

            {showWeather && (
              <div className="mt-3 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {WEATHER_CONDITIONS.map(w => (
                    <button
                      key={w.value}
                      onClick={() => setWeatherCond(weatherCond === w.value ? undefined : w.value)}
                      style={chipStyle(weatherCond === w.value)}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Seasons card — right column, equal height */}
        <div style={{
          ...cardStyle,
          padding: 24,
          background: 'linear-gradient(160deg, #FFFFFF 0%, #FAF6F3 100%)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Decorative background accent */}
          <div style={{
            position: 'absolute', top: -40, right: -40,
            width: 130, height: 130,
            background: 'radial-gradient(circle, rgba(196,30,58,0.06) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }} />

          <label style={sectionLabelStyle} className="mb-5 block">{t.outfits.seasonLabel}</label>

          <div className="flex flex-col gap-2.5">
            {SEASONS.map(s => {
              const active = season === s.value;
              return (
                <button
                  key={s.value}
                  onClick={() => setSeason(s.value)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 16px',
                    borderRadius: 12,
                    border: active ? '1px solid rgba(196,30,58,0.35)' : '1px solid rgba(0,0,0,0.06)',
                    background: active ? 'rgba(196,30,58,0.08)' : 'rgba(0,0,0,0.03)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: active ? 700 : 500,
                    color: active ? '#C41E3A' : '#2C2320',
                    letterSpacing: '0.03em',
                  }}>
                    {s.label}
                  </span>
                  {active && (
                    <span style={{ marginLeft: 'auto', flexShrink: 0 }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="#C41E3A" strokeWidth={2.5} style={{ width: 14, height: 14 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Shared generate button — full width, below both cards */}
      <button
        onClick={handleGenerate}
        disabled={generateOutfit.isPending}
        style={{
          width: '100%',
          background: 'linear-gradient(135deg, #7a0020 0%, #C41E3A 60%, #e8294a 100%)',
          borderRadius: 14,
          boxShadow: '0 4px 24px rgba(196,30,58,0.35)',
          border: 'none',
          color: 'white',
          fontWeight: 600,
          fontSize: '0.925rem',
          padding: '15px 24px',
          cursor: generateOutfit.isPending ? 'not-allowed' : 'pointer',
          opacity: generateOutfit.isPending ? 0.7 : 1,
          marginBottom: 28,
          letterSpacing: '0.02em',
        }}
      >
        {generateOutfit.isPending ? (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <svg className="animate-spin" style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            {t.outfits.generating}
          </span>
        ) : (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            {t.outfits.generateBtn}
          </span>
        )}
      </button>

      {/* ── Generated results — full width */}
      <div className="space-y-6">
        {noResults && (
          <div style={{
            background: 'rgba(196,30,58,0.08)',
            border: '1px solid rgba(196,30,58,0.2)',
            borderRadius: 12,
            padding: '16px 20px',
            color: 'rgba(255,160,100,0.9)',
            fontSize: '0.875rem',
          }}>
            {t.outfits.noResults}
          </div>
        )}

        {results.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p style={sectionLabelStyle}>{t.outfits.suggestedOutfits}</p>
              <span style={{ color: '#9E9690', fontSize: '0.75rem' }}>{results.length} {t.outfits.sortedByCompatibility}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {results.map((result, i) => (
                <GeneratedOutfitCard
                  key={i}
                  result={result}
                  event={event}
                  season={season}
                  onSave={() => handleSave(result, i)}
                  isSaving={savingIdx === i}
                  isSaved={savedIdxs.has(i)}
                  onShare={(imageUrl, itemImages) => { setShareModal({ imageUrl, itemImages, idx: i }); setShareCaption(''); }}
                  isSharing={sharingIdx === i}
                  isShared={sharedIdxs.has(i)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Saved outfits — full width */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p style={sectionLabelStyle} className="mb-0.5">{t.outfits.savedOutfits}</p>
              <span style={{ color: '#9E9690', fontSize: '0.75rem' }}>{outfits.length} {t.outfits.combinations}</span>
            </div>
            <button
              onClick={() => setFilterFav(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[0.65rem] font-semibold tracking-wider uppercase transition-all"
              style={{
                borderRadius: 8,
                border: filterFav ? '1px solid rgba(196,30,58,0.4)' : '1px solid #E2DDD7',
                background: filterFav ? 'rgba(196,30,58,0.1)' : '#F5F2EE',
                color: filterFav ? '#C41E3A' : '#706A64',
                cursor: 'pointer',
              }}
            >
              <svg viewBox="0 0 24 24" className="h-3 w-3" style={{ fill: filterFav ? '#C41E3A' : 'none' }} stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
              {t.outfits.favorites}
            </button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-square animate-pulse" style={{ background: '#EAE6E1', borderRadius: 12 }} />
              ))}
            </div>
          ) : filteredOutfits.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 text-center"
              style={{
                border: '1px dashed rgba(0,0,0,0.1)',
                borderRadius: 16,
              }}
            >
              <p style={{ color: '#706A64', fontSize: '0.875rem' }}>
                {outfits.length === 0 ? t.outfits.noSavedOutfits : t.outfits.noFavorites}
              </p>
              <p style={{ color: '#9E9690', fontSize: '0.75rem', marginTop: 4 }}>{t.outfits.generateAndSave}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredOutfits.map(outfit => (
                <SavedOutfitCard
                  key={outfit.id}
                  outfit={outfit}
                  onToggleFavorite={o => toggleFavorite.mutate({ id: o.id, current: o.is_favorite })}
                  onDelete={setDeleteConfirm}
                  onShare={() => handleSavedOutfitShare(outfit)}
                  isSharing={savingSavedShareId === outfit.id}
                  isShared={savedSharedIds.has(outfit.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Share to Keşfet modal */}
      {shareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-sm" style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 16, overflow: 'hidden' }}>
            {/* Preview - uniform grid, fully visible items */}
            <div style={{ aspectRatio: '1', overflow: 'hidden', background: '#F8F5F2' }}>
              {(() => {
                const imgs = (shareModal.itemImages.length > 0 ? shareModal.itemImages : [shareModal.imageUrl]).slice(0, 4);
                const imgStyle: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'contain', display: 'block', background: '#F8F5F2', padding: 6, boxSizing: 'border-box' };
                if (imgs.length === 1) {
                  // eslint-disable-next-line @next/next/no-img-element
                  return <img src={imgs[0]} alt="Kombin" style={{ ...imgStyle, padding: 16 }} />;
                }
                const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: imgs.length > 2 ? '1fr 1fr' : '1fr', width: '100%', height: '100%', gap: 2, background: '#E8E2DB' };
                if (imgs.length === 3) {
                  return (
                    <div style={gridStyle}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imgs[0]} alt="" style={imgStyle} />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imgs[1]} alt="" style={imgStyle} />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imgs[2]} alt="" style={{ ...imgStyle, gridColumn: '1 / 3' }} />
                    </div>
                  );
                }
                return (
                  <div style={gridStyle}>
                    {imgs.map((url, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={url} alt="" style={imgStyle} />
                    ))}
                  </div>
                );
              })()}
            </div>
            <div className="p-5">
              <p style={sectionLabelStyle} className="mb-1">KESFEDİLECEK</p>
              <h3 style={{ color: '#141210', fontWeight: 700, fontSize: '1rem', marginBottom: 12 }}>Kombini topluluğa paylaş</h3>
              <textarea
                placeholder="Bir şeyler yaz... (isteğe bağlı)"
                value={shareCaption}
                onChange={e => setShareCaption(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  background: '#F5F2EE',
                  border: '1px solid #E2DDD7',
                  borderRadius: 10,
                  padding: '10px 12px',
                  color: '#141210',
                  fontSize: '0.875rem',
                  outline: 'none',
                  resize: 'none',
                  marginBottom: 14,
                }}
              />
              {shareError && (
                <p style={{ color: '#C41E3A', fontSize: '0.8rem', marginBottom: 10 }}>{shareError}</p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => { setShareModal(null); setShareError(null); }}
                  style={{ flex: 1, background: '#F5F2EE', border: '1px solid #E2DDD7', borderRadius: 10, color: '#141210', fontWeight: 500, fontSize: '0.875rem', padding: '10px 16px', cursor: 'pointer' }}
                >
                  İptal
                </button>
                <button
                  onClick={handleShareConfirm}
                  disabled={shareOutfit.isPending}
                  style={{ flex: 1, background: 'linear-gradient(135deg, #3b0764 0%, #7c3aed 100%)', borderRadius: 10, border: 'none', color: 'white', fontWeight: 600, fontSize: '0.875rem', padding: '10px 16px', cursor: shareOutfit.isPending ? 'not-allowed' : 'pointer', opacity: shareOutfit.isPending ? 0.6 : 1 }}
                >
                  {shareOutfit.isPending ? 'Paylaşılıyor...' : 'Keşfete Paylaş'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-sm p-8" style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 16 }}>
            <p style={sectionLabelStyle} className="mb-3">{t.outfits.confirmDelete}</p>
            <h3 style={{ color: '#141210', fontFamily: 'serif', fontWeight: 700, fontSize: '1.25rem', marginBottom: 8 }}>{t.outfits.removeOutfit}</h3>
            <p style={{ color: '#706A64', fontSize: '0.875rem', marginBottom: 24 }}>{t.outfits.deleteOutfitConfirm}</p>
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
                {t.outfits.cancel}
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleteOutfit.isPending}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #7a0020 0%, #C41E3A 60%, #e8294a 100%)',
                  borderRadius: 12,
                  border: 'none',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  padding: '10px 16px',
                  cursor: deleteOutfit.isPending ? 'not-allowed' : 'pointer',
                  opacity: deleteOutfit.isPending ? 0.6 : 1,
                }}
              >
                {deleteOutfit.isPending ? t.outfits.deleting : t.outfits.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
