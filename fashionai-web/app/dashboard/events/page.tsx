'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useEvents } from '@/lib/hooks/useEvents';
import { useOutfits } from '@/lib/hooks/useOutfits';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { EventType } from '@/types/common.types';
import type { CalendarEvent } from '@/types/event.types';

function isUpcoming(iso: string) {
  return new Date(iso) >= new Date();
}

const sectionLabelStyle: React.CSSProperties = {
  color: '#9E9690',
  fontSize: '0.6rem',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  fontWeight: 700,
};

const cardStyle: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E2DDD7',
  borderRadius: 16,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#FFFFFF',
  border: '1px solid #E2DDD7',
  borderRadius: 12,
  padding: '10px 14px',
  color: '#141210',
  fontSize: '0.875rem',
  outline: 'none',
};

/* ── Event type → cover gradient ── */
const EVENT_GRADIENT: Record<string, string> = {
  daily_casual: 'linear-gradient(135deg,#EDE8E3 0%,#D9D0C7 100%)',
  picnic:       'linear-gradient(135deg,#D9EDD4 0%,#B8D9B1 100%)',
  sport:        'linear-gradient(135deg,#D4E4F5 0%,#A8C8E8 100%)',
  business:     'linear-gradient(135deg,#E8E4F0 0%,#C8C0DC 100%)',
  date_night:   'linear-gradient(135deg,#F5D4D4 0%,#E8A8A8 100%)',
  invitation:   'linear-gradient(135deg,#F5E8D4 0%,#E8C898 100%)',
  graduation:   'linear-gradient(135deg,#F0E4D0 0%,#D9C4A4 100%)',
  travel:       'linear-gradient(135deg,#D4EDF5 0%,#A8D4E8 100%)',
};

/* ── Event type → static cover image ── */
const EVENT_COVER_IMAGE: Record<string, string> = {
  invitation:   '/events/balo.jpg',
  date_night:   '/events/balo.jpg',
  graduation:   '/events/graduation.jpg',
};

