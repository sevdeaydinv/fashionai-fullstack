'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useWardrobe } from '@/lib/hooks/useWardrobe';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { ClothingItem } from '@/types/wardrobe.types';
import { ALL_CITIES } from '@/constants/cities';

const OPENWEATHER_API_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY ?? '';
const NIGHT_OPTIONS = ['1', '2', '3', '5', '7', '10', '14'];

const EVENT_OPTIONS = [
  { key: 'gunluk',    label: 'Günlük'        },
  { key: 'is',        label: 'İş / Toplantı' },
  { key: 'tatil',     label: 'Tatil'         },
  { key: 'romantik',  label: 'Romantik Akşam'},
  { key: 'dugun',     label: 'Düğün'         },
  { key: 'davet',     label: 'Davet / Gala'  },
  { key: 'mezuniyet', label: 'Mezuniyet'     },
  { key: 'spor',      label: 'Spor'          },
  { key: 'kamp',      label: 'Kamp / Doğa'  },
  { key: 'piknik',    label: 'Piknik'        },
];

const EVENT_LABEL: Record<string, string> = Object.fromEntries(
  EVENT_OPTIONS.map(o => [o.key, o.label])
);

const TR_MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const TR_DAYS_SHORT = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];

type DayEvents = { morning?: string; evening?: string };

interface WeatherData {
  city: string; country: string;
  temp: number; feels_like: number;
  condition: string; humidity: number; wind: number;
}

interface DayOutfit {
  day: number; label: string;
  slot?: 'morning' | 'evening';
  purpose_used?: string;
  reason: string;
  top: ClothingItem | null; bottom: ClothingItem | null;
  shoes: ClothingItem | null; bag: ClothingItem | null;
  outer: ClothingItem | null;
}

interface ValizResult {
  outfits: DayOutfit[];
  packingItems: ClothingItem[];
  essentials: string[];
}

function buildCalendarGrid(year: number, month: number): { day: number; overflow: boolean }[] {
  const firstDay   = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays   = new Date(year, month, 0).getDate();
  const startOffset = (firstDay + 6) % 7;
  const cells: { day: number; overflow: boolean }[] = [];
  for (let i = startOffset - 1; i >= 0; i--) cells.push({ day: prevDays - i, overflow: true });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, overflow: false });
  let next = 1;
  while (cells.length % 7 !== 0) cells.push({ day: next++, overflow: true });
  return cells;
}

function ClothingImage({ item, size = 72 }: { item: ClothingItem; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 12,
      border: '1px solid rgba(0,0,0,0.07)',
      background: '#F8F5F2',
      overflow: 'hidden', position: 'relative', flexShrink: 0,
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    }}>
      {item.image_url ? (
        <Image src={item.image_url} alt={item.name} fill className="object-cover" />
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: item.color }} />
        </div>
      )}
    </div>
  );
}

/* ── Sun SVG icon ────────────────────────────────── */
function SunIcon({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="14" fill="url(#vSunGrad)" />
      {[0,45,90,135,180,225,270,315].map((deg, i) => (
        <line key={i}
          x1={32 + Math.cos(deg * Math.PI/180) * 19} y1={32 + Math.sin(deg * Math.PI/180) * 19}
          x2={32 + Math.cos(deg * Math.PI/180) * 25} y2={32 + Math.sin(deg * Math.PI/180) * 25}
          stroke="#F5A623" strokeWidth="3" strokeLinecap="round"
        />
      ))}
      <defs>
        <radialGradient id="vSunGrad" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#FFD966"/>
          <stop offset="60%" stopColor="#F5A623"/>
          <stop offset="100%" stopColor="#E8890A"/>
        </radialGradient>
      </defs>
    </svg>
  );
}

