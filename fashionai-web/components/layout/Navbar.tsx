'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export function Navbar() {
  const { user, loading, signOut } = useAuth();
  const { lang, t, setLang } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isDark = pathname === '/';

  const NAV_LINKS = [
    { label: t.nav.home,       href: '/' },
    { label: t.nav.features,   href: '/#features' },
    { label: t.nav.howItWorks, href: '/#how-it-works' },
    { label: t.nav.about,      href: '/#about' },
    { label: t.nav.contact,    href: '/#contact' },
  ];

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
          ? 'rgba(28,25,23,0.92)'
          : 'transparent',
        backdropFilter: isScrolledOrDashboard ? 'blur(16px)' : 'none',
        borderBottom: isScrolledOrDashboard ? '1px solid rgba(255,255,255,0.06)' : 'none',
      }}
    >
      <nav className="flex h-16 w-full items-center justify-between px-6">

        {/* ── Logo */}
        <Link href="/" className="shrink-0 flex items-center gap-3">
          {/* Amblem — elmas + yapay zeka kıvılcımı */}
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Dış elmas */}
            <path d="M16 2L28 10V22L16 30L4 22V10L16 2Z" fill="#C41E3A" fillOpacity="0.12" stroke="#C41E3A" strokeWidth="1.2"/>
            {/* İç elmas */}
            <path d="M16 8L23 13V19L16 24L9 19V13L16 8Z" fill="#C41E3A" fillOpacity="0.2" stroke="#C41E3A" strokeWidth="1"/>
            {/* Merkez yıldız / kıvılcım */}
            <path d="M16 12.5L17.2 15.2L20 16L17.2 16.8L16 19.5L14.8 16.8L12 16L14.8 15.2L16 12.5Z" fill="#C41E3A"/>
          </svg>
          {/* Wordmark — eski stil, büyütülmüş */}
          <span style={{ fontFamily: 'serif', fontSize: '1.35rem', fontWeight: 700, letterSpacing: '-0.01em', color: '#fff' }}>
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
              { label: t.nav.home,     href: '/dashboard' },
              { label: t.nav.wardrobe, href: '/dashboard/wardrobe' },
              { label: t.nav.outfits,  href: '/dashboard/outfits' },
              { label: t.nav.beauty,   href: '/dashboard/beauty' },
              { label: t.nav.events,   href: '/dashboard/events' },
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
                      active ? 'text-white' : 'text-white/80 hover:text-white',
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

          {/* Language switcher */}
          <div className="flex items-center gap-1 text-[0.65rem] font-bold tracking-widest">
            <button onClick={() => setLang('tr')} style={{ color: lang === 'tr' ? 'white' : 'rgba(255,255,255,0.65)', transition: 'color 0.2s', background: 'none', border: 'none', cursor: 'pointer' }}>TR</button>
            <span style={{ color: 'rgba(255,255,255,0.35)' }}>|</span>
            <button onClick={() => setLang('en')} style={{ color: lang === 'en' ? 'white' : 'rgba(255,255,255,0.65)', transition: 'color 0.2s', background: 'none', border: 'none', cursor: 'pointer' }}>EN</button>
          </div>

          {/* Profil / kullanıcı */}
          {/* Separator — only on landing when not logged in */}
          {!loading && !user && pathname === '/' && (
            <div className="hidden sm:block h-4 w-px" style={{ background: 'rgba(255,255,255,0.15)' }} />
          )}

          {loading ? (
            <div className="h-5 w-5 rounded-full animate-pulse bg-white/20" />
          ) : user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(v => !v)}
                className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors duration-200"
                aria-label={t.nav.profileAriaLabel}
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
                    <p className="text-[0.6rem] font-bold tracking-widest uppercase text-white/30">{t.nav.account}</p>
                    <p className="text-xs text-white/60 mt-0.5 truncate">{user.email}</p>
                  </div>
                  <div className="py-1">
                    <Link href="/dashboard"
                      className="flex items-center px-4 py-2.5 text-xs text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                      {t.nav.dashboard}
                    </Link>
                    <Link href="/dashboard/profile"
                      className="flex items-center px-4 py-2.5 text-xs text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                      {t.nav.profileSettings}
                    </Link>
                    <div className="border-t mt-1 pt-1" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                      <button onClick={handleSignOut}
                        className="w-full text-left px-4 py-2.5 text-xs transition-colors hover:bg-white/5"
                        style={{ color: '#C41E3A' }}>
                        {t.nav.signOut}
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
                {t.nav.signIn}
              </Link>
              <Link href="/register"
                className="text-[0.7rem] font-bold tracking-[0.15em] uppercase text-white px-6 py-2 rounded-full transition-all hover:opacity-80"
                style={{ background: '#C41E3A' }}>
                {t.nav.getStarted}
              </Link>
            </div>
          )}

          {/* Mobil hamburger */}
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="md:hidden text-white/70 hover:text-white transition-colors"
            aria-label={t.nav.menuAriaLabel}
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
        <div className="md:hidden" style={{ background: 'rgba(28,25,23,0.97)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="px-6 py-5 space-y-1">
            {/* Landing sayfası linkleri */}
            {pathname === '/' && NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href}
                className="block py-3 text-[0.7rem] font-bold tracking-[0.15em] uppercase text-white/70 hover:text-white transition-colors border-b"
                style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                {link.label}
              </Link>
            ))}
            {/* Dashboard linkleri */}
            {user && pathname.startsWith('/dashboard') && [
              { label: t.nav.home,     href: '/dashboard' },
              { label: t.nav.wardrobe, href: '/dashboard/wardrobe' },
              { label: t.nav.outfits,  href: '/dashboard/outfits' },
              { label: t.nav.beauty,   href: '/dashboard/beauty' },
              { label: t.nav.events,   href: '/dashboard/events' },
              { label: 'Valiz Modu',   href: '/dashboard/valiz' },
              { label: 'Profil',       href: '/dashboard/profile' },
            ].map((link) => {
              const active = link.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(link.href);
              return (
                <Link key={link.href} href={link.href}
                  className="block py-3 text-[0.7rem] font-bold tracking-[0.15em] uppercase transition-colors border-b"
                  style={{ borderColor: 'rgba(255,255,255,0.05)', color: active ? '#C41E3A' : 'rgba(255,255,255,0.7)' }}>
                  {link.label}
                </Link>
              );
            })}
            {!user && (
              <div className="pt-5 flex flex-col gap-3">
                <Link href="/login"
                  className="block text-center py-3 border text-[0.7rem] font-bold tracking-[0.15em] uppercase text-white transition-colors hover:bg-white/5"
                  style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
                  {t.nav.signInMobile}
                </Link>
                <Link href="/register"
                  className="block text-center py-3 text-[0.7rem] font-bold tracking-[0.15em] uppercase text-white transition-opacity hover:opacity-80"
                  style={{ background: '#C41E3A' }}>
                  {t.nav.getStartedFree}
                </Link>
              </div>
            )}
            {user && (
              <button onClick={handleSignOut}
                className="w-full text-left pt-4 py-3 text-[0.7rem] font-bold tracking-[0.15em] uppercase transition-colors"
                style={{ color: '#C41E3A' }}>
                {t.nav.signOutMobile}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
