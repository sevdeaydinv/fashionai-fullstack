import { createClient } from '@/lib/supabase/server';
import { WeatherWidget } from '@/components/weather/WeatherWidget';
import { UpcomingEventsWidget } from '@/components/events/UpcomingEventsWidget';

const QUICK_ACTIONS = [
  {
    label: 'Wardrobe',
    description: 'Upload a new item to your collection',
    href: '/dashboard/wardrobe',
    icon: '👕',
  },
  {
    label: 'Outfit',
    description: "Generate today's AI suggestion",
    href: '/dashboard/outfits',
    icon: '✨',
  },
  {
    label: 'Beauty',
    description: 'Personalized beauty recommendations',
    href: '/dashboard/beauty',
    icon: '💄',
  },
  {
    label: 'Avatar',
    description: 'Upload photo & create your digital look',
    href: '/dashboard/avatar',
    icon: '🪞',
  },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] ?? 'there';

  return (
    <div className="max-w-5xl">
      {/* Welcome header */}
      <div className="mb-10">
        <p className="section-label mb-2">Dashboard</p>
        <h1 className="editorial-heading text-4xl text-ink-900 mb-2">
          Good day, {firstName}
        </h1>
        <p className="text-ink-400 text-sm">
          Let&apos;s find you the perfect outfit for today.
        </p>
      </div>

      {/* Divider */}
      <div className="divider-editorial mb-10" />

      {/* Weather + Upcoming Events */}
      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        <WeatherWidget />
        <UpcomingEventsWidget />
      </div>

      {/* Setup progress */}
      <div className="mb-10 border border-amber-200 bg-amber-50 p-6">
        <div className="flex items-start gap-4">
          <span className="text-xl mt-0.5">🚀</span>
          <div className="flex-1">
            <p className="section-label mb-1">Getting Started</p>
            <h3 className="font-serif font-bold text-ink-900 text-lg mb-1">Complete your setup</h3>
            <p className="text-sm text-ink-500 mb-5">
              Follow these steps to unlock personalized AI styling.
            </p>
            <div className="flex flex-col gap-3">
              {[
                { done: true,  label: 'Create your account' },
                { done: false, label: 'Fill in body measurements & style preferences' },
                { done: false, label: 'Upload your first clothing items' },
                { done: false, label: 'Generate your first outfit' },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span
                    className={[
                      'flex h-5 w-5 shrink-0 items-center justify-center text-xs',
                      step.done
                        ? 'bg-ink-900 text-white'
                        : 'border border-ink-300 text-transparent',
                    ].join(' ')}
                  >
                    {step.done && (
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  <span className={step.done ? 'text-ink-400 line-through' : 'text-ink-700'}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <p className="section-label mb-4">Quick Actions</p>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-px bg-ink-200 border border-ink-200 mb-10">
        {QUICK_ACTIONS.map((action) => (
          <a
            key={action.label}
            href={action.href}
            className="flex flex-col gap-4 bg-white p-6 transition-colors hover:bg-ink-50 cursor-pointer"
          >
            <span className="text-2xl">{action.icon}</span>
            <div>
              <p className="text-[0.65rem] font-semibold tracking-widest uppercase text-ink-900 mb-1">{action.label}</p>
              <p className="text-xs text-ink-400 leading-relaxed">{action.description}</p>
            </div>
          </a>
        ))}
      </div>

      {/* Stats row */}
      <p className="section-label mb-4">Your Stats</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-ink-200 border border-ink-200">
        {[
          { label: 'Clothing Items', value: '0', icon: '👕' },
          { label: 'Outfits Saved', value: '0', icon: '✨' },
          { label: 'Events Planned', value: '0', icon: '📅' },
          { label: 'Style Score', value: '—', icon: '⭐' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white p-6"
          >
            <span className="text-xl">{stat.icon}</span>
            <p className="mt-4 editorial-heading text-3xl text-ink-900">{stat.value}</p>
            <p className="text-[0.65rem] font-semibold tracking-widest uppercase text-ink-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
