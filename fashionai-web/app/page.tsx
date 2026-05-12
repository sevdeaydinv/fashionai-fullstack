import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';

export const dynamic = 'force-dynamic';

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main className="overflow-x-hidden bg-black">
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
    <section className="relative overflow-hidden bg-black">
      {/* Full-screen hero image */}
      <div className="relative w-full" style={{ height: '100svh', minHeight: '600px' }}>

        {/* Background photo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero-models.jpg"
          alt="Fashion models"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: 'center top' }}
        />

        {/* Dark gradient overlay — stronger on left for text legibility */}
        <div className="absolute inset-0"
          style={{
            background: 'linear-gradient(105deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.60) 45%, rgba(0,0,0,0.15) 100%)',
          }}
        />

        {/* Hero content */}
        <div className="absolute inset-0 flex items-center">
          <div className="w-full max-w-7xl mx-auto px-6 sm:px-10">
            <div className="max-w-lg">

              {/* Label */}
              <p className="mb-5 text-[0.6rem] font-bold tracking-[0.3em] uppercase"
                style={{ color: '#C41E3A' }}>
                AI-Powered Personal Styling
              </p>

              {/* Headline */}
              <h1 className="font-serif italic font-light leading-[1.1] mb-6"
                style={{ fontSize: 'clamp(2.8rem, 5vw, 4.5rem)', color: 'rgba(255,255,255,0.90)' }}>
                Dijital<br />Gardırobunuz
              </h1>

              {/* Subtitle */}
              <p className="mb-8 text-sm sm:text-base leading-relaxed"
                style={{ color: 'rgba(255,255,255,0.65)', maxWidth: '360px' }}>
                Gardırobunuzu bir kez yükleyin. Yapay zekamız her gün stilinize ve hava durumuna özel kombinler üretsin.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-3 mb-10">
                <Link
                  href="/register"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full px-8 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ background: '#C41E3A' }}
                >
                  Ücretsiz Başla
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                <Link
                  href="/#how-it-works"
                  className="inline-flex h-12 items-center justify-center rounded-full px-8 text-sm font-bold bg-white/10 text-white border border-white/20 backdrop-blur-sm transition-all hover:bg-white/20"
                >
                  Nasıl Çalışır?
                </Link>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2.5">
                  {['S', 'M', 'A', 'J', 'K'].map((initial, idx) => (
                    <span
                      key={idx}
                      className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-black text-[0.6rem] font-bold text-white"
                      style={{ background: idx % 2 === 0 ? '#C41E3A' : '#7b3535' }}
                    >
                      {initial}
                    </span>
                  ))}
                </div>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  <strong className="text-white">10.000+</strong> mutlu kullanıcı
                </span>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Scrolling ticker */}
      <div className="overflow-hidden bg-black" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="py-3.5 flex animate-marquee whitespace-nowrap">
          {[...Array(6)].map((_, i) => (
            <span key={i} className="flex items-center gap-8 mx-8 text-[0.65rem] font-semibold tracking-[0.15em] uppercase"
              style={{ color: 'rgba(255,255,255,0.45)' }}>
              <span style={{ color: '#C41E3A' }}>✦</span>
              <span>Ücretsiz başla, kredi kartı gerekmez</span>
              <span style={{ color: '#C41E3A' }}>✦</span>
              <span>Hava durumuna göre otomatik öneri</span>
              <span style={{ color: '#C41E3A' }}>✦</span>
              <span>Hem kadın hem erkek modaları</span>
              <span style={{ color: '#C41E3A' }}>✦</span>
              <span>AI destekli kişisel stil danışmanı</span>
            </span>
          ))}
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
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
    title: 'Smart Wardrobe',
    description: 'Upload your clothes once. AI catalogues each item by color, style, category, and season — your digital closet, always organized.',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
    title: 'AI Outfit Generator',
    description: 'Daily outfit combinations scored for color harmony, event appropriateness, weather, and your personal style profile.',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
      </svg>
    ),
    title: 'Beauty Assistant',
    description: 'Personalized makeup looks, hairstyle suggestions, and grooming routines based on your face shape, skin tone, and trending styles.',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
      </svg>
    ),
    title: 'Weather-Aware',
    description: "Outfit suggestions that adapt to real-time weather. Never overdress or underdress again — your stylist checks the forecast.",
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
    title: 'Event Planner',
    description: 'Planning for a wedding, graduation, or job interview? Set your event and get a curated look days in advance.',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    ),
    title: 'Body-Personalized',
    description: 'Recommendations shaped around your unique body measurements — height, waist, hip — for clothes that truly fit and flatter.',
  },
] as const;

