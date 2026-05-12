'use client';

import { useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ClothingItem, ClothingItemPayload } from '@/types/wardrobe.types';
import type { ClothingCategory, Season, Style } from '@/types/common.types';

// ── Schema
const schema = z.object({
  name:             z.string().min(1, 'İsim gerekli'),
  category:         z.string().min(1, 'Kategori gerekli'),
  color:            z.string().min(1, 'Renk gerekli'),
  color_name:       z.string().optional(),
  secondary_color:  z.string().optional(),
  brand:            z.string().optional(),
  season:           z.array(z.string()).min(1, 'En az bir sezon seçin'),
  style:            z.array(z.string()).min(1, 'En az bir stil seçin'),
  fabric:           z.string().optional(),
  notes:            z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

// ── Constants
const CATEGORIES: { value: ClothingCategory; label: string }[] = [
  { value: 'shirt',      label: 'Gömlek'         },
  { value: 'tshirt',     label: 'T-Shirt'         },
  { value: 'blouse',     label: 'Bluz'            },
  { value: 'sweater',    label: 'Kazak'           },
  { value: 'pants',      label: 'Pantolon'        },
  { value: 'jeans',      label: 'Kot'             },
  { value: 'skirt',      label: 'Etek'            },
  { value: 'shorts',     label: 'Şort'            },
  { value: 'jacket',     label: 'Ceket'           },
  { value: 'coat',       label: 'Mont'            },
  { value: 'dress',      label: 'Elbise'          },
  { value: 'shoes',      label: 'Ayakkabı'        },
  { value: 'sneakers',   label: 'Sneaker'         },
  { value: 'boots',      label: 'Bot'             },
  { value: 'heels',      label: 'Topuklu'         },
  { value: 'sandals',    label: 'Sandalet'        },
  { value: 'slippers',   label: 'Terlik'          },
  { value: 'sweatpants', label: 'Eşofman Altı'    },
  { value: 'bag',        label: 'Günlük Çanta'    },
  { value: 'sport_bag',  label: 'Spor Çanta'      },
  { value: 'backpack',   label: 'Sırt Çantası'    },
  { value: 'clutch',     label: 'Davet Çantası'   },
  { value: 'hat',        label: 'Şapka'           },
  { value: 'accessory',  label: 'Aksesuar'        },
];

const SEASONS: { value: Season; label: string }[] = [
  { value: 'spring',     label: 'İlkbahar'        },
  { value: 'summer',     label: 'Yaz'             },
  { value: 'autumn',     label: 'Sonbahar'        },
  { value: 'winter',     label: 'Kış'             },
  { value: 'all_season', label: 'Tüm Sezonlar'    },
];

const STYLES: { value: Style; label: string }[] = [
  { value: 'casual',     label: 'Günlük'          },
  { value: 'formal',     label: 'Resmi'           },
  { value: 'sport',      label: 'Spor'            },
  { value: 'streetwear', label: 'Sokak'           },
  { value: 'elegant',    label: 'Şık'             },
  { value: 'bohemian',   label: 'Bohem'           },
];

const FABRICS: { value: string; label: string }[] = [
  { value: 'cotton',    label: 'Pamuk'    },
  { value: 'denim',     label: 'Denim'    },
  { value: 'linen',     label: 'Keten'    },
  { value: 'silk',      label: 'İpek'     },
  { value: 'satin',     label: 'Saten'    },
  { value: 'chiffon',   label: 'Şifon'    },
  { value: 'velvet',    label: 'Kadife'   },
  { value: 'wool',      label: 'Yün'      },
  { value: 'polyester', label: 'Polyester'},
  { value: 'lycra',     label: 'Likra'    },
  { value: 'leather',   label: 'Deri'     },
  { value: 'lace',      label: 'Dantel'   },
];

const PRESET_COLORS = [
  '#1A1A1A', '#FFFFFF', '#6B7280', '#EF4444', '#F97316',
  '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899',
  '#F5F0E8', '#D2B48C', '#1E3A5F', '#2D5016', '#7C3AED',
];

interface Props {
  item?:      ClothingItem;
  onSubmit:   (payload: Omit<ClothingItemPayload, 'wardrobe_id'>, imageFile?: File) => Promise<void>;
  onCancel:   () => void;
  isLoading?: boolean;
}

/* ─── shared label style ─────────────────────────────────────────────────── */
const LBL: React.CSSProperties = {
  display:       'block',
  fontSize:      '0.62rem',
  fontWeight:    700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color:         '#7A6A65',
  marginBottom:  8,
};

/* ─── shared input style ─────────────────────────────────────────────────── */
const INPUT: React.CSSProperties = {
  width:        '100%',
  background:   'rgba(255,255,255,0.85)',
  border:       '1px solid rgba(28,20,18,0.1)',
  borderRadius: 12,
  padding:      '11px 14px',
  fontSize:     '0.82rem',
  color:        '#1C1C1C',
  outline:      'none',
  boxSizing:    'border-box',
  transition:   'border-color 0.15s, box-shadow 0.15s',
};

export function ClothingForm({ item, onSubmit, onCancel, isLoading }: Props) {
  const [imagePreview, setImagePreview] = useState<string | null>(item?.image_url ?? null);
  const [imageFile,    setImageFile]    = useState<File | null>(null);
  const [imgHover,     setImgHover]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:            item?.name            ?? '',
      category:        item?.category        ?? '',
      color:           item?.color           ?? '#1A1A1A',
      color_name:      item?.color_name      ?? '',
      secondary_color: item?.secondary_color ?? '',
      brand:           item?.brand           ?? '',
      season:          item?.season          ?? [],
      style:           item?.style           ?? [],
      fabric:          item?.tags?.find(t => t.startsWith('fabric:'))?.replace('fabric:', '') ?? '',
      notes:           item?.notes           ?? '',
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
      name:           values.name,
      category:       values.category as ClothingCategory,
      color:          values.color,
      color_name:     values.color_name     || null,
      secondary_color:values.secondary_color || null,
      brand:          values.brand          || null,
      season:         values.season         as Season[],
      style:          values.style          as Style[],
      notes:          values.notes          || null,
      tags:           values.fabric ? [`fabric:${values.fabric}`] : [],
      is_favorite:    item?.is_favorite     ?? false,
      last_worn_at:   item?.last_worn_at    ?? null,
      image_url:      item?.image_url       ?? '',
    };
    await onSubmit(payload, imageFile ?? undefined);
  };

  return (
    <>
      <style>{`
        .cf-input:focus {
          border-color: #C41E3A !important;
          box-shadow: 0 0 0 3px rgba(196,30,58,0.1) !important;
        }
        .cf-select:focus {
          border-color: #C41E3A !important;
          box-shadow: 0 0 0 3px rgba(196,30,58,0.1) !important;
          outline: none;
        }
        .cf-chip {
          padding: 6px 14px;
          border-radius: 100px;
          font-size: 0.72rem;
          font-weight: 600;
          border: 1px solid rgba(28,20,18,0.1);
          background: rgba(255,255,255,0.7);
          color: #5A4A45;
          cursor: pointer;
          transition: all 0.16s;
          letter-spacing: 0.02em;
        }
        .cf-chip:hover {
          background: rgba(255,255,255,1);
          border-color: rgba(196,30,58,0.3);
          color: #C41E3A;
        }
        .cf-chip.active {
          background: linear-gradient(135deg, #9A0025, #C41E3A);
          border-color: transparent;
          color: #fff;
          box-shadow: 0 2px 10px rgba(196,30,58,0.3);
        }
        .cf-upload:hover {
          border-color: rgba(196,30,58,0.45) !important;
          background: rgba(255,248,246,0.95) !important;
        }
        .cf-scroll::-webkit-scrollbar { width: 4px; }
        .cf-scroll::-webkit-scrollbar-track { background: transparent; }
        .cf-scroll::-webkit-scrollbar-thumb { background: rgba(196,30,58,0.2); border-radius: 2px; }
      `}</style>

      {/* ── Backdrop ──────────────────────────────────────────────────── */}
      <div style={{
        position:       'fixed',
        inset:          0,
        zIndex:         50,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '16px',
        background:     'rgba(20,10,8,0.55)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}>

        {/* ── Modal ─────────────────────────────────────────────────── */}
        <div style={{
          width:        '100%',
          maxWidth:     520,
          maxHeight:    '92vh',
          background:   '#FAF7F5',
          borderRadius: 24,
          boxShadow:    '0 32px 80px rgba(20,10,8,0.22), 0 8px 32px rgba(20,10,8,0.12)',
          overflow:     'hidden',
          display:      'flex',
          flexDirection:'column',
          border:       '1px solid rgba(255,255,255,0.6)',
        }}>

          {/* Header */}
          <div style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            padding:        '20px 24px 18px',
            borderBottom:   '1px solid rgba(28,20,18,0.07)',
            flexShrink:     0,
            background:     'rgba(255,255,255,0.5)',
          }}>
            <div>
              <p style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#C41E3A', marginBottom: 3 }}>
                DOLAP
              </p>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1C1C1C', letterSpacing: '-0.01em' }}>
                {item ? 'Kıyafeti Düzenle' : 'Yeni Kıyafet Ekle'}
              </h2>
            </div>
            <button
              onClick={onCancel}
              style={{
                width:          36,
                height:         36,
                borderRadius:   '50%',
                border:         '1px solid rgba(28,20,18,0.1)',
                background:     'rgba(255,255,255,0.7)',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                cursor:         'pointer',
                color:          '#8A7570',
                transition:     'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#C41E3A'; (e.currentTarget as HTMLButtonElement).style.color = 'white'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.7)'; (e.currentTarget as HTMLButtonElement).style.color = '#8A7570'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(28,20,18,0.1)'; }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form scroll area */}
          <form
            onSubmit={handleSubmit(handleFormSubmit)}
            className="cf-scroll"
            style={{ overflowY: 'auto', padding: '22px 24px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}
          >

            {/* ── Photo upload ──────────────────────────────────────── */}
            <div>
              <label style={LBL}>Fotoğraf</label>
              <div
                onClick={() => fileRef.current?.click()}
                className="cf-upload"
                onMouseEnter={() => setImgHover(true)}
                onMouseLeave={() => setImgHover(false)}
                style={{
                  height:         160,
                  borderRadius:   16,
                  border:         `2px dashed ${imgHover ? 'rgba(196,30,58,0.45)' : 'rgba(28,20,18,0.12)'}`,
                  background:     imagePreview ? 'transparent' : 'rgba(255,255,255,0.6)',
                  cursor:         'pointer',
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  overflow:       'hidden',
                  transition:     'border-color 0.18s, background 0.18s',
                  position:       'relative',
                }}
              >
                {imagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width:          52,
                      height:         52,
                      borderRadius:   '50%',
                      background:     'rgba(196,30,58,0.08)',
                      border:         '1px solid rgba(196,30,58,0.15)',
                      display:        'flex',
                      alignItems:     'center',
                      justifyContent: 'center',
                      color:          '#C41E3A',
                    }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ width: 24, height: 24 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    </div>
                    <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#8A7570' }}>Fotoğraf seç</p>
                    <p style={{ fontSize: '0.65rem', color: 'rgba(138,117,112,0.6)' }}>JPG, PNG veya WEBP</p>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
            </div>

            {/* ── Name ──────────────────────────────────────────────── */}
            <div>
              <label style={LBL}>Ad</label>
              <input
                {...register('name')}
                placeholder="örn. Beyaz gömlek"
                className="cf-input"
                style={INPUT}
              />
              {errors.name && <p style={{ marginTop: 5, fontSize: '0.7rem', color: '#C41E3A' }}>{errors.name.message}</p>}
            </div>

            {/* ── Category ──────────────────────────────────────────── */}
            <div>
              <label style={LBL}>Kategori</label>
              <select
                {...register('category')}
                className="cf-select"
                style={{ ...INPUT, appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer' }}
              >
                <option value="">Seçin...</option>
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              {errors.category && <p style={{ marginTop: 5, fontSize: '0.7rem', color: '#C41E3A' }}>{errors.category.message}</p>}
            </div>

            {/* ── Divider ───────────────────────────────────────────── */}
            <div style={{ height: 1, background: 'rgba(28,20,18,0.07)', margin: '0 -4px' }} />

            {/* ── Color ─────────────────────────────────────────────── */}
            <div>
              <label style={LBL}>Ana Renk</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                {PRESET_COLORS.map(c => (
                  <Controller
                    key={c}
                    name="color"
                    control={control}
                    render={({ field }) => (
                      <button
                        type="button"
                        onClick={() => field.onChange(c)}
                        style={{
                          width:        30,
                          height:       30,
                          borderRadius: '50%',
                          backgroundColor: c,
                          border:       c === '#FFFFFF' || c === '#F5F0E8' ? '1px solid rgba(0,0,0,0.12)' : '1px solid transparent',
                          boxShadow:    field.value === c
                            ? '0 0 0 2px #FAF7F5, 0 0 0 4px #C41E3A'
                            : '0 2px 6px rgba(0,0,0,0.12)',
                          cursor:       'pointer',
                          transform:    field.value === c ? 'scale(1.15)' : 'scale(1)',
                          transition:   'transform 0.15s, box-shadow 0.15s',
                          flexShrink:   0,
                        }}
                      />
                    )}
                  />
                ))}
                {/* Custom color picker */}
                <div style={{ position: 'relative', width: 30, height: 30 }}>
                  <input
                    type="color"
                    {...register('color')}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'pointer', borderRadius: '50%', opacity: 0 }}
                  />
                  <div style={{
                    width:          30,
                    height:         30,
                    borderRadius:   '50%',
                    background:     watchColor,
                    border:         '2px dashed rgba(28,20,18,0.2)',
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    color:          '#8A7570',
                  }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ width: 12, height: 12 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </div>
                </div>
              </div>
              <input
                {...register('color_name')}
                placeholder="Renk adı (örn. Lacivert)"
                className="cf-input"
                style={INPUT}
              />
              {errors.color && <p style={{ marginTop: 5, fontSize: '0.7rem', color: '#C41E3A' }}>{errors.color.message}</p>}
            </div>

            {/* ── Brand ─────────────────────────────────────────────── */}
            <div>
              <label style={LBL}>Marka <span style={{ textTransform: 'none', fontSize: '0.6rem', letterSpacing: 0, fontWeight: 500, color: '#A09590' }}>(opsiyonel)</span></label>
              <input
                {...register('brand')}
                placeholder="örn. Zara, H&M"
                className="cf-input"
                style={INPUT}
              />
            </div>

            {/* ── Divider ───────────────────────────────────────────── */}
            <div style={{ height: 1, background: 'rgba(28,20,18,0.07)', margin: '0 -4px' }} />

            {/* ── Season ────────────────────────────────────────────── */}
            <div>
              <label style={LBL}>Sezon</label>
              <Controller
                name="season"
                control={control}
                render={({ field }) => (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {SEASONS.map(s => {
                      const selected = field.value.includes(s.value);
                      return (
                        <button
                          key={s.value}
                          type="button"
                          className={`cf-chip${selected ? ' active' : ''}`}
                          onClick={() => {
                            if (selected) field.onChange(field.value.filter((v: string) => v !== s.value));
                            else field.onChange([...field.value, s.value]);
                          }}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              />
              {errors.season && <p style={{ marginTop: 5, fontSize: '0.7rem', color: '#C41E3A' }}>{errors.season.message}</p>}
            </div>

            {/* ── Style ─────────────────────────────────────────────── */}
            <div>
              <label style={LBL}>Stil</label>
              <Controller
                name="style"
                control={control}
                render={({ field }) => (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {STYLES.map(s => {
                      const selected = field.value.includes(s.value);
                      return (
                        <button
                          key={s.value}
                          type="button"
                          className={`cf-chip${selected ? ' active' : ''}`}
                          onClick={() => {
                            if (selected) field.onChange(field.value.filter((v: string) => v !== s.value));
                            else field.onChange([...field.value, s.value]);
                          }}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              />
              {errors.style && <p style={{ marginTop: 5, fontSize: '0.7rem', color: '#C41E3A' }}>{errors.style.message}</p>}
            </div>

            {/* ── Fabric ────────────────────────────────────────────── */}
            <div>
              <label style={LBL}>Kumaş <span style={{ textTransform: 'none', fontSize: '0.6rem', letterSpacing: 0, fontWeight: 500, color: '#A09590' }}>(opsiyonel)</span></label>
              <Controller
                name="fabric"
                control={control}
                render={({ field }) => (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {FABRICS.map(f => {
                      const selected = field.value === f.value;
                      return (
                        <button
                          key={f.value}
                          type="button"
                          className={`cf-chip${selected ? ' active' : ''}`}
                          onClick={() => field.onChange(selected ? '' : f.value)}
                        >
                          {f.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              />
            </div>

            {/* ── Notes ─────────────────────────────────────────────── */}
            <div>
              <label style={LBL}>Notlar <span style={{ textTransform: 'none', fontSize: '0.6rem', letterSpacing: 0, fontWeight: 500, color: '#A09590' }}>(opsiyonel)</span></label>
              <textarea
                {...register('notes')}
                rows={2}
                placeholder="Bu kıyafet hakkında notlarınız..."
                className="cf-input"
                style={{ ...INPUT, resize: 'none', lineHeight: 1.6 }}
              />
            </div>

            {/* ── Actions ───────────────────────────────────────────── */}
            <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
              <button
                type="button"
                onClick={onCancel}
                style={{
                  flex:         1,
                  padding:      '13px 0',
                  borderRadius: 14,
                  border:       '1px solid rgba(28,20,18,0.12)',
                  background:   'rgba(255,255,255,0.7)',
                  fontSize:     '0.8rem',
                  fontWeight:   600,
                  color:        '#5A4A45',
                  cursor:       'pointer',
                  transition:   'background 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,1)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.7)'; }}
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  flex:         2,
                  padding:      '13px 0',
                  borderRadius: 14,
                  border:       'none',
                  background:   isLoading
                    ? 'rgba(196,30,58,0.5)'
                    : 'linear-gradient(135deg, #9A0025 0%, #C41E3A 60%, #E8294A 100%)',
                  fontSize:     '0.8rem',
                  fontWeight:   700,
                  color:        '#fff',
                  cursor:       isLoading ? 'not-allowed' : 'pointer',
                  boxShadow:    isLoading ? 'none' : '0 4px 20px rgba(196,30,58,0.35)',
                  letterSpacing:'0.04em',
                  transition:   'opacity 0.15s, box-shadow 0.15s',
                }}
              >
                {isLoading ? 'Kaydediliyor...' : item ? 'Güncelle' : 'Ekle'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </>
  );
}
