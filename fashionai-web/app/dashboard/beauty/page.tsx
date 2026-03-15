'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useBeauty } from '@/lib/hooks/useBeauty';
import { MakeupCard } from '@/components/beauty/MakeupCard';
import { HairstyleCard, GroomingCard } from '@/components/beauty/HairstyleCard';
import { BeautyService } from '@/lib/services/beauty.service';
import type { BeautyProfile } from '@/types/beauty.types';
import type { RecommendationPayload } from '@/types/beauty.types';

const FACE_SHAPES = [
  { value: 'oval',    label: 'Oval',     icon: '🥚' },
  { value: 'round',   label: 'Yuvarlak', icon: '⭕' },
  { value: 'square',  label: 'Kare',     icon: '⬛' },
  { value: 'heart',   label: 'Kalp',     icon: '🫀' },
  { value: 'diamond', label: 'Elmas',    icon: '💎' },
  { value: 'oblong',  label: 'Uzun',     icon: '📏' },
];

const SKIN_TONES = [
  { value: 'fair',      label: 'Açık',        color: '#FDDBB4' },
  { value: 'light',     label: 'Açık-Orta',   color: '#F0C490' },
  { value: 'medium',    label: 'Orta',         color: '#D4956A' },
  { value: 'tan',       label: 'Buğday',       color: '#C07A4A' },
  { value: 'dark',      label: 'Koyu',         color: '#8B5A2B' },
  { value: 'deep',      label: 'Çok Koyu',     color: '#4A2C0A' },
];

const SKIN_TYPES = [
  { value: 'normal',      label: 'Normal' },
  { value: 'dry',         label: 'Kuru' },
  { value: 'oily',        label: 'Yağlı' },
  { value: 'combination', label: 'Karma' },
];

const HAIR_TYPES = [
  { value: 'straight', label: 'Düz' },
  { value: 'wavy',     label: 'Dalgalı' },
  { value: 'curly',    label: 'Kıvırcık' },
  { value: 'coily',    label: 'Afro' },
];

const HAIR_LENGTHS = [
  { value: 'short',  label: 'Kısa' },
  { value: 'medium', label: 'Orta' },
  { value: 'long',   label: 'Uzun' },
];

