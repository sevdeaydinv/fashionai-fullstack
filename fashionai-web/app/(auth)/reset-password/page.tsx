'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

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

export default function ResetPasswordPage() {
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
      <h1 className="text-2xl font-semibold text-ink-900 mb-2">Yeni şifre belirle</h1>
      <p className="text-sm text-ink-500 mb-8">
        Güvenli ve hatırlanması kolay bir şifre seç.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <Input
          label="Yeni Şifre"
          type="password"
          placeholder="Min. 8 karakter"
          autoComplete="new-password"
          hint="Büyük harf ve rakam içermeli"
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Şifre Tekrar"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          error={errors.confirm_password?.message}
          {...register('confirm_password')}
        />

        {serverError && (
          <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
            {serverError}
          </div>
        )}

        <Button type="submit" size="lg" loading={isSubmitting} className="w-full mt-1">
          Şifremi Güncelle
        </Button>
      </form>
    </div>
  );
}