export default function ValizPage() {
  const supabase = createClient();
  const { t } = useLanguage();
  const { data: userData } = useQuery({
    queryKey: ['user'],
    queryFn: async () => { const { data: { user } } = await supabase.auth.getUser(); return user; },
  });
  const userId = userData?.id ?? null;
  const { clothes, isLoading: wardrobeLoading } = useWardrobe(userId);

  const [inputVal, setInputVal]       = useState('');
  const [apiCity, setApiCity]         = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [nights, setNights]           = useState('3');
  const [purposes]                    = useState<string[]>(['gunluk']);
  const [weather, setWeather]         = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError]     = useState<string | null>(null);
  const [valizResult, setValizResult] = useState<ValizResult | null>(null);
  const [aiLoading, setAiLoading]     = useState(false);
  const [aiError, setAiError]         = useState<string | null>(null);
  const [checked, setChecked]         = useState<Set<string>>(new Set());
  const [showPackingList, setShowPackingList] = useState(false);
  const dropdownRef  = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const [startDate, setStartDate]     = useState('');
  const [calendarEvents, setCalendarEvents] = useState<Record<number, DayEvents>>({});
  const [editingDay, setEditingDay]   = useState<number | null>(null);
  const [editMorning, setEditMorning] = useState('');
  const [editEvening, setEditEvening] = useState('');
  const [calMonth, setCalMonth]       = useState(() => {
    const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const POPULAR_KEYS = ['Istanbul','Paris','London','Dubai','Tokyo','Bali','Barcelona','New York','Rome','Antalya','Amsterdam','Bangkok'];
  const popularCities = ALL_CITIES.filter(c => POPULAR_KEYS.includes(c.city));
  const filteredCities = inputVal.trim().length >= 2
    ? ALL_CITIES.filter(c =>
        c.label.toLowerCase().includes(inputVal.toLowerCase()) ||
        c.city.toLowerCase().includes(inputVal.toLowerCase())
      ).slice(0, 40)
    : popularCities;

  const tripDayMap = useMemo(() => {
    const map: Record<string, number> = {};
    if (!startDate) return map;
    const start = new Date(startDate + 'T00:00:00');
    const n = parseInt(nights) || 0;
    for (let i = 0; i < n; i++) {
      const d = new Date(start); d.setDate(d.getDate() + i);
      map[d.toISOString().slice(0, 10)] = i + 1;
    }
    return map;
  }, [startDate, nights]);

  const calendarGrid = useMemo(
    () => buildCalendarGrid(calMonth.getFullYear(), calMonth.getMonth()),
    [calMonth]
  );

  const tripDayList = useMemo(() =>
    Object.entries(tripDayMap).sort(([, a], [, b]) => a - b),
    [tripDayMap]
  );

  const handleDayClick = (dayNum: number) => {
    setEditingDay(dayNum);
    const ev = calendarEvents[dayNum] ?? {};
    setEditMorning(ev.morning ?? '');
    setEditEvening(ev.evening ?? '');
  };

  const saveEvents = () => {
    if (editingDay === null) return;
    const morning = editMorning.trim();
    const evening = editEvening.trim();
    setCalendarEvents(prev => {
      const updated = { ...prev };
      if (!morning && !evening) { delete updated[editingDay!]; }
      else { updated[editingDay!] = { ...(morning ? { morning } : {}), ...(evening ? { evening } : {}) }; }
      return updated;
    });
    setEditingDay(null);
  };

  const getDayDateLabel = (dayNum: number) => {
    if (!startDate) return `${dayNum}. Gün`;
    const d = new Date(startDate + 'T00:00:00');
    d.setDate(d.getDate() + dayNum - 1);
    return `${d.getDate()} ${TR_MONTHS[d.getMonth()]}`;
  };

  const getDayWeekday = (dayNum: number) => {
    if (!startDate) return '';
    const d = new Date(startDate + 'T00:00:00');
    d.setDate(d.getDate() + dayNum - 1);
    return TR_DAYS_SHORT[(d.getDay() + 6) % 7];
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectCity = (label: string, cityName: string) => {
    setInputVal(label); setApiCity(cityName); setShowDropdown(false);
  };

  const generatePlan = async () => {
    const cityToSearch = apiCity || inputVal.trim();
    if (!cityToSearch) { setWeatherError(t.valiz.cityRequired); return; }
    setWeatherError(null); setAiError(null); setValizResult(null); setChecked(new Set()); setShowPackingList(false);
    setWeatherLoading(true);
    let w: WeatherData;
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityToSearch)}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=tr`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.cod !== 200) { setWeatherError(t.valiz.cityNotFound); setWeatherLoading(false); return; }
      w = {
        city: data.name, country: data.sys.country,
        temp: Math.round(data.main.temp), feels_like: Math.round(data.main.feels_like),
        condition: data.weather[0].description,
        humidity: data.main.humidity, wind: Math.round(data.wind.speed * 3.6),
      };
      setWeather(w);
    } catch { setWeatherError(t.valiz.connectionError); setWeatherLoading(false); return; }
    setWeatherLoading(false);
    if (clothes.length === 0) { setAiError(t.valiz.noClothesError); return; }
    setAiLoading(true);
    try {
      const res = await fetch('/api/valiz-outfits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clothes, temp: w.temp, condition: w.condition, nights, purposes, calendarEvents, startDate }),
      });
      const data = await res.json();
      if (!res.ok) { setAiError(data.error ?? t.valiz.aiError); return; }
      setValizResult(data);
    } catch { setAiError(t.valiz.serverError); }
    setAiLoading(false);
  };

  const toggleCheck = (key: string) => {
    setChecked(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  };

  const isLoading = weatherLoading || aiLoading;

  // Format date for display
  const displayDate = startDate
    ? (() => { const d = new Date(startDate + 'T00:00:00'); return `${d.getDate()} ${TR_MONTHS[d.getMonth()]} ${d.getFullYear()}`; })()
    : '';

  const P = {
    red: '#C41E3A', redDark: '#7a0020',
    text: '#1D1D1D', muted: '#706A64', faint: '#9E9690',
    card: '#FFFFFF', border: 'rgba(0,0,0,0.07)',
    bg: '#FAF7F5', beige: '#EFE7E1',
  };

  const SL: React.CSSProperties = {
    color: P.faint, fontSize: '0.58rem', letterSpacing: '0.18em',
    textTransform: 'uppercase', fontWeight: 700,
  };

  return (
    <div>
      <style>{`
        .vl-city-btn:hover { background: #F5F2EE !important; }
        .vl-night-btn:hover { border-color: rgba(196,30,58,0.25) !important; background: rgba(196,30,58,0.05) !important; }
        .vl-outfit-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.1) !important; }
        .vl-day-ev:hover { background: rgba(196,30,58,0.04) !important; }
        .vl-ev-chip:hover { background: rgba(196,30,58,0.08) !important; border-color: rgba(196,30,58,0.25) !important; }
      `}</style>

      {/* ── Page header ─────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <p style={SL} className="mb-1">{t.valiz.sectionLabel}</p>
        <h1 style={{ color: P.text, fontFamily: 'serif', fontWeight: 700, fontSize: '2.1rem', marginBottom: 6 }}>
          {t.valiz.title}
        </h1>
        <p style={{ color: P.muted, fontSize: '0.875rem' }}>{t.valiz.subtitle}</p>
      </div>

      <div style={{ height: 1, background: P.border, marginBottom: 28 }} />

      {/* Wardrobe warning */}
      {!wardrobeLoading && clothes.length === 0 && (
        <div style={{ background: 'rgba(196,30,58,0.07)', border: '1px solid rgba(196,30,58,0.18)', borderRadius: 14, padding: '14px 20px', marginBottom: 20 }}>
          <p style={{ color: '#C87070', fontSize: '0.85rem' }}>
            {t.valiz.noClothesWarning}{' '}
            <a href="/dashboard/wardrobe" style={{ color: P.red, fontWeight: 600, textDecoration: 'underline' }}>Dolap</a>
            {' '}{t.valiz.addClothesLink}
          </p>
        </div>
      )}

      {/* ── SECTION 1: Travel Setup ──────────────── */}
      <div style={{
        background: P.card, border: `1px solid ${P.border}`,
        borderRadius: 22, padding: '24px 28px',
        boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
        marginBottom: 20,
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 16, alignItems: 'end' }}>

          {/* Destination */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <p style={{ ...SL, marginBottom: 8 }}>Nereye Gidiyorsun?</p>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: '#F8F5F2', border: `1px solid ${P.border}`,
              borderRadius: 12, padding: '10px 14px', cursor: 'pointer',
            }}
              onClick={() => setShowDropdown(v => !v)}
            >
              <svg viewBox="0 0 24 24" fill={P.red} style={{ width: 16, height: 16, flexShrink: 0 }}>
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <input
                type="text"
                placeholder="Şehir ara..."
                value={inputVal}
                onChange={(e) => { setInputVal(e.target.value); setApiCity(''); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                onKeyDown={(e) => { if (e.key === 'Enter') { setShowDropdown(false); generatePlan(); } }}
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '0.875rem', color: P.text, cursor: 'text' }}
              />
              <svg viewBox="0 0 24 24" fill="none" stroke={P.faint} strokeWidth={2} style={{ width: 14, height: 14, flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </div>

            {showDropdown && (
              <div style={{
                position: 'absolute', zIndex: 50, top: 'calc(100% + 6px)', left: 0, right: 0,
                background: '#FFFFFF', border: `1px solid ${P.border}`, borderRadius: 14,
                boxShadow: '0 12px 40px rgba(0,0,0,0.14)', overflow: 'hidden',
              }}>
                {inputVal.trim().length < 2 && (
                  <div style={{ padding: '10px 16px 6px', borderBottom: `1px solid ${P.border}` }}>
                    <p style={SL}>Popüler Destinasyonlar</p>
                  </div>
                )}
                {inputVal.trim().length >= 2 && filteredCities.length === 0 ? (
                  <div style={{ padding: '12px 16px', fontSize: '0.875rem' }}>
                    <span style={{ color: P.muted }}>&quot;{inputVal}&quot; listede yok. </span>
                    <button style={{ color: P.text, fontWeight: 600, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
                      onClick={() => { setApiCity(inputVal.trim()); setShowDropdown(false); }}>
                      Yine de devam et
                    </button>
                  </div>
                ) : (
                  <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                    {filteredCities.map((c, i) => (
                      <button key={i} className="vl-city-btn"
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', fontSize: '0.875rem', background: 'none', border: 'none', cursor: 'pointer', color: P.text, textAlign: 'left', transition: 'background 0.1s' }}
                        onClick={() => selectCity(c.label, c.city)}
                      >
                        <span style={{ fontSize: '1rem' }}>{c.flag}</span>
                        <span>{c.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Start date */}
          <div>
            <p style={{ ...SL, marginBottom: 8 }}>Başlangıç Tarihi</p>
            <label
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: '#F8F5F2', border: `1px solid ${P.border}`,
                borderRadius: 12, padding: '10px 14px', position: 'relative',
                cursor: 'pointer',
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke={P.red} strokeWidth={1.8} style={{ width: 16, height: 16, flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <span style={{ flex: 1, fontSize: '0.875rem', color: displayDate ? P.text : P.faint }}>
                {displayDate || 'Tarih seç'}
              </span>
              <svg viewBox="0 0 24 24" fill="none" stroke={P.faint} strokeWidth={2} style={{ width: 14, height: 14, flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
              <input
                ref={dateInputRef}
                type="date" value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (e.target.value) { const d = new Date(e.target.value + 'T00:00:00'); setCalMonth(new Date(d.getFullYear(), d.getMonth(), 1)); }
                }}
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%' }}
              />
            </label>
          </div>

          {/* Generate button */}
          <button
            onClick={generatePlan}
            disabled={isLoading || wardrobeLoading}
            style={{
              background: isLoading ? 'rgba(196,30,58,0.7)' : 'linear-gradient(135deg, #7a0020 0%, #C41E3A 55%, #e03050 100%)',
              borderRadius: 12, border: 'none', color: 'white',
              fontWeight: 600, fontSize: '0.9rem', letterSpacing: '0.01em',
              padding: '11px 28px', cursor: isLoading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 20px rgba(196,30,58,0.35)',
              display: 'flex', alignItems: 'center', gap: 8,
              whiteSpace: 'nowrap',
            }}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin" style={{ width: 15, height: 15 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                {weatherLoading ? 'Hava alınıyor…' : 'Plan hazırlanıyor…'}
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 15, height: 15 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                Planı Oluştur
              </>
            )}
          </button>
        </div>

        {/* Nights selector — compact row below */}
        <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
          <p style={{ ...SL, whiteSpace: 'nowrap' }}>{t.valiz.nightsLabel}</p>
          <div style={{ display: 'flex', gap: 6 }}>
            {NIGHT_OPTIONS.map(n => (
              <button key={n} className="vl-night-btn"
                onClick={() => setNights(n)}
                style={{
                  padding: '5px 12px', fontSize: '0.78rem', fontWeight: 600,
                  borderRadius: 8,
                  border: nights === n ? '1px solid rgba(196,30,58,0.35)' : `1px solid ${P.border}`,
                  background: nights === n ? 'rgba(196,30,58,0.09)' : '#F8F5F2',
                  color: nights === n ? P.red : P.muted,
                  cursor: 'pointer', transition: 'all 0.14s',
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error messages */}
      {(weatherError || aiError) && (
        <div style={{ background: 'rgba(196,30,58,0.08)', border: '1px solid rgba(196,30,58,0.2)', borderRadius: 12, padding: '12px 18px', marginBottom: 16 }}>
          <p style={{ color: '#C87070', fontSize: '0.85rem' }}>{weatherError ?? aiError}</p>
        </div>
      )}

      {/* ── SECTION 2: Weather + Calendar ─────────── */}
      {(weather || startDate) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 16, marginBottom: 20 }}>

          {/* Weather card */}
          {weather ? (
            <div style={{
              background: 'linear-gradient(140deg, #FFFAF4 0%, #FFF3E0 60%, #FFE8C2 100%)',
              border: `1px solid ${P.border}`, borderRadius: 22,
              padding: '24px 22px', position: 'relative', overflow: 'hidden',
              boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
            }}>
              {/* Glow */}
              <div style={{ position: 'absolute', top: -30, right: -20, width: 140, height: 140, background: 'radial-gradient(circle, rgba(255,180,60,0.3) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

              <p style={{ ...SL, marginBottom: 16 }}>Hava Durumu</p>

              {/* City */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 12 }}>
                <svg viewBox="0 0 24 24" fill={P.red} style={{ width: 13, height: 13 }}>
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: P.text }}>{weather.city}, {weather.country}</span>
              </div>

              {/* Icon + temp */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                <SunIcon size={60} />
                <div>
                  <p style={{ fontSize: '2.6rem', fontWeight: 700, color: P.text, lineHeight: 1, letterSpacing: '-0.02em' }}>{weather.temp}°C</p>
                  <p style={{ fontSize: '0.78rem', color: P.muted, marginTop: 4, textTransform: 'capitalize' }}>{weather.condition}</p>
                </div>
              </div>

              {/* Divider */}
              <div style={{ borderTop: '1px solid rgba(0,0,0,0.07)', marginBottom: 14 }} />

              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0 }}>
                {[
                  { label: 'Hissedilen', value: `${weather.feels_like}°C`, icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="#E05050" strokeWidth={1.8} style={{ width: 18, height: 18 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm-3-9v1.5M12 19.5V21m-6.364-3.136l1.06-1.06M17.304 6.696l1.06-1.06M3 12H4.5m15 0H21m-3.136 6.364l-1.06-1.06M6.696 6.696l-1.06-1.06" />
                    </svg>
                  )},
                  { label: 'Nem', value: `%${weather.humidity}`, icon: (
                    <svg viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
                      <path d="M12 2C12 2 5 10 5 15C5 18.866 8.134 22 12 22C15.866 22 19 18.866 19 15C19 10 12 2 12 2Z" fill="#4A9DD4" opacity="0.85"/>
                    </svg>
                  )},
                  { label: 'Rüzgar', value: `${weather.wind} km/s`, icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="#4A7DD4" strokeWidth={1.8} style={{ width: 18, height: 18 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/>
                    </svg>
                  )},
                ].map((s, i) => (
                  <div key={i} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    ...(i > 0 ? { borderLeft: '1px solid rgba(0,0,0,0.07)' } : {}),
                  }}>
                    {s.icon}
                    <p style={{ fontSize: '0.9rem', fontWeight: 700, color: P.text }}>{s.value}</p>
                    <p style={{ fontSize: '0.6rem', color: P.faint, letterSpacing: '0.05em' }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 22, padding: '24px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 200 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={P.faint} strokeWidth={1.5} style={{ width: 36, height: 36 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
              </svg>
              <p style={{ color: P.faint, fontSize: '0.8rem' }}>Hava durumu için şehir seçin</p>
            </div>
          )}

          {/* Calendar card */}
          <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 22, padding: '24px 22px', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
            {/* Month nav */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <button onClick={() => setCalMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.muted, fontSize: '1.2rem', lineHeight: 1, padding: '2px 10px', borderRadius: 8 }}>‹</button>
              <p style={{ color: P.text, fontWeight: 700, fontSize: '0.9rem' }}>
                {TR_MONTHS[calMonth.getMonth()]} {calMonth.getFullYear()}
              </p>
              <button onClick={() => setCalMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.muted, fontSize: '1.2rem', lineHeight: 1, padding: '2px 10px', borderRadius: 8 }}>›</button>
            </div>

            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 6 }}>
              {TR_DAYS_SHORT.map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: '0.58rem', color: P.faint, fontWeight: 700, letterSpacing: '0.05em', paddingBottom: 4 }}>{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {calendarGrid.map((cell, idx) => {
                const { day, overflow } = cell;

                // Only match current-month days to trip
                const y = calMonth.getFullYear();
                const m = String(calMonth.getMonth() + 1).padStart(2, '0');
                const dateStr = `${y}-${m}-${String(day).padStart(2, '0')}`;
                const tripDates = Object.keys(tripDayMap).sort();
                const totalTrip = tripDates.length;
                const tripIndex = overflow ? -1 : tripDates.indexOf(dateStr);
                const isTripDay = !overflow && tripIndex !== -1;
                const tripDayNum = isTripDay ? tripDayMap[dateStr] : undefined;

                // Gradient: dark red (#8B2035) → light pink (#F0B8C0)
                const getTripColor = (i: number, total: number) => {
                  const t = total <= 1 ? 0 : i / (total - 1);
                  const r = Math.round(139 + (240 - 139) * t);
                  const g = Math.round(32  + (184 -  32) * t);
                  const b = Math.round(53  + (192 -  53) * t);
                  return `rgb(${r},${g},${b})`;
                };

                const bg    = isTripDay ? getTripColor(tripIndex, totalTrip) : 'transparent';
                const color = overflow  ? '#C8C4BE'
                            : isTripDay ? '#FFFFFF'
                            : '#1D1D1D';
                const fw    = isTripDay ? 700 : overflow ? 400 : 400;

                return (
                  <button key={idx}
                    onClick={() => isTripDay && tripDayNum !== undefined ? handleDayClick(tripDayNum) : undefined}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      height: 38, borderRadius: 10,
                      fontSize: '0.82rem', fontWeight: fw,
                      background: bg, color,
                      border: 'none',
                      cursor: isTripDay ? 'pointer' : 'default',
                      transition: 'all 0.1s',
                    }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${P.border}` }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: P.red }} />
              <span style={{ fontSize: '0.7rem', color: P.muted }}>Seçili Günler</span>
            </div>

            {/* Event editor */}
            {editingDay !== null && (
              <div style={{ marginTop: 14, background: '#FAF7F5', borderRadius: 14, border: `1px solid ${P.border}`, padding: 16 }}>
                <p style={{ color: P.text, fontSize: '0.8rem', fontWeight: 700, marginBottom: 12 }}>
                  {editingDay}. Gün — {getDayDateLabel(editingDay)}
                </p>
                {(['morning', 'evening'] as const).map(slot => (
                  <div key={slot} style={{ marginBottom: slot === 'morning' ? 12 : 0 }}>
                    <p style={{ ...SL, marginBottom: 8 }}>{slot === 'morning' ? '☀ Sabah' : '🌙 Akşam'}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {EVENT_OPTIONS.map(opt => {
                        const curVal = slot === 'morning' ? editMorning : editEvening;
                        const sel = curVal === opt.key;
                        return (
                          <button key={opt.key} className="vl-ev-chip"
                            onClick={() => slot === 'morning' ? setEditMorning(sel ? '' : opt.key) : setEditEvening(sel ? '' : opt.key)}
                            style={{ padding: '4px 11px', fontSize: '0.7rem', fontWeight: sel ? 700 : 500, borderRadius: 100, border: sel ? `1px solid ${P.red}` : `1px solid ${P.border}`, background: sel ? 'rgba(196,30,58,0.1)' : '#FFF', color: sel ? P.red : P.muted, cursor: 'pointer', transition: 'all 0.1s' }}
                          >{opt.label}</button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <button onClick={saveEvents} style={{ flex: 1, background: P.red, color: 'white', border: 'none', borderRadius: 9, padding: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>Kaydet</button>
                  <button onClick={() => setEditingDay(null)} style={{ padding: '8px 14px', background: 'none', border: `1px solid ${P.border}`, borderRadius: 9, fontSize: '0.75rem', color: P.muted, cursor: 'pointer' }}>İptal</button>
                </div>
              </div>
            )}

            {tripDayList.length === 0 && (
              <p style={{ color: P.faint, fontSize: '0.75rem', textAlign: 'center', marginTop: 12 }}>
                Başlangıç tarihini seçince gezi günlerin görünür
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── SECTION 3: Daily Plan ──────────────────── */}
      {valizResult && valizResult.outfits.length > 0 && (() => {
        const dayMap = new Map<number, DayOutfit[]>();
        valizResult.outfits.forEach(o => {
          if (!dayMap.has(o.day)) dayMap.set(o.day, []);
          dayMap.get(o.day)!.push(o);
        });
        const dayEntries = Array.from(dayMap.entries()).sort(([a], [b]) => a - b);

        return (
          <div style={{ marginBottom: 20 }}>
            {/* Section header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ color: P.red, fontSize: '0.85rem' }}>✦</span>
              <h2 style={{ color: P.text, fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.01em' }}>Gün Gün Planın</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {dayEntries.map(([dayNum, dayOutfits]) => {
                const morning = dayOutfits.find(o => o.slot === 'morning' || dayOutfits.length === 1);
                const evening = dayOutfits.find(o => o.slot === 'evening');
                const dateNum = (() => {
                  if (!startDate) return dayNum;
                  const d = new Date(startDate + 'T00:00:00'); d.setDate(d.getDate() + dayNum - 1); return d.getDate();
                })();
                const monthName = (() => {
                  if (!startDate) return '';
                  const d = new Date(startDate + 'T00:00:00'); d.setDate(d.getDate() + dayNum - 1); return TR_MONTHS[d.getMonth()];
                })();
                const weekday = getDayWeekday(dayNum);

                const morningEvent = calendarEvents[dayNum]?.morning;
                const eveningEvent = calendarEvents[dayNum]?.evening;

                return (
                  <div key={dayNum} style={{
                    background: P.card, border: `1px solid ${P.border}`,
                    borderRadius: 18, overflow: 'hidden',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                    display: 'grid', gridTemplateColumns: '90px 1fr 1fr',
                  }}>
                    {/* Day number column */}
                    <div style={{
                      background: '#FAF7F5', borderRight: `1px solid ${P.border}`,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      padding: '20px 10px', position: 'relative',
                    }}>
                      <div style={{ position: 'absolute', left: 0, top: '15%', bottom: '15%', width: 3, background: P.red, borderRadius: '0 2px 2px 0' }} />
                      <p style={{ ...SL, marginBottom: 4 }}>{dayNum}. GÜN</p>
                      <p style={{ fontSize: '2rem', fontWeight: 800, color: P.text, lineHeight: 1, letterSpacing: '-0.02em' }}>{dateNum}</p>
                      {monthName && <p style={{ fontSize: '0.7rem', color: P.muted, marginTop: 3 }}>{monthName}</p>}
                      {weekday  && <p style={{ fontSize: '0.65rem', color: P.faint, marginTop: 1 }}>{weekday}</p>}
                    </div>

                    {/* Morning slot */}
                    <div style={{ padding: '18px 16px', borderRight: `1px solid ${P.border}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth={2} style={{ width: 15, height: 15 }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                        </svg>
                        <p style={{ ...SL }}>SABAH</p>
                      </div>
                      {morningEvent && (
                        <p style={{ fontSize: '0.78rem', color: P.muted, marginBottom: 10, fontWeight: 500 }}>{EVENT_LABEL[morningEvent] ?? morningEvent}</p>
                      )}
                      {morning ? (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {[morning.top, morning.bottom, morning.shoes, morning.bag, morning.outer]
                            .filter(Boolean).slice(0, 4)
                            .map((item, i) => <ClothingImage key={i} item={item!} size={68} />)}
                        </div>
                      ) : (
                        <p style={{ color: P.faint, fontSize: '0.75rem' }}>—</p>
                      )}
                    </div>

                    {/* Evening slot */}
                    <div style={{ padding: '18px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#7B8FCA" strokeWidth={2} style={{ width: 15, height: 15 }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                        </svg>
                        <p style={{ ...SL }}>AKŞAM</p>
                      </div>
                      {eveningEvent && (
                        <p style={{ fontSize: '0.78rem', color: P.muted, marginBottom: 10, fontWeight: 500 }}>{EVENT_LABEL[eveningEvent] ?? eveningEvent}</p>
                      )}
                      {evening ? (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {[evening.top, evening.bottom, evening.shoes, evening.bag, evening.outer]
                            .filter(Boolean).slice(0, 4)
                            .map((item, i) => <ClothingImage key={i} item={item!} size={68} />)}
                        </div>
                      ) : morning ? (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {[morning.top, morning.bottom, morning.shoes, morning.bag]
                            .filter(Boolean).slice(0, 4)
                            .map((item, i) => <ClothingImage key={i} item={item!} size={68} />)}
                        </div>
                      ) : (
                        <p style={{ color: P.faint, fontSize: '0.75rem' }}>—</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* ── SECTION 4: Packing list (expandable) ──── */}
      {valizResult && (
        <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 18, overflow: 'hidden', marginBottom: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <button
            onClick={() => setShowPackingList(v => !v)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(196,30,58,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke={P.red} strokeWidth={2} style={{ width: 16, height: 16 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
                </svg>
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ color: P.text, fontWeight: 700, fontSize: '0.875rem' }}>Valiz Listesi</p>
                <p style={{ color: P.faint, fontSize: '0.7rem', marginTop: 1 }}>{nights} gece için hazırlandı</p>
              </div>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke={P.muted} strokeWidth={2} style={{ width: 16, height: 16, transition: 'transform 0.2s', transform: showPackingList ? 'rotate(180deg)' : 'none' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {showPackingList && (
            <div style={{ padding: '0 24px 24px', borderTop: `1px solid ${P.border}`, paddingTop: 20 }}>
              {valizResult.packingItems.length > 0 && (
                <>
                  <p style={{ ...SL, marginBottom: 12 }}>{t.valiz.fromWardrobe}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                    {valizResult.packingItems.map(item => {
                      const key = `item-${item.id}`;
                      const done = checked.has(key);
                      return (
                        <button key={key} onClick={() => toggleCheck(key)}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                          <span style={{ width: 16, height: 16, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: done ? 'none' : `1px solid ${P.border}`, background: done ? P.red : 'transparent' }}>
                            {done && <svg style={{ width: 10, height: 10 }} fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                          </span>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, backgroundColor: item.color, border: '1px solid rgba(0,0,0,0.1)' }} />
                          <span style={{ color: done ? P.faint : P.muted, textDecoration: done ? 'line-through' : 'none', fontSize: '0.875rem', transition: 'all 0.15s' }}>{item.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ height: 1, background: P.border, marginBottom: 20 }} />
                </>
              )}
              <p style={{ ...SL, marginBottom: 12 }}>{t.valiz.essentials}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {valizResult.essentials.map((item, i) => {
                  const key = `ess-${i}`;
                  const done = checked.has(key);
                  return (
                    <button key={key} onClick={() => toggleCheck(key)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                      <span style={{ width: 16, height: 16, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: done ? 'none' : `1px solid ${P.border}`, background: done ? P.red : 'transparent' }}>
                        {done && <svg style={{ width: 10, height: 10 }} fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      </span>
                      <span style={{ color: done ? P.faint : P.muted, textDecoration: done ? 'line-through' : 'none', fontSize: '0.875rem', transition: 'all 0.15s' }}>{item}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
