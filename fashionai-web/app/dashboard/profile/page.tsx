'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ProfileService } from '@/lib/services/profile.service';
import { StorageService } from '@/lib/supabase/storage';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { Profile, BodyMeasurements } from '@/types/profile.types';

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

// ─── Helpers ────────────────────────────────────────────────
const STYLE_LABELS: Record<string, string> = {
  casual: 'Casual', formal: 'Formal', sport: 'Sportif',
  streetwear: 'Streetwear', elegant: 'Elegant', bohemian: 'Bohemian',
};

const GENDER_LABELS: Record<string, string> = {
  male: 'Erkek', female: 'Kadın',
  non_binary: 'Non-binary', prefer_not_to_say: 'Belirtmek istemiyorum',
};

const GENDER_OPTIONS = [
  { value: 'female', label: 'Kadın' },
  { value: 'male', label: 'Erkek' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'prefer_not_to_say', label: 'Belirtmek istemiyorum' },
] as const;

function calcAge(birthDate: string | null): string {
  if (!birthDate) return '—';
  const diff = Date.now() - new Date(birthDate).getTime();
  return `${Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))} yaş`;
}

// ─── Main Component ─────────────────────────────────────────
export default function ProfilePage() {
  const supabase = createClient();

  const [profile, setProfile]       = useState<Profile | null>(null);
  const [measurements, setMeasurements] = useState<BodyMeasurements | null>(null);
  const [userId, setUserId]         = useState<string | null>(null);
  const [loading, setLoading]       = useState(true);
  const [editProfile, setEditProfile]   = useState(false);
  const [editMeasure, setEditMeasure]   = useState(false);
  const [saving, setSaving]         = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile form
  const pForm = useForm<ProfileForm>({ resolver: zodResolver(profileSchema) });

  // Measurements form
  const mForm = useForm<MeasurementsForm>({ resolver: zodResolver(measurementsSchema) });

  // ── Load data
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

  // ── Save profile
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

  // ── Save measurements
  const onSaveMeasurements = async (data: MeasurementsForm) => {
    if (!userId) return;
    setSaving(true);
    const { error } = await ProfileService.upsertBodyMeasurements(userId, data);
    if (!error) {
      setMeasurements((prev) => prev ? { ...prev, ...data } : {
        id: '', user_id: userId, bmi: null, updated_at: '',
        height_cm: data.height_cm ?? null,
        weight_kg: data.weight_kg ?? null,
        waist_cm:  data.waist_cm  ?? null,
        hip_cm:    data.hip_cm    ?? null,
        shoe_size: data.shoe_size ?? null,
        chest_cm: null, shoulder_cm: null, inseam_cm: null,
      });
      setEditMeasure(false);
      flash('Ölçüler güncellendi.');
    }
    setSaving(false);
  };

  // ── Upload avatar photo
  const onPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      flash('Sadece JPG, PNG veya WebP yükleyebilirsin.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      flash('Dosya boyutu 5 MB\'dan küçük olmalı.');
      return;
    }

    setUploadingPhoto(true);
    const { url, error } = await StorageService.upload('avatars', userId, file, 'avatar.jpg');

    if (error || !url) {
      flash('Fotoğraf yüklenemedi, tekrar dene.');
      setUploadingPhoto(false);
      return;
    }

    const { error: updateErr } = await ProfileService.updateProfile(userId, { avatar_url: url });
    if (!updateErr) {
      setProfile((prev) => prev ? { ...prev, avatar_url: `${url}?t=${Date.now()}` } : prev);
      flash('Profil fotoğrafı güncellendi.');
    }
    setUploadingPhoto(false);
  };

  const flash = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-ink-900">Profilim</h1>
        <p className="text-sm text-ink-500 mt-1">Kişisel bilgilerini ve ölçülerini yönet.</p>
      </div>

      {successMsg && (
        <div className="mb-6 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {successMsg}
        </div>
      )}

      {/* ── Profil Fotoğrafı ── */}
      <section className="rounded-2xl border border-ink-100 bg-white p-6 mb-5">
        <h2 className="text-base font-semibold text-ink-900 mb-5">Profil Fotoğrafı</h2>
        <div className="flex items-center gap-5">
          {/* Avatar preview */}
          <div className="relative h-20 w-20 shrink-0">
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt="Profil fotoğrafı"
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-brand-100 flex items-center justify-center text-2xl font-semibold text-brand-600">
                {profile?.full_name?.charAt(0).toUpperCase() ?? '?'}
              </div>
            )}
            {uploadingPhoto && (
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={onPhotoChange}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              loading={uploadingPhoto}
              onClick={() => fileInputRef.current?.click()}
            >
              Fotoğraf Yükle
            </Button>
            <p className="text-xs text-ink-400">JPG, PNG veya WebP · Maks. 5 MB</p>
          </div>
        </div>
      </section>

      {/* ── Kişisel Bilgiler ── */}
      <section className="rounded-2xl border border-ink-100 bg-white p-6 mb-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-ink-900">Kişisel Bilgiler</h2>
          {!editProfile && (
            <button
              onClick={() => setEditProfile(true)}
              className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
            >
              Düzenle
            </button>
          )}
        </div>

        {!editProfile ? (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <InfoRow label="Ad Soyad"     value={profile?.full_name ?? '—'} />
            <InfoRow label="Cinsiyet"     value={profile?.gender ? GENDER_LABELS[profile.gender] : '—'} />
            <InfoRow label="Doğum Tarihi" value={profile?.birth_date ? new Date(profile.birth_date).toLocaleDateString('tr-TR') : '—'} />
            <InfoRow label="Yaş"          value={calcAge(profile?.birth_date ?? null)} />
            <div className="col-span-2">
              <dt className="text-ink-500 mb-1.5">Stil Tercihleri</dt>
              <dd className="flex flex-wrap gap-2">
                {profile?.style_prefs?.length
                  ? profile.style_prefs.map((s) => (
                      <span key={s} className="rounded-lg bg-brand-50 border border-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                        {STYLE_LABELS[s] ?? s}
                      </span>
                    ))
                  : <span className="text-ink-400">—</span>
                }
              </dd>
            </div>
          </dl>
        ) : (
          <form onSubmit={pForm.handleSubmit(onSaveProfile)} className="flex flex-col gap-4">
            <Input
              label="Ad Soyad"
              type="text"
              error={pForm.formState.errors.full_name?.message}
              {...pForm.register('full_name')}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink-700">Cinsiyet</label>
              <div className="grid grid-cols-2 gap-2">
                {GENDER_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={[
                      'flex items-center gap-2 rounded-xl border px-3 py-2.5 cursor-pointer text-sm transition-colors',
                      pForm.watch('gender') === opt.value
                        ? 'border-brand-500 bg-brand-50 text-brand-700 font-medium'
                        : 'border-ink-200 text-ink-600 hover:border-ink-300',
                    ].join(' ')}
                  >
                    <input type="radio" value={opt.value} className="sr-only" {...pForm.register('gender')} />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            <Input
              label="Doğum Tarihi"
              type="date"
              error={pForm.formState.errors.birth_date?.message}
              {...pForm.register('birth_date')}
            />

            <div className="flex gap-3 mt-1">
              <Button type="button" variant="ghost" size="md" className="flex-1" onClick={() => setEditProfile(false)}>
                İptal
              </Button>
              <Button type="submit" size="md" className="flex-1" loading={saving}>
                Kaydet
              </Button>
            </div>
          </form>
        )}
      </section>

      {/* ── Vücut Ölçüleri ── */}
      <section className="rounded-2xl border border-ink-100 bg-white p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-ink-900">Vücut Ölçüleri</h2>
          {!editMeasure && (
            <button
              onClick={() => setEditMeasure(true)}
              className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
            >
              Düzenle
            </button>
          )}
        </div>

        {!editMeasure ? (
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 text-sm">
            <InfoRow label="Boy"            value={measurements?.height_cm ? `${measurements.height_cm} cm` : '—'} />
            <InfoRow label="Kilo"           value={measurements?.weight_kg ? `${measurements.weight_kg} kg` : '—'} />
            <InfoRow label="Bel"            value={measurements?.waist_cm  ? `${measurements.waist_cm} cm`  : '—'} />
            <InfoRow label="Kalça"          value={measurements?.hip_cm    ? `${measurements.hip_cm} cm`    : '—'} />
            <InfoRow label="Ayak Numarası"  value={measurements?.shoe_size ? `${measurements.shoe_size} EU` : '—'} />
            <InfoRow label="BMI"            value={measurements?.bmi       ? `${measurements.bmi}`          : '—'} />
          </dl>
        ) : (
          <form onSubmit={mForm.handleSubmit(onSaveMeasurements)} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Boy (cm)"          type="number" placeholder="168" {...mForm.register('height_cm', { valueAsNumber: true })} error={mForm.formState.errors.height_cm?.message} />
              <Input label="Kilo (kg)"         type="number" placeholder="62"  {...mForm.register('weight_kg', { valueAsNumber: true })} error={mForm.formState.errors.weight_kg?.message} />
              <Input label="Bel (cm)"          type="number" placeholder="70"  {...mForm.register('waist_cm',  { valueAsNumber: true })} error={mForm.formState.errors.waist_cm?.message}  />
              <Input label="Kalça (cm)"        type="number" placeholder="95"  {...mForm.register('hip_cm',    { valueAsNumber: true })} error={mForm.formState.errors.hip_cm?.message}    />
              <Input label="Ayak Numarası (EU)" type="number" placeholder="38" {...mForm.register('shoe_size', { valueAsNumber: true })} error={mForm.formState.errors.shoe_size?.message}  />
            </div>
            <div className="flex gap-3 mt-1">
              <Button type="button" variant="ghost" size="md" className="flex-1" onClick={() => setEditMeasure(false)}>
                İptal
              </Button>
              <Button type="submit" size="md" className="flex-1" loading={saving}>
                Kaydet
              </Button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

// ─── InfoRow ────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-ink-500">{label}</dt>
      <dd className="font-medium text-ink-900 mt-0.5">{value}</dd>
    </div>
  );
}
