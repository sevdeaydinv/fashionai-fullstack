'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useEvents } from '@/lib/hooks/useEvents';
import { useOutfits } from '@/lib/hooks/useOutfits';
import type { EventType } from '@/types/common.types';
import type { CalendarEvent } from '@/types/event.types';

const EVENT_OPTIONS: { value: EventType; label: string; icon: string }[] = [
  { value: 'daily_casual', label: 'Günlük',    icon: '☀️' },
  { value: 'picnic',       label: 'Piknik',     icon: '🌿' },
  { value: 'sport',        label: 'Spor',       icon: '🏃' },
  { value: 'business',     label: 'İş',         icon: '💼' },
  { value: 'date_night',   label: 'Romantik',   icon: '🌙' },
  { value: 'invitation',   label: 'Davet',      icon: '🎉' },
  { value: 'graduation',   label: 'Mezuniyet',  icon: '🎓' },
  { value: 'travel',       label: 'Seyahat',    icon: '✈️' },
];

const EVENT_ICON: Record<EventType, string> = Object.fromEntries(
  EVENT_OPTIONS.map(e => [e.value, e.icon])
) as Record<EventType, string>;

const EVENT_LABEL: Record<EventType, string> = Object.fromEntries(
  EVENT_OPTIONS.map(e => [e.value, e.label])
) as Record<EventType, string>;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function isUpcoming(iso: string) {
  return new Date(iso) >= new Date();
}

