'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageContext';

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
  { value: 'casual',      label: 'Casual' },
  { value: 'formal',      label: 'Formal' },
  { value: 'sport',       label: 'Sportif' },
  { value: 'streetwear',  label: 'Streetwear' },
  { value: 'elegant',     label: 'Elegant' },
  { value: 'bohemian',    label: 'Bohemian' },
] as const;

type StyleValue = typeof STYLE_OPTIONS[number]['value'];

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

// ─── Component ──────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const { t } = useLanguage();

  const GENDER_OPTIONS = [
    { value: 'female'           as const, label: t.onboarding.genderOptions.female },
    { value: 'male'             as const, label: t.onboarding.genderOptions.male },
    { value: 'non_binary'       as const, label: t.onboarding.genderOptions.non_binary },
    { value: 'prefer_not_to_say' as const, label: t.onboarding.genderOptions.prefer_not_to_say },
  ];

  const MEASUREMENT_FIELDS: { label: string; field: keyof Step2Data; placeholder: string }[] = [
    { label: t.onboarding.measurementFields.height_cm, field: 'height_cm', placeholder: '168' },
    { label: t.onboarding.measurementFields.weight_kg, field: 'weight_kg', placeholder: '62' },
    { label: t.onboarding.measurementFields.waist_cm,  field: 'waist_cm',  placeholder: '70' },
    { label: t.onboarding.measurementFields.hip_cm,    field: 'hip_cm',    placeholder: '95' },
    { label: t.onboarding.measurementFields.shoe_size, field: 'shoe_size', placeholder: '38' },
  ];

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
      setError(t.onboarding.errorSelectStyle);
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t.onboarding.sessionNotFound);

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
      setError(e instanceof Error ? e.message : t.onboarding.genericError);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Progress bar ─────────────────────────────────────────
  const steps = [t.onboarding.step1Label, t.onboarding.step2Label, t.onboarding.step3Label];

  return (
    <div className="w-full max-w-lg">
      {/* Header */}
      <div className="mb-8">
        <h1 style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.5rem', fontWeight: 600, marginBottom: 4 }}>
          {t.onboarding.title}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
          {t.onboarding.subtitle}
        </p>
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
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                  style={{
                    background: isDone
                      ? 'rgba(196,30,58,0.3)'
                      : isActive
                      ? '#C41E3A'
                      : 'transparent',
                    border: isDone
                      ? '1px solid rgba(196,30,58,0.5)'
                      : isActive
                      ? 'none'
                      : '2px solid rgba(255,255,255,0.2)',
                    color: (isDone || isActive) ? 'white' : 'rgba(255,255,255,0.4)',
                  }}
                >
                  {isDone ? (
                    <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    idx
                  )}
                </span>
                <span
                  className="text-xs font-medium hidden sm:block"
                  style={{ color: isActive ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)' }}
                >
                  {label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className="flex-1 h-px mx-2"
                  style={{ background: isDone ? 'rgba(196,30,58,0.3)' : 'rgba(255,255,255,0.1)' }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* ── STEP 1: Kişisel Bilgiler ── */}
      {step === 1 && (
        <form onSubmit={form1.handleSubmit(onStep1Submit)} className="flex flex-col gap-5">
          <div>
            <label style={labelStyle}>{t.onboarding.fullNameLabel}</label>
            <input
              type="text"
              placeholder="Ada Yıldız"
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = 'rgba(196,30,58,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(196,30,58,0.1)'; }}
              {...form1.register('full_name')}
            />
            {form1.formState.errors.full_name && (
              <p style={{ color: '#ff6070', fontSize: '0.75rem', marginTop: 4 }}>{form1.formState.errors.full_name.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label style={labelStyle}>{t.onboarding.genderLabel}</label>
            <div className="grid grid-cols-2 gap-2">
              {GENDER_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2.5 cursor-pointer text-sm transition-all"
                  style={{
                    borderRadius: 12,
                    padding: '12px 16px',
                    border: form1.watch('gender') === opt.value
                      ? '1px solid rgba(196,30,58,0.3)'
                      : '1px solid rgba(255,255,255,0.12)',
                    background: form1.watch('gender') === opt.value
                      ? 'rgba(196,30,58,0.15)'
                      : 'rgba(255,255,255,0.07)',
                    color: form1.watch('gender') === opt.value
                      ? '#ff6080'
                      : 'rgba(255,255,255,0.7)',
                    fontWeight: form1.watch('gender') === opt.value ? 500 : 400,
                  }}
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
              <p style={{ color: '#ff6070', fontSize: '0.75rem', marginTop: 4 }}>{form1.formState.errors.gender.message}</p>
            )}
          </div>

          <div>
            <label style={labelStyle}>{t.onboarding.birthDateLabel}</label>
            <input
              type="date"
              style={{ ...inputStyle, colorScheme: 'dark' }}
              onFocus={(e) => { e.target.style.borderColor = 'rgba(196,30,58,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(196,30,58,0.1)'; }}
              {...form1.register('birth_date')}
            />
            {form1.formState.errors.birth_date && (
              <p style={{ color: '#ff6070', fontSize: '0.75rem', marginTop: 4 }}>{form1.formState.errors.birth_date.message}</p>
            )}
          </div>

          <button
            type="submit"
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
              cursor: 'pointer',
              marginTop: 8,
            }}
          >
            {t.onboarding.continueBtn}
          </button>
        </form>
      )}

      {/* ── STEP 2: Vücut Ölçüleri ── */}
      {step === 2 && (
        <form onSubmit={form2.handleSubmit(onStep2Submit)} className="flex flex-col gap-5">
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', marginTop: -8 }}>
            {t.onboarding.measurementsOptional}
          </p>

          <div className="grid grid-cols-2 gap-4">
            {MEASUREMENT_FIELDS.map(({ label, field, placeholder }) => (
              <div key={field}>
                <label style={labelStyle}>{label}</label>
                <input
                  type="number"
                  placeholder={placeholder}
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = 'rgba(196,30,58,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(196,30,58,0.1)'; }}
                  {...form2.register(field, { valueAsNumber: true })}
                />
                {form2.formState.errors[field] && (
                  <p style={{ color: '#ff6070', fontSize: '0.75rem', marginTop: 4 }}>{form2.formState.errors[field]?.message}</p>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 12,
                color: 'rgba(255,255,255,0.8)',
                fontWeight: 500,
                fontSize: '0.9rem',
                padding: '13px 24px',
                cursor: 'pointer',
              }}
            >
              {t.onboarding.backBtn}
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #7a0020 0%, #C41E3A 60%, #e8294a 100%)',
                borderRadius: 12,
                boxShadow: '0 4px 20px rgba(196,30,58,0.4)',
                border: 'none',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.9rem',
                padding: '13px 24px',
                cursor: 'pointer',
              }}
            >
              {t.onboarding.continueBtn}
            </button>
          </div>
        </form>
      )}

      {/* ── STEP 3: Stil Tercihleri ── */}
      {step === 3 && (
        <div className="flex flex-col gap-5">
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', marginTop: -8 }}>
            {t.onboarding.styleDesc}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {STYLE_OPTIONS.map((opt) => {
              const selected = selectedStyles.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleStyle(opt.value)}
                  className="flex flex-col items-center gap-2 p-4 text-sm font-medium transition-all"
                  style={{
                    borderRadius: 16,
                    border: selected
                      ? '1px solid rgba(196,30,58,0.3)'
                      : '1px solid rgba(255,255,255,0.12)',
                    background: selected
                      ? 'rgba(196,30,58,0.15)'
                      : 'rgba(255,255,255,0.07)',
                    color: selected ? '#ff6080' : 'rgba(255,255,255,0.7)',
                    cursor: 'pointer',
                  }}
                >
                  {opt.label}
                  {selected && (
                    <span
                      className="flex h-4 w-4 items-center justify-center rounded-full"
                      style={{ background: '#C41E3A' }}
                    >
                      <svg style={{ width: 10, height: 10, color: 'white' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {error && (
            <div style={{
              background: 'rgba(196,30,58,0.1)',
              border: '1px solid rgba(196,30,58,0.3)',
              borderRadius: 12,
              padding: '12px 16px',
              color: '#ff6070',
              fontSize: '0.875rem',
            }}>
              {error}
            </div>
          )}

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 12,
                color: 'rgba(255,255,255,0.8)',
                fontWeight: 500,
                fontSize: '0.9rem',
                padding: '13px 24px',
                cursor: 'pointer',
              }}
            >
              {t.onboarding.backBtn}
            </button>
            <button
              type="button"
              onClick={onFinish}
              disabled={submitting}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #7a0020 0%, #C41E3A 60%, #e8294a 100%)',
                borderRadius: 12,
                boxShadow: '0 4px 20px rgba(196,30,58,0.4)',
                border: 'none',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.9rem',
                padding: '13px 24px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? t.onboarding.saving : t.onboarding.finishBtn}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
