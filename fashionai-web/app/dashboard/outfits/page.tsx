'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useOutfits } from '@/lib/hooks/useOutfits';
import { GeneratedOutfitCard, SavedOutfitCard } from '@/components/outfit/OutfitCard';
import type { OutfitGenerationResult, Outfit } from '@/types/outfit.types';
import type { EventType, Season, WeatherCondition } from '@/types/common.types';

// ── Constants
const EVENTS: { value: EventType; label: string; icon: string }[] = [
  { value: 'daily_casual', label: 'Günlük',     icon: '☀️' },
  { value: 'picnic',       label: 'Piknik',      icon: '🌿' },
  { value: 'sport',        label: 'Spor',        icon: '🏃' },
  { value: 'business',     label: 'İş',          icon: '💼' },
  { value: 'date_night',   label: 'Romantik',    icon: '🌙' },
  { value: 'invitation',   label: 'Davet',       icon: '🎉' },
  { value: 'graduation',   label: 'Mezuniyet',   icon: '🎓' },
  { value: 'travel',       label: 'Seyahat',     icon: '✈️' },
];

const SEASONS: { value: Season; label: string }[] = [
  { value: 'spring', label: 'İlkbahar' },
  { value: 'summer', label: 'Yaz' },
  { value: 'autumn', label: 'Sonbahar' },
  { value: 'winter', label: 'Kış' },
];

const WEATHER_CONDITIONS: { value: WeatherCondition; label: string }[] = [
  { value: 'sunny',        label: 'Güneşli' },
  { value: 'partly_cloudy',label: 'Parçalı Bulutlu' },
  { value: 'cloudy',       label: 'Bulutlu' },
  { value: 'rainy',        label: 'Yağmurlu' },
  { value: 'snowy',        label: 'Karlı' },
];

