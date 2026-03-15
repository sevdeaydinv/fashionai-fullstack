'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useEvents } from '@/lib/hooks/useEvents';
import type { EventType } from '@/types/common.types';

const EVENT_ICON: Record<EventType, string> = {
  daily_casual: '☀️', picnic: '🌿', sport: '🏃', business: '💼',
  date_night: '🌙', invitation: '🎉', graduation: '🎓', travel: '✈️',
};

const EVENT_LABEL: Record<EventType, string> = {
  daily_casual: 'Günlük', picnic: 'Piknik', sport: 'Spor', business: 'İş',
  date_night: 'Romantik', invitation: 'Davet', graduation: 'Mezuniyet', travel: 'Seyahat',
};

function daysUntil(iso: string): string {
  const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Bugün';
  if (diff === 1) return 'Yarın';
  return `${diff} gün sonra`;
}

export function UpcomingEventsWidget() {
  const supabase = createClient();
  const { data: userData } = useQuery({
    queryKey: ['user'],
    queryFn: async () => { const { data: { user } } = await supabase.auth.getUser(); return user; },
  });
  const userId = userData?.id ?? null;
  const { upcomingEvents, isLoading } = useEvents(userId);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-ink-100 bg-white p-5 animate-pulse">
        <div className="h-4 w-32 bg-ink-100 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-12 bg-ink-100 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-ink-900">Yaklaşan Etkinlikler</h3>
        <Link href="/dashboard/events" className="text-xs text-ink-400 hover:text-ink-700 transition-colors">
          Tümü →
        </Link>
      </div>

      {upcomingEvents.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-ink-400">Yaklaşan etkinlik yok</p>
          <Link href="/dashboard/events" className="mt-2 inline-block text-xs font-medium text-ink-700 hover:underline">
            Etkinlik ekle
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {upcomingEvents.map(event => (
            <div key={event.id} className="flex items-center gap-3 rounded-xl border border-ink-50 bg-ink-50 p-3">
              <span className="text-xl shrink-0">{EVENT_ICON[event.event_type as EventType]}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink-900 truncate">{event.title}</p>
                <p className="text-xs text-ink-400">{EVENT_LABEL[event.event_type as EventType]}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                daysUntil(event.event_date) === 'Bugün'
                  ? 'bg-red-100 text-red-600'
                  : daysUntil(event.event_date) === 'Yarın'
                  ? 'bg-amber-100 text-amber-600'
                  : 'bg-ink-100 text-ink-500'
              }`}>
                {daysUntil(event.event_date)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
