'use client';

import { useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ClothingItem, ClothingItemPayload } from '@/types/wardrobe.types';
import type { ClothingCategory, Season, Style } from '@/types/common.types';

// ── Schema
const schema = z.object({
  name: z.string().min(1, 'İsim gerekli'),
  category: z.string().min(1, 'Kategori gerekli'),
  color: z.string().min(1, 'Renk gerekli'),
  color_name: z.string().optional(),
  secondary_color: z.string().optional(),
  brand: z.string().optional(),
  season: z.array(z.string()).min(1, 'En az bir sezon seçin'),
  style: z.array(z.string()).min(1, 'En az bir stil seçin'),
  fabric: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

// ── Constants
const CATEGORIES: { value: ClothingCategory; label: string }[] = [
  { value: 'shirt', label: 'Gömlek' }, { value: 'tshirt', label: 'T-Shirt' },
  { value: 'blouse', label: 'Bluz' }, { value: 'sweater', label: 'Kazak' },
  { value: 'pants', label: 'Pantolon' }, { value: 'jeans', label: 'Kot' },
  { value: 'skirt', label: 'Etek' }, { value: 'shorts', label: 'Şort' },
  { value: 'jacket', label: 'Ceket' }, { value: 'coat', label: 'Mont' },
  { value: 'dress', label: 'Elbise' },
  { value: 'shoes', label: 'Ayakkabı' }, { value: 'sneakers', label: 'Sneaker' },
  { value: 'boots', label: 'Bot' }, { value: 'heels', label: 'Topuklu' },
  { value: 'bag', label: 'Günlük Çanta' }, { value: 'sport_bag', label: 'Spor Çanta' },
  { value: 'backpack', label: 'Sırt Çantası' }, { value: 'clutch', label: 'Davet Çantası' },
  { value: 'accessory', label: 'Aksesuar' },
];

const SEASONS: { value: Season; label: string }[] = [
  { value: 'spring', label: 'İlkbahar' }, { value: 'summer', label: 'Yaz' },
  { value: 'autumn', label: 'Sonbahar' }, { value: 'winter', label: 'Kış' },
  { value: 'all_season', label: 'Tüm Sezonlar' },
];

const STYLES: { value: Style; label: string }[] = [
  { value: 'casual', label: 'Günlük' }, { value: 'formal', label: 'Resmi' },
  { value: 'sport', label: 'Spor' }, { value: 'streetwear', label: 'Sokak' },
  { value: 'elegant', label: 'Şık' }, { value: 'bohemian', label: 'Bohem' },
];

const FABRICS: { value: string; label: string }[] = [
  { value: 'cotton',    label: 'Pamuk' },
  { value: 'denim',     label: 'Denim' },
  { value: 'linen',     label: 'Keten' },
  { value: 'silk',      label: 'İpek' },
  { value: 'satin',     label: 'Saten' },
  { value: 'chiffon',   label: 'Şifon' },
  { value: 'velvet',    label: 'Kadife' },
  { value: 'wool',      label: 'Yün' },
  { value: 'polyester', label: 'Polyester' },
  { value: 'lycra',     label: 'Likra' },
  { value: 'leather',   label: 'Deri' },
  { value: 'lace',      label: 'Dantel' },
];

const PRESET_COLORS = [
  '#000000', '#FFFFFF', '#6B7280', '#EF4444', '#F97316',
  '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899',
  '#F5F5DC', '#D2B48C', '#1E3A5F', '#2D5016', '#7C3AED',
];

interface Props {
  item?: ClothingItem;
  onSubmit: (payload: Omit<ClothingItemPayload, 'wardrobe_id'>, imageFile?: File) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ClothingForm({ item, onSubmit, onCancel, isLoading }: Props) {
  const [imagePreview, setImagePreview] = useState<string | null>(item?.image_url ?? null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: item?.name ?? '',
      category: item?.category ?? '',
      color: item?.color ?? '#000000',
      color_name: item?.color_name ?? '',
      secondary_color: item?.secondary_color ?? '',
      brand: item?.brand ?? '',
      season: item?.season ?? [],
      style: item?.style ?? [],
      fabric: item?.tags?.find(t => t.startsWith('fabric:'))?.replace('fabric:', '') ?? '',
      notes: item?.notes ?? '',
    },
  });

  const watchColor = watch('color');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = async (values: FormValues) => {
    const payload: Omit<ClothingItemPayload, 'wardrobe_id'> = {
      name: values.name,
      category: values.category as ClothingCategory,
      color: values.color,
      color_name: values.color_name || null,
      secondary_color: values.secondary_color || null,
      brand: values.brand || null,
      season: values.season as Season[],
      style: values.style as Style[],
      notes: values.notes || null,
      tags: values.fabric ? [`fabric:${values.fabric}`] : [],
      is_favorite: item?.is_favorite ?? false,
      last_worn_at: item?.last_worn_at ?? null,
      image_url: item?.image_url ?? '',
    };
    await onSubmit(payload, imageFile ?? undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
          <h2 className="text-base font-semibold text-ink-900">
            {item ? 'Kıyafeti Düzenle' : 'Yeni Kıyafet Ekle'}
          </h2>
          <button onClick={onCancel} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-ink-50 text-ink-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-5 space-y-4">
          {/* Image upload */}
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1.5">Fotoğraf</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="relative flex h-40 w-full cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-ink-200 bg-ink-50 hover:bg-ink-100 transition-colors overflow-hidden"
            >
              {imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imagePreview} alt="preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-ink-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-8 w-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                  <span className="text-xs">Fotoğraf seç</span>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            {!item && !imageFile && (
              <p className="mt-1 text-xs text-ink-400">Kıyafet eklemek için fotoğraf yükleyin</p>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">Ad</label>
            <input
              {...register('name')}
              placeholder="örn. Beyaz gömlek"
              className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-ink-400/30"
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">Kategori</label>
            <select
              {...register('category')}
              className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-400/30"
            >
              <option value="">Seçin...</option>
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category.message}</p>}
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1.5">Ana Renk</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {PRESET_COLORS.map(c => (
                <Controller
                  key={c}
                  name="color"
                  control={control}
                  render={({ field }) => (
                    <button
                      type="button"
                      onClick={() => field.onChange(c)}
                      className={`h-7 w-7 rounded-full border-2 transition-transform ${field.value === c ? 'border-ink-900 scale-110' : 'border-ink-200'}`}
                      style={{ backgroundColor: c }}
                    />
                  )}
                />
              ))}
              <div className="relative h-7 w-7">
                <input
                  type="color"
                  {...register('color')}
                  className="absolute inset-0 h-full w-full cursor-pointer rounded-full opacity-0"
                />
                <div
                  className="h-7 w-7 rounded-full border-2 border-dashed border-ink-300 flex items-center justify-center text-ink-400"
                  style={{ backgroundColor: watchColor }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </div>
              </div>
            </div>
            <input
              {...register('color_name')}
              placeholder="Renk adı (örn. Lacivert)"
              className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-ink-400/30"
            />
            {errors.color && <p className="mt-1 text-xs text-red-500">{errors.color.message}</p>}
          </div>

          {/* Brand */}
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">Marka (opsiyonel)</label>
            <input
              {...register('brand')}
              placeholder="örn. Zara, H&M"
              className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-ink-400/30"
            />
          </div>

          {/* Season */}
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1.5">Sezon</label>
            <Controller
              name="season"
              control={control}
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {SEASONS.map(s => {
                    const selected = field.value.includes(s.value);
                    return (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => {
                          if (selected) field.onChange(field.value.filter((v: string) => v !== s.value));
                          else field.onChange([...field.value, s.value]);
                        }}
                        className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                          selected ? 'bg-ink-900 text-white border-ink-900' : 'bg-white text-ink-600 border-ink-200 hover:bg-ink-50'
                        }`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              )}
            />
            {errors.season && <p className="mt-1 text-xs text-red-500">{errors.season.message}</p>}
          </div>

          {/* Style */}
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1.5">Stil</label>
            <Controller
              name="style"
              control={control}
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {STYLES.map(s => {
                    const selected = field.value.includes(s.value);
                    return (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => {
                          if (selected) field.onChange(field.value.filter((v: string) => v !== s.value));
                          else field.onChange([...field.value, s.value]);
                        }}
                        className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                          selected ? 'bg-ink-900 text-white border-ink-900' : 'bg-white text-ink-600 border-ink-200 hover:bg-ink-50'
                        }`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              )}
            />
            {errors.style && <p className="mt-1 text-xs text-red-500">{errors.style.message}</p>}
          </div>

          {/* Fabric */}
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1.5">Kumaş (opsiyonel)</label>
            <Controller
              name="fabric"
              control={control}
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {FABRICS.map(f => {
                    const selected = field.value === f.value;
                    return (
                      <button
                        key={f.value}
                        type="button"
                        onClick={() => field.onChange(selected ? '' : f.value)}
                        className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                          selected ? 'bg-ink-900 text-white border-ink-900' : 'bg-white text-ink-600 border-ink-200 hover:bg-ink-50'
                        }`}
                      >
                        {f.label}
                      </button>
                    );
                  })}
                </div>
              )}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">Notlar (opsiyonel)</label>
            <textarea
              {...register('notes')}
              rows={2}
              placeholder="Bu kıyafet hakkında notlarınız..."
              className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-ink-400/30 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-xl border border-ink-200 py-2.5 text-sm font-medium text-ink-600 hover:bg-ink-50 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 rounded-xl bg-ink-900 py-2.5 text-sm font-medium text-white hover:bg-ink-800 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Kaydediliyor...' : item ? 'Güncelle' : 'Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
