'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useBeauty } from '@/lib/hooks/useBeauty';
import { MakeupCard } from '@/components/beauty/MakeupCard';
import { HairstyleCard, GroomingCard } from '@/components/beauty/HairstyleCard';
import { BeautyService } from '@/lib/services/beauty.service';
import type { BeautyProfile, RecommendationPayload, FaceAnalysisResult } from '@/types/beauty.types';

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

type Tab = 'profile' | 'face_analysis';

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

  // Tab state
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  // Form state
  const [form, setForm] = useState<Partial<Omit<BeautyProfile, 'id' | 'user_id' | 'updated_at'>>>({});
  const [saved, setSaved] = useState(false);

  // AI öneri state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<RecommendationPayload | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Face analysis state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [faceImage, setFaceImage] = useState<File | null>(null);
  const [facePreview, setFacePreview] = useState<string | null>(null);
  const [faceLoading, setFaceLoading] = useState(false);
  const [faceResult, setFaceResult] = useState<FaceAnalysisResult | null>(null);
  const [faceError, setFaceError] = useState<string | null>(null);

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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFaceImage(file);
    setFaceResult(null);
    setFaceError(null);
    const reader = new FileReader();
    reader.onload = () => setFacePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleFaceAnalysis = async () => {
    if (!faceImage) return;
    setFaceLoading(true);
    setFaceError(null);
    setFaceResult(null);

    try {
      const fd = new FormData();
      fd.append('image', faceImage);
      const res = await fetch('/api/face-analysis', { method: 'POST', body: fd });

      if (res.ok) {
        const { result } = await res.json();
        setFaceResult(result);
      } else {
        setFaceError('Yüz analizi yapılamadı. Lütfen net bir yüz fotoğrafı yükleyin.');
      }
    } catch {
      setFaceError('Bağlantı hatası. Tekrar deneyin.');
    } finally {
      setFaceLoading(false);
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
    <div>
      {/* Header */}
      <div className="mb-8">
        <p className="section-label mb-1">Personalization</p>
        <h1 className="editorial-heading text-4xl text-ink-900">Beauty Assistant</h1>
        <p className="text-sm text-ink-400 mt-1">AI-powered beauty recommendations for your profile</p>
      </div>

      <div className="divider-editorial mb-8" />

      {/* Tabs */}
      <div className="flex gap-0 mb-8 border-b border-ink-200 max-w-2xl">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-5 py-3 text-xs font-semibold tracking-wider uppercase border-b-2 transition-colors -mb-px ${
            activeTab === 'profile'
              ? 'border-ink-900 text-ink-900'
              : 'border-transparent text-ink-400 hover:text-ink-600'
          }`}
        >
          Beauty Profile
        </button>
        <button
          onClick={() => setActiveTab('face_analysis')}
          className={`px-5 py-3 text-xs font-semibold tracking-wider uppercase border-b-2 transition-colors -mb-px ${
            activeTab === 'face_analysis'
              ? 'border-ink-900 text-ink-900'
              : 'border-transparent text-ink-400 hover:text-ink-600'
          }`}
        >
          Yüz Analizi
        </button>
      </div>

      <div className="max-w-2xl space-y-6">

        {/* ── Face Analysis Tab */}
        {activeTab === 'face_analysis' && (
          <div className="space-y-6">
            {/* Upload Area */}
            <div className="bg-white border border-ink-100 p-6 space-y-4">
              <p className="section-label">Fotoğraf Yükle</p>
              <p className="text-xs text-ink-400">Net, ön cepheden çekilmiş bir yüz fotoğrafı yükleyin. Yapay zeka yüz şeklinizi analiz edecek.</p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleImageSelect}
              />

              {facePreview ? (
                <div className="space-y-3">
                  <div className="relative w-48 h-48 mx-auto">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={facePreview}
                      alt="Yüz fotoğrafı"
                      className="w-full h-full object-cover border border-ink-200"
                    />
                  </div>
                  <button
                    onClick={() => { setFaceImage(null); setFacePreview(null); setFaceResult(null); setFaceError(null); }}
                    className="btn-outline w-full text-xs"
                  >
                    Fotoğrafı Değiştir
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-ink-200 py-12 flex flex-col items-center gap-3 hover:border-ink-400 transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-8 w-8 text-ink-300">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 5.75 5.75 0 011.566 1.88A4.5 4.5 0 0117.25 19.5H6.75z" />
                  </svg>
                  <span className="text-xs text-ink-400 font-medium">Fotoğraf seçmek için tıklayın</span>
                  <span className="text-[0.65rem] text-ink-300">JPG, PNG veya WebP</span>
                </button>
              )}
            </div>

            {faceImage && (
              <button
                onClick={handleFaceAnalysis}
                disabled={faceLoading}
                className="btn-brand w-full disabled:opacity-60"
              >
                {faceLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                    Yüz analiz ediliyor...
                  </span>
                ) : '✨ Yüzümü Analiz Et'}
              </button>
            )}

            {faceError && (
              <div className="border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-700">
                {faceError}
              </div>
            )}

            {/* Face Analysis Results */}
            {faceResult && (
              <div className="space-y-4">
                {/* Face Shape */}
                <div className="bg-white border border-ink-100 p-6">
                  <p className="section-label mb-4">Yüz Şekli Analizi</p>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex-1">
                      <h3 className="editorial-heading text-2xl text-ink-900">{faceResult.face_shape_label}</h3>
                      <p className="text-sm text-ink-500 mt-1">{faceResult.face_shape_description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[0.65rem] text-ink-400 uppercase tracking-wider mb-1">Güven</p>
                      <p className="text-lg font-semibold text-ink-900">{Math.round(faceResult.confidence * 100)}%</p>
                    </div>
                  </div>
                </div>

                {/* Hairstyle Suggestions */}
                <div className="bg-white border border-ink-100 p-6">
                  <p className="section-label mb-4">Saç Modeli Önerileri</p>
                  <div className="space-y-3">
                    {faceResult.hairstyle_suggestions.map((style, i) => (
                      <div key={i} className="border border-ink-100 p-4">
                        <h4 className="text-sm font-semibold text-ink-900 mb-1">{style.name}</h4>
                        <p className="text-xs text-ink-500 mb-2">{style.description}</p>
                        <p className="text-[0.65rem] text-ink-400 uppercase tracking-wider">{style.suitable_for}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tips */}
                {faceResult.styling_tips.length > 0 && (
                  <div className="bg-white border border-ink-100 p-6">
                    <p className="section-label mb-4">Stil İpuçları</p>
                    <ul className="space-y-2">
                      {faceResult.styling_tips.map((tip, i) => (
                        <li key={i} className="flex gap-2 text-sm text-ink-600">
                          <span className="text-brand-500 shrink-0">✓</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {faceResult.avoid_tips.length > 0 && (
                  <div className="bg-white border border-ink-100 p-6">
                    <p className="section-label mb-4">Kaçınılması Gerekenler</p>
                    <ul className="space-y-2">
                      {faceResult.avoid_tips.map((tip, i) => (
                        <li key={i} className="flex gap-2 text-sm text-ink-600">
                          <span className="text-amber-500 shrink-0">✗</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Profile Tab */}
        {activeTab === 'profile' && <>

        {/* ── Profile Form */}
        <div className="bg-white border border-ink-100 p-6 space-y-6">
          <p className="section-label">Beauty Profile</p>

          {/* Face Shape */}
          <div>
            <label className="block text-xs text-ink-500 mb-3">Face Shape</label>
            <div className="grid grid-cols-3 gap-2">
              {FACE_SHAPES.map(s => (
                <button
                  key={s.value}
                  onClick={() => setForm(f => ({ ...f, face_shape: s.value as BeautyProfile['face_shape'] }))}
                  className={`flex flex-col items-center gap-1.5 border py-3 text-[0.65rem] font-semibold tracking-wider uppercase transition-colors ${
                    (currentProfile.face_shape ?? '') === s.value
                      ? 'border-ink-900 bg-ink-900 text-white'
                      : 'border-ink-200 text-ink-500 hover:border-ink-400'
                  }`}
                >
                  <span className="text-lg">{s.icon}</span>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Skin Tone */}
          <div>
            <label className="block text-xs text-ink-500 mb-3">Skin Tone</label>
            <div className="flex gap-2 flex-wrap">
              {SKIN_TONES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setForm(f => ({ ...f, skin_tone: t.value }))}
                  className={`flex items-center gap-2 border px-3 py-1.5 text-[0.65rem] font-semibold tracking-wider uppercase transition-colors ${
                    (currentProfile.skin_tone ?? '') === t.value
                      ? 'border-ink-900 bg-ink-900 text-white'
                      : 'border-ink-200 text-ink-600 hover:border-ink-400'
                  }`}
                >
                  <span
                    className="h-3 w-3 shrink-0"
                    style={{ backgroundColor: t.color }}
                  />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Skin Type */}
          <div>
            <label className="block text-xs text-ink-500 mb-3">Skin Type</label>
            <div className="flex gap-2">
              {SKIN_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setForm(f => ({ ...f, skin_type: t.value as BeautyProfile['skin_type'] }))}
                  className={`flex-1 border py-2 text-[0.65rem] font-semibold tracking-wider uppercase transition-colors ${
                    (currentProfile.skin_type ?? '') === t.value
                      ? 'border-ink-900 bg-ink-900 text-white'
                      : 'border-ink-200 text-ink-500 hover:border-ink-400'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Hair Type */}
          <div>
            <label className="block text-xs text-ink-500 mb-3">Hair Type</label>
            <div className="flex gap-2">
              {HAIR_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setForm(f => ({ ...f, hair_type: t.value as BeautyProfile['hair_type'] }))}
                  className={`flex-1 border py-2 text-[0.65rem] font-semibold tracking-wider uppercase transition-colors ${
                    (currentProfile.hair_type ?? '') === t.value
                      ? 'border-ink-900 bg-ink-900 text-white'
                      : 'border-ink-200 text-ink-500 hover:border-ink-400'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Hair Length */}
          <div>
            <label className="block text-xs text-ink-500 mb-3">Hair Length</label>
            <div className="flex gap-2">
              {HAIR_LENGTHS.map(l => (
                <button
                  key={l.value}
                  onClick={() => setForm(f => ({ ...f, hair_length: l.value as BeautyProfile['hair_length'] }))}
                  className={`flex-1 border py-2 text-[0.65rem] font-semibold tracking-wider uppercase transition-colors ${
                    (currentProfile.hair_length ?? '') === l.value
                      ? 'border-ink-900 bg-ink-900 text-white'
                      : 'border-ink-200 text-ink-500 hover:border-ink-400'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={updateProfile.isPending || Object.keys(form).length === 0}
            className="btn-primary w-full disabled:opacity-50"
          >
            {saved ? '✓ Saved' : updateProfile.isPending ? 'Saving...' : 'Save Profile'}
          </button>
        </div>

        {/* ── AI Recommendations */}
        <button
          onClick={handleGetRecommendations}
          disabled={aiLoading}
          className="btn-brand w-full disabled:opacity-60"
        >
          {aiLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              Generating AI recommendations...
            </span>
          ) : '✨ Get AI Beauty Recommendations'}
        </button>

        {aiError && (
          <div className="border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-700">
            {aiError}
          </div>
        )}

        {/* ── AI Results */}
        {aiResult && (
          <div className="space-y-4">
            <p className="section-label">Your Personal Recommendations</p>

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

        </>}
      </div>
    </div>
  );
}
