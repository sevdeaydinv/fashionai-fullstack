import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';

export const dynamic = 'force-dynamic';

/* ============================================================
   FashionAI — Landing Page
   ============================================================ */

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main className="overflow-x-hidden">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <StatsSection />
        <CtaSection />
        <Footer />
      </main>
    </>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  HERO                                                       */
/* ─────────────────────────────────────────────────────────── */
function HeroSection() {
  return (
    <section className="min-h-screen flex items-center pt-20 pb-10 bg-white overflow-hidden">
      <div className="w-full">

        {/* Hero card — full background image */}
        <div className="relative w-full">

          {/* Fotoğraf — tam genişlik, orijinal oran korunur, kırpma yok */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero-models.jpg"
            alt="Fashion models"
            className="w-full h-auto block"
          />

          {/* Overlay */}
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(100deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0.1) 100%)' }} />

          {/* İçerik — sol, dikey ortada */}
          <div className="absolute inset-0 flex items-center">
          <div className="flex flex-col gap-6 px-14 max-w-lg">

            {/* Headline */}
            <div className="space-y-1">
              <h1 className="font-serif italic font-light leading-[1.15] tracking-wide"
                style={{ fontSize: 'clamp(2rem, 3.5vw, 3.2rem)', color: 'rgba(255,255,255,0.65)' }}>
                Dijital
              </h1>
              <h1 className="font-serif italic font-light leading-[1.15] tracking-wide"
                style={{ fontSize: 'clamp(2rem, 3.5vw, 3.2rem)', color: 'rgba(255,255,255,0.65)' }}>
                Gardırobunuz
              </h1>
            </div>

            {/* Subheadline */}
            <p className="text-sm text-white/70 leading-relaxed max-w-xs">
              Gardırobunuzu bir kez yükleyin. AI her gün stilinize ve hava durumuna özel kombinler üretsin.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full px-7 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: '#C41E3A' }}
              >
                Ücretsiz Başla
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <Link
                href="/#how-it-works"
                className="inline-flex h-11 items-center justify-center rounded-full px-7 text-sm font-bold bg-white text-ink-900 transition-all hover:bg-white/90"
              >
                Nasıl Çalışır?
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {['S','M','A','J','K'].map((i, idx) => (
                  <span key={idx}
                    className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[0.6rem] font-bold text-white"
                    style={{ background: idx % 2 === 0 ? '#C41E3A' : '#7b3f35' }}>
                    {i}
                  </span>
                ))}
              </div>
              <span className="text-xs text-white/60"><strong className="text-white">10.000+</strong> kullanıcı</span>
            </div>
          </div>
          </div>

        </div>

        {/* Alt bilgi şeridi */}
        <div className="mt-6 px-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-2 text-xs text-ink-400">
          <span>✦ Ücretsiz başla, kredi kartı gerekmez</span>
          <span className="h-px w-12 bg-ink-200 hidden sm:block" />
          <span>✦ Hava durumuna göre otomatik öneri</span>
          <span className="h-px w-12 bg-ink-200 hidden sm:block" />
          <span>✦ Hem kadın hem erkek modaları</span>
        </div>

      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  FEATURES                                                   */
/* ─────────────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    title: 'Smart Wardrobe',
    description:
      'Upload your clothes once. AI catalogues each item by color, style, category, and season — your digital closet, always organized.',
    accent: 'bg-violet-500/10 text-violet-500',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
    title: 'AI Outfit Generator',
    description:
      'Daily outfit combinations scored for color harmony, event appropriateness, weather, and your personal style profile.',
    accent: 'bg-brand-500/10 text-brand-500',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
      </svg>
    ),
    title: 'Beauty Assistant',
    description:
      'Personalized makeup looks, hairstyle suggestions, and grooming routines based on your face shape, skin tone, and trending styles.',
    accent: 'bg-rose-500/10 text-rose-500',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
      </svg>
    ),
    title: 'Weather-Aware',
    description:
      "Outfit suggestions that adapt to real-time weather. Never overdress or underdress again — your stylist checks the forecast.",
    accent: 'bg-sky-500/10 text-sky-500',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
    title: 'Event Planner',
    description:
      'Planning for a wedding, graduation, or job interview? Set your event and get a curated look days in advance.',
    accent: 'bg-amber-500/10 text-amber-500',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
    title: 'Body-Personalized',
    description:
      'Recommendations shaped around your unique body measurements — height, waist, hip — for clothes that truly fit and flatter.',
    accent: 'bg-emerald-500/10 text-emerald-500',
  },
] as const;

function FeaturesSection() {
  return (
    <section id="features" className="bg-white py-28">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="max-w-2xl mb-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-600 mb-4">
            Features
          </p>
          <h2 className="text-4xl lg:text-5xl font-semibold text-ink-900 leading-tight">
            Everything you need to look your best
          </h2>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-ink-100 bg-ink-50 p-7 hover:border-ink-200 hover:bg-white hover:shadow-lg hover:shadow-ink-900/5 transition-all duration-200"
            >
              <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${feature.accent}`}>
                {feature.icon}
              </div>
              <h3 className="mb-2.5 text-base font-semibold text-ink-900">
                {feature.title}
              </h3>
              <p className="text-sm text-ink-500 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  HOW IT WORKS                                              */
