import { createClient } from '@/lib/supabase/server';
import { WeatherWidget } from '@/components/weather/WeatherWidget';

const QUICK_ACTIONS = [
  {
    label: 'Add Clothing',
    description: 'Upload a new item to your wardrobe',
    href: '/dashboard/wardrobe',
    icon: '👕',
    color: 'bg-violet-50 border-violet-100 hover:border-violet-200',
    iconBg: 'bg-violet-100',
  },
  {
    label: 'Generate Outfit',
    description: "Get today's AI outfit suggestion",
    href: '/dashboard/outfits',
    icon: '✨',
    color: 'bg-brand-50 border-brand-100 hover:border-brand-200',
    iconBg: 'bg-brand-100',
  },
  {
    label: 'Beauty Tips',
    description: 'See personalized beauty recommendations',
    href: '/dashboard/beauty',
    icon: '💄',
    color: 'bg-rose-50 border-rose-100 hover:border-rose-200',
    iconBg: 'bg-rose-100',
  },
  {
    label: 'Edit Avatar',
    description: 'Upload photo & create your digital avatar',
    href: '/dashboard/avatar',
    icon: '🪞',
    color: 'bg-sky-50 border-sky-100 hover:border-sky-200',
    iconBg: 'bg-sky-100',
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
        <h1 className="text-3xl font-semibold text-ink-900 mb-2">
          Good day, {firstName} 👋
        </h1>
        <p className="text-ink-500">
          Let&apos;s find you the perfect outfit for today.
        </p>
      </div>

      {/* Weather widget */}
      <div className="mb-8">
        <WeatherWidget />
      </div>

      {/* Setup progress (shown when wardrobe is empty) */}
      <div className="mb-10 rounded-2xl border border-amber-100 bg-amber-50 p-6">
        <div className="flex items-start gap-4">
          <span className="text-2xl">🚀</span>
          <div className="flex-1">
            <h3 className="font-semibold text-ink-900 mb-1">Complete your setup</h3>
            <p className="text-sm text-ink-500 mb-4">
              Follow these steps to unlock personalized AI styling.
            </p>
            <div className="flex flex-col gap-2.5">
              {[
                { done: true,  label: 'Create your account' },
                { done: false, label: 'Fill in body measurements & style preferences' },
                { done: false, label: 'Upload your first clothing items' },
                { done: false, label: 'Generate your first outfit' },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span
                    className={[
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs',
                      step.done
                        ? 'bg-emerald-500 text-white'
                        : 'border-2 border-ink-300',
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
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400 mb-4">
        Quick Actions
      </h2>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
        {QUICK_ACTIONS.map((action) => (
          <a
            key={action.label}
            href={action.href}
            className={[
              'flex flex-col gap-4 rounded-2xl border p-5 transition-all duration-150',
              'hover:shadow-md hover:shadow-ink-900/5 cursor-pointer',
              action.color,
            ].join(' ')}
          >
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl text-2xl ${action.iconBg}`}>
              {action.icon}
            </span>
            <div>
              <p className="text-sm font-semibold text-ink-900">{action.label}</p>
              <p className="text-xs text-ink-500 mt-0.5">{action.description}</p>
            </div>
          </a>
        ))}
      </div>

      {/* Stats row */}
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400 mb-4">
        Your Stats
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Clothing Items', value: '0', icon: '👕' },
          { label: 'Outfits Saved', value: '0', icon: '✨' },
          { label: 'Events Planned', value: '0', icon: '📅' },
          { label: 'Style Score', value: '—', icon: '⭐' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-ink-100 bg-white p-5"
          >
            <span className="text-2xl">{stat.icon}</span>
            <p className="mt-3 text-2xl font-bold text-ink-900">{stat.value}</p>
            <p className="text-xs text-ink-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
