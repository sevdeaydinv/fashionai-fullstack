'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageContext';

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'En az 8 karakter olmalı')
      .regex(/[A-Z]/, 'Büyük harf içermeli')
      .regex(/[0-9]/, 'Rakam içermeli'),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: 'Şifreler eşleşmiyor',
    path: ['confirm_password'],
  });

type FormData = z.infer<typeof schema>;

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 12,
  padding: '12px 16px',
  color: 'white',
  fontSize: '0.9rem',
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: 'rgba(255,255,255,0.7)',
  fontSize: '0.8rem',
  fontWeight: 500,
  marginBottom: 6,
};

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const { t } = useLanguage();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError(null);

    const { error } = await supabase.auth.updateUser({ password: data.password });

    if (error) {
      setServerError(error.message);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="w-full max-w-sm">
      <h1 style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.5rem', fontWeight: 600, marginBottom: 8 }}>
        {t.resetPassword.title}
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', marginBottom: 32 }}>
        {t.resetPassword.subtitle}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div>
          <label style={labelStyle}>{t.resetPassword.newPasswordLabel}</label>
          <input
            type="password"
            placeholder={t.resetPassword.newPasswordPlaceholder}
            autoComplete="new-password"
            style={inputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(196,30,58,0.5)';
              e.target.style.boxShadow = '0 0 0 3px rgba(196,30,58,0.1)';
            }}
            {...register('password')}
          />
          {errors.password && (
            <p style={{ color: '#ff6070', fontSize: '0.75rem', marginTop: 4 }}>{errors.password.message}</p>
          )}
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', marginTop: 4 }}>{t.resetPassword.passwordHint}</p>
        </div>

        <div>
          <label style={labelStyle}>{t.resetPassword.confirmPasswordLabel}</label>
          <input
            type="password"
            placeholder={t.resetPassword.confirmPasswordPlaceholder}
            autoComplete="new-password"
            style={inputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(196,30,58,0.5)';
              e.target.style.boxShadow = '0 0 0 3px rgba(196,30,58,0.1)';
            }}
            {...register('confirm_password')}
          />
          {errors.confirm_password && (
            <p style={{ color: '#ff6070', fontSize: '0.75rem', marginTop: 4 }}>{errors.confirm_password.message}</p>
          )}
        </div>

        {serverError && (
          <div style={{
            background: 'rgba(196,30,58,0.1)',
            border: '1px solid rgba(196,30,58,0.3)',
            borderRadius: 12,
            padding: '12px 16px',
            color: '#ff6070',
            fontSize: '0.875rem',
          }}>
            {serverError}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #7a0020 0%, #C41E3A 60%, #e8294a 100%)',
            borderRadius: 12,
            boxShadow: '0 4px 20px rgba(196,30,58,0.4)',
            border: 'none',
            color: 'white',
            fontWeight: 600,
            fontSize: '0.9rem',
            padding: '13px 24px',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.7 : 1,
            marginTop: 4,
          }}
        >
          {isSubmitting ? t.resetPassword.updating : t.resetPassword.submitBtn}
        </button>
      </form>
    </div>
  );
}
