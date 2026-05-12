'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';

const schema = z.object({
  email: z.string().email('Geçerli bir e-posta girin'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalı'),
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

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) {
      setServerError(
        error.message === 'Invalid login credentials'
          ? 'E-posta veya şifre hatalı.'
          : error.message
      );
      return;
    }
    router.push('/dashboard');
    router.refresh();
  };

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

      {/* Başlık */}
      <h1 className="text-2xl font-semibold text-white mb-1">Tekrar hoşgeldiniz</h1>
      <p className="text-sm mb-7" style={{ color: 'rgba(255,255,255,0.5)' }}>
        Hesabınız yok mu?{' '}
        <Link href="/register" className="hover:opacity-80 transition-opacity" style={{ color: '#ff4466' }}>
          Ücretsiz kayıt olun.
        </Link>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* E-posta */}
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

        {/* Şifre */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm text-white/70">Şifre</label>
            <Link
              href="/forgot-password"
              className="text-xs hover:opacity-80 transition-opacity"
              style={{ color: 'rgba(255,255,255,0.40)' }}
            >
              Şifremi unuttum?
            </Link>
          </div>
          <input
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            {...register('password')}
            style={{ ...inputStyle, borderColor: errors.password ? 'rgba(196,30,58,0.6)' : 'rgba(255,255,255,0.12)' }}
            onFocus={e => {
              e.currentTarget.style.borderColor = 'rgba(196,30,58,0.5)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(196,30,58,0.1)';
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = errors.password ? 'rgba(196,30,58,0.6)' : 'rgba(255,255,255,0.12)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          {errors.password && (
            <p className="mt-1 text-xs" style={{ color: '#ff4466' }}>{errors.password.message}</p>
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
            transition: 'box-shadow 0.3s, transform 0.3s',
          }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 32px rgba(196,30,58,0.7)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(196,30,58,0.4)'; }}
        >
          {isSubmitting ? 'Giriş yapılıyor...' : 'Giriş Yap'}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>veya</span>
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
      </div>

      {/* Google OAuth placeholder */}
      <button
        disabled
        className="w-full h-12 flex items-center justify-center gap-3 rounded-xl text-sm transition-opacity disabled:opacity-40 cursor-not-allowed"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.55)',
        }}
      >
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Google ile devam et
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>(yakında)</span>
      </button>
    </div>
  );
}
