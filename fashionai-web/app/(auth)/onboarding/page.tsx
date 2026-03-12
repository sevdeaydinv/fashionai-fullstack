'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

// ─── Schemas ────────────────────────────────────────────────
const step1Schema = z.object({
  full_name: z.string().min(2, 'En az 2 karakter olmalı'),
  gender: z.enum(['male', 'female', 'non_binary', 'prefer_not_to_say'], {
    message: 'Lütfen bir seçenek seçin',
  }),
  birth_date: z.string().min(1, 'Doğum tarihi gerekli'),
});

const step2Schema = z.object({
  height_cm: z.number().min(100).max(250).optional(),
  weight_kg: z.number().min(30).max(300).optional(),
  waist_cm:  z.number().min(40).max(200).optional(),
  hip_cm:    z.number().min(40).max(200).optional(),
  shoe_size: z.number().min(30).max(55).optional(),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

const STYLE_OPTIONS = [
  { value: 'casual',      label: 'Casual',      emoji: '👕' },
  { value: 'formal',      label: 'Formal',      emoji: '👔' },
  { value: 'sport',       label: 'Sportif',     emoji: '🏃' },
  { value: 'streetwear',  label: 'Streetwear',  emoji: '🧢' },
  { value: 'elegant',     label: 'Elegant',     emoji: '✨' },
  { value: 'bohemian',    label: 'Bohemian',    emoji: '🌸' },
] as const;

type StyleValue = typeof STYLE_OPTIONS[number]['value'];

const GENDER_OPTIONS = [
  { value: 'female',           label: 'Kadın' },
  { value: 'male',             label: 'Erkek' },
  { value: 'non_binary',       label: 'Non-binary' },
  { value: 'prefer_not_to_say', label: 'Belirtmek istemiyorum' },
] as const;

// ─── Component ──────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Data | null>(null);
  const [selectedStyles, setSelectedStyles] = useState<StyleValue[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 form
  const form1 = useForm<Step1Data>({ resolver: zodResolver(step1Schema) });

  // Step 2 form
  const form2 = useForm<Step2Data>({ resolver: zodResolver(step2Schema) });

  // ── Step 1 submit
  const onStep1Submit = (data: Step1Data) => {
    setStep1Data(data);
    setStep(2);
  };

  // ── Step 2 submit
  const onStep2Submit = (data: Step2Data) => {
    setStep2Data(data);
    setStep(3);
  };

  // ── Toggle style selection
  const toggleStyle = (value: StyleValue) => {
    setSelectedStyles((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    );
  };

  // ── Final submit
  const onFinish = async () => {
    if (selectedStyles.length === 0) {
      setError('Lütfen en az bir stil seçin.');
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Oturum bulunamadı');

      // Upsert profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: step1Data!.full_name,
          gender: step1Data!.gender,
          birth_date: step1Data!.birth_date,
          style_prefs: selectedStyles,
          onboarded: true,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Upsert body measurements (only if any value was entered)
      const hasMeasurements = Object.values(step2Data ?? {}).some((v) => v != null);
      if (hasMeasurements) {
        const { error: measError } = await supabase
          .from('body_measurements')
          .upsert({
            user_id: user.id,
            height_cm: step2Data?.height_cm ?? null,
            weight_kg: step2Data?.weight_kg ?? null,
            waist_cm:  step2Data?.waist_cm  ?? null,
            hip_cm:    step2Data?.hip_cm    ?? null,
            shoe_size: step2Data?.shoe_size ?? null,
          }, { onConflict: 'user_id' });

        if (measError) throw measError;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Bir hata oluştu, tekrar dene.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Progress bar ─────────────────────────────────────────
  const steps = ['Kişisel Bilgiler', 'Ölçüler', 'Stil Tercihleri'];

  return (
    <div className="w-full max-w-lg">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-ink-900 mb-1">Hesabını Kişiselleştir</h1>
        <p className="text-sm text-ink-500">Sana en iyi önerileri sunabilmemiz için birkaç bilgiye ihtiyacımız var.</p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((label, i) => {
          const idx = i + 1;
          const isDone = step > idx;
          const isActive = step === idx;
          return (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={[
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                    isDone
                      ? 'bg-emerald-500 text-white'
                      : isActive
                      ? 'bg-brand-600 text-white'
                      : 'border-2 border-ink-200 text-ink-400',
                  ].join(' ')}
                >
                  {isDone ? (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    idx
                  )}
                </span>
                <span className={`text-xs font-medium hidden sm:block ${isActive ? 'text-ink-900' : 'text-ink-400'}`}>
                  {label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-px mx-2 ${isDone ? 'bg-emerald-300' : 'bg-ink-200'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── STEP 1: Kişisel Bilgiler ── */}
      {step === 1 && (
        <form onSubmit={form1.handleSubmit(onStep1Submit)} className="flex flex-col gap-5">
          <Input
            label="Ad Soyad"
            type="text"
            placeholder="Ada Yıldız"
            error={form1.formState.errors.full_name?.message}
            {...form1.register('full_name')}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink-700">Cinsiyet</label>
            <div className="grid grid-cols-2 gap-2">
              {GENDER_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={[
                    'flex items-center gap-2.5 rounded-xl border px-4 py-3 cursor-pointer text-sm transition-colors',
                    form1.watch('gender') === opt.value
                      ? 'border-brand-500 bg-brand-50 text-brand-700 font-medium'
                      : 'border-ink-200 text-ink-600 hover:border-ink-300',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    value={opt.value}
                    className="sr-only"
                    {...form1.register('gender')}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
            {form1.formState.errors.gender && (
              <p className="text-xs text-red-500">{form1.formState.errors.gender.message}</p>
            )}
          </div>

          <Input
            label="Doğum Tarihi"
            type="date"
            error={form1.formState.errors.birth_date?.message}
            {...form1.register('birth_date')}
          />

          <Button type="submit" size="lg" className="w-full mt-2">
            Devam Et →
          </Button>
        </form>
      )}

      {/* ── STEP 2: Vücut Ölçüleri ── */}
      {step === 2 && (
        <form onSubmit={form2.handleSubmit(onStep2Submit)} className="flex flex-col gap-5">
          <p className="text-sm text-ink-500 -mt-2">
            Ölçüler tamamen opsiyoneldir, dilersen atlayabilirsin.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Boy (cm)"
              type="number"
              placeholder="168"
              error={form2.formState.errors.height_cm?.message}
              {...form2.register('height_cm', { valueAsNumber: true })}
            />
            <Input
              label="Kilo (kg)"
              type="number"
              placeholder="62"
              error={form2.formState.errors.weight_kg?.message}
              {...form2.register('weight_kg', { valueAsNumber: true })}
            />
            <Input
              label="Bel (cm)"
              type="number"
              placeholder="70"
              error={form2.formState.errors.waist_cm?.message}
              {...form2.register('waist_cm', { valueAsNumber: true })}
            />
            <Input
              label="Kalça (cm)"
              type="number"
              placeholder="95"
              error={form2.formState.errors.hip_cm?.message}
              {...form2.register('hip_cm', { valueAsNumber: true })}
            />
            <Input
              label="Ayak Numarası (EU)"
              type="number"
              placeholder="38"
              error={form2.formState.errors.shoe_size?.message}
              {...form2.register('shoe_size', { valueAsNumber: true })}
            />
          </div>

          <div className="flex gap-3 mt-2">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="flex-1"
              onClick={() => setStep(1)}
            >
              ← Geri
            </Button>
            <Button type="submit" size="lg" className="flex-1">
              Devam Et →
            </Button>
          </div>
        </form>
      )}

      {/* ── STEP 3: Stil Tercihleri ── */}
      {step === 3 && (
        <div className="flex flex-col gap-5">
          <p className="text-sm text-ink-500 -mt-2">
            Sana en uygun kombinleri önerebilmemiz için tercih ettiğin stilleri seç.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {STYLE_OPTIONS.map((opt) => {
              const selected = selectedStyles.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleStyle(opt.value)}
                  className={[
                    'flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-sm font-medium transition-all',
                    selected
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-ink-200 text-ink-600 hover:border-ink-300 hover:bg-ink-50',
                  ].join(' ')}
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  {opt.label}
                  {selected && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-600">
                      <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-3 mt-2">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="flex-1"
              onClick={() => setStep(2)}
            >
              ← Geri
            </Button>
            <Button
              type="button"
              size="lg"
              className="flex-1"
              loading={submitting}
              onClick={onFinish}
            >
              Tamamla 🎉
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
