'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Ana Sayfa',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} style={{ width: 22, height: 22 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
      </svg>
    ),
  },
  {
    href: '/dashboard/wardrobe',
    label: 'Dolap',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} style={{ width: 22, height: 22 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 2.25c0 .966.784 1.75 1.75 1.75h2.5A1.75 1.75 0 0015 2.25M9 2.25A2.25 2.25 0 006.75 4.5v.25H3.75A1.5 1.5 0 002.25 6.25v13.5A1.5 1.5 0 003.75 21h16.5a1.5 1.5 0 001.5-1.5V6.25a1.5 1.5 0 00-1.5-1.5h-3v-.25A2.25 2.25 0 0015 2.25M9 2.25h6" />
      </svg>
    ),
  },
  {
    href: '/dashboard/outfits',
    label: 'Kombinler',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} style={{ width: 22, height: 22 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
  },
  {
    href: '/dashboard/beauty',
    label: 'Güzellik',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} style={{ width: 22, height: 22 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75z" />
      </svg>
    ),
  },
  {
    href: '/dashboard/profile',
    label: 'Profil',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} style={{ width: 22, height: 22 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{
        background:    'rgba(21,15,13,0.97)',
        backdropFilter:'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop:     '1px solid rgba(255,255,255,0.06)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', height: 60 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display:        'flex',
                flexDirection:  'column',
                alignItems:     'center',
                gap:            3,
                padding:        '6px 12px',
                borderRadius:   10,
                color:          isActive ? '#C41E3A' : 'rgba(255,255,255,0.35)',
                textDecoration: 'none',
                transition:     'color 0.15s',
                minWidth:       48,
              }}
            >
              {item.icon}
              <span style={{ fontSize: '0.6rem', fontWeight: isActive ? 700 : 400, letterSpacing: '0.03em' }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
