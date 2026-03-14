'use client';

import Link from 'next/link';
import type { OutfitGenerationResult } from '@/types/outfit.types';
import type { Outfit } from '@/types/outfit.types';

const EVENT_LABELS: Record<string, string> = {
  daily_casual: 'Günlük', picnic: 'Piknik', sport: 'Spor',
  graduation: 'Mezuniyet', invitation: 'Davet', travel: 'Seyahat',
  business: 'İş', date_night: 'Romantik',
};

const SEASON_LABELS: Record<string, string> = {
  spring: 'İlkbahar', summer: 'Yaz', autumn: 'Sonbahar',
  winter: 'Kış', all_season: 'Tüm Sezonlar',
};

// ── Generated outfit card (before saving)
interface GeneratedCardProps {
  result: OutfitGenerationResult;
  event: string;
  season: string;
  onSave: () => void;
  isSaving?: boolean;
  isSaved?: boolean;
}

export function GeneratedOutfitCard({ result, event, season, onSave, isSaving, isSaved }: GeneratedCardProps) {
  const scorePercent = Math.round(result.score * 100);
  const scoreColor =
    scorePercent >= 85 ? 'text-emerald-600 bg-emerald-50' :
    scorePercent >= 70 ? 'text-blue-600 bg-blue-50' :
    scorePercent >= 55 ? 'text-amber-600 bg-amber-50' :
                         'text-red-600 bg-red-50';

  const items = [result.top, result.bottom, result.shoes, result.bag].filter(Boolean);

  return (
    <div className="rounded-2xl border border-ink-100 bg-white overflow-hidden hover:shadow-md hover:shadow-ink-900/5 transition-all duration-150">
      {/* Images grid */}
      <div className="grid grid-cols-3 gap-0.5 bg-ink-100">
        {items.slice(0, 3).map((item, i) => (
          <div key={i} className="aspect-square bg-ink-50 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item!.image_url}
              alt={item!.name}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="p-3.5">
        {/* Score + badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${scoreColor}`}>
            {scorePercent}% uyum
          </span>
          <span className="rounded-full bg-ink-100 px-2.5 py-0.5 text-xs text-ink-600">
            {EVENT_LABELS[event] ?? event}
          </span>
          <span className="rounded-full bg-ink-100 px-2.5 py-0.5 text-xs text-ink-600">
            {SEASON_LABELS[season] ?? season}
          </span>
        </div>

        {/* Reason */}
        <p className="mt-2 text-xs text-ink-500 line-clamp-2">{result.reason}</p>

        {/* Item names */}
        <div className="mt-2 space-y-0.5">
          {[result.top, result.bottom, result.shoes].filter(Boolean).map((item, i) => (
            <p key={i} className="text-xs text-ink-400 truncate">
              <span className="text-ink-300">·</span> {item!.name}
            </p>
          ))}
        </div>

        {/* Save button */}
        <button
          onClick={onSave}
          disabled={isSaving || isSaved}
          className={`mt-3 w-full rounded-xl py-2 text-xs font-medium transition-colors ${
            isSaved
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              : 'bg-ink-900 text-white hover:bg-ink-800 disabled:opacity-50'
          }`}
        >
          {isSaved ? '✓ Kaydedildi' : isSaving ? 'Kaydediliyor...' : 'Kombini Kaydet'}
        </button>
      </div>
    </div>
  );
}

// ── Saved outfit card (from database)
interface SavedCardProps {
  outfit: Outfit;
  onToggleFavorite: (outfit: Outfit) => void;
  onDelete: (outfit: Outfit) => void;
}

export function SavedOutfitCard({ outfit, onToggleFavorite, onDelete }: SavedCardProps) {
  const scorePercent = outfit.ai_score ? Math.round(outfit.ai_score * 100) : null;

  return (
    <div className="group relative rounded-2xl border border-ink-100 bg-white overflow-hidden hover:shadow-md hover:shadow-ink-900/5 transition-all duration-150">
      {/* Cover image */}
      <Link href={`/dashboard/outfits/${outfit.id}`}>
        <div className="relative aspect-square bg-ink-50 overflow-hidden">
          {outfit.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={outfit.cover_image_url}
              alt={outfit.name ?? 'Kombin'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-ink-300">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-10 w-10">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75z" />
              </svg>
            </div>
          )}

          {/* Favorite button */}
          <button
            onClick={(e) => { e.preventDefault(); onToggleFavorite(outfit); }}
            className="absolute top-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur shadow-sm hover:bg-white transition-colors"
          >
            <svg
              className={`h-4 w-4 transition-colors ${outfit.is_favorite ? 'fill-red-500 text-red-500' : 'fill-none text-ink-400'}`}
              viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </button>

          {/* Score badge */}
          {scorePercent !== null && (
            <span className="absolute bottom-2.5 left-2.5 rounded-lg bg-white/90 backdrop-blur px-2 py-0.5 text-xs font-semibold text-ink-700">
              {scorePercent}%
            </span>
          )}

          {/* Worn badge */}
          {outfit.worn_at && (
            <span className="absolute bottom-2.5 right-2.5 rounded-lg bg-ink-900/80 backdrop-blur px-2 py-0.5 text-xs text-white">
              Giyildi
            </span>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="p-3.5">
        <p className="text-sm font-medium text-ink-900 truncate">
          {outfit.name ?? (outfit.event ? EVENT_LABELS[outfit.event] : 'Kombin')}
        </p>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {outfit.event && (
            <span className="text-xs text-ink-400">{EVENT_LABELS[outfit.event]}</span>
          )}
          {outfit.season && (
            <span className="text-xs text-ink-300">· {SEASON_LABELS[outfit.season]}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-3">
          <Link
            href={`/dashboard/outfits/${outfit.id}`}
            className="flex-1 rounded-lg border border-ink-200 py-1.5 text-center text-xs font-medium text-ink-600 hover:bg-ink-50 transition-colors"
          >
            Detay
          </Link>
          <button
            onClick={() => onDelete(outfit)}
            className="flex-1 rounded-lg border border-red-100 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            Sil
          </button>
        </div>
      </div>
    </div>
  );
}
