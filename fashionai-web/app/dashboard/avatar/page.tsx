'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AvatarService } from '@/lib/services/avatar.service';
import { Button } from '@/components/ui/Button';
import type { Avatar } from '@/types/profile.types';
import type { FaceShape } from '@/types/common.types';

// ─── Face Shape Data ─────────────────────────────────────────
const FACE_SHAPES: { value: FaceShape; label: string; description: string; emoji: string }[] = [
  { value: 'oval',    label: 'Oval',    emoji: '🥚', description: 'Dengeli oranlar, hafif daralan çene' },
  { value: 'round',   label: 'Yuvarlak', emoji: '⭕', description: 'Geniş elmacık kemikleri, yumuşak çene' },
  { value: 'square',  label: 'Kare',    emoji: '⬜', description: 'Belirgin çene hattı, geniş alın' },
  { value: 'heart',   label: 'Kalp',    emoji: '🫀', description: 'Geniş alın, ince ve sivri çene' },
  { value: 'diamond', label: 'Elmas',   emoji: '💎', description: 'Dar alın ve çene, geniş elmacık' },
  { value: 'oblong',  label: 'Uzun',    emoji: '🔲', description: 'Yüz genişliğinden uzun, düz yanaklar' },
];

// ─── Component ───────────────────────────────────────────────
export default function AvatarPage() {
  const supabase = createClient();

  const [avatar, setAvatar]         = useState<Avatar | null>(null);
  const [userId, setUserId]         = useState<string | null>(null);
  const [uploading, setUploading]   = useState(false);
  const [saving, setSaving]         = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg]     = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load data
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const a = await AvatarService.getAvatar(user.id);
      setAvatar(a);
    })();
  }, []);

  // ── Validate & upload file
  const processFile = useCallback(async (file: File) => {
    if (!userId) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setErrorMsg('Sadece JPG, PNG veya WebP yükleyebilirsin.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Dosya boyutu 10 MB\'dan küçük olmalı.');
      return;
    }

    setErrorMsg(null);
    setUploading(true);

    const { url, error } = await AvatarService.uploadPhoto(userId, file);
    if (error || !url) {
      setErrorMsg('Fotoğraf yüklenemedi, tekrar dene.');
      setUploading(false);
      return;
    }

    const { error: upsertErr } = await AvatarService.upsertAvatar(userId, { photo_url: url });
    if (!upsertErr) {
      setAvatar((prev) => prev
        ? { ...prev, photo_url: `${url}?t=${Date.now()}` }
        : { id: '', user_id: userId, photo_url: `${url}?t=${Date.now()}`, avatar_url: null, face_shape: null, skin_tone: null, hair_color: null, eye_color: null, generation_meta: null, created_at: '', updated_at: '' }
      );
      flash('Fotoğraf yüklendi.');
    }
    setUploading(false);
  }, [userId]);

  // ── Drag & drop handlers
  const onDragOver  = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop      = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  // ── Save face shape
  const onFaceShapeSelect = async (shape: FaceShape) => {
    if (!userId) return;
    setSaving(true);
    const { error } = await AvatarService.updateFaceShape(userId, shape);
    if (!error) {
      setAvatar((prev) => prev ? { ...prev, face_shape: shape } : prev);
      flash('Yüz şekli kaydedildi.');
    }
    setSaving(false);
  };

  const flash = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-ink-900">Avatar</h1>
        <p className="text-sm text-ink-500 mt-1">Fotoğrafını yükle ve yüz şeklini seç.</p>
      </div>

      {successMsg && (
        <div className="mb-5 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="mb-5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
          {errorMsg}
        </div>
      )}

      {/* ── Fotoğraf Yükleme ── */}
      <section className="rounded-2xl border border-ink-100 bg-white p-6 mb-5">
        <h2 className="text-base font-semibold text-ink-900 mb-5">Fotoğraf Yükle</h2>

        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {/* Preview */}
          <div className="shrink-0">
            {avatar?.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar.photo_url}
                alt="Avatar fotoğrafı"
                className="h-32 w-32 rounded-2xl object-cover border border-ink-100"
              />
            ) : (
              <div className="h-32 w-32 rounded-2xl bg-ink-50 border-2 border-dashed border-ink-200 flex flex-col items-center justify-center gap-2">
                <svg className="h-8 w-8 text-ink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                </svg>
                <span className="text-xs text-ink-300">Fotoğraf yok</span>
              </div>
            )}
          </div>

          {/* Drop zone */}
          <div className="flex-1 w-full">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={onFileChange}
            />
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={[
                'flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 cursor-pointer transition-colors',
                isDragging
                  ? 'border-brand-400 bg-brand-50'
                  : 'border-ink-200 hover:border-ink-300 hover:bg-ink-50',
              ].join(' ')}
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
                  <span className="text-sm text-ink-500">Yükleniyor...</span>
                </div>
              ) : (
                <>
                  <svg className="h-8 w-8 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <div className="text-center">
                    <p className="text-sm font-medium text-ink-700">
                      {isDragging ? 'Bırak!' : 'Sürükle & bırak veya tıkla'}
                    </p>
                    <p className="text-xs text-ink-400 mt-0.5">JPG, PNG veya WebP · Maks. 10 MB</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Yüz Şekli Seçimi ── */}
      <section className="rounded-2xl border border-ink-100 bg-white p-6">
        <h2 className="text-base font-semibold text-ink-900 mb-1">Yüz Şekli</h2>
        <p className="text-sm text-ink-500 mb-5">
          Yüz şeklini seç — sana en uygun saç ve makyaj önerileri sunalım.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {FACE_SHAPES.map((shape) => {
            const isSelected = avatar?.face_shape === shape.value;
            return (
              <button
                key={shape.value}
                type="button"
                disabled={saving}
                onClick={() => onFaceShapeSelect(shape.value)}
                className={[
                  'flex flex-col items-start gap-1.5 rounded-2xl border-2 p-4 text-left transition-all',
                  isSelected
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-ink-200 hover:border-ink-300 hover:bg-ink-50',
                ].join(' ')}
              >
                <span className="text-2xl">{shape.emoji}</span>
                <span className={`text-sm font-semibold ${isSelected ? 'text-brand-700' : 'text-ink-900'}`}>
                  {shape.label}
                </span>
                <span className="text-xs text-ink-400 leading-relaxed">
                  {shape.description}
                </span>
                {isSelected && (
                  <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand-600">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Seçili
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
