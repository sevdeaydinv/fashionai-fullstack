'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { ProfileService } from '@/lib/services/profile.service';
import { StorageService } from '@/lib/supabase/storage';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { Profile, BodyMeasurements } from '@/types/profile.types';
import type { Style } from '@/types/common.types';

// ─── Schemas ────────────────────────────────────────────────
const profileSchema = z.object({
  full_name: z.string().min(2, 'En az 2 karakter olmalı'),
  gender: z.enum(['male', 'female', 'non_binary', 'prefer_not_to_say']).optional(),
  birth_date: z.string().optional(),
});

const measurementsSchema = z.object({
  height_cm: z.number().min(100).max(250).optional(),
  weight_kg: z.number().min(30).max(300).optional(),
  waist_cm:  z.number().min(40).max(200).optional(),
  hip_cm:    z.number().min(40).max(200).optional(),
  shoe_size: z.number().min(30).max(55).optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;
type MeasurementsForm = z.infer<typeof measurementsSchema>;

// ─── Style options ───────────────────────────────────────────
const ALL_STYLES: { value: Style; label: string }[] = [
  { value: 'casual',     label: 'Casual' },
  { value: 'sport',      label: 'Sportif' },
  { value: 'formal',     label: 'Formal' },
  { value: 'bohemian',   label: 'Bohemian' },
  { value: 'elegant',    label: 'Elegant' },
  { value: 'streetwear', label: 'Streetwear' },
];

const GENDER_MAP: Record<string, string> = {
  male:             'Erkek',
  female:           'Kadın',
  non_binary:       'Non-binary',
  prefer_not_to_say:'Belirtmek istemiyorum',
};

// ─── Styles ──────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid rgba(0,0,0,0.07)',
  borderRadius: 18,
  padding: 28,
  marginBottom: 20,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#FFFFFF',
  border: '1px solid #E2DDD7',
  borderRadius: 12,
  padding: '12px 16px',
  color: '#141210',
  fontSize: '0.9rem',
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: '#706A64',
  fontSize: '0.8rem',
  fontWeight: 500,
  marginBottom: 6,
};

// ─── Icons ───────────────────────────────────────────────────
function HeightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#C41E3A" strokeWidth="1.8" style={{ width: 22, height: 22 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M9 5l3-2 3 2M9 19l3 2 3-2" />
    </svg>
  );
}
function WeightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#C41E3A" strokeWidth="1.8" style={{ width: 22, height: 22 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18l-2 13H5L3 6z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6a3 3 0 016 0" />
    </svg>
  );
}
function WaistIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#C41E3A" strokeWidth="1.8" style={{ width: 22, height: 22 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 3c0 8 10 8 10 0M7 21c0-8 10-8 10 0M7 12h10" />
    </svg>
  );
}
function HipIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#C41E3A" strokeWidth="1.8" style={{ width: 22, height: 22 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 5c-2 3-2 6 0 9s6 5 4 10M16 5c2 3 2 6 0 9s-6 5-4 10" />
    </svg>
  );
}
function ShoeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#C41E3A" strokeWidth="1.8" style={{ width: 22, height: 22 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 18c0-2 1.5-3 3-3l10-5 5 2-1 4a2 2 0 01-2 2H4a2 2 0 01-2-2z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l-3-6" />
    </svg>
  );
}
function BmiIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#C41E3A" strokeWidth="1.8" style={{ width: 22, height: 22 }}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path strokeLinecap="round" d="M8 9h3M8 12h5M8 15h3" />
      <path strokeLinecap="round" d="M16 9v6" />
    </svg>
  );
}
function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#C41E3A" strokeWidth="1.8" style={{ width: 18, height: 18 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a2.1 2.1 0 113 3L7 19.35l-4 1 1-4L16.862 3.487z" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#C41E3A" strokeWidth="1.8" style={{ width: 18, height: 18 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
    </svg>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function ProfilePage() {
  const supabase = createClient();
  const { lang, t } = useLanguage();

  const GENDER_OPTIONS = [
    { value: 'female' as const,            label: t.profile.genderLabels.female },
    { value: 'male' as const,              label: t.profile.genderLabels.male },
    { value: 'non_binary' as const,        label: t.profile.genderLabels.non_binary },
    { value: 'prefer_not_to_say' as const, label: t.profile.genderLabels.prefer_not_to_say },
  ];

  function calcAge(birthDate: string | null): string {
    if (!birthDate) return '—';
    const diff = Date.now() - new Date(birthDate).getTime();
    return `${Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))} yaş`;
  }

  const [profile, setProfile]             = useState<Profile | null>(null);
  const [measurements, setMeasurements]   = useState<BodyMeasurements | null>(null);
  const [userId, setUserId]               = useState<string | null>(null);
  const [loading, setLoading]             = useState(true);
  const [editProfile, setEditProfile]     = useState(false);
  const [editMeasure, setEditMeasure]     = useState(false);
  const [saving, setSaving]               = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [successMsg, setSuccessMsg]       = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pForm = useForm<ProfileForm>({ resolver: zodResolver(profileSchema) });
  const mForm = useForm<MeasurementsForm>({ resolver: zodResolver(measurementsSchema) });

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const [p, m] = await Promise.all([
        ProfileService.getProfile(user.id),
        ProfileService.getBodyMeasurements(user.id),
      ]);
      setProfile(p);
      setMeasurements(m);
      if (p) {
        pForm.reset({
          full_name: p.full_name ?? '',
          gender: p.gender ?? undefined,
          birth_date: p.birth_date ?? '',
        });
      }
      if (m) {
        mForm.reset({
          height_cm: m.height_cm ?? undefined,
          weight_kg: m.weight_kg ?? undefined,
          waist_cm:  m.waist_cm  ?? undefined,
          hip_cm:    m.hip_cm    ?? undefined,
          shoe_size: m.shoe_size ?? undefined,
        });
      }
      setLoading(false);
    })();
  }, []);

  const onSaveProfile = async (data: ProfileForm) => {
    if (!userId) return;
    setSaving(true);
    const { error } = await ProfileService.updateProfile(userId, data);
    if (!error) {
      setProfile((prev) => prev ? { ...prev, ...data } : prev);
      setEditProfile(false);
      flash('Profil güncellendi.');
    }
    setSaving(false);
  };

  const onSaveMeasurements = async (data: MeasurementsForm) => {
    if (!userId) return;
    setSaving(true);
    const { error } = await ProfileService.upsertBodyMeasurements(userId, data);
    if (!error) {
      setMeasurements((prev) => prev ? { ...prev, ...data } : {
        id: '', user_id: userId, bmi: null, updated_at: '',
        height_cm: data.height_cm ?? null, weight_kg: data.weight_kg ?? null,
        waist_cm: data.waist_cm ?? null, hip_cm: data.hip_cm ?? null,
        shoe_size: data.shoe_size ?? null,
        chest_cm: null, shoulder_cm: null, inseam_cm: null,
      });
      setEditMeasure(false);
      flash('Ölçüler güncellendi.');
    }
    setSaving(false);
  };

  const onPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { flash('Geçersiz format.'); return; }
    if (file.size > 5 * 1024 * 1024) { flash('Dosya 5 MB\'dan büyük olamaz.'); return; }
    setUploadingPhoto(true);
    const { url, error } = await StorageService.upload('avatars', userId, file, 'avatar.jpg');
    if (error || !url) { flash('Yükleme başarısız.'); setUploadingPhoto(false); return; }
    const cacheBustedUrl = `${url}?t=${Date.now()}`;
    const { error: updateErr } = await ProfileService.updateProfile(userId, { avatar_url: cacheBustedUrl });
    if (!updateErr) {
      setProfile((prev) => prev ? { ...prev, avatar_url: cacheBustedUrl } : prev);
      flash('Fotoğraf güncellendi.');
    }
    setUploadingPhoto(false);
  };

  const onStyleToggle = async (styleValue: string) => {
    if (!userId) return;
    const current = profile?.style_prefs ?? [];
    const updated = (current.includes(styleValue as Style)
      ? current.filter(s => s !== styleValue)
      : [...current, styleValue as Style]) as Style[];
    const { error } = await ProfileService.updateProfile(userId, { style_prefs: updated });
    if (!error) setProfile(prev => prev ? { ...prev, style_prefs: updated } : prev);
  };

  const flash = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 rounded-full border-2 border-t-transparent" style={{ borderColor: '#C41E3A', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  const initial = profile?.full_name?.charAt(0).toUpperCase() ?? '?';

  return (
    <div style={{ width: '100%' }}>

      {/* ── Başlık ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
        <div style={{ width: 4, height: 40, background: '#C41E3A', borderRadius: 2, flexShrink: 0 }} />
        <h1 style={{ color: '#141210', fontSize: '1.8rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Profil</h1>
      </div>
      <p style={{ color: '#706A64', fontSize: '0.875rem', marginBottom: 28, paddingLeft: 18 }}>
        Kişisel bilgilerinizi güncelleyin ve stilinizi yansıtın.
      </p>

      {/* ── Success toast ── */}
      {successMsg && (
        <div style={{
          marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8,
          borderRadius: 12, background: 'rgba(0,120,60,0.08)', border: '1px solid rgba(0,120,60,0.2)',
          padding: '12px 16px', color: '#006030', fontSize: '0.875rem',
        }}>
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {successMsg}
        </div>
      )}

      {/* ── Kart 1: Fotoğraf + Kişisel Bilgiler + Stil ── */}
      <div style={card}>
        <h2 style={{ color: '#141210', fontSize: '1.05rem', fontWeight: 700, marginBottom: 22 }}>Profil Fotoğrafı</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 32 }}>

          {/* Sol: Avatar */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, minWidth: 140 }}>
            <div style={{ position: 'relative', width: 120, height: 120 }}>
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt="Profil" style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{
                  width: 120, height: 120, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #C41E3A 0%, #9a1530 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ color: '#fff', fontSize: '2.6rem', fontWeight: 700 }}>{initial}</span>
                </div>
              )}
              {uploadingPhoto && (
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ width: 24, height: 24, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} className="animate-spin" />
                </div>
              )}
            </div>

            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={onPhotoChange} />
            <button
              type="button"
              disabled={uploadingPhoto}
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: 'linear-gradient(135deg, #9a1530 0%, #C41E3A 100%)',
                color: '#fff', border: 'none', borderRadius: 12,
                padding: '9px 22px', fontWeight: 600, fontSize: '0.875rem',
                cursor: uploadingPhoto ? 'not-allowed' : 'pointer',
                opacity: uploadingPhoto ? 0.7 : 1, whiteSpace: 'nowrap',
              }}
            >
              {uploadingPhoto ? 'Yükleniyor…' : 'Fotoğraf Yükle'}
            </button>
            <p style={{ fontSize: '0.72rem', color: '#9E9690', textAlign: 'center', lineHeight: 1.5 }}>
              JPG, PNG veya WebP<br />Maks. 5 MB
            </p>
          </div>

          {/* Sağ: Kişisel Bilgiler */}
          <div style={{ borderLeft: '1px solid #F0EBE6', paddingLeft: 32 }}>
            {!editProfile ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                  <h3 style={{ color: '#141210', fontSize: '1rem', fontWeight: 700 }}>Kişisel Bilgiler</h3>
                  <button
                    onClick={() => setEditProfile(true)}
                    style={{ color: '#C41E3A', fontSize: '0.875rem', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Düzenle
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px' }}>
                  <ViewField label="Ad Soyad"      value={profile?.full_name ?? '—'} />
                  <ViewField label="Cinsiyet"       value={profile?.gender ? (GENDER_MAP[profile.gender] ?? '—') : '—'} />
                  <ViewField label="Doğum Tarihi"   value={profile?.birth_date ? new Date(profile.birth_date).toLocaleDateString('tr-TR') : '—'} />
                  <ViewField label="Yaş"            value={calcAge(profile?.birth_date ?? null)} />
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                  <h3 style={{ color: '#141210', fontSize: '1rem', fontWeight: 700 }}>Kişisel Bilgiler</h3>
                </div>
                <form onSubmit={pForm.handleSubmit(onSaveProfile)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Ad Soyad</label>
                    <input type="text" style={inputStyle} {...pForm.register('full_name')}
                      onFocus={e => { e.target.style.borderColor = 'rgba(196,30,58,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(196,30,58,0.1)'; }}
                    />
                    {pForm.formState.errors.full_name && (
                      <p style={{ color: '#C41E3A', fontSize: '0.75rem', marginTop: 4 }}>{pForm.formState.errors.full_name.message}</p>
                    )}
                  </div>
                  <div>
                    <label style={labelStyle}>Cinsiyet</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {GENDER_OPTIONS.map(opt => (
                        <label key={opt.value} style={{
                          borderRadius: 12, padding: '9px 12px', cursor: 'pointer', fontSize: '0.85rem',
                          border: pForm.watch('gender') === opt.value ? '1px solid #C41E3A' : '1px solid #E2DDD7',
                          background: pForm.watch('gender') === opt.value ? '#C41E3A' : '#F5F2EE',
                          color: pForm.watch('gender') === opt.value ? 'white' : '#706A64',
                        }}>
                          <input type="radio" value={opt.value} className="sr-only" {...pForm.register('gender')} />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Doğum Tarihi</label>
                    <input type="date" style={inputStyle} {...pForm.register('birth_date')}
                      onFocus={e => { e.target.style.borderColor = 'rgba(196,30,58,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(196,30,58,0.1)'; }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" onClick={() => setEditProfile(false)} style={{
                      flex: 1, background: '#F5F2EE', border: '1px solid #E2DDD7', borderRadius: 12,
                      color: '#141210', fontWeight: 500, fontSize: '0.875rem', padding: '9px 16px', cursor: 'pointer',
                    }}>İptal</button>
                    <button type="submit" disabled={saving} style={{
                      flex: 1, background: 'linear-gradient(135deg, #9a1530 0%, #C41E3A 100%)',
                      borderRadius: 12, border: 'none', color: 'white', fontWeight: 600,
                      fontSize: '0.875rem', padding: '9px 16px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
                    }}>{saving ? 'Kaydediliyor…' : 'Kaydet'}</button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>

        {/* Stil Tercihleri */}
        <div style={{ borderTop: '1px solid #F0EBE6', marginTop: 24, paddingTop: 22 }}>
          <h3 style={{ color: '#141210', fontSize: '0.95rem', fontWeight: 700, marginBottom: 14 }}>Stil Tercihleri</h3>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {ALL_STYLES.map(s => {
              const selected = profile?.style_prefs?.includes(s.value);
              return (
                <button key={s.value} type="button" onClick={() => onStyleToggle(s.value)} style={{
                  padding: '8px 20px', borderRadius: 50, fontSize: '0.875rem', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.15s',
                  background: selected ? 'linear-gradient(135deg, #9a1530 0%, #C41E3A 100%)' : 'transparent',
                  color: selected ? '#fff' : '#706A64',
                  border: selected ? '1.5px solid #C41E3A' : '1.5px solid #D6CFC9',
                }}>
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Kart 2: Vücut Ölçüleri ── */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h2 style={{ color: '#141210', fontSize: '1.05rem', fontWeight: 700 }}>Vücut Ölçüleri</h2>
          {!editMeasure && (
            <button onClick={() => setEditMeasure(true)} style={{
              color: '#C41E3A', fontSize: '0.875rem', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer',
            }}>Düzenle</button>
          )}
        </div>

        {!editMeasure ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            <MeasureCard icon={<HeightIcon />}  label="Boy"          value={measurements?.height_cm ? `${measurements.height_cm} cm` : '—'} />
            <MeasureCard icon={<WeightIcon />}  label="Kilo"         value={measurements?.weight_kg ? `${measurements.weight_kg} kg` : '—'} />
            <MeasureCard icon={<WaistIcon />}   label="Bel"          value={measurements?.waist_cm  ? `${measurements.waist_cm} cm`  : '—'} />
            <MeasureCard icon={<HipIcon />}     label="Kalça"        value={measurements?.hip_cm    ? `${measurements.hip_cm} cm`    : '—'} />
            <MeasureCard icon={<ShoeIcon />}    label="Ayak Numarası" value={measurements?.shoe_size ? `${measurements.shoe_size} EU` : '—'} />
            <MeasureCard icon={<BmiIcon />}     label="BMI"          value={measurements?.bmi       ? `${measurements.bmi}`          : '—'} />
          </div>
        ) : (
          <form onSubmit={mForm.handleSubmit(onSaveMeasurements)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {[
                { label: 'Boy (cm)',        field: 'height_cm' as const, placeholder: '168' },
                { label: 'Kilo (kg)',       field: 'weight_kg' as const, placeholder: '62' },
                { label: 'Bel (cm)',        field: 'waist_cm'  as const, placeholder: '70' },
                { label: 'Kalça (cm)',      field: 'hip_cm'    as const, placeholder: '95' },
                { label: 'Ayak No (EU)',    field: 'shoe_size' as const, placeholder: '38' },
              ].map(({ label, field, placeholder }) => (
                <div key={field}>
                  <label style={labelStyle}>{label}</label>
                  <input type="number" placeholder={placeholder} style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = 'rgba(196,30,58,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(196,30,58,0.1)'; }}
                    {...mForm.register(field, { valueAsNumber: true })}
                  />
                  {mForm.formState.errors[field] && (
                    <p style={{ color: '#C41E3A', fontSize: '0.72rem', marginTop: 3 }}>{mForm.formState.errors[field]?.message}</p>
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setEditMeasure(false)} style={{
                flex: 1, background: '#F5F2EE', border: '1px solid #E2DDD7', borderRadius: 12,
                color: '#141210', fontWeight: 500, fontSize: '0.875rem', padding: '10px 16px', cursor: 'pointer',
              }}>İptal</button>
              <button type="submit" disabled={saving} style={{
                flex: 1, background: 'linear-gradient(135deg, #9a1530 0%, #C41E3A 100%)',
                borderRadius: 12, border: 'none', color: 'white', fontWeight: 600,
                fontSize: '0.875rem', padding: '10px 16px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
              }}>{saving ? 'Kaydediliyor…' : 'Kaydet'}</button>
            </div>
          </form>
        )}
      </div>

      {/* ── Kart 3: Hızlı İşlemler ── */}
      <div style={card}>
        <h2 style={{ color: '#141210', fontSize: '1.05rem', fontWeight: 700, marginBottom: 20 }}>Hızlı İşlemler</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          <QuickAction icon={<PencilIcon />} label="Ölçümlerimi Güncelle"      onClick={() => { setEditMeasure(true); window.scrollTo({ top: 400, behavior: 'smooth' }); }} />
          <QuickAction icon={<PencilIcon />} label="Stil Tercihlerimi Düzenle" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
          <QuickAction icon={<UserIcon />}   label="Profil Bilgilerimi Güncelle" onClick={() => { setEditProfile(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────
function ViewField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ color: '#9E9690', fontSize: '0.75rem', marginBottom: 3 }}>{label}</p>
      <p style={{ color: '#141210', fontWeight: 600, fontSize: '0.9rem' }}>{value}</p>
    </div>
  );
}

function MeasureCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{
      background: '#FAF7F5', border: '1px solid #EDE8E3', borderRadius: 14,
      padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10, background: 'rgba(196,30,58,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <p style={{ color: '#9E9690', fontSize: '0.72rem', marginBottom: 2 }}>{label}</p>
        <p style={{ color: '#141210', fontWeight: 700, fontSize: '1rem' }}>{value}</p>
      </div>
    </div>
  );
}

function QuickAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{
      background: '#FAF7F5', border: '1px solid #EDE8E3', borderRadius: 14,
      padding: '16px', display: 'flex', alignItems: 'center', gap: 10,
      cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s',
      width: '100%',
    }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(196,30,58,0.05)')}
      onMouseLeave={e => (e.currentTarget.style.background = '#FAF7F5')}
    >
      <div style={{
        width: 34, height: 34, borderRadius: 8, background: 'rgba(196,30,58,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {icon}
      </div>
      <span style={{ color: '#2C2320', fontSize: '0.85rem', fontWeight: 500 }}>{label}</span>
    </button>
  );
}
