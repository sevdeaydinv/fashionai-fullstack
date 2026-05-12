import { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert,
  Modal, FlatList, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase/client';
import { API_BASE_URL } from '@/lib/config';
import { ALL_CITIES } from '@/lib/cities';

// ── Constants ────────────────────────────────────────────────
const RED   = '#C41E3A';
const RED_BG = 'rgba(196,30,58,0.08)';

const POPULAR_KEYS = ['Istanbul','Paris','London','Dubai','Tokyo','Bali','Barcelona','New York','Rome','Antalya','Amsterdam','Bangkok'];
const POPULAR_CITIES = ALL_CITIES.filter(c => POPULAR_KEYS.includes(c.city));
const NIGHT_OPTIONS = ['1','2','3','5','7','10','14'];

const EVENT_OPTIONS = [
  { key: 'gunluk',    label: 'Günlük'         },
  { key: 'is',        label: 'İş / Toplantı'  },
  { key: 'tatil',     label: 'Tatil'           },
  { key: 'romantik',  label: 'Romantik Akşam'  },
  { key: 'dugun',     label: 'Düğün'           },
  { key: 'davet',     label: 'Davet / Gala'    },
  { key: 'mezuniyet', label: 'Mezuniyet'        },
  { key: 'spor',      label: 'Spor'            },
  { key: 'kamp',      label: 'Kamp / Doğa'    },
  { key: 'piknik',    label: 'Piknik'          },
];
const EVENT_LABEL: Record<string, string> = Object.fromEntries(EVENT_OPTIONS.map(o => [o.key, o.label]));

const TR_MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const TR_DAYS_SHORT = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];

// ── Types ────────────────────────────────────────────────────
type DayEvents = { morning?: string; evening?: string };

interface WeatherData {
  city: string; country: string;
  temp: number; feels_like: number;
  condition: string; humidity: number; wind: number;
}

interface ClothingItem {
  id: string; name: string; category: string;
  color: string; color_name: string | null;
  season: string[]; style: string[];
  image_url: string | null;
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

// ── Helpers ──────────────────────────────────────────────────
function weatherEmoji(condition: string): string {
  const c = condition.toLowerCase();
  if (c.includes('clear'))   return '☀️';
  if (c.includes('cloud'))   return '☁️';
  if (c.includes('rain') || c.includes('drizzle')) return '🌧️';
  if (c.includes('snow'))    return '❄️';
  if (c.includes('thunder')) return '⛈️';
  if (c.includes('fog') || c.includes('mist')) return '🌫️';
  return '🌤️';
}

function buildCalendarGrid(year: number, month: number): { day: number; overflow: boolean }[] {
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays    = new Date(year, month, 0).getDate();
  const startOffset = (firstDay + 6) % 7;
  const cells: { day: number; overflow: boolean }[] = [];
  for (let i = startOffset - 1; i >= 0; i--) cells.push({ day: prevDays - i, overflow: true });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, overflow: false });
  let next = 1;
  while (cells.length % 7 !== 0) cells.push({ day: next++, overflow: true });
  return cells;
}

function getTripColor(i: number, total: number): string {
  const t = total <= 1 ? 0 : i / (total - 1);
  const r = Math.round(139 + (240 - 139) * t);
  const g = Math.round(32  + (184 -  32) * t);
  const b = Math.round(53  + (192 -  53) * t);
  return `rgb(${r},${g},${b})`;
}

function formatDisplayDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return `${d.getDate()} ${TR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// ── ClothingCard ─────────────────────────────────────────────
function ClothingCard({ item }: { item: ClothingItem }) {
  return (
    <View style={cc.wrap}>
      <View style={cc.imgBox}>
        {item.image_url
          ? <Image source={{ uri: item.image_url }} style={cc.img} resizeMode="cover" />
          : <View style={[cc.dot, { backgroundColor: item.color }]} />
        }
      </View>
      <Text style={cc.name} numberOfLines={2}>{item.name}</Text>
    </View>
  );
}
const cc = StyleSheet.create({
  wrap:   { width: 68, alignItems: 'center', marginRight: 8, marginBottom: 6 },
  imgBox: { width: 68, height: 68, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)', backgroundColor: '#F8F5F2', overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  img:    { width: 68, height: 68 },
  dot:    { width: 22, height: 22, borderRadius: 11 },
  name:   { fontSize: 10, color: '#706A64', textAlign: 'center', lineHeight: 13 },
});

// ── Date Picker Modal ─────────────────────────────────────────
function DatePickerModal({ visible, value, onClose, onConfirm }: {
  visible: boolean; value: string;
  onClose: () => void; onConfirm: (iso: string) => void;
}) {
  const init = value ? new Date(value + 'T00:00:00') : new Date();
  const [year,  setYear]  = useState(init.getFullYear());
  const [month, setMonth] = useState(init.getMonth());
  const [day,   setDay]   = useState(init.getDate());

  const maxDay = new Date(year, month + 1, 0).getDate();
  const safeDay = Math.min(day, maxDay);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 24, width: 300 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#1D1D1D', marginBottom: 20, textAlign: 'center' }}>
            Başlangıç Tarihi
          </Text>

          {/* Year */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <Text style={{ width: 70, fontSize: 13, color: '#706A64', fontWeight: '600' }}>Yıl</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity onPress={() => setYear(y => y - 1)} style={dpBtn}><Text style={dpBtnTxt}>‹</Text></TouchableOpacity>
              <Text style={dpVal}>{year}</Text>
              <TouchableOpacity onPress={() => setYear(y => y + 1)} style={dpBtn}><Text style={dpBtnTxt}>›</Text></TouchableOpacity>
            </View>
          </View>

          {/* Month */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <Text style={{ width: 70, fontSize: 13, color: '#706A64', fontWeight: '600' }}>Ay</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity onPress={() => setMonth(m => (m + 11) % 12)} style={dpBtn}><Text style={dpBtnTxt}>‹</Text></TouchableOpacity>
              <Text style={[dpVal, { width: 72, textAlign: 'center', fontSize: 13 }]}>{TR_MONTHS[month]}</Text>
              <TouchableOpacity onPress={() => setMonth(m => (m + 1) % 12)} style={dpBtn}><Text style={dpBtnTxt}>›</Text></TouchableOpacity>
            </View>
          </View>

          {/* Day */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <Text style={{ width: 70, fontSize: 13, color: '#706A64', fontWeight: '600' }}>Gün</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity onPress={() => setDay(d => Math.max(1, d - 1))} style={dpBtn}><Text style={dpBtnTxt}>‹</Text></TouchableOpacity>
              <Text style={dpVal}>{safeDay}</Text>
              <TouchableOpacity onPress={() => setDay(d => Math.min(maxDay, d + 1))} style={dpBtn}><Text style={dpBtnTxt}>›</Text></TouchableOpacity>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity onPress={onClose} style={{ flex: 1, borderWidth: 1, borderColor: '#E2DDD7', borderRadius: 10, paddingVertical: 11, alignItems: 'center' }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#706A64' }}>İptal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                const mm = String(month + 1).padStart(2, '0');
                const dd = String(safeDay).padStart(2, '0');
                onConfirm(`${year}-${mm}-${dd}`);
              }}
              style={{ flex: 1, backgroundColor: RED, borderRadius: 10, paddingVertical: 11, alignItems: 'center' }}
            >
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>Seç</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
const dpBtn: object = { width: 32, height: 32, borderRadius: 8, backgroundColor: '#F5F2EE', alignItems: 'center', justifyContent: 'center' };
const dpBtnTxt: object = { fontSize: 18, color: '#1D1D1D', lineHeight: 20 };
const dpVal: object = { width: 40, textAlign: 'center', fontSize: 15, fontWeight: '700', color: '#1D1D1D' };

// ── Main Component ────────────────────────────────────────────
export default function ValizScreen() {
  // ── City ──
  const [inputVal, setInputVal]     = useState('');
  const [apiCity, setApiCity]       = useState('');
  const [showCityModal, setShowCityModal] = useState(false);

  // ── Form ──
  const [startDate, setStartDate]   = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [nights, setNights]         = useState('3');
  const [purpose] = useState('gunluk');

  // ── Calendar ──
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [calendarEvents, setCalendarEvents] = useState<Record<number, DayEvents>>({});
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [editMorning, setEditMorning] = useState('');
  const [editEvening, setEditEvening] = useState('');

  // ── Data ──
  const [clothes, setClothes]       = useState<ClothingItem[]>([]);
  const [weather, setWeather]       = useState<WeatherData | null>(null);
  const [result, setResult]         = useState<ValizResult | null>(null);
  const [checked, setChecked]       = useState<Set<string>>(new Set());
  const [packingOpen, setPackingOpen] = useState(false);

  // ── Loading / Error ──
  const [loadingClothes, setLoadingClothes] = useState(false);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [loadingAI, setLoadingAI]   = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const isLoading = loadingWeather || loadingAI;

  // City filter
  const filteredCities = useMemo(() => {
    if (inputVal.trim().length < 2) return POPULAR_CITIES;
    const q = inputVal.toLowerCase();
    return ALL_CITIES.filter(c =>
      c.label.toLowerCase().includes(q) || c.city.toLowerCase().includes(q)
    ).slice(0, 40);
  }, [inputVal]);

  // Trip day map: dateStr → dayNum
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

  const tripDayList = useMemo(
    () => Object.entries(tripDayMap).sort(([, a], [, b]) => a - b),
    [tripDayMap]
  );

  // Load wardrobe
  useEffect(() => {
    (async () => {
      setLoadingClothes(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from('clothes')
          .select('id, name, category, color, color_name, season, style, image_url')
          .eq('user_id', user.id);
        if (data) setClothes(data as ClothingItem[]);
      } finally { setLoadingClothes(false); }
    })();
  }, []);

  // Calendar helpers
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

  // Generate plan
  const handleGenerate = async () => {
    const searchCity = apiCity || inputVal.trim();
    if (!searchCity) { setError('Lütfen bir şehir seçin.'); return; }
    if (clothes.length === 0) {
      Alert.alert('Gardırob Boş', 'Önce Wardrobe sekmesinden kıyafet eklemelisin.');
      return;
    }
    setError(null); setResult(null); setChecked(new Set()); setPackingOpen(false);

    // 1) Hava durumu
    setLoadingWeather(true);
    let w: WeatherData;
    try {
      const res  = await fetch(`${API_BASE_URL}/api/weather?q=${encodeURIComponent(searchCity)}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Şehir bulunamadı.'); setLoadingWeather(false); return; }
      w = {
        city: data.name, country: data.sys.country,
        temp: Math.round(data.main.temp), feels_like: Math.round(data.main.feels_like),
        condition: data.weather[0].description,
        humidity: data.main.humidity, wind: Math.round(data.wind.speed * 3.6),
      };
      setWeather(w);
    } catch { setError('Hava durumu alınamadı.'); setLoadingWeather(false); return; }
    setLoadingWeather(false);

    // 2) AI plan
    setLoadingAI(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/valiz-outfits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clothes, temp: w.temp, condition: w.condition, nights,
          purposes: Array.from(
            new Set(
              Object.values(calendarEvents).flatMap(ev => [ev.morning, ev.evening].filter(Boolean))
            )
          ).filter(Boolean).length > 0
            ? Array.from(new Set(Object.values(calendarEvents).flatMap(ev => [ev.morning, ev.evening].filter(Boolean))))
            : [purpose],
          calendarEvents, startDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Plan oluşturulamadı.'); return; }
      setResult(data);
    } catch { setError('Sunucuya bağlanılamadı.'); }
    finally { setLoadingAI(false); }
  };

  const toggleCheck = (key: string) => {
    setChecked(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  };

  // Day-based outfit map
  const dayMap = useMemo(() => {
    const m = new Map<number, DayOutfit[]>();
    result?.outfits.forEach(o => {
      if (!m.has(o.day)) m.set(o.day, []);
      m.get(o.day)!.push(o);
    });
    return Array.from(m.entries()).sort(([a], [b]) => a - b);
  }, [result]);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={s.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 4, height: 32, backgroundColor: RED, borderRadius: 2 }} />
            <Text style={s.headerTitle}>Valiz Modu 🧳</Text>
          </View>
          <Text style={s.headerSub}>Gardırobundan hava durumuna göre gün gün kombin</Text>
        </View>

        {/* Gardırob uyarısı */}
        {!loadingClothes && clothes.length === 0 && (
          <View style={s.warnBox}>
            <Text style={s.warnText}>⚠️ Gardırobunda kıyafet yok. Önce Wardrobe sekmesinden kıyafet ekle.</Text>
          </View>
        )}
        {!loadingClothes && clothes.length > 0 && (
          <View style={s.okBox}>
            <Ionicons name="checkmark-circle" size={14} color="#15803d" />
            <Text style={s.okText}>{clothes.length} kıyafet yüklendi</Text>
          </View>
        )}

        {/* ── Kart 1: Seyahat Ayarları ── */}
        <View style={s.card}>
          {/* Şehir */}
          <Text style={s.sectionLabel}>NEREYEGİDİYORSUN?</Text>
          <TouchableOpacity style={s.picker} onPress={() => setShowCityModal(true)} activeOpacity={0.7}>
            <Ionicons name="location" size={15} color={RED} />
            <Text style={[s.pickerText, !inputVal && { color: '#9E9690' }]}>
              {inputVal || 'Şehir ara veya seç…'}
            </Text>
            <Ionicons name="chevron-down" size={14} color="#9E9690" />
          </TouchableOpacity>

          {/* Başlangıç Tarihi */}
          <Text style={s.sectionLabel}>BAŞLANGIÇ TARİHİ</Text>
          <TouchableOpacity style={s.picker} onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
            <Ionicons name="calendar" size={15} color={RED} />
            <Text style={[s.pickerText, !startDate && { color: '#9E9690' }]}>
              {startDate ? formatDisplayDate(startDate) : 'Tarih seç (opsiyonel)'}
            </Text>
            <Ionicons name="chevron-down" size={14} color="#9E9690" />
          </TouchableOpacity>

          {/* Gece sayısı */}
          <Text style={s.sectionLabel}>KAÇ GECE?</Text>
          <View style={s.chipRow}>
            {NIGHT_OPTIONS.map(n => (
              <TouchableOpacity
                key={n}
                style={[s.nightChip, nights === n && s.nightChipActive]}
                onPress={() => setNights(n)}
              >
                <Text style={[s.nightChipText, nights === n && s.nightChipTextActive]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Gün gün etkinlik planı ── */}
          <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.07)', marginBottom: 18, paddingTop: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={s.sectionLabel}>GÜN GÜN ETKİNLİK PLANI</Text>
              <Text style={{ fontSize: 10, color: '#9E9690' }}>opsiyonel</Text>
            </View>
            {Array.from({ length: parseInt(nights) || 0 }, (_, i) => i + 1).map(dayNum => {
              const ev = calendarEvents[dayNum];
              const isOpen = editingDay === dayNum;
              return (
                <View key={dayNum} style={{ marginBottom: 8 }}>
                  {/* Row header */}
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row', alignItems: 'center',
                      backgroundColor: isOpen ? '#FAF7F5' : '#F8F5F2',
                      borderRadius: 12, padding: 12,
                      borderWidth: 1, borderColor: isOpen ? RED_BG : 'rgba(0,0,0,0.07)',
                    }}
                    onPress={() => {
                      if (isOpen) { setEditingDay(null); }
                      else {
                        setEditingDay(dayNum);
                        setEditMorning(ev?.morning ?? '');
                        setEditEvening(ev?.evening ?? '');
                      }
                    }}
                    activeOpacity={0.75}
                  >
                    <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: isOpen ? RED_BG : 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: isOpen ? RED : '#706A64' }}>{dayNum}</Text>
                    </View>
                    <View style={{ flex: 1, flexDirection: 'row', gap: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={{ fontSize: 11 }}>☀️</Text>
                        <Text style={{ fontSize: 11, color: ev?.morning ? RED : '#bbb', fontWeight: ev?.morning ? '600' : '400' }}>
                          {ev?.morning ? EVENT_LABEL[ev.morning] : '—'}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 11, color: '#ddd' }}>·</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={{ fontSize: 11 }}>🌙</Text>
                        <Text style={{ fontSize: 11, color: ev?.evening ? '#5B6FAD' : '#bbb', fontWeight: ev?.evening ? '600' : '400' }}>
                          {ev?.evening ? EVENT_LABEL[ev.evening] : '—'}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={14} color="#9E9690" />
                  </TouchableOpacity>

                  {/* Expanded editor */}
                  {isOpen && (
                    <View style={{ backgroundColor: '#FAF7F5', borderRadius: 12, borderWidth: 1, borderColor: RED_BG, borderTopWidth: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0, padding: 12 }}>
                      {(['morning', 'evening'] as const).map(slot => (
                        <View key={slot} style={{ marginBottom: slot === 'morning' ? 12 : 0 }}>
                          <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: '#9E9690', marginBottom: 8 }}>
                            {slot === 'morning' ? '☀️ SABAH' : '🌙 AKŞAM'}
                          </Text>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                            {EVENT_OPTIONS.map(opt => {
                              const curVal = slot === 'morning' ? editMorning : editEvening;
                              const sel = curVal === opt.key;
                              return (
                                <TouchableOpacity
                                  key={opt.key}
                                  onPress={() => slot === 'morning'
                                    ? setEditMorning(sel ? '' : opt.key)
                                    : setEditEvening(sel ? '' : opt.key)
                                  }
                                  style={{
                                    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100,
                                    borderWidth: 1,
                                    borderColor: sel ? RED : 'rgba(0,0,0,0.1)',
                                    backgroundColor: sel ? RED_BG : '#fff',
                                  }}
                                >
                                  <Text style={{ fontSize: 11, fontWeight: sel ? '700' : '400', color: sel ? RED : '#706A64' }}>
                                    {opt.label}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>
                      ))}
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                        <TouchableOpacity
                          onPress={saveEvents}
                          style={{ flex: 1, backgroundColor: RED, borderRadius: 10, paddingVertical: 9, alignItems: 'center' }}
                        >
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>Kaydet</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => setEditingDay(null)}
                          style={{ paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', borderRadius: 10 }}
                        >
                          <Text style={{ fontSize: 12, color: '#706A64' }}>İptal</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* Generate */}
          <TouchableOpacity style={[s.btn, isLoading && { opacity: 0.7 }]} onPress={handleGenerate} disabled={isLoading} activeOpacity={0.85}>
            {isLoading
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Ionicons name="sparkles" size={16} color="#fff" />
                  <Text style={s.btnText}>
                    {loadingWeather ? 'Hava alınıyor…' : loadingAI ? 'Plan hazırlanıyor…' : 'Planı Oluştur'}
                  </Text>
                </>
            }
          </TouchableOpacity>
        </View>

        {/* ── Error ── */}
        {error && (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        {/* ── Hava Durumu ── */}
        {weather && (
          <View style={[s.card, { backgroundColor: '#FFFAF4', borderColor: '#FFE8C2' }]}>
            <Text style={s.sectionLabel}>HAVA DURUMU</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ fontSize: 52, marginRight: 16 }}>{weatherEmoji(weather.condition)}</Text>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <Ionicons name="location" size={12} color={RED} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#1D1D1D' }}>{weather.city}, {weather.country}</Text>
                </View>
                <Text style={{ fontSize: 36, fontWeight: '800', color: '#1D1D1D', letterSpacing: -1, lineHeight: 40 }}>{weather.temp}°C</Text>
                <Text style={{ fontSize: 12, color: '#706A64', textTransform: 'capitalize', marginTop: 2 }}>{weather.condition}</Text>
              </View>
            </View>
            <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.07)', paddingTop: 12, flexDirection: 'row' }}>
              {[
                { label: 'Hissedilen', value: `${weather.feels_like}°C` },
                { label: 'Nem',        value: `%${weather.humidity}`     },
                { label: 'Rüzgar',     value: `${weather.wind} km/s`     },
              ].map((item, i) => (
                <View key={i} style={[{ flex: 1, alignItems: 'center' }, i > 0 && { borderLeftWidth: 1, borderLeftColor: 'rgba(0,0,0,0.07)' }]}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#1D1D1D' }}>{item.value}</Text>
                  <Text style={{ fontSize: 10, color: '#9E9690', marginTop: 2, letterSpacing: 0.3 }}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Takvim ── */}
        {(startDate || tripDayList.length > 0) && (
          <View style={s.card}>
            {/* Month nav */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <TouchableOpacity
                onPress={() => setCalMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                style={{ padding: 6 }}
              >
                <Text style={{ fontSize: 18, color: '#706A64', lineHeight: 20 }}>‹</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#1D1D1D' }}>
                {TR_MONTHS[calMonth.getMonth()]} {calMonth.getFullYear()}
              </Text>
              <TouchableOpacity
                onPress={() => setCalMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                style={{ padding: 6 }}
              >
                <Text style={{ fontSize: 18, color: '#706A64', lineHeight: 20 }}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Day headers */}
            <View style={{ flexDirection: 'row', marginBottom: 6 }}>
              {TR_DAYS_SHORT.map(d => (
                <Text key={d} style={{ flex: 1, textAlign: 'center', fontSize: 9, fontWeight: '700', color: '#9E9690', letterSpacing: 0.3 }}>{d}</Text>
              ))}
            </View>

            {/* Grid */}
            {Array.from({ length: Math.ceil(calendarGrid.length / 7) }, (_, row) => (
              <View key={row} style={{ flexDirection: 'row', marginBottom: 3 }}>
                {calendarGrid.slice(row * 7, row * 7 + 7).map((cell, col) => {
                  const { day, overflow } = cell;
                  const y = calMonth.getFullYear();
                  const m = String(calMonth.getMonth() + 1).padStart(2, '0');
                  const dateStr = `${y}-${m}-${String(day).padStart(2, '0')}`;
                  const tripDates = Object.keys(tripDayMap).sort();
                  const totalTrip = tripDates.length;
                  const tripIndex = overflow ? -1 : tripDates.indexOf(dateStr);
                  const isTripDay = !overflow && tripIndex !== -1;
                  const tripDayNum = isTripDay ? tripDayMap[dateStr] : undefined;
                  const hasEvents = tripDayNum !== undefined && calendarEvents[tripDayNum];

                  const bg    = isTripDay ? getTripColor(tripIndex, totalTrip) : 'transparent';
                  const color = overflow ? '#C8C4BE' : isTripDay ? '#FFFFFF' : '#1D1D1D';

                  return (
                    <TouchableOpacity
                      key={col}
                      onPress={() => isTripDay && tripDayNum !== undefined ? handleDayClick(tripDayNum) : undefined}
                      disabled={!isTripDay}
                      style={{
                        flex: 1, height: 36, borderRadius: 9, backgroundColor: bg,
                        alignItems: 'center', justifyContent: 'center',
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={{ fontSize: 13, fontWeight: isTripDay ? '700' : '400', color }}>
                        {day}
                      </Text>
                      {hasEvents && (
                        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#fff', marginTop: 1, opacity: 0.8 }} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}

            {/* Legend */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.07)' }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: RED }} />
              <Text style={{ fontSize: 11, color: '#706A64' }}>Gezi günleri — tıklayarak etkinlik ekle</Text>
            </View>

            {/* Hint when no start date */}
            {tripDayList.length === 0 && (
              <Text style={{ fontSize: 12, color: '#9E9690', textAlign: 'center', marginTop: 8 }}>
                Başlangıç tarihini seçince gezi günlerin görünür
              </Text>
            )}

            {/* Event editor */}
            {editingDay !== null && (
              <View style={{ marginTop: 14, backgroundColor: '#FAF7F5', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)', padding: 14 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#1D1D1D', marginBottom: 12 }}>
                  {editingDay}. Gün — {getDayDateLabel(editingDay)}
                  {getDayWeekday(editingDay) ? ` (${getDayWeekday(editingDay)})` : ''}
                </Text>
                {(['morning', 'evening'] as const).map(slot => (
                  <View key={slot} style={{ marginBottom: slot === 'morning' ? 14 : 0 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: '#9E9690', marginBottom: 8 }}>
                      {slot === 'morning' ? '☀️ SABAH' : '🌙 AKŞAM'}
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {EVENT_OPTIONS.map(opt => {
                        const curVal = slot === 'morning' ? editMorning : editEvening;
                        const sel = curVal === opt.key;
                        return (
                          <TouchableOpacity
                            key={opt.key}
                            onPress={() => slot === 'morning'
                              ? setEditMorning(sel ? '' : opt.key)
                              : setEditEvening(sel ? '' : opt.key)
                            }
                            style={{
                              paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100,
                              borderWidth: 1,
                              borderColor: sel ? RED : 'rgba(0,0,0,0.1)',
                              backgroundColor: sel ? RED_BG : '#fff',
                            }}
                          >
                            <Text style={{ fontSize: 11, fontWeight: sel ? '700' : '500', color: sel ? RED : '#706A64' }}>
                              {opt.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ))}
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
                  <TouchableOpacity onPress={saveEvents} style={{ flex: 1, backgroundColor: RED, borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>Kaydet</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setEditingDay(null)} style={{ paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', borderRadius: 10 }}>
                    <Text style={{ fontSize: 13, color: '#706A64' }}>İptal</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ── Gün Gün Plan ── */}
        {dayMap.length > 0 && (
          <View style={{ marginBottom: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Text style={{ color: RED, fontSize: 14 }}>✦</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#1D1D1D', letterSpacing: -0.3 }}>Gün Gün Planın</Text>
            </View>

            {dayMap.map(([dayNum, dayOutfits]) => {
              const morning = dayOutfits.find(o => o.slot === 'morning') ?? (dayOutfits.length === 1 ? dayOutfits[0] : undefined);
              const evening = dayOutfits.find(o => o.slot === 'evening');
              const morningEvent = calendarEvents[dayNum]?.morning;
              const eveningEvent = calendarEvents[dayNum]?.evening;

              const dateLabel = (() => {
                if (!startDate) return '';
                const d = new Date(startDate + 'T00:00:00');
                d.setDate(d.getDate() + dayNum - 1);
                return `${d.getDate()} ${TR_MONTHS[d.getMonth()]}`;
              })();
              const weekday = getDayWeekday(dayNum);

              return (
                <View key={dayNum} style={[s.card, { marginBottom: 10 }]}>
                  {/* Day header */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.07)' }}>
                    <View style={{ width: 3, height: 40, backgroundColor: RED, borderRadius: 2 }} />
                    <View>
                      <Text style={{ fontSize: 9, fontWeight: '700', letterSpacing: 2, color: '#9E9690' }}>{dayNum}. GÜN</Text>
                      {dateLabel ? (
                        <Text style={{ fontSize: 20, fontWeight: '800', color: '#1D1D1D', letterSpacing: -0.5, lineHeight: 24 }}>
                          {dateLabel}
                        </Text>
                      ) : null}
                      {weekday ? <Text style={{ fontSize: 11, color: '#706A64' }}>{weekday}</Text> : null}
                    </View>
                  </View>

                  {/* Morning */}
                  <View style={{ marginBottom: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <Text style={{ fontSize: 13 }}>☀️</Text>
                      <Text style={{ fontSize: 9, fontWeight: '700', letterSpacing: 2, color: '#9E9690' }}>SABAH</Text>
                      {morningEvent && (
                        <View style={{ backgroundColor: RED_BG, borderRadius: 100, paddingHorizontal: 8, paddingVertical: 2 }}>
                          <Text style={{ fontSize: 10, fontWeight: '600', color: RED }}>{EVENT_LABEL[morningEvent] ?? morningEvent}</Text>
                        </View>
                      )}
                    </View>
                    {morning ? (
                      <>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                          {[morning.top, morning.bottom, morning.shoes, morning.bag, morning.outer]
                            .filter(Boolean).slice(0, 4)
                            .map((item, i) => <ClothingCard key={i} item={item!} />)
                          }
                        </View>
                        {morning.reason ? (
                          <Text style={{ fontSize: 11, color: '#888', lineHeight: 16, marginTop: 4 }}>{morning.reason}</Text>
                        ) : null}
                      </>
                    ) : (
                      <Text style={{ fontSize: 12, color: '#bbb' }}>—</Text>
                    )}
                  </View>

                  {/* Evening */}
                  <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)', paddingTop: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <Text style={{ fontSize: 13 }}>🌙</Text>
                      <Text style={{ fontSize: 9, fontWeight: '700', letterSpacing: 2, color: '#9E9690' }}>AKŞAM</Text>
                      {eveningEvent && (
                        <View style={{ backgroundColor: 'rgba(123,143,202,0.1)', borderRadius: 100, paddingHorizontal: 8, paddingVertical: 2 }}>
                          <Text style={{ fontSize: 10, fontWeight: '600', color: '#5B6FAD' }}>{EVENT_LABEL[eveningEvent] ?? eveningEvent}</Text>
                        </View>
                      )}
                    </View>
                    {evening ? (
                      <>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                          {[evening.top, evening.bottom, evening.shoes, evening.bag, evening.outer]
                            .filter(Boolean).slice(0, 4)
                            .map((item, i) => <ClothingCard key={i} item={item!} />)
                          }
                        </View>
                        {evening.reason ? (
                          <Text style={{ fontSize: 11, color: '#888', lineHeight: 16, marginTop: 4 }}>{evening.reason}</Text>
                        ) : null}
                      </>
                    ) : morning ? (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                        {[morning.top, morning.bottom, morning.shoes, morning.bag]
                          .filter(Boolean).slice(0, 4)
                          .map((item, i) => <ClothingCard key={i} item={item!} />)
                        }
                      </View>
                    ) : (
                      <Text style={{ fontSize: 12, color: '#bbb' }}>—</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Valiz Listesi (açılır/kapanır) ── */}
        {result && (
          <View style={[s.card, { padding: 0, overflow: 'hidden', marginBottom: 32 }]}>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18 }}
              onPress={() => setPackingOpen(v => !v)}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: RED_BG, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="bag-outline" size={18} color={RED} />
                </View>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#1D1D1D' }}>Valiz Listesi</Text>
                  <Text style={{ fontSize: 11, color: '#9E9690', marginTop: 1 }}>{nights} gece için hazırlandı</Text>
                </View>
              </View>
              <Ionicons name={packingOpen ? 'chevron-up' : 'chevron-down'} size={16} color="#706A64" />
            </TouchableOpacity>

            {packingOpen && (
              <View style={{ paddingHorizontal: 18, paddingBottom: 18, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.07)' }}>
                {result.packingItems.length > 0 && (
                  <>
                    <Text style={[s.sectionLabel, { marginTop: 16, marginBottom: 10 }]}>GARDIROBTANDAN</Text>
                    {result.packingItems.map(item => {
                      const key = `item-${item.id}`;
                      const done = checked.has(key);
                      return (
                        <TouchableOpacity key={key} style={s.checkRow} onPress={() => toggleCheck(key)} activeOpacity={0.7}>
                          <View style={[s.checkbox, done && s.checkboxDone]}>
                            {done && <Ionicons name="checkmark" size={11} color="#fff" />}
                          </View>
                          <View style={[s.colorDot, { backgroundColor: item.color }]} />
                          <Text style={[s.checkText, done && s.checkTextDone]}>{item.name}</Text>
                        </TouchableOpacity>
                      );
                    })}
                    <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.07)', marginVertical: 14 }} />
                  </>
                )}

                <Text style={[s.sectionLabel, { marginBottom: 10 }]}>ZORUNLU EŞYALAR</Text>
                {result.essentials.map((item, i) => {
                  const key = `ess-${i}`;
                  const done = checked.has(key);
                  return (
                    <TouchableOpacity key={key} style={s.checkRow} onPress={() => toggleCheck(key)} activeOpacity={0.7}>
                      <View style={[s.checkbox, done && s.checkboxDone]}>
                        {done && <Ionicons name="checkmark" size={11} color="#fff" />}
                      </View>
                      <Text style={[s.checkText, done && s.checkTextDone]}>{item}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

      </ScrollView>

      {/* ── Şehir Seçici Modal ── */}
      <Modal visible={showCityModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCityModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#1D1D1D' }}>Destinasyon Seç</Text>
            <TouchableOpacity onPress={() => setShowCityModal(false)}>
              <Ionicons name="close" size={22} color="#706A64" />
            </TouchableOpacity>
          </View>

          <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }}>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#E2DDD7', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: '#1D1D1D', backgroundColor: '#FAF7F5' }}
              placeholder="Şehir veya ülke ara..."
              placeholderTextColor="#aaa"
              value={inputVal}
              onChangeText={v => { setInputVal(v); setApiCity(''); }}
              autoFocus
              autoCapitalize="words"
              returnKeyType="search"
            />
          </View>

          <Text style={{ fontSize: 9, fontWeight: '700', letterSpacing: 1.5, color: '#9E9690', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8 }}>
            {inputVal.trim().length < 2 ? '⭐ POPÜLER DESTINASYONLAR' : `${filteredCities.length} SONUÇ`}
          </Text>

          <FlatList
            data={filteredCities}
            keyExtractor={item => item.city}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 }}
                onPress={() => { setInputVal(item.label); setApiCity(item.city); setShowCityModal(false); }}
              >
                <Text style={{ fontSize: 22, marginRight: 12 }}>{item.flag}</Text>
                <Text style={{ fontSize: 15, color: '#1D1D1D' }}>{item.label}</Text>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#f5f5f4', marginLeft: 56 }} />}
            ListFooterComponent={
              inputVal.trim().length >= 2 && filteredCities.length === 0 ? (
                <TouchableOpacity
                  style={{ paddingHorizontal: 20, paddingVertical: 16 }}
                  onPress={() => { setApiCity(inputVal.trim()); setShowCityModal(false); }}
                >
                  <Text style={{ fontSize: 14, color: RED, fontWeight: '600' }}>"{inputVal.trim()}" ile devam et →</Text>
                </TouchableOpacity>
              ) : null
            }
          />
        </SafeAreaView>
      </Modal>

      {/* ── Tarih Seçici Modal ── */}
      <DatePickerModal
        visible={showDatePicker}
        value={startDate}
        onClose={() => setShowDatePicker(false)}
        onConfirm={iso => {
          setStartDate(iso);
          setShowDatePicker(false);
          const d = new Date(iso + 'T00:00:00');
          setCalMonth(new Date(d.getFullYear(), d.getMonth(), 1));
        }}
      />
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#FAF7F5' },
  scroll: { paddingBottom: 32 },

  header: {
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14,
    backgroundColor: '#1C1917',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.3 },
  headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4, paddingLeft: 14 },

  warnBox: { marginHorizontal: 16, marginTop: 12, backgroundColor: 'rgba(196,30,58,0.07)', borderWidth: 1, borderColor: 'rgba(196,30,58,0.18)', borderRadius: 12, padding: 12 },
  warnText: { fontSize: 12, color: '#C87070' },
  okBox:   { marginHorizontal: 16, marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(21,128,61,0.07)', borderWidth: 1, borderColor: 'rgba(21,128,61,0.2)', borderRadius: 12, padding: 10 },
  okText:  { fontSize: 12, color: '#15803d', fontWeight: '600' },

  card: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)',
    borderRadius: 18, padding: 18, marginHorizontal: 16, marginTop: 14,
  },
  sectionLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 2, color: '#9E9690', marginBottom: 10 },

  picker: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FAF7F5', borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16,
  },
  pickerText: { flex: 1, fontSize: 15, color: '#1D1D1D' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  nightChip:         { paddingHorizontal: 13, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', backgroundColor: '#FAF7F5' },
  nightChipActive:   { borderColor: RED_BG, backgroundColor: RED_BG, borderWidth: 1 },
  nightChipText:     { fontSize: 13, fontWeight: '600', color: '#706A64' },
  nightChipTextActive: { color: RED },
  purposeChip:         { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', backgroundColor: '#FAF7F5' },
  purposeChipActive:   { borderColor: '#1D1D1D', backgroundColor: '#1D1D1D' },
  purposeChipText:     { fontSize: 13, fontWeight: '500', color: '#706A64' },
  purposeChipTextActive: { color: '#fff', fontWeight: '600' }, // kept for style ref

  btn: {
    backgroundColor: RED, borderRadius: 12, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 0.3 },

  errorBox:  { marginHorizontal: 16, marginTop: 14, backgroundColor: 'rgba(196,30,58,0.08)', borderWidth: 1, borderColor: 'rgba(196,30,58,0.2)', borderRadius: 12, padding: 12 },
  errorText: { fontSize: 13, color: '#C87070' },

  checkRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  checkbox:    { width: 18, height: 18, borderRadius: 5, borderWidth: 1, borderColor: '#ccc', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  checkboxDone:{ backgroundColor: RED, borderColor: RED },
  colorDot:    { width: 10, height: 10, borderRadius: 5, marginRight: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  checkText:     { flex: 1, fontSize: 14, color: '#706A64' },
  checkTextDone: { color: '#bbb', textDecorationLine: 'line-through' },
});
