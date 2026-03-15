'use client';

import type { MakeupRecommendation } from '@/types/beauty.types';

interface Props {
  makeup: MakeupRecommendation;
}

export function MakeupCard({ makeup }: Props) {
  return (
    <div className="rounded-2xl border border-rose-100 bg-white p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xl">💄</span>
        <h3 className="font-semibold text-ink-900">Makyaj Önerileri</h3>
      </div>

      {/* Renk paleti */}
      <div>
        <p className="text-xs font-medium text-ink-500 mb-2">Göz Farı Paleti</p>
        <div className="flex gap-2 flex-wrap">
          {makeup.eye_shadow_palette.map((color, i) => (
            <span
              key={i}
              className="rounded-full border border-ink-100 bg-ink-50 px-3 py-1 text-xs text-ink-700"
            >
              {color}
            </span>
          ))}
        </div>
      </div>

      {/* Renkler */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-rose-50 p-3">
          <p className="text-xs text-rose-400 font-medium mb-0.5">Dudak Rengi</p>
          <p className="text-sm text-ink-900">{makeup.lip_color}</p>
        </div>
        <div className="rounded-xl bg-amber-50 p-3">
          <p className="text-xs text-amber-500 font-medium mb-0.5">Allık Tonu</p>
          <p className="text-sm text-ink-900">{makeup.blush_tone}</p>
        </div>
      </div>

      {/* Fondöten */}
      <div className="rounded-xl bg-ink-50 p-3">
        <p className="text-xs text-ink-400 font-medium mb-0.5">Fondöten Tonu</p>
        <p className="text-sm text-ink-900">{makeup.foundation_shade}</p>
      </div>

      {/* İpuçları */}
      {makeup.style_tips.length > 0 && (
        <div>
          <p className="text-xs font-medium text-ink-500 mb-2">Stil İpuçları</p>
          <ul className="space-y-1.5">
            {makeup.style_tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-ink-700">
                <span className="text-rose-400 mt-0.5">✦</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
