'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_SECTIONS = [
  {
    label: 'Main',
    items: [
      { label: 'Home', href: '/dashboard' },
      { label: 'Wardrobe', href: '/dashboard/wardrobe' },
      { label: 'Outfits', href: '/dashboard/outfits' },
    ],
  },
  {
    label: 'Style',
    items: [
      { label: 'Beauty', href: '/dashboard/beauty' },
      { label: 'Events', href: '/dashboard/events' },
      { label: 'Avatar', href: '/dashboard/avatar' },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Profile', href: '/dashboard/profile' },
    ],
  },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-52 shrink-0 border-r border-ink-100 bg-white min-h-screen sticky top-0 pt-16">
      <nav className="flex flex-col gap-6 px-5 py-8">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="section-label mb-3">{section.label}</p>
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const isActive =
                  item.href === '/dashboard'
                    ? pathname === '/dashboard'
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      'flex items-center py-2 pl-3 text-[0.8rem] transition-colors border-l-2',
                      isActive
                        ? 'text-ink-900 font-semibold border-brand-500'
                        : 'text-ink-400 hover:text-ink-700 font-medium border-transparent',
                    ].join(' ')}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