/* ─────────────────────────────────────────────────────────── */
const STEPS = [
  {
    step: '01',
    title: 'Build your digital wardrobe',
    description:
      'Photograph and upload your clothing items. Add details like color, style, and season. Takes just a few minutes.',
  },
  {
    step: '02',
    title: 'Tell us about yourself',
    description:
      'Enter your body measurements, style preferences, and skin tone. The more we know, the better we tailor suggestions.',
  },
  {
    step: '03',
    title: 'Get AI-powered style ideas',
    description:
      'Every morning, receive outfit recommendations based on your wardrobe, the weather, and what you have planned.',
  },
];

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-ink-950 py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl mb-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-400 mb-4">
            How It Works
          </p>
          <h2 className="text-4xl lg:text-5xl font-semibold text-white leading-tight">
            Up and running in under 5 minutes
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {STEPS.map((item, i) => (
            <div key={item.step} className="relative">
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-6 left-[calc(100%+1rem)] right-0 h-px w-8 bg-gradient-to-r from-white/20 to-transparent" />
              )}
              <div className="text-4xl font-bold text-white/5 mb-4">{item.step}</div>
              <h3 className="text-lg font-semibold text-white mb-3">{item.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  STATS                                                      */
/* ─────────────────────────────────────────────────────────── */
const STATS = [
  { value: '10K+', label: 'Active Users' },
  { value: '2M+', label: 'Outfits Generated' },
  { value: '98%', label: 'User Satisfaction' },
  { value: '150+', label: 'Style Categories' },
];

function StatsSection() {
  return (
    <section className="border-y border-ink-100 bg-white py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <p className="text-4xl font-bold text-ink-900">{stat.value}</p>
              <p className="mt-1.5 text-sm text-ink-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  CTA                                                        */
/* ─────────────────────────────────────────────────────────── */
function CtaSection() {
  return (
    <section id="pricing" className="bg-ink-50 py-28">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-4xl lg:text-5xl font-semibold text-ink-900 leading-tight mb-6">
          Your best-dressed era starts today
        </h2>
        <p className="text-lg text-ink-500 mb-10">
          Free to start — no credit card required. Upload your wardrobe and get your first AI outfit in minutes.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-brand-600 px-8 text-base font-medium text-white transition-all hover:bg-brand-500 hover:shadow-lg hover:shadow-brand-600/30"
          >
            Create Free Account
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          <Link
            href="/login"
            className="inline-flex h-13 items-center justify-center rounded-xl border border-ink-200 px-8 text-base font-medium text-ink-700 transition-all hover:bg-ink-100"
          >
            Sign In
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  FOOTER                                                     */
/* ─────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="border-t border-ink-100 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L8 8H4L6 14H4L8 20H16L20 14H18L20 8H16L12 2Z" fill="white" fillOpacity="0.9" />
            </svg>
          </span>
          <span className="text-sm font-semibold text-ink-900">FashionAI</span>
        </div>
        <p className="text-sm text-ink-400">
          © {new Date().getFullYear()} FashionAI. All rights reserved.
        </p>
        <div className="flex gap-5 text-sm text-ink-400">
          <Link href="#" className="hover:text-ink-700 transition-colors">Privacy</Link>
          <Link href="#" className="hover:text-ink-700 transition-colors">Terms</Link>
          <Link href="#" className="hover:text-ink-700 transition-colors">Contact</Link>
        </div>
      </div>
    </footer>
  );
}
