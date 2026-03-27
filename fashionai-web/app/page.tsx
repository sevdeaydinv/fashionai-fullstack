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

        {/* Features ve altı — şeffaf siyah zemin + kırmızı dekoratif çizgiler */}
        <div className="relative" style={{ background: 'rgba(0,0,0,0.82)' }}>

          {/* Dekoratif neon dalgalı çizgiler */}
          <svg className="pointer-events-none absolute inset-0 w-full h-full" viewBox="0 0 1440 3000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <defs>
              {/* Geniş yumuşak glow */}
              <filter id="glow-soft" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="18" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              {/* Keskin neon glow */}
              <filter id="glow-sharp" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* Çizgi 1 — sol alttan sağ üste hafif S eğrisi */}
            <path d="M-100,900 C300,600 700,1100 1100,400 S1600,200 1600,200"
              fill="none" stroke="#C41E3A" strokeWidth="2.5" strokeOpacity="0.12" filter="url(#glow-soft)" />
            <path d="M-100,900 C300,600 700,1100 1100,400 S1600,200 1600,200"
              fill="none" stroke="#ff2040" strokeWidth="0.8" strokeOpacity="0.25" filter="url(#glow-sharp)" />

            {/* Çizgi 2 — yukarıdan geçen geniş yay */}
            <path d="M0,400 C400,150 900,700 1440,300"
              fill="none" stroke="#C41E3A" strokeWidth="2" strokeOpacity="0.1" filter="url(#glow-soft)" />
            <path d="M0,400 C400,150 900,700 1440,300"
              fill="none" stroke="#ff2040" strokeWidth="0.7" strokeOpacity="0.2" filter="url(#glow-sharp)" />

            {/* Çizgi 3 — ortada çapraz geçiş */}
            <path d="M1500,800 C1100,1100 600,900 0,1400"
              fill="none" stroke="#C41E3A" strokeWidth="2.5" strokeOpacity="0.13" filter="url(#glow-soft)" />
            <path d="M1500,800 C1100,1100 600,900 0,1400"
              fill="none" stroke="#ff2040" strokeWidth="0.9" strokeOpacity="0.28" filter="url(#glow-sharp)" />

            {/* Çizgi 4 — alt bölge dalgası */}
            <path d="M0,1800 C350,1500 750,2100 1150,1700 S1500,1600 1600,1600"
              fill="none" stroke="#C41E3A" strokeWidth="2" strokeOpacity="0.09" filter="url(#glow-soft)" />
            <path d="M0,1800 C350,1500 750,2100 1150,1700 S1500,1600 1600,1600"
              fill="none" stroke="#ff2040" strokeWidth="0.6" strokeOpacity="0.18" filter="url(#glow-sharp)" />

            {/* Çizgi 5 — ince uzun diyagonal */}
            <path d="M200,0 C400,500 800,1000 1440,2000"
              fill="none" stroke="#C41E3A" strokeWidth="1.5" strokeOpacity="0.08" filter="url(#glow-soft)" />
            <path d="M200,0 C400,500 800,1000 1440,2000"
              fill="none" stroke="#ff2040" strokeWidth="0.5" strokeOpacity="0.15" filter="url(#glow-sharp)" />

            {/* Çizgi 6 — en alt, seyrek */}
            <path d="M-50,2400 C500,2100 900,2600 1500,2300"
              fill="none" stroke="#C41E3A" strokeWidth="2" strokeOpacity="0.08" filter="url(#glow-soft)" />
            <path d="M-50,2400 C500,2100 900,2600 1500,2300"
              fill="none" stroke="#ff2040" strokeWidth="0.6" strokeOpacity="0.16" filter="url(#glow-sharp)" />
          </svg>

          <FeaturesSection />
          <HowItWorksSection />
          <StatsSection />
          <CtaSection />
        </div>

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
    <section className="bg-black overflow-hidden">
      <div className="w-full">

        {/* Hero card — full background image */}
        <div className="relative w-full" style={{ height: '56.25vw', minHeight: '500px', maxHeight: '100vh' }}>

          {/* Fotoğraf */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero-models.jpg"
            alt="Fashion models"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: 'center top' }}
          />

          {/* Overlay */}
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(100deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0.1) 100%)' }} />

          {/* İçerik — sol, navbar altında ortada */}
          <div className="absolute inset-0 flex items-center pt-16 pb-10">
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

        {/* Kayan yazı şeridi */}
        <div className="overflow-hidden bg-black py-4">
          <div className="flex animate-marquee whitespace-nowrap">
            {[...Array(4)].map((_, i) => (
              <span key={i} className="flex items-center gap-10 mx-10 text-xs font-medium text-white/60 tracking-wide">
                <span>✦ Ücretsiz başla, kredi kartı gerekmez</span>
                <span className="text-white/20">—</span>
                <span>✦ Hava durumuna göre otomatik öneri</span>
                <span className="text-white/20">—</span>
                <span>✦ Hem kadın hem erkek modaları</span>
                <span className="text-white/20">—</span>
                <span>✦ AI destekli kişisel stil danışmanı</span>
                <span className="text-white/20">—</span>
              </span>
            ))}
          </div>
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
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
    title: 'Smart Wardrobe',
    description:
      'Upload your clothes once. AI catalogues each item by color, style, category, and season — your digital closet, always organized.',
    accent: 'bg-violet-500/10 text-violet-500',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
      </svg>
    ),
    title: 'AI Outfit Generator',
    description:
      'Daily outfit combinations scored for color harmony, event appropriateness, weather, and your personal style profile.',
    accent: 'bg-brand-500/10 text-brand-500',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
      </svg>
    ),
    title: 'Beauty Assistant',
    description:
      'Personalized makeup looks, hairstyle suggestions, and grooming routines based on your face shape, skin tone, and trending styles.',
    accent: 'bg-rose-500/10 text-rose-500',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
      </svg>
    ),
    title: 'Weather-Aware',
    description:
      "Outfit suggestions that adapt to real-time weather. Never overdress or underdress again — your stylist checks the forecast.",
    accent: 'bg-sky-500/10 text-sky-500',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
      </svg>
    ),
    title: 'Event Planner',
    description:
      'Planning for a wedding, graduation, or job interview? Set your event and get a curated look days in advance.',
    accent: 'bg-amber-500/10 text-amber-500',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
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
    <section id="features" className="py-28" style={{ background: '#0a0a0a' }}>
      <div className="mx-auto max-w-7xl px-6">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-16">
          <div>
            <p className="text-[0.65rem] font-bold tracking-[0.25em] uppercase mb-4" style={{ color: '#C41E3A' }}>
              Features
            </p>
            <h2 className="font-serif italic font-light text-white leading-tight"
              style={{ fontSize: 'clamp(2.2rem, 4vw, 3.5rem)' }}>
              Everything you need to look your best
            </h2>
          </div>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group p-9 transition-all duration-500 cursor-default rounded-2xl relative overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.6) 100%)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.10)',
                boxShadow: '0 16px 48px rgba(0,0,0,0.75), 0 4px 16px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.15) inset, 0 -1px 0 rgba(0,0,0,0.6) inset',
              }}
            >
              {/* Üst yansıma şeridi */}
              <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 30%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.25) 70%, transparent 100%)' }} />

              {/* Sol kenar yansıma */}
              <div className="absolute top-0 left-0 bottom-0 w-px"
                style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 50%, transparent 100%)' }} />

              {/* İkon */}
              <div className="mb-7 text-white/35 group-hover:text-white/70 transition-colors duration-300">
                {feature.icon}
              </div>

              {/* Başlık */}
              <h3 className="text-base font-bold tracking-wider uppercase text-white mb-3">
                {feature.title}
              </h3>

              {/* Kısa çizgi */}
              <div className="w-8 h-px mb-4 transition-all duration-500 group-hover:w-16"
                style={{ background: '#C41E3A' }} />

              <p className="text-[0.9rem] leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
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
    color: '#C41E3A',
    glow: 'rgba(196,30,58,0.25)',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    step: '02',
    title: 'Bize kendinizden bahsedin.',
    description: 'Vücut ölçülerinizi, stil tercihlerinizi ve ten renginizi girin. Ne kadar çok bilgi verirseniz, size o kadar iyi öneriler sunabiliriz.',
    color: '#a855f7',
    glow: 'rgba(168,85,247,0.25)',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    step: '03',
    title: 'Yapay zekâ destekli stil fikirleri edinin.',
    description: 'Her sabah, gardırobunuza, hava durumuna ve planlarınıza göre kıyafet önerileri alın.',
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.25)',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
      </svg>
    ),
  },
];

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-28" style={{ background: '#0a0a0a' }}>
      <div className="mx-auto max-w-7xl px-6">

        {/* Header */}
        <div className="max-w-2xl mb-20">
          <p className="text-[0.65rem] font-bold tracking-[0.25em] uppercase mb-5" style={{ color: '#C41E3A' }}>
            Nasıl Çalışır
          </p>
          <h2 className="font-serif italic font-light text-white leading-tight"
            style={{ fontSize: 'clamp(2.2rem, 4vw, 3.5rem)' }}>
            5 dakikadan kısa sürede<br />kullanıma hazır.
          </h2>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-5">
          {STEPS.map((item, i) => (
            <div key={item.step} className="relative group rounded-2xl p-8 transition-all duration-500 overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.6) 100%)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.10)',
                boxShadow: '0 16px 48px rgba(0,0,0,0.75), 0 4px 16px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.15) inset, 0 -1px 0 rgba(0,0,0,0.6) inset',
              }}>

              {/* Üst yansıma şeridi */}
              <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 30%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.25) 70%, transparent 100%)' }} />

              {/* Sol kenar yansıma */}
              <div className="absolute top-0 left-0 bottom-0 w-px"
                style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 50%, transparent 100%)' }} />

              {/* Üst: numara + ikon */}
              <div className="flex items-center justify-between mb-8">
                <span className="text-[3rem] font-bold leading-none"
                  style={{ color: '#C41E3A', fontFamily: 'var(--font-playfair)' }}>
                  {item.step}
                </span>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ background: 'rgba(196,30,58,0.15)', color: '#C41E3A' }}>
                  {item.icon}
                </div>
              </div>

              {/* İnce kırmızı çizgi */}
              <div className="w-12 h-0.5 mb-6 rounded-full" style={{ background: '#C41E3A' }} />

              <h3 className="text-base font-bold text-white leading-snug mb-3">
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  ABOUT                                                      */
/* ─────────────────────────────────────────────────────────── */
function StatsSection() {
  return (
    <section id="about" className="py-28" style={{ background: '#0a0a0a' }}>
      <div className="mx-auto max-w-7xl px-6">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10 mb-20">
          <div className="max-w-xl">
            <p className="text-[0.65rem] font-bold tracking-[0.25em] uppercase mb-5" style={{ color: '#C41E3A' }}>
              Hakkımızda
            </p>
            <h2 className="font-serif italic font-light text-white leading-tight"
              style={{ fontSize: 'clamp(2.2rem, 4vw, 3.5rem)' }}>
              Modayı herkes için<br />erişilebilir kılıyoruz.
            </h2>
          </div>
          <p className="max-w-md text-[0.95rem] leading-relaxed lg:pb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
            FashionAI, yapay zeka teknolojisini moda dünyasıyla buluşturan bir stil platformudur. Herkesin kendi bedenine, bütçesine ve zevkine uygun kombinler oluşturabilmesi için tasarlandık.
          </p>
        </div>

        {/* İki sütun — metin + istatistikler */}
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Sol — hikaye */}
          <div className="space-y-6">
            <p className="text-[0.95rem] leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
              2026 yılında kurulan FashionAI, insanların her sabah "ne giyeyim?" sorusuna vakit kaybetmeden cevap bulabilmesi için doğdu. Gardırobunuzu dijitalleştirin, yapay zekamız hava durumunu, planlarınızı ve stil profilinizi analiz ederek size özel kombinler üretsin.
            </p>
            <p className="text-[0.95rem] leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Hem kadın hem erkek modalarını destekleyen platformumuz; gardırop yönetimi, güzellik asistanı ve etkinlik planlayıcısı özellikleriyle komple bir kişisel stil deneyimi sunar.
            </p>
            <div className="pt-2">
              <div className="w-12 h-px" style={{ background: '#C41E3A' }} />
            </div>
            <p className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
              İstanbul, Türkiye · 2026
            </p>
          </div>

          {/* Sağ — istatistikler */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: '10K+', label: 'Aktif Kullanıcı' },
              { value: '2M+', label: 'Oluşturulan Kombin' },
              { value: '%98', label: 'Kullanıcı Memnuniyeti' },
              { value: '150+', label: 'Stil Kategorisi' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl p-7 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.6) 100%)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  boxShadow: '0 16px 48px rgba(0,0,0,0.75), 0 4px 16px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.15) inset, 0 -1px 0 rgba(0,0,0,0.6) inset',
                }}>
                {/* Üst yansıma */}
                <div className="absolute top-0 left-0 right-0 h-px"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3) 50%, transparent)' }} />
                <p className="text-3xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-playfair)' }}>
                  {stat.value}
                </p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{stat.label}</p>
              </div>
            ))}
          </div>
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
    <section id="contact" className="py-28" style={{ background: '#0a0a0a' }}>
      <div className="mx-auto max-w-7xl px-6">

        {/* Header */}
        <div className="mb-16">
          <p className="text-[0.65rem] font-bold tracking-[0.25em] uppercase mb-5" style={{ color: '#C41E3A' }}>
            İletişim
          </p>
          <h2 className="font-serif italic font-light text-white leading-tight"
            style={{ fontSize: 'clamp(2.2rem, 4vw, 3.5rem)' }}>
            Bizimle iletişime geçin.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {/* E-posta */}
          <div className="rounded-2xl p-6 relative overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.6) 100%)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.10)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.75), 0 4px 16px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.15) inset, 0 -1px 0 rgba(0,0,0,0.6) inset',
            }}>
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3) 50%, transparent)' }} />
            <div className="absolute top-0 left-0 bottom-0 w-px"
              style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 50%, transparent 100%)' }} />
            <div className="mb-5 text-white/40">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <p className="text-[0.65rem] font-bold tracking-[0.2em] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>E-posta</p>
            <div className="w-8 h-px mb-4" style={{ background: '#C41E3A' }} />
            <a href="mailto:info@fashionai.com" className="text-white text-sm hover:opacity-70 transition-opacity">
              info@fashionai.com
            </a>
          </div>

          {/* Telefon */}
          <div className="rounded-2xl p-6 relative overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.6) 100%)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.10)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.75), 0 4px 16px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.15) inset, 0 -1px 0 rgba(0,0,0,0.6) inset',
            }}>
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3) 50%, transparent)' }} />
            <div className="absolute top-0 left-0 bottom-0 w-px"
              style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 50%, transparent 100%)' }} />
            <div className="mb-5 text-white/40">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
            </div>
            <p className="text-[0.65rem] font-bold tracking-[0.2em] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>Telefon</p>
            <div className="w-8 h-px mb-4" style={{ background: '#C41E3A' }} />
            <a href="tel:+902121234567" className="text-white text-sm hover:opacity-70 transition-opacity">
              +90 (212) 123 45 67
            </a>
          </div>

          {/* Adres */}
          <div className="rounded-2xl p-6 relative overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.6) 100%)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.10)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.75), 0 4px 16px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.15) inset, 0 -1px 0 rgba(0,0,0,0.6) inset',
            }}>
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3) 50%, transparent)' }} />
            <div className="absolute top-0 left-0 bottom-0 w-px"
              style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 50%, transparent 100%)' }} />
            <div className="mb-5 text-white/40">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            </div>
            <p className="text-[0.65rem] font-bold tracking-[0.2em] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>Adres</p>
            <div className="w-8 h-px mb-4" style={{ background: '#C41E3A' }} />
            <p className="text-white text-sm leading-relaxed">
              Maslak Mah. Büyükdere Cad.<br />No:255, Sarıyer / İstanbul
            </p>
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
        <span className="font-serif text-base font-bold tracking-tight text-white">
          FASHION<span style={{ color: '#C41E3A' }}>AI</span>
        </span>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
          © {new Date().getFullYear()} FashionAI. Tüm hakları saklıdır.
        </p>
        <div className="flex items-center gap-3">
          {/* Instagram */}
          <a href="#" aria-label="Instagram" className="flex h-8 w-8 items-center justify-center rounded-lg hover:opacity-70 transition-opacity" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
          </a>
          {/* TikTok */}
          <a href="#" aria-label="TikTok" className="flex h-8 w-8 items-center justify-center rounded-lg hover:opacity-70 transition-opacity" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.28 6.28 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.78a4.85 4.85 0 01-1.01-.09z"/>
            </svg>
          </a>
          {/* App Store */}
          <a href="#" aria-label="App Store" className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:opacity-70 transition-opacity" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <svg className="h-4 w-4 text-white shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            <span className="text-[0.65rem] font-semibold text-white">App Store</span>
          </a>
          {/* Google Play */}
          <a href="#" aria-label="Google Play" className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:opacity-70 transition-opacity" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <svg className="h-4 w-4 text-white shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3.18 23.76c.3.17.64.24.99.2l12.6-7.27-2.72-2.72-10.87 9.79zM.17 1.03C.06 1.3 0 1.62 0 1.98v20.04c0 .36.06.68.17.95l.09.09 11.23-11.23v-.26L.26.94l-.09.09zM20.54 10.37l-2.98-1.72-3.06 3.06 3.06 3.06 3-1.73c.86-.5.86-1.31-.02-1.67zM3.18.24L15.78 7.5l-2.72 2.73L2.19.44A1.17 1.17 0 013.18.24z"/>
            </svg>
            <span className="text-[0.65rem] font-semibold text-white">Google Play</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