export default function OutfitsPage() {
  const supabase = createClient();
  const { data: userData } = useQuery({
    queryKey: ['user'],
    queryFn: async () => { const { data: { user } } = await supabase.auth.getUser(); return user; },
  });
  const userId = userData?.id ?? null;

  const { outfits, isLoading, generateOutfit, saveOutfit, deleteOutfit, toggleFavorite } = useOutfits(userId);

  // ── Form state
  const [event, setEvent]       = useState<EventType>('daily_casual');
  const [season, setSeason]     = useState<Season>('spring');
  const [weatherCond, setWeatherCond]   = useState<WeatherCondition | undefined>();
  const [weatherTemp, setWeatherTemp]   = useState<number | undefined>();
  const [showWeather, setShowWeather]   = useState(false);

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

  // ── Delete
  const handleDelete = async (outfit: Outfit) => {
    await deleteOutfit.mutateAsync(outfit.id);
    setDeleteConfirm(null);
  };

  const filteredOutfits = filterFav ? outfits.filter(o => o.is_favorite) : outfits;

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Header */}
      <div className="bg-white border-b border-ink-100 px-4 py-4 sm:px-6">
        <h1 className="text-lg font-semibold text-ink-900">Kombin Oluştur</h1>
        <p className="text-xs text-ink-400 mt-0.5">Gardırobundan AI destekli kombinler üret</p>
      </div>

      <div className="p-4 sm:p-6 space-y-6 max-w-3xl mx-auto">

        {/* ── Seçim formu */}
        <div className="rounded-2xl bg-white border border-ink-100 p-5 space-y-5">

          {/* Event */}
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-2">Etkinlik</label>
            <div className="grid grid-cols-4 gap-2">
              {EVENTS.map(e => (
                <button
                  key={e.value}
                  onClick={() => setEvent(e.value)}
                  className={`flex flex-col items-center gap-1 rounded-xl border py-2.5 text-xs font-medium transition-colors ${
                    event === e.value
                      ? 'border-ink-900 bg-ink-900 text-white'
                      : 'border-ink-200 text-ink-600 hover:bg-ink-50'
                  }`}
                >
                  <span className="text-lg">{e.icon}</span>
                  {e.label}
                </button>
              ))}
            </div>
          </div>

          {/* Season */}
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-2">Sezon</label>
            <div className="flex gap-2">
              {SEASONS.map(s => (
                <button
                  key={s.value}
                  onClick={() => setSeason(s.value)}
                  className={`flex-1 rounded-xl border py-2 text-xs font-medium transition-colors ${
                    season === s.value
                      ? 'border-ink-900 bg-ink-900 text-white'
                      : 'border-ink-200 text-ink-600 hover:bg-ink-50'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Weather (optional) */}
          <div>
            <button
              onClick={() => setShowWeather(v => !v)}
              className="flex items-center gap-1.5 text-xs font-medium text-ink-500 hover:text-ink-800 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d={showWeather ? 'M19.5 8.25l-7.5 7.5-7.5-7.5' : 'M8.25 4.5l7.5 7.5-7.5 7.5'} />
              </svg>
              Hava durumu ekle (opsiyonel)
            </button>

            {showWeather && (
              <div className="mt-3 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {WEATHER_CONDITIONS.map(w => (
                    <button
                      key={w.value}
                      onClick={() => setWeatherCond(weatherCond === w.value ? undefined : w.value)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        weatherCond === w.value
                          ? 'border-ink-900 bg-ink-900 text-white'
                          : 'border-ink-200 text-ink-600 hover:bg-ink-50'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Sıcaklık (°C)"
                    value={weatherTemp ?? ''}
                    onChange={e => setWeatherTemp(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-36 rounded-lg border border-ink-200 px-3 py-1.5 text-sm text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-ink-400/30"
                  />
                  <span className="text-xs text-ink-400">isteğe bağlı</span>
                </div>
              </div>
            )}
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={generateOutfit.isPending}
            className="w-full rounded-xl bg-ink-900 py-3 text-sm font-semibold text-white hover:bg-ink-800 disabled:opacity-60 transition-colors"
          >
            {generateOutfit.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                Kombinler üretiliyor...
              </span>
            ) : '✨ Kombin Üret'}
          </button>
        </div>

        {/* ── Üretilen kombinler */}
        {noResults && (
          <div className="rounded-2xl bg-amber-50 border border-amber-100 px-5 py-4 text-sm text-amber-700">
            Seçilen kriterlere uygun kıyafet bulunamadı. Gardırobuna daha fazla kıyafet ekle veya filtreleri değiştir.
          </div>
        )}

        {results.length > 0 && (
          <div>
            <p className="text-xs font-medium text-ink-500 mb-3">Önerilen kombinler</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {results.map((result, i) => (
                <GeneratedOutfitCard
                  key={i}
                  result={result}
                  event={event}
                  season={season}
                  onSave={() => handleSave(result, i)}
                  isSaving={savingIdx === i}
                  isSaved={savedIdxs.has(i)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Kaydedilmiş kombinler */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-ink-900">
              Kaydedilen Kombinler
              <span className="ml-1.5 text-xs font-normal text-ink-400">({outfits.length})</span>
            </p>
            <button
              onClick={() => setFilterFav(v => !v)}
              className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                filterFav ? 'border-red-400 bg-red-50 text-red-500' : 'border-ink-200 text-ink-500 hover:bg-ink-50'
              }`}
            >
              <svg viewBox="0 0 24 24" className={`h-3 w-3 ${filterFav ? 'fill-red-500' : 'fill-none'}`} stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
              Favoriler
            </button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-2xl bg-ink-100 animate-pulse" />
              ))}
            </div>
          ) : filteredOutfits.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 py-16 text-center">
              <p className="text-sm text-ink-500">
                {outfits.length === 0 ? 'Henüz kaydedilmiş kombin yok' : 'Favori kombin bulunamadı'}
              </p>
              <p className="text-xs text-ink-400 mt-1">Yukarıdan kombin üretip kaydedebilirsin.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredOutfits.map(outfit => (
                <SavedOutfitCard
                  key={outfit.id}
                  outfit={outfit}
                  onToggleFavorite={o => toggleFavorite.mutate({ id: o.id, current: o.is_favorite })}
                  onDelete={setDeleteConfirm}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-ink-900">Kombini Sil</h3>
            <p className="mt-2 text-sm text-ink-500">
              Bu kombin silinsin mi? Bu işlem geri alınamaz.
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
                disabled={deleteOutfit.isPending}
                className="flex-1 rounded-xl bg-red-500 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
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