export default function EventsPage() {
  const supabase = createClient();
  const { lang, t } = useLanguage();

  const EVENT_OPTIONS: { value: EventType; label: string }[] = [
    { value: 'daily_casual', label: t.events.eventLabels.daily_casual },
    { value: 'picnic',       label: t.events.eventLabels.picnic },
    { value: 'sport',        label: t.events.eventLabels.sport },
    { value: 'business',     label: t.events.eventLabels.business },
    { value: 'date_night',   label: t.events.eventLabels.date_night },
    { value: 'invitation',   label: t.events.eventLabels.invitation },
    { value: 'graduation',   label: t.events.eventLabels.graduation },
    { value: 'travel',       label: t.events.eventLabels.travel },
  ];

  const EVENT_LABEL: Record<EventType, string> = Object.fromEntries(
    EVENT_OPTIONS.map(e => [e.value, e.label])
  ) as Record<EventType, string>;

  function formatDateOnly(iso: string) {
    return new Date(iso).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', {
      day: 'numeric', month: 'long', year: 'numeric', weekday: 'long',
    });
  }
  function formatTimeOnly(iso: string) {
    return new Date(iso).toLocaleTimeString(lang === 'tr' ? 'tr-TR' : 'en-US', {
      hour: '2-digit', minute: '2-digit',
    });
  }

  const { data: userData } = useQuery({
    queryKey: ['user'],
    queryFn: async () => { const { data: { user } } = await supabase.auth.getUser(); return user; },
  });
  const userId = userData?.id ?? null;

  const { events, isLoading, createEvent, deleteEvent, assignOutfit } = useEvents(userId);
  const { outfits } = useOutfits(userId);

  const [showForm, setShowForm]         = useState(false);
  const [title, setTitle]               = useState('');
  const [eventType, setEventType]       = useState<EventType>('daily_casual');
  const [eventDate, setEventDate]       = useState('');
  const [location, setLocation]         = useState('');
  const [notes, setNotes]               = useState('');
  const [formError, setFormError]       = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<CalendarEvent | null>(null);
  const [assignModal, setAssignModal]   = useState<CalendarEvent | null>(null);
  const [view, setView]                 = useState<'upcoming' | 'all'>('upcoming');

  const handleCreate = async () => {
    if (!title.trim()) { setFormError(t.events.titleRequired); return; }
    if (!eventDate)    { setFormError(t.events.dateRequired); return; }
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

  const upcomingCount = events.filter(e => isUpcoming(e.event_date)).length;

  const chipStyle = (active: boolean): React.CSSProperties => ({
    border: active ? '1px solid rgba(196,30,58,0.3)' : '1px solid #E2DDD7',
    background: active ? 'rgba(196,30,58,0.1)' : '#F5F2EE',
    color: active ? '#C41E3A' : '#706A64',
    borderRadius: 8,
    padding: '6px 12px',
    fontSize: '0.6rem',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    cursor: 'pointer',
    transition: 'all 0.15s',
  });

  return (
    <div>
      <style>{`
        .ev-action-btn:hover { background: #EDE8E3 !important; }
        .ev-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.08) !important; }
      `}</style>

      {/* ── Hero header card ─────────────────────── */}
      <div style={{
        ...cardStyle,
        borderRadius: 22,
        padding: '28px 32px',
        marginBottom: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #FFFFFF 0%, #FAF4F2 100%)',
        boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
        overflow: 'hidden', position: 'relative',
      }}>
        {/* Background glow */}
        <div style={{ position: 'absolute', top: -40, right: 160, width: 200, height: 200, background: 'radial-gradient(circle, rgba(196,30,58,0.06) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* Calendar icon */}
          <div style={{
            width: 72, height: 72, borderRadius: 18, flexShrink: 0,
            background: 'linear-gradient(135deg, #F5E8E8 0%, #EDD4D4 100%)',
            border: '1px solid rgba(196,30,58,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem',
          }}>
            📅
          </div>
          <div>
            <p style={{ ...sectionLabelStyle, marginBottom: 4 }}>{t.events.sectionLabel}</p>
            <h1 style={{ color: '#141210', fontFamily: 'serif', fontWeight: 700, fontSize: '2rem', marginBottom: 6, lineHeight: 1.1 }}>
              {t.events.title}
            </h1>
            <p style={{ color: '#706A64', fontSize: '0.875rem' }}>{t.events.subtitle}</p>
          </div>
        </div>

        {/* Right: upcoming count + add button — equal width & height */}
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 14, flexShrink: 0 }}>
          {/* Upcoming count badge */}
          <div style={{
            ...cardStyle, borderRadius: 16, width: 140,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(196,30,58,0.04)',
            borderColor: 'rgba(196,30,58,0.15)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'center', marginBottom: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#C41E3A' }} />
              <p style={{ ...sectionLabelStyle, fontSize: '0.55rem' }}>Yaklaşan Etkinlik</p>
            </div>
            <p style={{ fontSize: '2rem', fontWeight: 800, color: '#C41E3A', lineHeight: 1 }}>{upcomingCount}</p>
            <p style={{ color: '#9E9690', fontSize: '0.7rem', marginTop: 2 }}>etkinlik</p>
          </div>

          {/* Add button */}
          <button
            onClick={() => setShowForm(v => !v)}
            style={{
              background: 'linear-gradient(135deg, #7a0020 0%, #C41E3A 60%, #e8294a 100%)',
              borderRadius: 12, boxShadow: '0 4px 20px rgba(196,30,58,0.35)',
              border: 'none', color: 'white', fontWeight: 600, fontSize: '0.875rem',
              width: 140, cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ width: 14, height: 14 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {t.events.addEvent}
          </button>
        </div>
      </div>

      {/* ── Create Event Form ─────────────────────── */}
      {showForm && (
        <div style={{ ...cardStyle, padding: 24, marginBottom: 20, borderRadius: 18 }} className="space-y-5">
          <p style={sectionLabelStyle}>{t.events.newEventLabel}</p>

          <div>
            <label style={{ color: '#706A64', fontSize: '0.75rem', display: 'block', marginBottom: 8 }}>{t.events.titleLabel}</label>
            <input
              type="text" placeholder={t.events.titlePlaceholder} value={title}
              onChange={e => setTitle(e.target.value)} style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = 'rgba(196,30,58,0.5)'; }}
              onBlur={(e) => { e.target.style.borderColor = '#E2DDD7'; }}
            />
          </div>

          <div>
            <label style={{ color: '#706A64', fontSize: '0.75rem', display: 'block', marginBottom: 12 }}>{t.events.eventTypeLabel}</label>
            <div className="grid grid-cols-4 gap-2">
              {EVENT_OPTIONS.map(e => (
                <button key={e.value} onClick={() => setEventType(e.value)}
                  style={chipStyle(eventType === e.value)}
                  className="flex flex-col items-center py-2.5 transition-all">
                  {e.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ color: '#706A64', fontSize: '0.75rem', display: 'block', marginBottom: 8 }}>{t.events.dateTimeLabel}</label>
              <input type="datetime-local" value={eventDate} onChange={e => setEventDate(e.target.value)} style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = 'rgba(196,30,58,0.5)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#E2DDD7'; }} />
            </div>
            <div>
              <label style={{ color: '#706A64', fontSize: '0.75rem', display: 'block', marginBottom: 8 }}>{t.events.locationLabel}</label>
              <input type="text" placeholder={t.events.locationPlaceholder} value={location} onChange={e => setLocation(e.target.value)} style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = 'rgba(196,30,58,0.5)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#E2DDD7'; }} />
            </div>
          </div>

          <div>
            <label style={{ color: '#706A64', fontSize: '0.75rem', display: 'block', marginBottom: 8 }}>{t.events.notesLabel}</label>
            <textarea rows={2} placeholder={t.events.notesPlaceholder} value={notes}
              onChange={e => setNotes(e.target.value)} style={{ ...inputStyle, resize: 'none' }}
              onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = 'rgba(196,30,58,0.5)'; }}
              onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = '#E2DDD7'; }} />
          </div>

          {formError && <p style={{ color: '#C41E3A', fontSize: '0.75rem' }}>{formError}</p>}

          <div className="flex gap-3">
            <button onClick={() => setShowForm(false)}
              style={{ flex: 1, background: '#F5F2EE', border: '1px solid #E2DDD7', borderRadius: 12, color: '#141210', fontWeight: 500, fontSize: '0.875rem', padding: '10px 16px', cursor: 'pointer' }}>
              {t.events.cancel}
            </button>
            <button onClick={handleCreate} disabled={createEvent.isPending}
              style={{ flex: 1, background: 'linear-gradient(135deg, #7a0020 0%, #C41E3A 60%, #e8294a 100%)', borderRadius: 12, border: 'none', color: 'white', fontWeight: 600, fontSize: '0.875rem', padding: '10px 16px', cursor: createEvent.isPending ? 'not-allowed' : 'pointer', opacity: createEvent.isPending ? 0.7 : 1 }}>
              {createEvent.isPending ? t.events.creating : t.events.createEvent}
            </button>
          </div>
        </div>
      )}

      {/* ── Filter tabs row ───────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #E2DDD7', marginBottom: 20 }}>
        {(['upcoming', 'all'] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            style={{
              background: 'none', border: 'none', borderBottom: `2px solid ${view === v ? '#C41E3A' : 'transparent'}`,
              color: view === v ? '#141210' : '#9E9690',
              cursor: 'pointer', letterSpacing: '0.12em', fontSize: '0.65rem',
              fontWeight: 700, paddingBottom: 12, paddingRight: 20,
              textTransform: 'uppercase', transition: 'all 0.15s',
              marginBottom: -1,
            }}>
            {v === 'upcoming' ? t.events.tabUpcoming : t.events.tabAll}
          </button>
        ))}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 10 }}>
          <span style={{ color: '#9E9690', fontSize: '0.75rem' }}>{displayed.length} {t.events.eventsCount}</span>
          {/* Calendar view toggle */}
          <button style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#F5F2EE', border: '1px solid #E2DDD7', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', color: '#706A64', fontSize: '0.68rem', fontWeight: 600 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} style={{ width: 13, height: 13 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            Takvim Görünümü
          </button>
          {/* Grid toggle */}
          <button style={{ background: '#F5F2EE', border: '1px solid #E2DDD7', borderRadius: 8, padding: '5px 8px', cursor: 'pointer', color: '#706A64', display: 'flex' }}>
            <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 13, height: 13 }}>
              <path d="M3 3h7v7H3V3zm0 11h7v7H3v-7zm11-11h7v7h-7V3zm0 11h7v7h-7v-7z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Event List ───────────────────────────── */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ height: 160, background: '#EAE6E1', borderRadius: 16, animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div style={{ border: '1px dashed rgba(0,0,0,0.1)', borderRadius: 16, padding: '64px 24px', textAlign: 'center' }}>
          <p style={{ color: '#706A64', fontSize: '0.875rem' }}>
            {view === 'upcoming' ? t.events.noUpcoming : t.events.noEvents}
          </p>
          <p style={{ color: '#9E9690', fontSize: '0.75rem', marginTop: 4 }}>{t.events.addEventHint}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {displayed.map(event => {
            const upcoming       = isUpcoming(event.event_date);
            const assignedOutfit = outfits.find(o => o.id === event.outfit_id);
            const coverGradient  = EVENT_GRADIENT[event.event_type] ?? EVENT_GRADIENT.daily_casual;
            const staticCover    = EVENT_COVER_IMAGE[event.event_type];

            return (
              <div key={event.id} className="ev-card"
                style={{ ...cardStyle, borderRadius: 18, overflow: 'hidden', opacity: upcoming ? 1 : 0.55, display: 'flex', transition: 'box-shadow 0.2s', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>

                {/* Cover image / gradient */}
                <div style={{ width: 200, flexShrink: 0, background: coverGradient, position: 'relative', overflow: 'hidden' }}>
                  {event.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={event.cover_image_url} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  ) : staticCover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={staticCover} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 160 }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth={1.5} style={{ width: 40, height: 40 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  {/* Top row: badge + actions */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{
                      display: 'inline-block', padding: '4px 12px',
                      fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
                      background: 'rgba(196,30,58,0.1)', color: '#C41E3A',
                      border: '1px solid rgba(196,30,58,0.2)', borderRadius: 100,
                    }}>
                      {EVENT_LABEL[event.event_type]}
                    </span>

                    {/* Action icons */}
                    <div style={{ display: 'flex', gap: 6 }}>
                      {/* Edit */}
                      <button className="ev-action-btn"
                        style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #E2DDD7', background: '#F8F5F2', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.15s', color: '#706A64' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} style={{ width: 13, height: 13 }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                        </svg>
                      </button>
                      {/* Share */}
                      <button className="ev-action-btn"
                        style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #E2DDD7', background: '#F8F5F2', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.15s', color: '#706A64' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} style={{ width: 13, height: 13 }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                      </button>
                      {/* Delete */}
                      <button className="ev-action-btn"
                        onClick={() => setDeleteConfirm(event)}
                        style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #E2DDD7', background: '#F8F5F2', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.15s', color: '#706A64' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} style={{ width: 13, height: 13 }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 style={{ color: '#141210', fontFamily: 'serif', fontWeight: 700, fontSize: '1.35rem', marginBottom: 10, lineHeight: 1.2 }}>
                    {event.title}
                  </h3>

                  {/* Date / Time / Location */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="#9E9690" strokeWidth={1.8} style={{ width: 14, height: 14, flexShrink: 0 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                      </svg>
                      <span style={{ color: '#706A64', fontSize: '0.82rem' }}>{formatDateOnly(event.event_date)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="#9E9690" strokeWidth={1.8} style={{ width: 14, height: 14, flexShrink: 0 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span style={{ color: '#706A64', fontSize: '0.82rem' }}>{formatTimeOnly(event.event_date)}</span>
                    </div>
                    {event.location && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#9E9690" strokeWidth={1.8} style={{ width: 14, height: 14, flexShrink: 0 }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                        <span style={{ color: '#706A64', fontSize: '0.82rem' }}>{event.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {event.notes && (
                    <p style={{ color: '#9E9690', fontSize: '0.78rem', lineHeight: 1.5, marginBottom: 12 }}>
                      {event.notes}
                    </p>
                  )}

                  {/* Bottom row: outfit badge + assign button */}
                  {upcoming && (
                    <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {assignedOutfit && (
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4ade80', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 100, padding: '3px 10px' }}>
                          ✓ {t.events.outfitAssigned}
                        </span>
                      )}
                      <button
                        onClick={() => setAssignModal(event)}
                        style={{
                          marginLeft: 'auto',
                          background: 'linear-gradient(135deg, #7a0020 0%, #C41E3A 55%, #e8294a 100%)',
                          borderRadius: 10, border: 'none', color: 'white',
                          fontWeight: 600, fontSize: '0.82rem', padding: '9px 18px',
                          cursor: 'pointer', boxShadow: '0 3px 12px rgba(196,30,58,0.3)',
                          display: 'flex', alignItems: 'center', gap: 6,
                        }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ width: 12, height: 12 }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Kombin
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Assign Outfit Modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-sm p-6 max-h-[70vh] flex flex-col"
            style={{ background: '#FFFFFF', border: '1px solid #E2DDD7', borderRadius: 16 }}>
            <p style={sectionLabelStyle} className="mb-1">{t.events.selectOutfitLabel}</p>
            <p style={{ color: '#706A64', fontSize: '0.75rem', marginBottom: 16 }}>{t.events.forEvent} {assignModal.title}</p>
            {outfits.length === 0 ? (
              <p style={{ color: '#706A64', fontSize: '0.875rem', textAlign: 'center', padding: '32px 0' }}>{t.events.noSavedOutfits}</p>
            ) : (
              <div className="overflow-y-auto space-y-2 flex-1">
                {outfits.map(outfit => (
                  <button key={outfit.id} onClick={() => handleAssignOutfit(outfit.id)}
                    className="w-full flex items-center gap-3 p-3 text-left transition-all"
                    style={{ borderRadius: 12, border: assignModal.outfit_id === outfit.id ? '1px solid rgba(196,30,58,0.3)' : '1px solid #E2DDD7', background: assignModal.outfit_id === outfit.id ? 'rgba(196,30,58,0.1)' : '#F5F2EE', cursor: 'pointer' }}>
                    {outfit.cover_image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={outfit.cover_image_url} alt="" className="h-12 w-12 object-cover shrink-0" style={{ borderRadius: 8 }} />
                    )}
                    <div className="min-w-0 flex-1">
                      <p style={{ color: '#141210', fontSize: '0.875rem', fontWeight: 500 }} className="truncate">
                        {outfit.name ?? `${EVENT_LABEL[outfit.event as EventType]} Outfit`}
                      </p>
                      <p style={{ color: '#706A64', fontSize: '0.75rem' }}>{EVENT_LABEL[outfit.event as EventType]}</p>
                    </div>
                    {assignModal.outfit_id === outfit.id && (
                      <span style={{ color: '#4ade80', fontSize: '0.875rem' }}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setAssignModal(null)}
              style={{ marginTop: 16, width: '100%', background: '#F5F2EE', border: '1px solid #E2DDD7', borderRadius: 12, color: '#141210', fontWeight: 500, fontSize: '0.875rem', padding: '10px 16px', cursor: 'pointer' }}>
              {t.events.cancel}
            </button>
          </div>
        </div>
      )}

      {/* ── Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-sm p-8" style={{ background: '#FFFFFF', border: '1px solid #E2DDD7', borderRadius: 16 }}>
            <p style={sectionLabelStyle} className="mb-3">{t.events.confirmDelete}</p>
            <h3 style={{ color: '#141210', fontFamily: 'serif', fontWeight: 700, fontSize: '1.25rem', marginBottom: 8 }}>{deleteConfirm.title}</h3>
            <p style={{ color: '#706A64', fontSize: '0.875rem', marginBottom: 24 }}>{t.events.deleteEventConfirm}</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                style={{ flex: 1, background: '#F5F2EE', border: '1px solid #E2DDD7', borderRadius: 12, color: '#141210', fontWeight: 500, fontSize: '0.875rem', padding: '10px 16px', cursor: 'pointer' }}>
                {t.events.cancel}
              </button>
              <button onClick={handleDelete} disabled={deleteEvent.isPending}
                style={{ flex: 1, background: 'linear-gradient(135deg, #7a0020 0%, #C41E3A 60%, #e8294a 100%)', borderRadius: 12, border: 'none', color: 'white', fontWeight: 600, fontSize: '0.875rem', padding: '10px 16px', cursor: deleteEvent.isPending ? 'not-allowed' : 'pointer', opacity: deleteEvent.isPending ? 0.6 : 1 }}>
                {deleteEvent.isPending ? t.events.deleting : t.events.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
