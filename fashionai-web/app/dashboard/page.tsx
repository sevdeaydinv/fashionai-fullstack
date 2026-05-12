'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { WeatherWidget } from '@/components/weather/WeatherWidget';
import { UpcomingEventsWidget } from '@/components/events/UpcomingEventsWidget';
import { createClient } from '@/lib/supabase/client';

/* ─── Design tokens ─────────────────────────────────────────────────────── */
const P = {
  bg:       '#FAF7F5',
  beige:    '#EFE4DE',
  blush:    '#D6AAA1',
  rose:     '#C98E87',
  red:      '#C41E3A',
  redDark:  '#9A0025',
  charcoal: '#1C1C1C',
  text:     '#2C2320',
  muted:    '#8A7570',
};

/* Glassmorphism base card */
const glass: React.CSSProperties = {
  background:          'rgba(255,255,255,0.68)',
  backdropFilter:      'blur(24px)',
  WebkitBackdropFilter:'blur(24px)',
  border:              '1px solid rgba(255,255,255,0.82)',
  boxShadow:           '0 8px 40px rgba(28,20,18,0.07), 0 2px 8px rgba(28,20,18,0.04), inset 0 1px 0 rgba(255,255,255,0.7)',
  borderRadius:        22,
};

const sectionLabel: React.CSSProperties = {
  color:         P.muted,
  fontSize:      '0.55rem',
  letterSpacing: '0.28em',
  textTransform: 'uppercase',
  fontWeight:    700,
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { t }   = useLanguage();

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] ?? 'there';

  /* ── Dynamic stats ────────────────────────────────────────────────── */
  const [stats, setStats] = useState({ clothes: 0, outfits: 0, events: 0 });
  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    Promise.all([
      supabase.from('clothes').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('outfits').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('events').select('id',  { count: 'exact', head: true }).eq('user_id', user.id),
    ]).then(([c, o, e]) => {
      setStats({ clothes: c.count ?? 0, outfits: o.count ?? 0, events: e.count ?? 0 });
    });
  }, [user]);

  const QUICK_ACTIONS = [
    {
      label: t.dashboard.wardrobeLabel,
      description: t.dashboard.wardrobeDesc,
      href: '/dashboard/wardrobe',
      circleColor: 'rgba(196,30,58,0.08)',
      iconColor: P.red,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} style={{ width: 26, height: 26 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 2.25c0 .966.784 1.75 1.75 1.75h2.5A1.75 1.75 0 0015 2.25M9 2.25A2.25 2.25 0 006.75 4.5v.25H3.75A1.5 1.5 0 002.25 6.25v13.5A1.5 1.5 0 003.75 21h16.5a1.5 1.5 0 001.5-1.5V6.25a1.5 1.5 0 00-1.5-1.5h-3v-.25A2.25 2.25 0 0015 2.25M9 2.25h6M12 7v4m0 0v4m0-4h4m-4 0H8" />
        </svg>
      ),
    },
    {
      label: t.dashboard.outfitLabel,
      description: t.dashboard.outfitDesc,
      href: '/dashboard/outfits',
      circleColor: 'rgba(196,30,58,0.07)',
      iconColor: P.red,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} style={{ width: 26, height: 26 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
        </svg>
      ),
    },
    {
      label: t.dashboard.beautyLabel,
      description: t.dashboard.beautyDesc,
      href: '/dashboard/beauty',
      circleColor: 'rgba(196,30,58,0.06)',
      iconColor: P.red,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} style={{ width: 26, height: 26 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75z" />
        </svg>
      ),
    },
    {
      label: t.dashboard.valizLabel,
      description: t.dashboard.valizDesc,
      href: '/dashboard/valiz',
      circleColor: 'rgba(196,30,58,0.09)',
      iconColor: P.red,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} style={{ width: 26, height: 26 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1080, paddingBottom: 56 }}>

      <style>{`
        @keyframes luxuryMarquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .lux-marquee { animation: luxuryMarquee 32s linear infinite; }

        .qa-card {
          background: rgba(255,255,255,0.68);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.82);
          box-shadow: 0 8px 40px rgba(28,20,18,0.07), 0 2px 8px rgba(28,20,18,0.04), inset 0 1px 0 rgba(255,255,255,0.7);
          border-radius: 22px;
          padding: 28px 24px;
          text-decoration: none;
          display: flex;
          flex-direction: column;
          cursor: pointer;
          transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.22s ease, background 0.18s ease;
        }
        .qa-card:hover {
          transform: translateY(-5px);
          background: rgba(255,255,255,0.88);
          box-shadow: 0 20px 60px rgba(28,20,18,0.11), 0 4px 16px rgba(28,20,18,0.06), inset 0 1px 0 rgba(255,255,255,0.9);
        }
        .qa-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 20px;
          padding: 7px 16px;
          background: #C41E3A;
          color: #FAF7F5;
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          border-radius: 100px;
          box-shadow: 0 0 20px rgba(196,30,58,0.28), 0 3px 10px rgba(196,30,58,0.2);
          transition: opacity 0.15s, box-shadow 0.15s;
          width: fit-content;
        }
        .qa-card:hover .qa-pill {
          box-shadow: 0 0 32px rgba(196,30,58,0.4), 0 4px 16px rgba(196,30,58,0.28);
        }
        .stat-card {
          background: rgba(255,255,255,0.68);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.82);
          box-shadow: 0 8px 40px rgba(28,20,18,0.07), 0 2px 8px rgba(28,20,18,0.04), inset 0 1px 0 rgba(255,255,255,0.7);
          border-radius: 18px;
          padding: 22px 22px;
          transition: transform 0.2s;
        }
        .stat-card:hover { transform: translateY(-2px); }

        /* ── Responsive grid helpers ── */
        .grid-3col { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .grid-4col { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }

        @media (max-width: 1024px) {
          .grid-4col { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .grid-3col { grid-template-columns: 1fr; }
          .grid-4col { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .qa-card   { padding: 20px 18px; border-radius: 18px; }
          .stat-card { padding: 16px 18px; border-radius: 14px; }
          .hero-text-width { width: 100% !important; }
          .hero-overlay { background: linear-gradient(to bottom, rgba(18,8,6,0.7) 0%, rgba(18,8,6,0.55) 60%, transparent 100%) !important; }
          .hero-padding  { padding: 32px 24px !important; min-height: 260px !important; }
          .hero-title    { font-size: 1.55rem !important; }
          .hero-desc     { display: none; }
          .ticker-hide   { display: none; }
        }
        @media (max-width: 480px) {
          .grid-4col { grid-template-columns: 1fr 1fr; gap: 8px; }
          .hero-title { font-size: 1.35rem !important; }
        }
      `}</style>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* HERO CARD — cinematic floating banner (image reference style)      */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div style={{
        borderRadius:  22,
        overflow:      'hidden',
        marginBottom:  18,
        boxShadow:     '0 32px 80px rgba(20,10,8,0.18), 0 8px 32px rgba(20,10,8,0.10)',
        position:      'relative',
        minHeight:     340,
        background:    '#1A0F0E',
      }}>
        {/* Full-bleed video — GPU-accelerated, no quality degradation */}
        <video
          src="/promo.mp4"
          autoPlay muted loop playsInline
          style={{
            position:        'absolute',
            inset:            0,
            width:            '100%',
            height:           '100%',
            objectFit:       'cover',
            objectPosition:  'center top',
            transform:       'translateZ(0)',
            willChange:      'transform',
            filter:          'none',
            imageRendering:  'high-quality' as React.CSSProperties['imageRendering'],
          }}
        />

        {/* Left dark gradient */}
        <div className="hero-overlay" style={{
          position:      'absolute',
          inset:          0,
          background:    'linear-gradient(to right, rgba(18,8,6,0.96) 0%, rgba(18,8,6,0.84) 24%, rgba(18,8,6,0.4) 44%, rgba(18,8,6,0.06) 62%, transparent 72%)',
          pointerEvents: 'none',
        }} />

        {/* Left text content */}
        <div className="hero-text-width hero-padding" style={{
          position:        'relative',
          zIndex:          2,
          width:           '42%',
          padding:         '44px 0 44px 44px',
          display:         'flex',
          flexDirection:   'column',
          justifyContent:  'center',
          minHeight:       340,
        }}>
          <p style={{ color: P.red, fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 14 }}>
            AI STİL ASISTANI
          </p>
          <h1 className="hero-title" style={{
            color:         '#FAF7F5',
            fontFamily:    'Georgia, "Times New Roman", serif',
            fontWeight:    700,
            fontSize:      '2.05rem',
            lineHeight:    1.18,
            marginBottom:  14,
            letterSpacing: '-0.01em',
          }}>
            Kişiselleştirilmiş<br />stilini oluştur
          </h1>
          <p className="hero-desc" style={{ color: 'rgba(250,247,245,0.5)', fontSize: '0.78rem', lineHeight: 1.65, marginBottom: 30, maxWidth: 240 }}>
            AI önerileriyle sana en uygun kombinleri keşfetmeye başla.
          </p>
          <a href="/dashboard/outfits" style={{
            display:        'inline-flex',
            alignItems:     'center',
            gap:            8,
            padding:        '11px 24px',
            background:     P.red,
            color:          '#FAF7F5',
            fontSize:       '0.7rem',
            fontWeight:     600,
            letterSpacing:  '0.05em',
            borderRadius:   10,
            boxShadow:      '0 4px 18px rgba(196,30,58,0.38)',
            textDecoration: 'none',
            width:          'fit-content',
            transition:     'opacity 0.15s',
          }}>
            Stilini Keşfet
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M2.5 6.5h8M7 3L10.5 6.5 7 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>

      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TICKER ─ luxury marquee                                           */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="ticker-hide" style={{
        overflow:     'hidden',
        marginBottom: 18,
        borderRadius: 12,
        background:   'rgba(255,255,255,0.44)',
        backdropFilter:'blur(16px)',
        WebkitBackdropFilter:'blur(16px)',
        border:       '1px solid rgba(255,255,255,0.7)',
        padding:      '11px 0',
        boxShadow:    '0 4px 20px rgba(28,20,18,0.05)',
      }}>
        <div className="lux-marquee" style={{ display: 'flex', whiteSpace: 'nowrap' }}>
          {[...Array(6)].map((_, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 24, marginRight: 24, fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: `rgba(44,35,32,0.28)` }}>
              <span style={{ color: P.red, fontSize: '0.55rem' }}>✦</span>
              <span>Ücretsiz başla, kredi kartı gerekmez</span>
              <span style={{ color: P.red, fontSize: '0.55rem' }}>✦</span>
              <span>Hava durumuna göre otomatik öneri</span>
              <span style={{ color: P.red, fontSize: '0.55rem' }}>✦</span>
              <span>Hem kadın hem erkek modaları</span>
              <span style={{ color: P.red, fontSize: '0.55rem' }}>✦</span>
              <span>AI destekli kişisel stil danışmanı</span>
            </span>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 3 INFO CARDS — Weather · Events · AI Recommendation               */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <p style={{ ...sectionLabel, marginBottom: 12 }}>Günlük Özet</p>
      <div className="grid-3col" style={{ marginBottom: 28 }}>

        {/* ── Weather card ── */}
        <div style={{
          ...glass,
          overflow: 'hidden',
          position: 'relative',
          background: 'linear-gradient(145deg, rgba(255,248,242,0.88) 0%, rgba(255,235,218,0.82) 50%, rgba(255,220,200,0.78) 100%)',
          border: '1px solid rgba(255,220,200,0.7)',
          boxShadow: '0 8px 40px rgba(201,120,80,0.09), 0 0 0 0.5px rgba(255,200,175,0.4), inset 0 1px 0 rgba(255,255,255,0.7)',
        }}>
          {/* Glow orb */}
          <div style={{
            position:   'absolute',
            top:        -30,
            right:      -20,
            width:      120,
            height:     120,
            background: 'radial-gradient(circle, rgba(255,200,140,0.35) 0%, transparent 70%)',
            borderRadius:'50%',
            pointerEvents:'none',
          }} />
          <WeatherWidget />
        </div>

        {/* ── Events card ── */}
        <div style={{
          ...glass,
          overflow: 'hidden',
          position: 'relative',
        }}>
          <UpcomingEventsWidget />
        </div>

        {/* ── AI Recommendation card ── */}
        <div style={{
          ...glass,
          padding:  '26px 22px',
          display:  'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(145deg, rgba(255,255,255,0.72) 0%, rgba(239,228,222,0.55) 100%)',
        }}>
          {/* Glow */}
          <div style={{
            position:   'absolute',
            bottom:     -40,
            right:      -20,
            width:      160,
            height:     160,
            background: 'radial-gradient(circle, rgba(201,142,135,0.18) 0%, transparent 70%)',
            borderRadius:'50%',
            pointerEvents:'none',
          }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{
              width:        30,
              height:       30,
              borderRadius: '50%',
              background:   'rgba(196,30,58,0.08)',
              border:       '1px solid rgba(196,30,58,0.2)',
              display:      'flex',
              alignItems:   'center',
              justifyContent:'center',
              color:        P.red,
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ width: 14, height: 14 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <p style={{ ...sectionLabel, color: P.red }}>AI Öneri</p>
          </div>

          <p style={{ color: P.text, fontSize: '0.85rem', fontWeight: 700, fontFamily: 'Georgia, serif', lineHeight: 1.4, marginBottom: 10 }}>
            Bugün için Stil İpucu
          </p>
          <p style={{ color: P.muted, fontSize: '0.73rem', lineHeight: 1.65, flex: 1 }}>
            Dolabını ekle, yapay zeka hava durumuna ve etkinlik takvimine göre kişisel kombinini hazırlasın.
          </p>

          {/* Fashion item pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, margin: '14px 0' }}>
            {['Blazer', 'Çanta', 'Ayakkabı'].map(item => (
              <span key={item} style={{
                padding:       '4px 10px',
                background:    'rgba(239,228,222,0.8)',
                border:        '1px solid rgba(214,170,161,0.4)',
                borderRadius:  100,
                color:         P.text,
                fontSize:      '0.62rem',
                fontWeight:    600,
                letterSpacing: '0.05em',
              }}>
                {item}
              </span>
            ))}
          </div>

          <a href="/dashboard/outfits" style={{
            display:       'inline-flex',
            alignItems:    'center',
            gap:           6,
            padding:       '8px 16px',
            background:    P.beige,
            border:        '1px solid rgba(196,30,58,0.2)',
            borderRadius:  100,
            color:         P.red,
            fontSize:      '0.6rem',
            fontWeight:    700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            textDecoration:'none',
            width:         'fit-content',
            transition:    'background 0.15s',
          }}>
            Keşfet
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5h6M5.5 2.5L8 5l-2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 4 QUICK ACTION CARDS                                               */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <p style={{ ...sectionLabel, marginBottom: 12 }}>{t.dashboard.quickActions}</p>
      <div className="grid-4col" style={{ marginBottom: 32 }}>
        {QUICK_ACTIONS.map((action) => (
          <a key={action.label} href={action.href} className="qa-card">
            {/* Circle icon */}
            <div style={{
              width:          52,
              height:         52,
              borderRadius:   '50%',
              background:     action.circleColor,
              border:         '1px solid rgba(196,30,58,0.15)',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              color:          action.iconColor,
              boxShadow:      '0 4px 16px rgba(28,20,18,0.06)',
              transition:     'transform 0.2s',
            }}>
              {action.icon}
            </div>

            <div style={{ marginTop: 18, flex: 1 }}>
              <p style={{ color: P.text, fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 7 }}>
                {action.label}
              </p>
              <p style={{ color: P.muted, fontSize: '0.72rem', lineHeight: 1.6 }}>
                {action.description}
              </p>
            </div>

            <span className="qa-pill">
              Keşfet
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5h6M5.5 2.5L8 5l-2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </a>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* STATS ROW                                                          */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <p style={{ ...sectionLabel, marginBottom: 12 }}>{t.dashboard.yourStats}</p>
      <div className="grid-4col">
        {[
          { label: t.dashboard.clothingItems, value: String(stats.clothes), icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} style={{ width: 18, height: 18 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-8.25z" />
            </svg>
          )},
          { label: t.dashboard.outfitsSaved, value: String(stats.outfits), icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} style={{ width: 18, height: 18 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          )},
          { label: t.dashboard.eventsPlanned, value: String(stats.events), icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} style={{ width: 18, height: 18 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          )},
          { label: t.dashboard.styleScore, value: stats.clothes > 0 ? `${Math.min(100, Math.round((stats.outfits / Math.max(stats.clothes, 1)) * 200))}` : '—', icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} style={{ width: 18, height: 18 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          )},
        ].map((stat) => (
          <div key={stat.label} className="stat-card">
            <div style={{
              width:          34,
              height:         34,
              borderRadius:   10,
              background:     'rgba(196,30,58,0.08)',
              border:         '1px solid rgba(196,30,58,0.15)',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              color:          P.red,
            }}>
              {stat.icon}
            </div>
            <p style={{
              color:      P.charcoal,
              fontFamily: 'Georgia, serif',
              fontWeight: 700,
              fontSize:   '1.75rem',
              marginTop:  '0.9rem',
              letterSpacing: '-0.02em',
            }}>
              {stat.value}
            </p>
            <p style={{ ...sectionLabel, marginTop: 4 }}>{stat.label}</p>
          </div>
        ))}
      </div>

    </div>
  );
}
