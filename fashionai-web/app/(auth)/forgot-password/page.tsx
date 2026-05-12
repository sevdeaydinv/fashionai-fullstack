'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';

const schema = z.object({
  email: z.string().email('Geçerli bir e-posta girin'),
});

type FormData = z.infer<typeof schema>;

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '12px',
  padding: '12px 16px',
  width: '100%',
  color: 'white',
  fontSize: '0.9rem',
  outline: 'none',
};

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    if (error) { setServerError(error.message); return; }
    setSuccess(true);
  };

  if (success) {
    return (
      <div
        className="w-full max-w-[440px] rounded-2xl p-8 text-center"
        style={{
          background: 'rgba(255,255,255,0.07)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
        }}
      >
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full mx-auto mb-5"
          style={{ background: 'rgba(196,30,58,0.15)', border: '1px solid rgba(196,30,58,0.4)' }}
        >
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="#C41E3A" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">E-postanı kontrol et</h2>
        <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Şifre sıfırlama bağlantısı e-posta adresine gönderildi.
        </p>
        <Link href="/login" className="text-sm font-semibold hover:opacity-80 transition-opacity" style={{ color: '#C41E3A' }}>
          ← Giriş sayfasına dön
        </Link>
      </div>
    );
  }

  return (
    <div
      className="w-full max-w-[440px] rounded-2xl p-8 relative overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.07)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.1) inset',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 mb-7">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: 'linear-gradient(135deg, #8b0000, #C41E3A)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L8 8H4L6 14H4L8 20H16L20 14H18L20 8H16L12 2Z" fill="white" fillOpacity="0.95" />
          </svg>
        </span>
        <span className="text-base font-bold text-white tracking-wide">FashionAI</span>
      </div>

      <h1 className="text-2xl font-semibold text-white mb-1">Şifreni sıfırla</h1>
      <p className="text-sm mb-7" style={{ color: 'rgba(255,255,255,0.5)' }}>
        E-posta adresini gir, sana sıfırlama bağlantısı gönderelim.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm mb-1.5 text-white/70">E-posta</label>
          <input
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            {...register('email')}
            style={{ ...inputStyle, borderColor: errors.email ? 'rgba(196,30,58,0.6)' : 'rgba(255,255,255,0.12)' }}
            onFocus={e => {
              e.currentTarget.style.borderColor = 'rgba(196,30,58,0.5)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(196,30,58,0.1)';
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = errors.email ? 'rgba(196,30,58,0.6)' : 'rgba(255,255,255,0.12)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          {errors.email && (
            <p className="mt-1 text-xs" style={{ color: '#ff4466' }}>{errors.email.message}</p>
          )}
        </div>

        {serverError && (
          <div
            className="rounded-xl px-4 py-3 text-sm"
            style={{ background: 'rgba(196,30,58,0.1)', border: '1px solid rgba(196,30,58,0.3)', color: '#ff6070' }}
          >
            {serverError}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all disabled:opacity-50 mt-1"
          style={{
            background: 'linear-gradient(135deg, #7a0020 0%, #C41E3A 60%, #e8294a 100%)',
            boxShadow: '0 4px 20px rgba(196,30,58,0.4)',
          }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 32px rgba(196,30,58,0.7)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(196,30,58,0.4)'; }}
        >
          {isSubmitting ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="text-sm hover:opacity-80 transition-opacity"
          style={{ color: 'rgba(255,255,255,0.40)' }}
        >
          ← Giriş sayfasına dön
        </Link>
      </div>
    </div>
  );
}
