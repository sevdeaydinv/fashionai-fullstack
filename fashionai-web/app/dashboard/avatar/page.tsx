'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AvatarService } from '@/lib/services/avatar.service';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { Avatar } from '@/types/profile.types';
import type { FaceShape } from '@/types/common.types';

const cardStyle: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E2DDD7',
  borderRadius: 16,
  padding: 24,
};

// ─── Component ───────────────────────────────────────────────
export default function AvatarPage() {
  const supabase = createClient();
  const { lang, t } = useLanguage();

  const FACE_SHAPE_LABELS: Record<FaceShape, string> = {
    oval:    'Oval',
    round:   lang === 'tr' ? 'Yuvarlak' : 'Round',
    square:  lang === 'tr' ? 'Kare' : 'Square',
    heart:   lang === 'tr' ? 'Kalp' : 'Heart',
    diamond: lang === 'tr' ? 'Elmas' : 'Diamond',
    oblong:  lang === 'tr' ? 'Uzun' : 'Oblong',
  };

  const FACE_SHAPES: { value: FaceShape; label: string; description: string }[] = [
    { value: 'oval',    label: FACE_SHAPE_LABELS.oval,    description: t.avatar.faceShapeDescriptions.oval },
    { value: 'round',   label: FACE_SHAPE_LABELS.round,   description: t.avatar.faceShapeDescriptions.round },
    { value: 'square',  label: FACE_SHAPE_LABELS.square,  description: t.avatar.faceShapeDescriptions.square },
    { value: 'heart',   label: FACE_SHAPE_LABELS.heart,   description: t.avatar.faceShapeDescriptions.heart },
    { value: 'diamond', label: FACE_SHAPE_LABELS.diamond, description: t.avatar.faceShapeDescriptions.diamond },
    { value: 'oblong',  label: FACE_SHAPE_LABELS.oblong,  description: t.avatar.faceShapeDescriptions.oblong },
  ];

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
      setErrorMsg(t.avatar.errorInvalidFormat);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg(t.avatar.errorTooLarge);
      return;
    }

    setErrorMsg(null);
    setUploading(true);

    const { url, error } = await AvatarService.uploadPhoto(userId, file);
    if (error || !url) {
      setErrorMsg(t.avatar.errorUploadFailed);
      setUploading(false);
      return;
    }

    const { error: upsertErr } = await AvatarService.upsertAvatar(userId, { photo_url: url });
    if (!upsertErr) {
      setAvatar((prev) => prev
        ? { ...prev, photo_url: `${url}?t=${Date.now()}` }
        : { id: '', user_id: userId, photo_url: `${url}?t=${Date.now()}`, avatar_url: null, face_shape: null, skin_tone: null, hair_color: null, eye_color: null, generation_meta: null, created_at: '', updated_at: '' }
      );
      flash(t.avatar.photoUploaded);
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
      flash(t.avatar.faceShapeSaved);
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
        <h1 style={{ color: '#141210', fontSize: '1.5rem', fontWeight: 600 }}>{t.avatar.title}</h1>
        <p style={{ color: '#706A64', fontSize: '0.875rem', marginTop: 4 }}>{t.avatar.subtitle}</p>
      </div>

      {successMsg && (
        <div className="mb-5 flex items-center gap-2" style={{
          borderRadius: 12,
          background: 'rgba(34,197,94,0.1)',
          border: '1px solid rgba(34,197,94,0.2)',
          padding: '12px 16px',
          color: '#4ade80',
          fontSize: '0.875rem',
        }}>
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="mb-5" style={{
          borderRadius: 12,
          background: 'rgba(196,30,58,0.1)',
          border: '1px solid rgba(196,30,58,0.3)',
          padding: '12px 16px',
          color: '#C41E3A',
          fontSize: '0.875rem',
        }}>
          {errorMsg}
        </div>
      )}

      {/* ── Fotoğraf Yükleme ── */}
      <section style={{ ...cardStyle, marginBottom: 20 }}>
        <h2 style={{ color: '#141210', fontSize: '1rem', fontWeight: 600, marginBottom: 20 }}>{t.avatar.photoUploadTitle}</h2>

        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {/* Preview */}
          <div className="shrink-0">
            {avatar?.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar.photo_url}
                alt="Avatar fotoğrafı"
                className="h-32 w-32 object-cover"
                style={{ borderRadius: 16, border: '1px solid #E2DDD7' }}
              />
            ) : (
              <div
                className="h-32 w-32 flex flex-col items-center justify-center gap-2"
                style={{
                  borderRadius: 16,
                  background: '#F5F2EE',
                  border: '2px dashed rgba(0,0,0,0.1)',
                }}
              >
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: '#9E9690' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                </svg>
                <span style={{ color: '#9E9690', fontSize: '0.7rem' }}>{t.avatar.noPhoto}</span>
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
              className="flex flex-col items-center justify-center gap-3 p-8 cursor-pointer transition-all"
              style={{
                borderRadius: 16,
                border: `2px dashed ${isDragging ? 'rgba(196,30,58,0.6)' : 'rgba(0,0,0,0.1)'}`,
                background: isDragging ? 'rgba(196,30,58,0.07)' : '#F5F2EE',
              }}
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: '#C41E3A', borderTopColor: 'transparent' }} />
                  <span style={{ color: '#706A64', fontSize: '0.875rem' }}>{t.avatar.uploading}</span>
                </div>
              ) : (
                <>
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: '#9E9690' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <div className="text-center">
                    <p style={{ color: '#706A64', fontSize: '0.875rem', fontWeight: 500 }}>
                      {isDragging ? t.avatar.drop : t.avatar.dragDropOrClick}
                    </p>
                    <p style={{ color: '#9E9690', fontSize: '0.75rem', marginTop: 2 }}>{t.avatar.maxSizeLabel}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Yüz Şekli Seçimi ── */}
      <section style={cardStyle}>
        <h2 style={{ color: '#141210', fontSize: '1rem', fontWeight: 600, marginBottom: 4 }}>{t.avatar.faceShapeTitle}</h2>
        <p style={{ color: '#706A64', fontSize: '0.875rem', marginBottom: 20 }}>
          {t.avatar.faceShapeDesc}
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
                className="flex flex-col items-start gap-1.5 p-4 text-left transition-all"
                style={{
                  borderRadius: 16,
                  border: isSelected ? '1px solid rgba(196,30,58,0.3)' : '1px solid #E2DDD7',
                  background: isSelected ? 'rgba(196,30,58,0.12)' : '#F5F2EE',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                <span style={{ color: '#141210', fontSize: '0.875rem', fontWeight: 600 }}>
                  {shape.label}
                </span>
                <span style={{ color: '#706A64', fontSize: '0.75rem', lineHeight: 1.5 }}>
                  {shape.description}
                </span>
                {isSelected && (
                  <span className="mt-1 inline-flex items-center gap-1" style={{ color: '#C41E3A', fontSize: '0.75rem', fontWeight: 500 }}>
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {t.avatar.selected}
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
