'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';

const schema = z
  .object({
    full_name: z.string().min(2, 'En az 2 karakter olmalı'),
    email: z.string().email('Geçerli bir e-posta girin'),
    password: z
      .string()
      .min(8, 'En az 8 karakter olmalı')
      .regex(/[A-Z]/, 'Büyük harf içermelidir')
      .regex(/[0-9]/, 'Rakam içermelidir'),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: 'Şifreler eşleşmiyor',
    path: ['confirm_password'],
  });

type FormData = z.infer<typeof schema>;

const inputStyle = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '12px',
  padding: '12px 16px',
  width: '100%',
  color: 'white',
  fontSize: '0.9rem',
  outline: 'none',
};

export default function RegisterPage() {
  const supabase = createClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.full_name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) { setServerError(error.message); return; }
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="w-full max-w-[480px] rounded-2xl p-8 text-center"
        style={{
          background: 'rgba(255,255,255,0.07)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
        }}>
        <div className="flex h-14 w-14 items-center justify-center rounded-full mx-auto mb-5"
          style={{ background: 'rgba(196,30,58,0.15)', border: '1px solid rgba(196,30,58,0.4)' }}>
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="#C41E3A" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">E-postanı kontrol et</h2>
        <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Hesabını etkinleştirmek için e-postana bir bağlantı gönderdik.
        </p>
        <Link href="/login" className="text-sm font-semibold" style={{ color: '#C41E3A' }}>← Giriş yap</Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[480px] rounded-2xl p-8 relative overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.07)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.1) inset',
      }}>

      {/* Logo */}
      <div className="flex items-center gap-3 mb-6">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: 'linear-gradient(135deg, #8b0000, #C41E3A)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L8 8H4L6 14H4L8 20H16L20 14H18L20 8H16L12 2Z" fill="white" fillOpacity="0.95" />
          </svg>
        </span>
        <span className="text-base font-bold text-white tracking-wide">FashionAI</span>
      </div>

      {/* Başlık */}
      <h1 className="text-2xl font-semibold text-white mb-1">Hesabınızı oluşturun</h1>
      <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
        Zaten bir hesabınız var mı?{' '}
        <Link href="/login" className="hover:opacity-80 transition-opacity" style={{ color: '#ff4466' }}>
          Giriş yapın.
        </Link>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Ad Soyad */}
        <div>
          <label className="block text-sm mb-1.5 text-white/70">Ad Soyad</label>
          <input type="text" placeholder="Sofia Martinez" autoComplete="name"
            {...register('full_name')}
            style={{ ...inputStyle, borderColor: errors.full_name ? 'rgba(196,30,58,0.6)' : 'rgba(255,255,255,0.12)' }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(196,30,58,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(196,30,58,0.1)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = errors.full_name ? 'rgba(196,30,58,0.6)' : 'rgba(255,255,255,0.12)'; e.currentTarget.style.boxShadow = 'none'; }}
          />
          {errors.full_name && <p className="mt-1 text-xs" style={{ color: '#ff4466' }}>{errors.full_name.message}</p>}
        </div>

        {/* E-posta */}
        <div>
          <label className="block text-sm mb-1.5 text-white/70">E-posta</label>
          <input type="email" placeholder="you@example.com" autoComplete="email"
            {...register('email')}
            style={{ ...inputStyle, borderColor: errors.email ? 'rgba(196,30,58,0.6)' : 'rgba(255,255,255,0.12)' }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(196,30,58,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(196,30,58,0.1)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = errors.email ? 'rgba(196,30,58,0.6)' : 'rgba(255,255,255,0.12)'; e.currentTarget.style.boxShadow = 'none'; }}
          />
          {errors.email && <p className="mt-1 text-xs" style={{ color: '#ff4466' }}>{errors.email.message}</p>}
        </div>

        {/* Şifre */}
        <div>
          <label className="block text-sm mb-1.5 text-white/70">Şifre</label>
          <input type="password" placeholder="En az 8 karakter" autoComplete="new-password"
            {...register('password')}
            style={{ ...inputStyle, borderColor: errors.password ? 'rgba(196,30,58,0.6)' : 'rgba(255,255,255,0.12)' }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(196,30,58,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(196,30,58,0.1)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = errors.password ? 'rgba(196,30,58,0.6)' : 'rgba(255,255,255,0.12)'; e.currentTarget.style.boxShadow = 'none'; }}
          />
          {errors.password
            ? <p className="mt-1 text-xs" style={{ color: '#ff4466' }}>{errors.password.message}</p>
            : <p className="mt-1 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Büyük harf ve rakam içermelidir</p>}
        </div>

        {/* Şifre Onay */}
        <div>
          <label className="block text-sm mb-1.5 text-white/70">Şifreyi Onayla</label>
          <input type="password" placeholder="••••••••" autoComplete="new-password"
            {...register('confirm_password')}
            style={{ ...inputStyle, borderColor: errors.confirm_password ? 'rgba(196,30,58,0.6)' : 'rgba(255,255,255,0.12)' }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(196,30,58,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(196,30,58,0.1)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = errors.confirm_password ? 'rgba(196,30,58,0.6)' : 'rgba(255,255,255,0.12)'; e.currentTarget.style.boxShadow = 'none'; }}
          />
          {errors.confirm_password && <p className="mt-1 text-xs" style={{ color: '#ff4466' }}>{errors.confirm_password.message}</p>}
        </div>

        {serverError && (
          <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(196,30,58,0.1)', border: '1px solid rgba(196,30,58,0.3)', color: '#ff6070' }}>
            {serverError}
          </div>
        )}

        <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Hesap oluşturarak{' '}
          <Link href="#" className="underline hover:opacity-70">Hizmet Şartlarımızı</Link>{' '}
          ve{' '}
          <Link href="#" className="underline hover:opacity-70">Gizlilik Politikamızı</Link>{' '}
          kabul etmiş olursunuz.
        </p>

        <button type="submit" disabled={isSubmitting}
          className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all disabled:opacity-50 mt-1"
          style={{
            background: 'linear-gradient(135deg, #7a0020 0%, #C41E3A 60%, #e8294a 100%)',
            boxShadow: '0 4px 20px rgba(196,30,58,0.4)',
          }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 32px rgba(196,30,58,0.7)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(196,30,58,0.4)'; }}
        >
          {isSubmitting ? 'Oluşturuluyor...' : 'Hesap oluşturmak'}
        </button>
      </form>
    </div>
  );
}
