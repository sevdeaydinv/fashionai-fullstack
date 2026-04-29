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
    <div>
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="section-label mb-1">Calendar</p>
          <h1 className="editorial-heading text-4xl text-ink-900">Event Planner</h1>
          <p className="text-sm text-ink-400 mt-1">Plan outfits for your upcoming events</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="btn-primary"
        >
          <span>+</span> Add Event
        </button>
      </div>

      <div className="divider-editorial mb-8" />

      <div className="max-w-2xl space-y-5">

        {/* ── Create Event Form */}
        {showForm && (
          <div className="bg-white border border-ink-100 p-6 space-y-5">
            <p className="section-label">New Event</p>

            <div>
              <label className="block text-xs text-ink-500 mb-2">Title *</label>
              <input
                type="text"
                placeholder="Event name"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="input-editorial"
              />
            </div>

            <div>
              <label className="block text-xs text-ink-500 mb-3">Event Type</label>
              <div className="grid grid-cols-4 gap-2">
                {EVENT_OPTIONS.map(e => (
                  <button
                    key={e.value}
                    onClick={() => setEventType(e.value)}
                    className={`flex flex-col items-center gap-1.5 border py-2.5 text-[0.6rem] font-semibold tracking-wider uppercase transition-colors ${
                      eventType === e.value
                        ? 'border-ink-900 bg-ink-900 text-white'
                        : 'border-ink-200 text-ink-500 hover:border-ink-400'
                    }`}
                  >
                    <span className="text-base">{e.icon}</span>
                    {e.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-ink-500 mb-2">Date & Time *</label>
                <input
                  type="datetime-local"
                  value={eventDate}
                  onChange={e => setEventDate(e.target.value)}
                  className="w-full border border-ink-200 px-3 py-2 text-sm text-ink-900 focus:outline-none focus:border-ink-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-ink-500 mb-2">Location</label>
                <input
                  type="text"
                  placeholder="Optional"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="input-editorial"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-ink-500 mb-2">Notes</label>
              <textarea
                rows={2}
                placeholder="Optional notes..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full border border-ink-200 px-3 py-2 text-sm text-ink-900 placeholder:text-ink-300 focus:outline-none focus:border-ink-400 transition-colors resize-none"
              />
            </div>

            {formError && <p className="text-xs text-brand-600">{formError}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="btn-outline flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={createEvent.isPending}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {createEvent.isPending ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </div>
        )}

        {/* ── Filter tabs */}
        <div className="flex items-center gap-4 border-b border-ink-200 mb-5">
          {(['upcoming', 'all'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`pb-3 text-[0.65rem] font-semibold tracking-widest uppercase transition-colors border-b-2 ${
                view === v
                  ? 'border-ink-900 text-ink-900'
                  : 'border-transparent text-ink-400 hover:text-ink-700'
              }`}
            >
              {v === 'upcoming' ? 'Upcoming' : 'All Events'}
            </button>
          ))}
          <span className="ml-auto text-xs text-ink-400">{displayed.length} events</span>
        </div>

        {/* ── Event List */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-ink-100 animate-pulse" />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center border border-dashed border-ink-200 py-16 text-center">
            <p className="text-sm text-ink-400">
              {view === 'upcoming' ? 'No upcoming events' : 'No events yet'}
            </p>
            <p className="text-xs text-ink-300 mt-1">Add a new event above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayed.map(event => {
              const upcoming = isUpcoming(event.event_date);
              const assignedOutfit = outfits.find(o => o.id === event.outfit_id);
              return (
                <div
                  key={event.id}
                  className={`bg-white border border-ink-100 p-4 ${!upcoming ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="text-xl shrink-0 mt-0.5">{EVENT_ICON[event.event_type]}</span>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-ink-900 truncate">{event.title}</p>
                        <p className="text-xs text-ink-400 mt-0.5">{formatDate(event.event_date)}</p>
                        {event.location && (
                          <p className="text-xs text-ink-400 mt-0.5">📍 {event.location}</p>
                        )}
                        <span className="inline-block mt-1.5 px-2 py-0.5 text-[0.6rem] font-semibold tracking-wider uppercase bg-ink-50 text-ink-500 border border-ink-100">
                          {EVENT_LABEL[event.event_type]}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {upcoming && (
                        <button
                          onClick={() => setAssignModal(event)}
                          className={`border px-2.5 py-1.5 text-[0.6rem] font-semibold tracking-wider uppercase transition-colors ${
                            assignedOutfit
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                              : 'border-ink-200 text-ink-500 hover:border-ink-400'
                          }`}
                        >
                          {assignedOutfit ? '✓ Outfit' : '+ Outfit'}
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteConfirm(event)}
                        className="border border-ink-200 p-1.5 text-ink-400 hover:border-brand-300 hover:text-brand-500 transition-colors"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {event.notes && (
                    <p className="mt-2 text-xs text-ink-400 border-t border-ink-100 pt-2">{event.notes}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Assign Outfit Modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white p-6 shadow-2xl max-h-[70vh] flex flex-col">
            <p className="section-label mb-1">Select Outfit</p>
            <p className="text-xs text-ink-400 mb-4">For: {assignModal.title}</p>

            {outfits.length === 0 ? (
              <p className="text-sm text-ink-400 text-center py-8">No saved outfits yet.</p>
            ) : (
              <div className="overflow-y-auto space-y-2 flex-1">
                {outfits.map(outfit => (
                  <button
                    key={outfit.id}
                    onClick={() => handleAssignOutfit(outfit.id)}
                    className={`w-full flex items-center gap-3 border p-3 text-left transition-colors hover:bg-ink-50 ${
                      assignModal.outfit_id === outfit.id ? 'border-ink-900 bg-ink-50' : 'border-ink-200'
                    }`}
                  >
                    {outfit.cover_image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={outfit.cover_image_url} alt="" className="h-12 w-12 object-cover shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink-900 truncate">
                        {outfit.name ?? `${EVENT_LABEL[outfit.event as EventType]} Outfit`}
                      </p>
                      <p className="text-xs text-ink-400">{EVENT_LABEL[outfit.event as EventType]}</p>
                    </div>
                    {assignModal.outfit_id === outfit.id && (
                      <span className="text-emerald-600 text-sm">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setAssignModal(null)}
              className="btn-outline mt-4 w-full"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white p-8 shadow-2xl">
            <p className="section-label mb-3">Confirm Delete</p>
            <h3 className="editorial-heading text-xl text-ink-900 mb-2">{deleteConfirm.title}</h3>
            <p className="text-sm text-ink-500 mb-6">This event will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-outline flex-1">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleteEvent.isPending} className="btn-brand flex-1 disabled:opacity-50">
                {deleteEvent.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