export default function EventsPage() {
  const supabase = createClient();
  const { data: userData } = useQuery({
    queryKey: ['user'],
    queryFn: async () => { const { data: { user } } = await supabase.auth.getUser(); return user; },
  });
  const userId = userData?.id ?? null;

  const { events, isLoading, createEvent, deleteEvent, assignOutfit } = useEvents(userId);
  const { outfits } = useOutfits(userId);

  // Form state
  const [showForm, setShowForm]       = useState(false);
  const [title, setTitle]             = useState('');
  const [eventType, setEventType]     = useState<EventType>('daily_casual');
  const [eventDate, setEventDate]     = useState('');
  const [location, setLocation]       = useState('');
  const [notes, setNotes]             = useState('');
  const [formError, setFormError]     = useState('');

  // Delete / outfit assign
  const [deleteConfirm, setDeleteConfirm]   = useState<CalendarEvent | null>(null);
  const [assignModal, setAssignModal]       = useState<CalendarEvent | null>(null);

  // View
  const [view, setView] = useState<'upcoming' | 'all'>('upcoming');

  const handleCreate = async () => {
    if (!title.trim()) { setFormError('Başlık zorunlu.'); return; }
    if (!eventDate)    { setFormError('Tarih zorunlu.'); return; }
    setFormError('');
    await createEvent.mutateAsync({ title, event_type: eventType, event_date: eventDate, location: location || undefined, notes: notes || undefined });
    setTitle(''); setEventType('daily_casual'); setEventDate(''); setLocation(''); setNotes('');
    setShowForm(false);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    await deleteEvent.mutateAsync(deleteConfirm.id);
    setDeleteConfirm(null);
  };

  const handleAssignOutfit = async (outfitId: string) => {
    if (!assignModal) return;
    await assignOutfit.mutateAsync({ eventId: assignModal.id, outfitId });
    setAssignModal(null);
  };

  const displayed = view === 'upcoming'
    ? events.filter(e => isUpcoming(e.event_date))
    : events;

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Header */}
      <div className="bg-white border-b border-ink-100 px-4 py-4 sm:px-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-ink-900">Etkinlik Planlayıcı</h1>
          <p className="text-xs text-ink-400 mt-0.5">Etkinliklerine kombin planla</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 rounded-xl bg-ink-900 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-800 transition-colors"
        >
          <span className="text-base">+</span> Etkinlik Ekle
        </button>
      </div>

      <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-5">

        {/* ── Etkinlik Oluşturma Formu */}
        {showForm && (
          <div className="rounded-2xl bg-white border border-ink-100 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-ink-900">Yeni Etkinlik</h2>

            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1">Başlık *</label>
              <input
                type="text"
                placeholder="Etkinlik adı"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full rounded-xl border border-ink-200 px-3 py-2 text-sm text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-ink-400/30"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-600 mb-2">Etkinlik Türü</label>
              <div className="grid grid-cols-4 gap-2">
                {EVENT_OPTIONS.map(e => (
                  <button
                    key={e.value}
                    onClick={() => setEventType(e.value)}
                    className={`flex flex-col items-center gap-1 rounded-xl border py-2 text-xs font-medium transition-colors ${
                      eventType === e.value
                        ? 'border-ink-900 bg-ink-900 text-white'
                        : 'border-ink-200 text-ink-600 hover:bg-ink-50'
                    }`}
                  >
                    <span className="text-base">{e.icon}</span>
                    {e.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-ink-600 mb-1">Tarih & Saat *</label>
                <input
                  type="datetime-local"
                  value={eventDate}
                  onChange={e => setEventDate(e.target.value)}
                  className="w-full rounded-xl border border-ink-200 px-3 py-2 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-400/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-600 mb-1">Konum</label>
                <input
                  type="text"
                  placeholder="İsteğe bağlı"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full rounded-xl border border-ink-200 px-3 py-2 text-sm text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-ink-400/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1">Notlar</label>
              <textarea
                rows={2}
                placeholder="İsteğe bağlı notlar..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full rounded-xl border border-ink-200 px-3 py-2 text-sm text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-ink-400/30 resize-none"
              />
            </div>

            {formError && <p className="text-xs text-red-500">{formError}</p>}

            <div className="flex gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-xl border border-ink-200 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleCreate}
                disabled={createEvent.isPending}
                className="flex-1 rounded-xl bg-ink-900 py-2 text-sm font-semibold text-white hover:bg-ink-800 disabled:opacity-50 transition-colors"
              >
                {createEvent.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
              </button>
            </div>
          </div>
        )}

        {/* ── Liste / Filtre */}
        <div className="flex gap-2">
          {(['upcoming', 'all'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
                view === v ? 'border-ink-900 bg-ink-900 text-white' : 'border-ink-200 text-ink-600 hover:bg-ink-50'
              }`}
            >
              {v === 'upcoming' ? 'Yaklaşan' : 'Tümü'}
            </button>
          ))}
          <span className="ml-auto text-xs text-ink-400 self-center">{displayed.length} etkinlik</span>
        </div>

        {/* ── Etkinlik Listesi */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-ink-100 animate-pulse" />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 py-16 text-center">
            <p className="text-sm text-ink-500">
              {view === 'upcoming' ? 'Yaklaşan etkinlik yok' : 'Henüz etkinlik eklenmedi'}
            </p>
            <p className="text-xs text-ink-400 mt-1">Yukarıdan yeni etkinlik ekleyebilirsin.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayed.map(event => {
              const upcoming = isUpcoming(event.event_date);
              const assignedOutfit = outfits.find(o => o.id === event.outfit_id);
              return (
                <div
                  key={event.id}
                  className={`rounded-2xl border bg-white p-4 ${upcoming ? 'border-ink-100' : 'border-ink-100 opacity-60'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="text-2xl shrink-0">{EVENT_ICON[event.event_type]}</span>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-ink-900 truncate">{event.title}</p>
                        <p className="text-xs text-ink-400 mt-0.5">{formatDate(event.event_date)}</p>
                        {event.location && (
                          <p className="text-xs text-ink-400 mt-0.5">📍 {event.location}</p>
                        )}
                        <span className="inline-block mt-1.5 rounded-full border border-ink-100 bg-ink-50 px-2 py-0.5 text-xs text-ink-500">
                          {EVENT_LABEL[event.event_type]}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {upcoming && (
                        <button
                          onClick={() => setAssignModal(event)}
                          className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                            assignedOutfit
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                              : 'border-ink-200 text-ink-600 hover:bg-ink-50'
                          }`}
                        >
                          {assignedOutfit ? '✓ Kombin' : '+ Kombin'}
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteConfirm(event)}
                        className="rounded-lg border border-red-100 p-1.5 text-red-400 hover:bg-red-50 transition-colors"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {event.notes && (
                    <p className="mt-2 text-xs text-ink-400 border-t border-ink-50 pt-2">{event.notes}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Kombin Atama Modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl max-h-[70vh] flex flex-col">
            <h3 className="text-base font-semibold text-ink-900 mb-1">Kombin Seç</h3>
            <p className="text-xs text-ink-400 mb-4">{assignModal.title} etkinliği için kombin seç</p>

            {outfits.length === 0 ? (
              <p className="text-sm text-ink-500 text-center py-8">Kaydedilmiş kombin yok.</p>
            ) : (
              <div className="overflow-y-auto space-y-2 flex-1">
                {outfits.map(outfit => (
                  <button
                    key={outfit.id}
                    onClick={() => handleAssignOutfit(outfit.id)}
                    className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-ink-50 ${
                      assignModal.outfit_id === outfit.id ? 'border-ink-900 bg-ink-50' : 'border-ink-100'
                    }`}
                  >
                    {outfit.cover_image_url && (
                      <img src={outfit.cover_image_url} alt="" className="h-12 w-12 rounded-lg object-cover shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink-900 truncate">
                        {outfit.name ?? `${EVENT_LABEL[outfit.event as EventType]} Kombini`}
                      </p>
                      <p className="text-xs text-ink-400">{EVENT_LABEL[outfit.event as EventType]}</p>
                    </div>
                    {assignModal.outfit_id === outfit.id && (
                      <span className="ml-auto text-emerald-500 text-sm">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setAssignModal(null)}
              className="mt-4 w-full rounded-xl border border-ink-200 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50 transition-colors"
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {/* ── Silme Onayı */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-ink-900">Etkinliği Sil</h3>
            <p className="mt-2 text-sm text-ink-500">
              <span className="font-medium">{deleteConfirm.title}</span> etkinliği silinsin mi?
            </p>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 rounded-xl border border-ink-200 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50 transition-colors">
                İptal
              </button>
              <button onClick={handleDelete} disabled={deleteEvent.isPending} className="flex-1 rounded-xl bg-red-500 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50 transition-colors">
                {deleteEvent.isPending ? 'Siliniyor...' : 'Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
