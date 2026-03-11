'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

const NAV_LINKS = [
  { label: 'Features', href: '/#features' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Pricing', href: '/#pricing' },
];

export function Navbar() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isDark = pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
    router.refresh();
  };

  const userInitial = user?.email?.charAt(0).toUpperCase() ?? '?';

  return (
    <header
      className={[
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled || !isDark
          ? 'bg-white/90 backdrop-blur-xl border-b border-ink-100 shadow-sm'
          : 'bg-transparent',
      ].join(' ')}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L8 8H4L6 14H4L8 20H16L20 14H18L20 8H16L12 2Z"
                fill="white"
                fillOpacity="0.9"
              />
            </svg>
          </span>
          <span
            className={[
              'text-lg font-semibold tracking-tight',
              scrolled || !isDark ? 'text-ink-900' : 'text-white',
            ].join(' ')}
          >
            FashionAI
          </span>
        </Link>

        {/* Desktop nav links (landing only) */}
        {pathname === '/' && (
          <ul className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={[
                    'px-3.5 py-2 rounded-lg text-sm font-medium transition-colors',
                    scrolled
                      ? 'text-ink-600 hover:text-ink-900 hover:bg-ink-50'
                      : 'text-white/80 hover:text-white hover:bg-white/10',
                  ].join(' ')}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* Dashboard nav links */}
        {user && pathname.startsWith('/dashboard') && (
          <ul className="hidden md:flex items-center gap-1">
            {[
              { label: 'Home', href: '/dashboard' },
              { label: 'Wardrobe', href: '/dashboard/wardrobe' },
              { label: 'Outfits', href: '/dashboard/outfits' },
              { label: 'Beauty', href: '/dashboard/beauty' },
            ].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={[
                    'px-3.5 py-2 rounded-lg text-sm font-medium transition-colors',
                    pathname === link.href
                      ? 'bg-ink-100 text-ink-900'
                      : 'text-ink-600 hover:text-ink-900 hover:bg-ink-50',
                  ].join(' ')}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* Right side */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded-lg bg-ink-200" />
          ) : user ? (
            /* Authenticated user menu */
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium text-ink-700 hover:bg-ink-100 transition-colors"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-white text-xs font-semibold">
                  {userInitial}
                </span>
                <span className="hidden sm:block max-w-[120px] truncate">
                  {user.email}
                </span>
                <svg
                  className={`h-4 w-4 text-ink-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-ink-100 bg-white shadow-xl shadow-ink-900/10 overflow-hidden">
                  <div className="px-4 py-3 border-b border-ink-100">
                    <p className="text-xs text-ink-400 truncate">{user.email}</p>
                  </div>
                  <div className="p-1.5">
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-700 hover:bg-ink-50 transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      Dashboard
                    </Link>
                    <Link
                      href="/dashboard/profile"
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-700 hover:bg-ink-50 transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Profile
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Guest buttons */
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/login"
                className={[
                  'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                  scrolled || !isDark
                    ? 'text-ink-700 hover:bg-ink-50'
                    : 'text-white/80 hover:text-white hover:bg-white/10',
                ].join(' ')}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className={[
              'md:hidden p-2 rounded-lg transition-colors',
              scrolled || !isDark
                ? 'text-ink-600 hover:bg-ink-100'
                : 'text-white hover:bg-white/10',
            ].join(' ')}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-ink-100 bg-white/95 backdrop-blur-xl">
          <div className="px-4 py-3 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-3 py-2.5 rounded-xl text-sm font-medium text-ink-700 hover:bg-ink-50"
              >
                {link.label}
              </Link>
            ))}
            {!user && (
              <div className="pt-2 pb-1 flex flex-col gap-2">
                <Link
                  href="/login"
                  className="block text-center px-4 py-2.5 rounded-xl border border-ink-200 text-sm font-medium text-ink-700 hover:bg-ink-50"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="block text-center px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700"
                >
                  Get Started
                </Link>
              </div>
            )}
            {user && (
              <button
                onClick={handleSignOut}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
