'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const schema = z.object({
  email: z.string().email('Geçerli bir e-posta girin'),
});

type FormData = z.infer<typeof schema>;

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

    if (error) {
      setServerError(error.message);
      return;
    }

    setSuccess(true);
  };

  if (success) {
    return (
      <div className="w-full max-w-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 mb-6">
          <svg className="h-7 w-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-ink-900 mb-3">E-postanı kontrol et</h1>
        <p className="text-sm text-ink-500 leading-relaxed">
          Şifre sıfırlama bağlantısı e-posta adresine gönderildi. Bağlantıya tıklayarak yeni şifreni belirleyebilirsin.
        </p>
        <Link href="/login" className="mt-8 inline-block text-sm font-medium text-brand-600 hover:text-brand-700">
          ← Giriş sayfasına dön
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-semibold text-ink-900 mb-2">Şifreni sıfırla</h1>
      <p className="text-sm text-ink-500 mb-8">
        E-posta adresini gir, sana sıfırlama bağlantısı gönderelim.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <Input
          label="E-posta"
          type="email"
          placeholder="sen@example.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />

        {serverError && (
          <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
            {serverError}
          </div>
        )}

        <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
          Sıfırlama Bağlantısı Gönder
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link href="/login" className="text-sm text-ink-400 hover:text-brand-600 transition-colors">
          ← Giriş sayfasına dön
        </Link>
      </div>
    </div>
  );
}