export default function BeautyPage() {
  const supabase = createClient();

  const { data: userData } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: profileData } = useQuery({
    queryKey: ['profile', userData?.id],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', userData!.id).single();
      return data;
    },
    enabled: !!userData?.id,
  });

  const userId = userData?.id ?? null;
  const { profile, isLoading, updateProfile } = useBeauty(userId);

  // Form state
  const [form, setForm] = useState<Partial<Omit<BeautyProfile, 'id' | 'user_id' | 'updated_at'>>>({});
  const [saved, setSaved] = useState(false);

  // AI öneri state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<RecommendationPayload | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const currentProfile = { ...profile, ...form };

  const handleSave = async () => {
    if (!userId) return;
    await updateProfile.mutateAsync(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleGetRecommendations = async () => {
    if (!userId) return;
    setAiLoading(true);
    setAiError(null);
    setAiResult(null);

    // Yaş hesapla
    let age: number | null = null;
    if (profileData?.birth_date) {
      const birth = new Date(profileData.birth_date);
      age = new Date().getFullYear() - birth.getFullYear();
    }

    try {
      const res = await fetch('/api/beauty-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: currentProfile,
          gender: profileData?.gender,
          age,
        }),
      });

      if (res.ok) {
        const { payload } = await res.json();
        setAiResult(payload);

        // Kaydet
        await BeautyService.saveRecommendation(
          userId,
          'makeup',
          'Kişisel Güzellik Önerileri',
          payload
        );
      } else {
        setAiError('AI önerileri alınamadı. Profil bilgilerinizi doldurun.');
      }
    } catch {
      setAiError('Bağlantı hatası. Tekrar deneyin.');
    } finally {
      setAiLoading(false);
    }
  };

  const isGenderMale = profileData?.gender === 'male';

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-ink-100 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Header */}
      <div className="bg-white border-b border-ink-100 px-4 py-4 sm:px-6">
        <h1 className="text-lg font-semibold text-ink-900">Güzellik Asistanı</h1>
        <p className="text-xs text-ink-400 mt-0.5">Profiline göre kişiselleştirilmiş güzellik önerileri</p>
      </div>

      <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">

        {/* ── Profil Formu */}
        <div className="rounded-2xl bg-white border border-ink-100 p-5 space-y-5">
          <h2 className="text-sm font-semibold text-ink-900">Güzellik Profilin</h2>

          {/* Yüz Şekli */}
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-2">Yüz Şekli</label>
            <div className="grid grid-cols-3 gap-2">
              {FACE_SHAPES.map(s => (
                <button
                  key={s.value}
                  onClick={() => setForm(f => ({ ...f, face_shape: s.value as BeautyProfile['face_shape'] }))}
                  className={`flex flex-col items-center gap-1 rounded-xl border py-2.5 text-xs font-medium transition-colors ${
                    (currentProfile.face_shape ?? '') === s.value
                      ? 'border-ink-900 bg-ink-900 text-white'
                      : 'border-ink-200 text-ink-600 hover:bg-ink-50'
                  }`}
                >
                  <span className="text-lg">{s.icon}</span>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cilt Tonu */}
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-2">Cilt Tonu</label>
            <div className="flex gap-2 flex-wrap">
              {SKIN_TONES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setForm(f => ({ ...f, skin_tone: t.value }))}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    (currentProfile.skin_tone ?? '') === t.value
                      ? 'border-ink-900 bg-ink-900 text-white'
                      : 'border-ink-200 text-ink-700 hover:bg-ink-50'
                  }`}
                >
                  <span
                    className="h-3.5 w-3.5 rounded-full border border-ink-200 shrink-0"
                    style={{ backgroundColor: t.color }}
                  />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cilt Tipi */}
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-2">Cilt Tipi</label>
            <div className="flex gap-2">
              {SKIN_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setForm(f => ({ ...f, skin_type: t.value as BeautyProfile['skin_type'] }))}
                  className={`flex-1 rounded-xl border py-2 text-xs font-medium transition-colors ${
                    (currentProfile.skin_type ?? '') === t.value
                      ? 'border-ink-900 bg-ink-900 text-white'
                      : 'border-ink-200 text-ink-600 hover:bg-ink-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Saç Tipi */}
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-2">Saç Tipi</label>
            <div className="flex gap-2">
              {HAIR_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setForm(f => ({ ...f, hair_type: t.value as BeautyProfile['hair_type'] }))}
                  className={`flex-1 rounded-xl border py-2 text-xs font-medium transition-colors ${
                    (currentProfile.hair_type ?? '') === t.value
                      ? 'border-ink-900 bg-ink-900 text-white'
                      : 'border-ink-200 text-ink-600 hover:bg-ink-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Saç Uzunluğu */}
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-2">Saç Uzunluğu</label>
            <div className="flex gap-2">
              {HAIR_LENGTHS.map(l => (
                <button
                  key={l.value}
                  onClick={() => setForm(f => ({ ...f, hair_length: l.value as BeautyProfile['hair_length'] }))}
                  className={`flex-1 rounded-xl border py-2 text-xs font-medium transition-colors ${
                    (currentProfile.hair_length ?? '') === l.value
                      ? 'border-ink-900 bg-ink-900 text-white'
                      : 'border-ink-200 text-ink-600 hover:bg-ink-50'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Kaydet butonu */}
          <button
            onClick={handleSave}
            disabled={updateProfile.isPending || Object.keys(form).length === 0}
            className="w-full rounded-xl bg-ink-900 py-2.5 text-sm font-semibold text-white hover:bg-ink-800 disabled:opacity-50 transition-colors"
          >
            {saved ? '✓ Kaydedildi' : updateProfile.isPending ? 'Kaydediliyor...' : 'Profili Kaydet'}
          </button>
        </div>

        {/* ── AI Öneri Butonu */}
        <button
          onClick={handleGetRecommendations}
          disabled={aiLoading}
          className="w-full rounded-xl bg-gradient-to-r from-rose-500 to-violet-500 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 transition-opacity"
        >
          {aiLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              AI önerileri hazırlanıyor...
            </span>
          ) : '✨ AI ile Güzellik Önerileri Al'}
        </button>

        {aiError && (
          <div className="rounded-2xl bg-amber-50 border border-amber-100 px-5 py-4 text-sm text-amber-700">
            {aiError}
          </div>
        )}

        {/* ── AI Sonuçları */}
        {aiResult && (
          <div className="space-y-4">
            <p className="text-xs font-medium text-ink-500">Kişisel Önerileriniz</p>

            {aiResult.makeup && !isGenderMale && (
              <MakeupCard makeup={aiResult.makeup} />
            )}

            {aiResult.hairstyle && (
              <HairstyleCard hairstyle={aiResult.hairstyle} />
            )}

            {aiResult.grooming && isGenderMale && (
              <GroomingCard grooming={aiResult.grooming} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
