'use client';

import type { HairstyleRecommendation, GroomingRecommendation } from '@/types/beauty.types';

interface HairstyleProps {
  hairstyle: HairstyleRecommendation;
}

export function HairstyleCard({ hairstyle }: HairstyleProps) {
  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xl">✂️</span>
        <h3 className="font-semibold text-ink-900">Saç Önerileri</h3>
      </div>

      {/* Önerilen stiller */}
      <div>
        <p className="text-xs font-medium text-ink-500 mb-2">Önerilen Stiller</p>
        <div className="flex flex-wrap gap-2">
          {hairstyle.suggested_styles.map((style, i) => (
            <span
              key={i}
              className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700"
            >
              {style}
            </span>
          ))}
        </div>
      </div>

      {/* Ürünler */}
      {hairstyle.products.length > 0 && (
        <div>
          <p className="text-xs font-medium text-ink-500 mb-2">Önerilen Ürünler</p>
          <div className="flex flex-wrap gap-2">
            {hairstyle.products.map((product, i) => (
              <span
                key={i}
                className="rounded-full border border-ink-200 bg-ink-50 px-3 py-1 text-xs text-ink-600"
              >
                {product}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* İpuçları */}
      {hairstyle.styling_tips.length > 0 && (
        <div>
          <p className="text-xs font-medium text-ink-500 mb-2">Şekillendirme İpuçları</p>
          <ul className="space-y-1.5">
            {hairstyle.styling_tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-ink-700">
                <span className="text-violet-400 mt-0.5">✦</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

interface GroomingProps {
  grooming: GroomingRecommendation;
}

export function GroomingCard({ grooming }: GroomingProps) {
  return (
    <div className="rounded-2xl border border-sky-100 bg-white p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xl">🪒</span>
        <h3 className="font-semibold text-ink-900">Erkek Bakım Önerileri</h3>
      </div>

      {grooming.beard_style && (
        <div className="rounded-xl bg-sky-50 p-3">
          <p className="text-xs text-sky-500 font-medium mb-0.5">Sakal Stili</p>
          <p className="text-sm text-ink-900">{grooming.beard_style}</p>
        </div>
      )}

      {grooming.skincare_routine.length > 0 && (
        <div>
          <p className="text-xs font-medium text-ink-500 mb-2">Cilt Bakım Rutini</p>
          <ol className="space-y-1.5">
            {grooming.skincare_routine.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-ink-700">
                <span className="text-sky-400 font-bold shrink-0">{i + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}

      {grooming.tips.length > 0 && (
        <div>
          <p className="text-xs font-medium text-ink-500 mb-2">İpuçları</p>
          <ul className="space-y-1.5">
            {grooming.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-ink-700">
                <span className="text-sky-400 mt-0.5">✦</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
