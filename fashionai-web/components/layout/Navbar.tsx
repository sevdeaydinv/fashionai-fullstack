'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

const NAV_LINKS = [
  { label: 'Anasayfa',     href: '/' },
  { label: 'Özellikler',   href: '/#features' },
  { label: 'Nasıl Çalışır', href: '/#how-it-works' },
  { label: 'Hakkımızda',   href: '/#about' },
  { label: 'İletişim',     href: '/#contact' },
];

export function Navbar() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isDark = pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
    router.refresh();
  };

  const userInitial = user?.email?.charAt(0).toUpperCase() ?? '?';

  /* Scrolled veya dashboard → koyu solid; hero üzerinde → transparan */
  const isScrolledOrDashboard = scrolled || !isDark;

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        background: isScrolledOrDashboard
          ? 'rgba(10,10,10,0.92)'
          : 'transparent',
        backdropFilter: isScrolledOrDashboard ? 'blur(16px)' : 'none',
        borderBottom: isScrolledOrDashboard ? '1px solid rgba(255,255,255,0.06)' : 'none',
      }}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

        {/* ── Logo */}
        <Link href="/" className="shrink-0">
          <span className="font-serif text-lg font-bold tracking-tight text-white">
            FASHION<span style={{ color: '#C41E3A' }}>AI</span>
          </span>
        </Link>

        {/* ── Desktop nav links — sadece landing */}
        {pathname === '/' && (
          <ul className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="group relative text-[0.7rem] font-bold tracking-[0.15em] uppercase text-white/80 transition-colors duration-200 hover:text-white"
                >
                  {link.label}
                  {/* Hover underline */}
                  <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-white transition-all duration-300 group-hover:w-full" />
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* ── Dashboard nav links */}
        {user && pathname.startsWith('/dashboard') && (
          <ul className="hidden md:flex items-center gap-7">
            {[
              { label: 'Home',     href: '/dashboard' },
              { label: 'Wardrobe', href: '/dashboard/wardrobe' },
              { label: 'Outfits',  href: '/dashboard/outfits' },
              { label: 'Beauty',   href: '/dashboard/beauty' },
              { label: 'Events',   href: '/dashboard/events' },
            ].map((link) => {
              const active = link.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={[
                      'group relative text-[0.7rem] font-bold tracking-[0.15em] uppercase transition-colors duration-200',
                      active ? 'text-white' : 'text-white/55 hover:text-white',
                    ].join(' ')}
                  >
                    {link.label}
                    {active && (
                      <span className="absolute -bottom-0.5 left-0 h-px w-full bg-white" />
                    )}
                    {!active && (
                      <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-white/50 transition-all duration-300 group-hover:w-full" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {/* ── Sağ: ikonlar */}
        <div className="flex items-center gap-5">


          {/* Profil / kullanıcı */}
          {loading ? (
            <div className="h-5 w-5 rounded-full animate-pulse bg-white/20" />
          ) : user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(v => !v)}
                className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors duration-200"
                aria-label="Profil"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/30 bg-white/10 text-xs font-bold text-white">
                  {userInitial}
                </span>
                <svg className={`h-3 w-3 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-3 w-52 overflow-hidden shadow-2xl"
                  style={{ background: 'rgba(10,10,10,0.96)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                    <p className="text-[0.6rem] font-bold tracking-widest uppercase text-white/30">Hesap</p>
                    <p className="text-xs text-white/60 mt-0.5 truncate">{user.email}</p>
                  </div>
                  <div className="py-1">
                    <Link href="/dashboard"
                      className="flex items-center px-4 py-2.5 text-xs text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                      Dashboard
                    </Link>
                    <Link href="/dashboard/profile"
                      className="flex items-center px-4 py-2.5 text-xs text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                      Profil & Ayarlar
                    </Link>
                    <div className="border-t mt-1 pt-1" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                      <button onClick={handleSignOut}
                        className="w-full text-left px-4 py-2.5 text-xs transition-colors hover:bg-white/5"
                        style={{ color: '#C41E3A' }}>
                        Çıkış Yap
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-4">
              <Link href="/login"
                className="text-[0.7rem] font-bold tracking-[0.15em] uppercase text-white/70 hover:text-white transition-colors duration-200">
                Giriş
              </Link>
              <Link href="/register"
                className="text-[0.7rem] font-bold tracking-[0.15em] uppercase text-white px-5 py-2 transition-all hover:opacity-80"
                style={{ background: '#C41E3A' }}>
                Başla
              </Link>
            </div>
          )}

          {/* Mobil hamburger */}
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="md:hidden text-white/70 hover:text-white transition-colors"
            aria-label="Menü"
          >
            {mobileOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* ── Mobil menü */}
      {mobileOpen && (
        <div className="md:hidden" style={{ background: 'rgba(10,10,10,0.97)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="px-6 py-5 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href}
                className="block py-3 text-[0.7rem] font-bold tracking-[0.15em] uppercase text-white/70 hover:text-white transition-colors border-b"
                style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                {link.label}
              </Link>
            ))}
            {!user && (
              <div className="pt-5 flex flex-col gap-3">
                <Link href="/login"
                  className="block text-center py-3 border text-[0.7rem] font-bold tracking-[0.15em] uppercase text-white transition-colors hover:bg-white/5"
                  style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
                  Giriş Yap
                </Link>
                <Link href="/register"
                  className="block text-center py-3 text-[0.7rem] font-bold tracking-[0.15em] uppercase text-white transition-opacity hover:opacity-80"
                  style={{ background: '#C41E3A' }}>
                  Ücretsiz Başla
                </Link>
              </div>
            )}
            {user && (
              <button onClick={handleSignOut}
                className="w-full text-left pt-4 py-3 text-[0.7rem] font-bold tracking-[0.15em] uppercase transition-colors"
                style={{ color: '#C41E3A' }}>
                Çıkış Yap
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