function FeaturesSection() {
  return (
    <section id="features" className="py-28" style={{ background: '#0a0a0a' }}>
      <div className="mx-auto max-w-7xl px-6">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-16">
          <div>
            <p className="text-[0.6rem] font-bold tracking-[0.3em] uppercase mb-4"
              style={{ color: '#C41E3A' }}>
              Features
            </p>
            <h2 className="font-serif italic font-light text-white leading-tight"
              style={{ fontSize: 'clamp(2.2rem, 4vw, 3.4rem)' }}>
              Everything you need to look your best
            </h2>
          </div>
          <Link href="/register"
            className="shrink-0 inline-flex h-11 items-center gap-2 rounded-full px-7 text-xs font-bold tracking-widest uppercase text-white transition-all hover:opacity-80"
            style={{ background: '#C41E3A' }}>
            Hemen Başla
          </Link>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5 border border-white/5">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group p-8 bg-black hover:bg-white/[0.03] transition-colors duration-300 cursor-default relative overflow-hidden"
            >
              {/* Top border accent on hover */}
              <div className="absolute top-0 left-0 right-0 h-px scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"
                style={{ background: '#C41E3A' }} />

              {/* Icon */}
              <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ background: 'rgba(196,30,58,0.12)', color: '#C41E3A' }}>
                {feature.icon}
              </div>

              {/* Title */}
              <h3 className="text-[0.7rem] font-bold tracking-[0.2em] uppercase text-white mb-3">
                {feature.title}
              </h3>

              {/* Divider */}
              <div className="w-6 h-px mb-4" style={{ background: 'rgba(196,30,58,0.5)' }} />

              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.50)' }}>
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
    title: 'Dijital gardırobunuzu oluşturun',
    description: 'Giysilerinizin fotoğraflarını çekin ve yükleyin. Renk, stil ve mevsim gibi detayları ekleyin. Sadece birkaç dakika sürer.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6z" />
      </svg>
    ),
  },
  {
    step: '02',
    title: 'Bize kendinizden bahsedin',
    description: 'Vücut ölçülerinizi, stil tercihlerinizi ve ten renginizi girin. Ne kadar çok bilgi verirseniz, size o kadar iyi öneriler sunabiliriz.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    step: '03',
    title: 'Yapay zekâ destekli stil fikirleri edinin',
    description: 'Her sabah, gardırobunuza, hava durumuna ve planlarınıza göre kıyafet önerileri alın.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
  },
] as const;

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-28" style={{ background: '#0a0a0a', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="mx-auto max-w-7xl px-6">

        {/* Header */}
        <div className="max-w-2xl mb-20">
          <p className="text-[0.6rem] font-bold tracking-[0.3em] uppercase mb-5"
            style={{ color: '#C41E3A' }}>
            Nasıl Çalışır
          </p>
          <h2 className="font-serif italic font-light text-white leading-tight"
            style={{ fontSize: 'clamp(2.2rem, 4vw, 3.4rem)' }}>
            5 dakikadan kısa sürede<br />kullanıma hazır.
          </h2>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8">
          {STEPS.map((item, i) => (
            <div key={item.step} className="group relative">

              {/* Step number */}
              <div className="mb-6 flex items-center gap-4">
                <span className="text-[3.5rem] font-bold leading-none select-none"
                  style={{ color: 'rgba(196,30,58,0.15)', fontFamily: 'var(--font-playfair)' }}>
                  {item.step}
                </span>
                <div className="flex h-11 w-11 items-center justify-center rounded-full border"
                  style={{ borderColor: 'rgba(196,30,58,0.3)', color: '#C41E3A', background: 'rgba(196,30,58,0.08)' }}>
                  {item.icon}
                </div>
              </div>

              {/* Thin red line */}
              <div className="w-10 h-px mb-5" style={{ background: '#C41E3A' }} />

              <h3 className="text-sm font-bold text-white leading-snug mb-3 tracking-wide">
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.50)' }}>
                {item.description}
              </p>

              {/* Connector line between steps (desktop) */}
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-8 left-full w-8 h-px -translate-y-0"
                  style={{ background: 'rgba(255,255,255,0.08)' }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  ABOUT / STATS                                              */
/* ─────────────────────────────────────────────────────────── */
function StatsSection() {
  return (
    <section id="about" className="py-28" style={{ background: '#0a0a0a', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="mx-auto max-w-7xl px-6">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10 mb-20">
          <div className="max-w-xl">
            <p className="text-[0.6rem] font-bold tracking-[0.3em] uppercase mb-5"
              style={{ color: '#C41E3A' }}>
              Hakkımızda
            </p>
            <h2 className="font-serif italic font-light text-white leading-tight"
              style={{ fontSize: 'clamp(2.2rem, 4vw, 3.4rem)' }}>
              Modayı herkes için<br />erişilebilir kılıyoruz.
            </h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed lg:pb-2"
            style={{ color: 'rgba(255,255,255,0.45)' }}>
            FashionAI, yapay zeka teknolojisini moda dünyasıyla buluşturan bir stil platformudur. Herkesin kendi bedenine, bütçesine ve zevkine uygun kombinler oluşturabilmesi için tasarlandık.
          </p>
        </div>

        {/* Two columns */}
        <div className="grid lg:grid-cols-2 gap-16 items-start">

          {/* Left — story */}
          <div className="space-y-5">
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.50)' }}>
              2026 yılında kurulan FashionAI, insanların her sabah "ne giyeyim?" sorusuna vakit kaybetmeden cevap bulabilmesi için doğdu. Gardırobunuzu dijitalleştirin, yapay zekamız hava durumunu, planlarınızı ve stil profilinizi analiz ederek size özel kombinler üretsin.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.50)' }}>
              Hem kadın hem erkek modalarını destekleyen platformumuz; gardırop yönetimi, güzellik asistanı ve etkinlik planlayıcısı özellikleriyle komple bir kişisel stil deneyimi sunar.
            </p>
            <div className="w-10 h-px pt-2" style={{ background: '#C41E3A' }} />
            <p className="text-[0.6rem] font-bold tracking-[0.25em] uppercase"
              style={{ color: 'rgba(255,255,255,0.25)' }}>
              İstanbul, Türkiye · 2026
            </p>
          </div>

          {/* Right — stats */}
          <div className="grid grid-cols-2 gap-px bg-white/5 border border-white/5">
            {[
              { value: '10K+',  label: 'Aktif Kullanıcı' },
              { value: '2M+',   label: 'Oluşturulan Kombin' },
              { value: '%98',   label: 'Kullanıcı Memnuniyeti' },
              { value: '150+',  label: 'Stil Kategorisi' },
            ].map((stat) => (
              <div key={stat.label} className="bg-black p-8">
                <p className="text-3xl font-bold text-white mb-1"
                  style={{ fontFamily: 'var(--font-playfair)' }}>
                  {stat.value}
                </p>
                <p className="text-[0.65rem] font-semibold tracking-widest uppercase"
                  style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  CONTACT / CTA                                              */
/* ─────────────────────────────────────────────────────────── */
function CtaSection() {
  return (
    <section id="contact" className="py-28" style={{ background: '#0a0a0a', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="mx-auto max-w-7xl px-6">

        <div className="mb-16">
          <p className="text-[0.6rem] font-bold tracking-[0.3em] uppercase mb-5"
            style={{ color: '#C41E3A' }}>
            İletişim
          </p>
          <h2 className="font-serif italic font-light text-white leading-tight"
            style={{ fontSize: 'clamp(2.2rem, 4vw, 3.4rem)' }}>
            Bizimle iletişime geçin.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-px bg-white/5 border border-white/5 mb-16">
          {[
            {
              icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              ),
              label: 'E-posta',
              value: 'info@fashionai.com',
              href: 'mailto:info@fashionai.com',
            },
            {
              icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
              ),
              label: 'Telefon',
              value: '+90 (212) 123 45 67',
              href: 'tel:+902121234567',
            },
            {
              icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              ),
              label: 'Adres',
              value: 'Maslak Mah. Büyükdere Cad. No:255, Sarıyer / İstanbul',
              href: null,
            },
          ].map((item) => (
            <div key={item.label} className="bg-black p-8 group">
              <div className="mb-5 text-white/30 group-hover:text-white/50 transition-colors">
                {item.icon}
              </div>
              <p className="text-[0.6rem] font-bold tracking-[0.2em] uppercase mb-3"
                style={{ color: 'rgba(255,255,255,0.30)' }}>
                {item.label}
              </p>
              <div className="w-6 h-px mb-4" style={{ background: '#C41E3A' }} />
              {item.href ? (
                <a href={item.href}
                  className="text-sm text-white/70 hover:text-white transition-colors">
                  {item.value}
                </a>
              ) : (
                <p className="text-sm text-white/70 leading-relaxed">{item.value}</p>
              )}
            </div>
          ))}
        </div>

        {/* CTA Banner */}
        <div className="relative overflow-hidden rounded-2xl p-12 text-center"
          style={{ background: 'linear-gradient(135deg, #1a0a0e 0%, #0a0a0a 50%, #1a0a0e 100%)', border: '1px solid rgba(196,30,58,0.2)' }}>
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #C41E3A 0%, transparent 60%), radial-gradient(circle at 70% 50%, #C41E3A 0%, transparent 60%)' }} />
          <div className="relative">
            <p className="text-[0.6rem] font-bold tracking-[0.3em] uppercase mb-4"
              style={{ color: '#C41E3A' }}>
              Hemen Deneyin
            </p>
            <h3 className="font-serif italic font-light text-white mb-6"
              style={{ fontSize: 'clamp(1.8rem, 3vw, 2.8rem)' }}>
              Stilinizi keşfetmeye hazır mısınız?
            </h3>
            <Link href="/register"
              className="inline-flex h-12 items-center gap-2 rounded-full px-10 text-sm font-bold text-white transition-all hover:opacity-90"
              style={{ background: '#C41E3A' }}>
              Ücretsiz Başla
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
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
    <footer style={{ background: '#0a0a0a', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="mx-auto max-w-7xl px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link href="/">
          <span className="font-serif text-base font-bold tracking-tight text-white">
            FASHION<span style={{ color: '#C41E3A' }}>AI</span>
          </span>
        </Link>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
          © {new Date().getFullYear()} FashionAI. Tüm hakları saklıdır.
        </p>
        <div className="flex items-center gap-3">
          <a href="#" aria-label="Instagram"
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:opacity-70 transition-opacity"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
          </a>
          <a href="#" aria-label="TikTok"
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:opacity-70 transition-opacity"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.28 6.28 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.78a4.85 4.85 0 01-1.01-.09z"/>
            </svg>
          </a>
          <a href="#" aria-label="App Store"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:opacity-70 transition-opacity"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <svg className="h-4 w-4 text-white shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            <span className="text-[0.6rem] font-semibold text-white">App Store</span>
          </a>
          <a href="#" aria-label="Google Play"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:opacity-70 transition-opacity"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <svg className="h-4 w-4 text-white shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3.18 23.76c.3.17.64.24.99.2l12.6-7.27-2.72-2.72-10.87 9.79zM.17 1.03C.06 1.3 0 1.62 0 1.98v20.04c0 .36.06.68.17.95l.09.09 11.23-11.23v-.26L.26.94l-.09.09zM20.54 10.37l-2.98-1.72-3.06 3.06 3.06 3.06 3-1.73c.86-.5.86-1.31-.02-1.67zM3.18.24L15.78 7.5l-2.72 2.73L2.19.44A1.17 1.17 0 013.18.24z"/>
            </svg>
            <span className="text-[0.6rem] font-semibold text-white">Google Play</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
