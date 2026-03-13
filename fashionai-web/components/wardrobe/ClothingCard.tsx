'use client';

import Link from 'next/link';
import type { ClothingItem } from '@/types/wardrobe.types';

const CATEGORY_LABELS: Record<string, string> = {
  shirt: 'Gömlek', tshirt: 'T-Shirt', blouse: 'Bluz', sweater: 'Kazak',
  pants: 'Pantolon', jeans: 'Kot', skirt: 'Etek', shorts: 'Şort',
  jacket: 'Ceket', coat: 'Mont', dress: 'Elbise',
  shoes: 'Ayakkabı', sneakers: 'Sneaker', boots: 'Bot', heels: 'Topuklu',
  bag: 'Çanta', backpack: 'Sırt Çantası', clutch: 'El Çantası',
  accessory: 'Aksesuar',
};

const CATEGORY_COLORS: Record<string, string> = {
  shirt: 'bg-blue-50 text-blue-700', tshirt: 'bg-sky-50 text-sky-700',
  blouse: 'bg-pink-50 text-pink-700', sweater: 'bg-orange-50 text-orange-700',
  pants: 'bg-slate-50 text-slate-700', jeans: 'bg-indigo-50 text-indigo-700',
  skirt: 'bg-rose-50 text-rose-700', shorts: 'bg-yellow-50 text-yellow-700',
  jacket: 'bg-zinc-50 text-zinc-700', coat: 'bg-stone-50 text-stone-700',
  dress: 'bg-purple-50 text-purple-700',
  shoes: 'bg-amber-50 text-amber-700', sneakers: 'bg-lime-50 text-lime-700',
  boots: 'bg-brown-50 text-brown-700', heels: 'bg-fuchsia-50 text-fuchsia-700',
  bag: 'bg-teal-50 text-teal-700', backpack: 'bg-cyan-50 text-cyan-700',
  clutch: 'bg-violet-50 text-violet-700', accessory: 'bg-emerald-50 text-emerald-700',
};

interface Props {
  item: ClothingItem;
  onEdit: (item: ClothingItem) => void;
  onDelete: (item: ClothingItem) => void;
  onToggleFavorite: (item: ClothingItem) => void;
}

export function ClothingCard({ item, onEdit, onDelete, onToggleFavorite }: Props) {
  return (
    <div className="group relative rounded-2xl border border-ink-100 bg-white overflow-hidden hover:shadow-md hover:shadow-ink-900/5 transition-all duration-150">
      {/* Image */}
      <Link href={`/dashboard/wardrobe/${item.id}`} className="block">
      <div className="relative aspect-square bg-ink-50 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image_url}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Favorite button */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(item); }}
          className="absolute top-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur shadow-sm hover:bg-white transition-colors"
          aria-label={item.is_favorite ? 'Favoriden çıkar' : 'Favoriye ekle'}
        >
          <svg
            className={`h-4 w-4 transition-colors ${item.is_favorite ? 'fill-red-500 text-red-500' : 'fill-none text-ink-400 hover:text-red-400'}`}
            viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </button>

        {/* Category badge */}
        <span className={`absolute bottom-2.5 left-2.5 rounded-lg px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[item.category] ?? 'bg-ink-100 text-ink-600'}`}>
          {CATEGORY_LABELS[item.category] ?? item.category}
        </span>
      </div>
      </Link>

      {/* Info */}
      <div className="p-3.5">
        <p className="text-sm font-medium text-ink-900 truncate">{item.name}</p>
        <div className="flex items-center gap-1.5 mt-1">
          {/* Color dot */}
          <span
            className="h-3 w-3 rounded-full border border-ink-200 shrink-0"
            style={{ backgroundColor: item.color }}
          />
          <p className="text-xs text-ink-400 truncate">{item.color_name ?? item.color}</p>
          {item.brand && <span className="text-xs text-ink-300">· {item.brand}</span>}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onEdit(item)}
            className="flex-1 rounded-lg border border-ink-200 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-50 transition-colors"
          >
            Düzenle
          </button>
          <button
            onClick={() => onDelete(item)}
            className="flex-1 rounded-lg border border-red-100 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            Sil
          </button>
        </div>
      </div>
    </div>
  );
}
