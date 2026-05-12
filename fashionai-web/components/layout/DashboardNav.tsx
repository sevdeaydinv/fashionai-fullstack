'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createPortal } from 'react-dom';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAuth } from '@/lib/hooks/useAuth';

/* ─── Thin modern icons ─────────────────────────────────────────────────── */
const ICONS: Record<string, React.ReactNode> = {
  '/dashboard': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} style={{ width: 15, height: 15 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  ),
  '/dashboard/wardrobe': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} style={{ width: 15, height: 15 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 2.25c0 .966.784 1.75 1.75 1.75h2.5A1.75 1.75 0 0015 2.25M9 2.25A2.25 2.25 0 006.75 4.5v.25H3.75A1.5 1.5 0 002.25 6.25v13.5A1.5 1.5 0 003.75 21h16.5a1.5 1.5 0 001.5-1.5V6.25a1.5 1.5 0 00-1.5-1.5h-3v-.25A2.25 2.25 0 0015 2.25M9 2.25h6" />
    </svg>
  ),
  '/dashboard/outfits': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} style={{ width: 15, height: 15 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
  ),
  '/dashboard/kesfet': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} style={{ width: 15, height: 15 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  ),
  '/dashboard/beauty': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} style={{ width: 15, height: 15 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75z" />
    </svg>
  ),
  '/dashboard/events': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} style={{ width: 15, height: 15 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  ),
  '/dashboard/valiz': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} style={{ width: 15, height: 15 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  ),
  '/dashboard/profile': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} style={{ width: 15, height: 15 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

export function DashboardNav() {
  const pathname  = usePathname();
  const { t }    = useLanguage();
  const { user } = useAuth();
  const [collapsed, setCollapsed]       = useState(false);
  const [premiumModal, setPremiumModal] = useState(false);

  const userInitial = user?.email?.charAt(0).toUpperCase() ?? '?';
  const userName    = user?.user_metadata?.full_name?.split(' ')[0]
                   ?? user?.email?.split('@')[0]
                   ?? 'Kullanıcı';

  const NAV_SECTIONS = [
    {
      label: t.dashboardNav.main,
      items: [
        { label: t.dashboardNav.home,     href: '/dashboard' },
        { label: t.dashboardNav.wardrobe, href: '/dashboard/wardrobe' },
        { label: t.dashboardNav.outfits,  href: '/dashboard/outfits' },
      ],
    },
    {
      label: t.dashboardNav.style,
      items: [
        { label: 'Keşfet',                 href: '/dashboard/kesfet' },
        { label: t.dashboardNav.beauty,    href: '/dashboard/beauty' },
        { label: t.dashboardNav.events,    href: '/dashboard/events' },
        { label: t.dashboardNav.valizModu, href: '/dashboard/valiz' },
      ],
    },
    {
      label: t.dashboardNav.account,
      items: [
        { label: t.dashboardNav.profile, href: '/dashboard/profile' },
      ],
    },
  ];

  return (
    <>
      <style>{`
        .dnav-item {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 7px 11px;
          border-radius: 10px;
          font-size: 0.78rem;
          font-weight: 400;
          letter-spacing: 0.01em;
          white-space: nowrap;
          text-decoration: none;
          transition: background 0.18s, color 0.18s, box-shadow 0.18s;
          color: rgba(255,255,255,0.42);
          position: relative;
          overflow: hidden;
        }
        .dnav-item:hover {
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.75);
        }
        .dnav-item.active {
          background: rgba(196,30,58,0.14);
          color: #FAF7F5;
          font-weight: 600;
          box-shadow: inset 0 0 0 1px rgba(196,30,58,0.18), 0 4px 24px rgba(196,30,58,0.1);
        }
        .dnav-item.active::before {
          content: '';
          position: absolute;
          left: 0; top: 20%; bottom: 20%;
          width: 2.5px;
          background: #C41E3A;
          border-radius: 0 2px 2px 0;
        }
        .dnav-item.collapsed-item {
          padding: 8px 0;
          justify-content: center;
          border-radius: 10px;
        }
        .dnav-toggle:hover { color: rgba(255,255,255,0.6) !important; }
      `}</style>

      <aside
        className="hidden lg:flex flex-col shrink-0 sticky top-0 pt-16"
        style={{
          width:       collapsed ? 58 : 226,
          minHeight:   '100vh',
          transition:  'width 0.28s cubic-bezier(0.4,0,0.2,1)',
          background:  'linear-gradient(180deg, #150F0D 0%, #0E0908 55%, #150F0D 100%)',
          borderRight: '1px solid rgba(255,255,255,0.04)',
          overflow:    'hidden',
          position:    'relative',
          flexShrink:  0,
        }}
      >
        {/* Ambient glow orb */}
        <div style={{
          position:     'absolute',
          top:          60,
          left:         '50%',
          transform:    'translateX(-50%)',
          width:        180,
          height:       180,
          background:   'radial-gradient(circle, rgba(196,30,58,0.1) 0%, transparent 70%)',
          pointerEvents:'none',
          borderRadius: '50%',
          filter:       'blur(20px)',
        }} />

        {/* ── Collapse toggle ─────────────────────────────────────────── */}
        <button
          onClick={() => setCollapsed(v => !v)}
          className="dnav-toggle"
          style={{
            position:   'absolute',
            top:        20,
            right:      collapsed ? '50%' : 10,
            transform:  collapsed ? 'translateX(50%)' : 'none',
            background: 'none',
            border:     'none',
            padding:    4,
            cursor:     'pointer',
            color:      'rgba(255,255,255,0.18)',
            transition: 'color 0.15s, right 0.28s, transform 0.28s',
            zIndex:     2,
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 13, height: 13, transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.28s' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        {/* ── Navigation ──────────────────────────────────────────────── */}
        <nav style={{
          padding:   collapsed ? '14px 8px' : '14px 14px',
          display:   'flex',
          flexDirection: 'column',
          gap:       22,
          overflowX: 'hidden',
        }}>
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {section.items.map((item) => {
                  const isActive = item.href === '/dashboard'
                    ? pathname === '/dashboard'
                    : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={`dnav-item${isActive ? ' active' : ''}${collapsed ? ' collapsed-item' : ''}`}
                      style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
                    >
                      <span style={{
                        color:     isActive ? '#C41E3A' : 'rgba(255,255,255,0.28)',
                        flexShrink: 0,
                        transition: 'color 0.18s',
                      }}>
                        {ICONS[item.href]}
                      </span>
                      {!collapsed && item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* ── Premium membership card ─────────────────────────────────── */}
        {!collapsed && (
          <button
            onClick={() => setPremiumModal(true)}
            style={{
              margin:     '0 12px 14px',
              padding:    '14px 16px',
              background: 'linear-gradient(135deg, rgba(196,30,58,0.18) 0%, rgba(196,30,58,0.06) 100%)',
              backdropFilter: 'blur(12px)',
              border:     '1px solid rgba(196,30,58,0.2)',
              borderRadius: 14,
              boxShadow:  '0 4px 24px rgba(196,30,58,0.1), inset 0 1px 0 rgba(255,255,255,0.04)',
              flexShrink: 0,
              cursor:     'pointer',
              textAlign:  'left',
              width:      'calc(100% - 24px)',
              transition: 'border-color 0.15s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <p style={{ color: '#C41E3A', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase' }}>
                Premium
              </p>
              <svg viewBox="0 0 24 24" fill="none" stroke="#C41E3A" strokeWidth={1.5} style={{ width: 13, height: 13 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            </div>
            <p style={{ color: 'rgba(250,247,245,0.55)', fontSize: '0.68rem', lineHeight: 1.5, marginBottom: 12 }}>
              Tüm özelliklere sınırsız erişim
            </p>
            <div style={{
              width:         '100%',
              padding:       '7px 0',
              background:    '#C41E3A',
              color:         '#FAF7F5',
              fontSize:      '0.58rem',
              fontWeight:    700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              border:        'none',
              borderRadius:  8,
              textAlign:     'center',
              boxShadow:     '0 2px 12px rgba(196,30,58,0.3)',
            }}>
              Yükselt
            </div>
          </button>
        )}

        {/* ── Profile ─────────────────────────────────────────────────── */}
        <div style={{
          padding:    collapsed ? '12px 8px' : '12px 16px',
          borderTop:  '1px solid rgba(255,255,255,0.04)',
          display:    'flex',
          alignItems: 'center',
          gap:        10,
          justifyContent: collapsed ? 'center' : 'flex-start',
          flexShrink: 0,
        }}>
          <div style={{
            width:      32,
            height:     32,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #9A0025 0%, #C41E3A 100%)',
            display:    'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color:      '#FAF7F5',
            fontSize:   '0.7rem',
            fontWeight: 700,
            flexShrink: 0,
            boxShadow:  '0 0 0 1px rgba(196,30,58,0.3)',
          }}>
            {userInitial}
          </div>
          {!collapsed && (
            <div style={{ overflow: 'hidden' }}>
              <p style={{ color: '#F5EDE8', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {userName}
              </p>
              <p style={{ color: 'rgba(214,170,161,0.45)', fontSize: '0.6rem', letterSpacing: '0.05em' }}>
                Premium üye
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* ── Premium Modal ────────────────────────────────────────────── */}
      {premiumModal && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setPremiumModal(false)}
          style={{
            position:   'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(4px)',
            display:    'flex', alignItems: 'center', justifyContent: 'center',
            padding:    24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background:   '#FFFFFF',
              borderRadius: 24,
              padding:      '36px 36px 32px',
              maxWidth:     640,
              width:        '100%',
              boxShadow:    '0 32px 80px rgba(0,0,0,0.22)',
              position:     'relative',
            }}
          >
            {/* Close */}
            <button
              onClick={() => setPremiumModal(false)}
              style={{
                position: 'absolute', top: 18, right: 18,
                background: '#F5F2EE', border: 'none', borderRadius: 10,
                width: 32, height: 32, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#706A64',
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'linear-gradient(135deg, #9a1530 0%, #C41E3A 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.6} style={{ width: 18, height: 18 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              </div>
              <div>
                <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#141210', letterSpacing: '-0.01em' }}>
                  Premium Özellikler
                </p>
                <p style={{ fontSize: '0.8rem', color: '#9E9690', marginTop: 1 }}>
                  Yakında gelecek yenilikler
                </p>
              </div>
            </div>

            <div style={{ height: 1, background: '#F0EBE6', margin: '20px 0 24px' }} />

            {/* Feature cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* VR */}
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 16,
                background: 'linear-gradient(135deg, #FAF7F5 0%, #F5EDE8 100%)',
                border: '1px solid rgba(196,30,58,0.1)',
                borderRadius: 16, padding: '18px 20px',
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                  background: 'linear-gradient(135deg, rgba(196,30,58,0.12) 0%, rgba(196,30,58,0.06) 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#C41E3A" strokeWidth={1.6} style={{ width: 22, height: 22 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.5h19.5M9 12h.008v.008H9V12zm6 0h.008v.008H15V12zM3 7.5a.75.75 0 00-.75.75v7.5c0 .414.336.75.75.75h18a.75.75 0 00.75-.75v-7.5A.75.75 0 0021 7.5H3zM7.5 4.5h9" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                    <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#141210' }}>Sanal Gerçeklik ile Kombin Deneme</p>
                    <span style={{
                      fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em',
                      background: 'rgba(196,30,58,0.1)', color: '#C41E3A',
                      border: '1px solid rgba(196,30,58,0.2)', borderRadius: 6, padding: '2px 7px',
                      textTransform: 'uppercase',
                    }}>Yakında</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#706A64', lineHeight: 1.55 }}>
                    VR gözlüğü veya kamera ile kıyafetleri satın almadan önce üstünde dene, kombinleri gerçek zamanlı görüntüle.
                  </p>
                </div>
              </div>

              {/* Çocuk Modu */}
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 16,
                background: 'linear-gradient(135deg, #FAF7F5 0%, #F5EDE8 100%)',
                border: '1px solid rgba(196,30,58,0.1)',
                borderRadius: 16, padding: '18px 20px',
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                  background: 'linear-gradient(135deg, rgba(196,30,58,0.12) 0%, rgba(196,30,58,0.06) 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#C41E3A" strokeWidth={1.6} style={{ width: 22, height: 22 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9a3.75 3.75 0 100-7.5A3.75 3.75 0 0012 9zm-6.75 12h13.5c.621 0 1.125-.504 1.125-1.125v-.75C19.875 15.254 16.32 12 12 12s-7.875 3.254-7.875 7.125v.75c0 .621.504 1.125 1.125 1.125z" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                    <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#141210' }}>Çocuk Modu</p>
                    <span style={{
                      fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em',
                      background: 'rgba(196,30,58,0.1)', color: '#C41E3A',
                      border: '1px solid rgba(196,30,58,0.2)', borderRadius: 6, padding: '2px 7px',
                      textTransform: 'uppercase',
                    }}>Yakında</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#706A64', lineHeight: 1.55 }}>
                    Çocuklarınız için ayrı dolap yönetimi, yaşa uygun kombin önerileri ve ebeveyn kontrol paneli.
                  </p>
                </div>
              </div>

              {/* AI Makyaj */}
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 16,
                background: 'linear-gradient(135deg, #FAF7F5 0%, #F5EDE8 100%)',
                border: '1px solid rgba(196,30,58,0.1)',
                borderRadius: 16, padding: '18px 20px',
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                  background: 'linear-gradient(135deg, rgba(196,30,58,0.12) 0%, rgba(196,30,58,0.06) 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#C41E3A" strokeWidth={1.6} style={{ width: 22, height: 22 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                    <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#141210' }}>Yüz Fotoğrafına Direkt Makyaj Uygulama</p>
                    <span style={{
                      fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em',
                      background: 'rgba(196,30,58,0.1)', color: '#C41E3A',
                      border: '1px solid rgba(196,30,58,0.2)', borderRadius: 6, padding: '2px 7px',
                      textTransform: 'uppercase',
                    }}>Yakında</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#706A64', lineHeight: 1.55 }}>
                    Fotoğrafının üzerine yapay zeka ile farklı makyaj lookları dene, beğendiğin stili kaydet ve uygulama adımlarını al.
                  </p>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div style={{ marginTop: 28, display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={() => setPremiumModal(false)}
                style={{
                  padding: '11px 40px',
                  background: 'linear-gradient(135deg, #9a1530 0%, #C41E3A 100%)',
                  color: 'white', border: 'none', borderRadius: 12,
                  fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(196,30,58,0.3)',
                }}
              >
                Yakında Geliyor ✨
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
