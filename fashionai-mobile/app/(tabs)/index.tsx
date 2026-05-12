import { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Dimensions, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useFocusEffect } from 'expo-router';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageContext';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];
const { width } = Dimensions.get('window');

const RED  = '#C41E3A';
const MUTED= '#8A7570';
const TEXT = '#2C2320';

/* ── Quick Actions — matches web exactly ── */
const QUICK_ACTIONS: { label: string; desc: string; icon: IoniconName; route: string }[] = [
  { label: 'Gardırop',  desc: 'Kıyafetlerini yönet',     icon: 'shirt-outline',        route: '/(tabs)/wardrobe' },
  { label: 'Kombiner',  desc: 'AI önerileriyle stilini bul', icon: 'sparkles-outline',  route: '/(tabs)/outfits'  },
  { label: 'Güzellik',  desc: 'Bakım rutinini düzenle',   icon: 'color-palette-outline',route: '/(tabs)/beauty'   },
  { label: 'Valiz',     desc: 'Seyahat kombinlerini hazırla', icon: 'briefcase-outline', route: '/(tabs)/valiz'   },
  { label: 'Keşfet',    desc: 'Topluluğu keşfet',         icon: 'compass-outline',      route: '/(tabs)/kesfet'   },
  { label: 'Etkinlik',  desc: 'Etkinliklerini planla',    icon: 'calendar-outline',     route: '/(tabs)/events'   },
];

/* ── Event helpers ── */
const EVENT_ICON: Record<string, string> = {
  daily_casual:'☀️', picnic:'🌿', sport:'🏃', business:'💼',
  date_night:'🌙', invitation:'🎉', graduation:'🎓', travel:'✈️',
};
const EVENT_LABEL: Record<string, string> = {
  daily_casual:'Günlük', picnic:'Piknik', sport:'Spor', business:'İş',
  date_night:'Romantik', invitation:'Davet', graduation:'Mezuniyet', travel:'Seyahat',
};
function daysUntil(iso: string): string {
  const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Bugün';
  if (diff === 1) return 'Yarın';
  if (diff < 0)  return 'Geçti';
  return `${diff} gün`;
}

/* ── Weather helpers ── */
const CONDITION_LABELS: Record<string, string> = {
  sunny:'Güneşli', partly_cloudy:'Parçalı Bulutlu', cloudy:'Bulutlu',
  rainy:'Yağmurlu', stormy:'Fırtınalı', snowy:'Karlı', foggy:'Sisli',
};
const CONDITION_EMOJI: Record<string, string> = {
  sunny:'☀️', partly_cloudy:'⛅', cloudy:'☁️',
  rainy:'🌧️', stormy:'⛈️', snowy:'🌨️', foggy:'🌫️',
};
function mapWeatherCode(id: number): string {
  if (id >= 200 && id < 300) return 'stormy';
  if (id >= 300 && id < 600) return 'rainy';
  if (id >= 600 && id < 700) return 'snowy';
  if (id >= 700 && id < 800) return 'foggy';
  if (id === 800)             return 'sunny';
  if (id <= 802)              return 'partly_cloudy';
  return 'cloudy';
}

const WEATHER_KEY = Constants.expoConfig?.extra?.OPENWEATHER_API_KEY as string ?? '';

interface WeatherData { city: string; temp: number; feels_like: number; condition: string; humidity: number; wind_speed: number; }
interface UpcomingEvent { id: string; title: string; event_type: string; event_date: string; }

const PROMO_VIDEO = require('@/assets/promo.mp4');

export default function HomeScreen() {
  const { t } = useLanguage();
  const videoRef = useRef(null);
  const player = useVideoPlayer(PROMO_VIDEO, p => { p.loop = true; p.muted = true; p.play(); });

  const [firstName, setFirstName]         = useState('');
  const [clothingCount, setClothingCount] = useState(0);
  const [outfitCount, setOutfitCount]     = useState(0);
  const [eventsCount, setEventsCount]     = useState(0);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [weather, setWeather]             = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [userId, setUserId]               = useState<string | null>(null);

  /* ── Load user + counts ── */
  const loadData = useCallback(async (uid: string) => {
    const [
      { count: cCount },
      { count: oCount },
      { count: eCount },
      { data: evData },
    ] = await Promise.all([
      supabase.from('clothes').select('*', { count: 'exact', head: true }).eq('user_id', uid),
      supabase.from('outfits').select('*', { count: 'exact', head: true }).eq('user_id', uid),
      supabase.from('events').select('*', { count: 'exact', head: true }).eq('user_id', uid),
      supabase
        .from('events')
        .select('id, title, event_type, event_date')
        .eq('user_id', uid)
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(3),
    ]);
    setClothingCount(cCount ?? 0);
    setOutfitCount(oCount ?? 0);
    setEventsCount(eCount ?? 0);
    setUpcomingEvents(evData ?? []);
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const name = user.user_metadata?.full_name?.split(' ')[0] ?? '';
      setFirstName(name);
      await loadData(user.id);
    };
    init();
  }, []);

  /* Refresh on focus */
  useFocusEffect(useCallback(() => {
    if (userId) loadData(userId);
  }, [userId, loadData]));

  /* ── Weather via IP geolocation (no permission needed) ── */
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // IP-based location — no expo-location needed
        const geoRes = await fetch('https://ipapi.co/json/');
        if (!geoRes.ok) { setWeatherLoading(false); return; }
        const geo = await geoRes.json();
        const { latitude: lat, longitude: lon } = geo;
        if (!lat || !lon || !WEATHER_KEY) { setWeatherLoading(false); return; }

        const wRes = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_KEY}&units=metric&lang=tr`
        );
        if (!wRes.ok) { setWeatherLoading(false); return; }
        const d = await wRes.json();
        setWeather({
          city:       d.name,
          temp:       Math.round(d.main.temp),
          feels_like: Math.round(d.main.feels_like),
          condition:  mapWeatherCode(d.weather[0].id),
          humidity:   d.main.humidity,
          wind_speed: Math.round(d.wind.speed * 3.6),
        });
      } catch {/* ignore */} finally {
        setWeatherLoading(false);
      }
    };
    fetchWeather();
  }, []);

  /* ── Derived stats ── */
  const styleScore = clothingCount > 0
    ? Math.min(100, Math.round((outfitCount / Math.max(clothingCount, 1)) * 200))
    : null;

  const STATS = [
    { label: t.dashboard.clothingItems, value: String(clothingCount), icon: 'shirt-outline'    as IoniconName },
    { label: t.dashboard.outfitsSaved,  value: String(outfitCount),   icon: 'sparkles-outline' as IoniconName },
    { label: t.dashboard.eventsPlanned, value: String(eventsCount),   icon: 'calendar-outline' as IoniconName },
    { label: t.dashboard.styleScore,    value: styleScore != null ? String(styleScore) : '—', icon: 'star-outline' as IoniconName },
  ];

  const STEPS = [
    { done: true,              label: t.dashboard.step1 },
    { done: clothingCount > 0, label: t.dashboard.step2 },
    { done: clothingCount > 0, label: t.dashboard.step3 },
    { done: outfitCount > 0,   label: t.dashboard.step4 },
  ];
  const completedSteps = STEPS.filter(s => s.done).length;
  const progress = Math.round((completedSteps / STEPS.length) * 100);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* ── Dark header ── */}
        <View style={s.header}>
          <View>
            <Text style={s.brandLabel}>FASHION AI</Text>
            <Text style={s.greeting}>{firstName ? `Merhaba, ${firstName}` : 'Merhaba'}</Text>
          </View>
          <TouchableOpacity style={s.headerAvatar} onPress={() => router.push('/(tabs)/profile')}>
            <Ionicons name="person-outline" size={16} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>

        {/* ── Promo Video (unchanged) ── */}
        <View style={s.videoCard}>
          <VideoView
            ref={videoRef} player={player}
            style={s.video} contentFit="cover" nativeControls={false}
          />
        </View>

        {/* ── Günlük Özet ── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>GÜNLÜK ÖZET</Text>

          {/* Weather card */}
          <View style={[s.infoCard, s.weatherCard]}>
            <View style={s.infoCardGlow} />
            {weatherLoading ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <ActivityIndicator color={RED} size="small" />
              </View>
            ) : weather ? (
              <View style={{ padding: 16 }}>
                <View style={s.weatherTopRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Ionicons name="location" size={12} color={RED} />
                    <Text style={s.weatherCity}>{weather.city}</Text>
                  </View>
                  <Text style={s.weatherCondition}>{CONDITION_LABELS[weather.condition] ?? ''}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginVertical: 10 }}>
                  <Text style={{ fontSize: 40 }}>{CONDITION_EMOJI[weather.condition] ?? '🌤️'}</Text>
                  <View>
                    <Text style={s.weatherTemp}>{weather.temp}°C</Text>
                    <Text style={s.weatherFeels}>Hissedilen {weather.feels_like}°C</Text>
                  </View>
                </View>
                <View style={s.weatherRow}>
                  <View style={s.weatherStat}>
                    <Text style={s.weatherStatVal}>%{weather.humidity}</Text>
                    <Text style={s.weatherStatLbl}>Nem</Text>
                  </View>
                  <View style={s.weatherDivider} />
                  <View style={s.weatherStat}>
                    <Text style={s.weatherStatVal}>{weather.wind_speed} km/s</Text>
                    <Text style={s.weatherStatLbl}>Rüzgar</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={{ padding: 16 }}>
                <Text style={{ fontSize: 22, marginBottom: 6 }}>🌍</Text>
                <Text style={s.weatherCity}>Hava Durumu</Text>
                <Text style={[s.weatherFeels, { marginTop: 4 }]}>Konum alınamadı</Text>
              </View>
            )}
          </View>

          {/* Upcoming Events card */}
          <View style={s.infoCard}>
            <View style={{ padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={s.infoCardTitle}>Yaklaşan Etkinlikler</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/events')}>
                  <Text style={s.infoCardLink}>Tümü →</Text>
                </TouchableOpacity>
              </View>

              {upcomingEvents.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                  <Text style={s.infoCardEmpty}>Yaklaşan etkinlik yok</Text>
                  <TouchableOpacity onPress={() => router.push('/(tabs)/events')}>
                    <Text style={[s.infoCardLink, { marginTop: 4 }]}>Etkinlik ekle</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ gap: 8 }}>
                  {upcomingEvents.map(event => {
                    const until = daysUntil(event.event_date);
                    const chipColor = until === 'Bugün' ? '#FEE2E2' : until === 'Yarın' ? '#FEF3C7' : '#F5F2EE';
                    const chipText  = until === 'Bugün' ? '#DC2626' : until === 'Yarın' ? '#D97706' : '#706A64';
                    return (
                      <View key={event.id} style={s.eventRow}>
                        <Text style={{ fontSize: 20 }}>{EVENT_ICON[event.event_type] ?? '📅'}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={s.eventTitle} numberOfLines={1}>{event.title}</Text>
                          <Text style={s.eventType}>{EVENT_LABEL[event.event_type] ?? event.event_type}</Text>
                        </View>
                        <View style={[s.eventChip, { backgroundColor: chipColor }]}>
                          <Text style={[s.eventChipText, { color: chipText }]}>{until}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </View>

          {/* AI Tip card */}
          <View style={[s.infoCard, s.aiCard]}>
            <View style={s.aiGlow} />
            <View style={{ padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <View style={s.aiIconCircle}>
                  <Ionicons name="sparkles" size={14} color={RED} />
                </View>
                <Text style={[s.sectionLabel, { color: RED, marginBottom: 0 }]}>AI Öneri</Text>
              </View>
              <Text style={s.aiTitle}>Bugün için Stil İpucu</Text>
              <Text style={s.aiDesc}>
                Dolabını ekle, yapay zeka hava durumuna ve etkinlik takvimine göre kişisel kombinini hazırlasın.
              </Text>
              <View style={s.aiPills}>
                {['Blazer', 'Çanta', 'Ayakkabı'].map(item => (
                  <View key={item} style={s.aiPill}>
                    <Text style={s.aiPillText}>{item}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity style={s.aiBtn} onPress={() => router.push('/(tabs)/outfits')} activeOpacity={0.8}>
                <Text style={s.aiBtnText}>Keşfet</Text>
                <Ionicons name="arrow-forward" size={11} color={RED} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Quick Actions ── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>{t.dashboard.quickActions.toUpperCase()}</Text>
          <View style={s.qaGrid}>
            {QUICK_ACTIONS.map(action => (
              <TouchableOpacity
                key={action.label}
                style={s.qaCard}
                onPress={() => router.push(action.route as never)}
                activeOpacity={0.82}
              >
                {/* Circle icon */}
                <View style={s.qaCircle}>
                  <Ionicons name={action.icon} size={22} color={RED} />
                </View>

                <View style={{ marginTop: 14, flex: 1 }}>
                  <Text style={s.qaLabel}>{action.label.toUpperCase()}</Text>
                  <Text style={s.qaDesc}>{action.desc}</Text>
                </View>

                {/* "Keşfet" pill */}
                <View style={s.qaPill}>
                  <Text style={s.qaPillText}>Keşfet</Text>
                  <Ionicons name="arrow-forward" size={10} color="#fff" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Stats ── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>{t.dashboard.yourStats.toUpperCase()}</Text>
          <View style={s.statsGrid}>
            {STATS.map(stat => (
              <View key={stat.label} style={s.statCard}>
                <View style={s.statIconWrap}>
                  <Ionicons name={stat.icon} size={18} color={RED} />
                </View>
                <Text style={s.statValue}>{stat.value}</Text>
                <Text style={s.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Setup ── */}
        {progress < 100 && (
          <View style={[s.section, { paddingBottom: 0 }]}>
            <View style={s.setupCard}>
              <View style={s.setupTop}>
                <View>
                  <Text style={s.setupEyebrow}>BAŞLANGIÇ</Text>
                  <Text style={s.setupTitle}>Kurulumu tamamla</Text>
                </View>
                <View style={s.setupCircle}>
                  <Text style={s.setupPct}>{progress}%</Text>
                </View>
              </View>
              <View style={s.progressBg}>
                <View style={[s.progressFill, { width: `${progress}%` as any }]} />
              </View>
              {STEPS.map((step, i) => (
                <View key={i} style={s.stepRow}>
                  <View style={[s.stepDot, step.done && s.stepDotDone]}>
                    {step.done
                      ? <Ionicons name="checkmark" size={10} color="#fff" />
                      : <Text style={s.stepNum}>{i + 1}</Text>}
                  </View>
                  <Text style={[s.stepText, step.done && s.stepDone]}>{step.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const CARD_W = (width - 48 - 10) / 2;

const s = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: '#FAF7F5' },

  /* Header */
  header: {
    backgroundColor: '#1A1410',
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  brandLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 3, color: RED, marginBottom: 3 },
  greeting:   { fontSize: 21, fontWeight: '700', color: '#fff', letterSpacing: -0.3 },
  headerAvatar: {
    width: 34, height: 34, borderRadius: 17,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },

  /* Video */
  videoCard:    { marginHorizontal: 16, marginTop: 16, borderRadius: 18, overflow: 'hidden', position: 'relative' },
  video:        { width: width - 32, height: (width - 32) * (680 / 1440) },

  /* Section wrapper */
  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 3, color: MUTED, marginBottom: 12 },

  /* Info cards (Günlük Özet) */
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.82)',
    marginBottom: 10, overflow: 'hidden',
    shadowColor: '#1C1412', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 16, elevation: 3,
    position: 'relative',
  },
  weatherCard: { backgroundColor: '#FFF8F0' },
  infoCardGlow: {
    position: 'absolute', top: -20, right: -10, width: 100, height: 100,
    backgroundColor: 'rgba(255,180,60,0.15)', borderRadius: 50,
    pointerEvents: 'none',
  },

  /* Weather */
  weatherTopRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  weatherCity:     { fontSize: 13, fontWeight: '600', color: TEXT },
  weatherCondition:{ fontSize: 12, color: MUTED },
  weatherTemp:     { fontSize: 36, fontWeight: '700', color: '#1A1210', lineHeight: 40, letterSpacing: -1 },
  weatherFeels:    { fontSize: 12, color: MUTED, marginTop: 2 },
  weatherRow:      { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 10, marginTop: 4 },
  weatherStat:     { flex: 1, alignItems: 'center' },
  weatherDivider:  { width: 1, height: 28, backgroundColor: 'rgba(0,0,0,0.06)' },
  weatherStatVal:  { fontSize: 16, fontWeight: '700', color: '#1A1210' },
  weatherStatLbl:  { fontSize: 10, color: MUTED, marginTop: 2 },

  /* Events widget */
  infoCardTitle: { fontSize: 14, fontWeight: '700', color: TEXT },
  infoCardLink:  { fontSize: 12, color: MUTED },
  infoCardEmpty: { fontSize: 13, color: MUTED },
  eventRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F5F2EE', borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
  },
  eventTitle:    { fontSize: 13, fontWeight: '600', color: TEXT },
  eventType:     { fontSize: 11, color: MUTED, marginTop: 1 },
  eventChip:     { borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3 },
  eventChipText: { fontSize: 10, fontWeight: '700' },

  /* AI card */
  aiCard: { backgroundColor: '#FAF5F2' },
  aiGlow: {
    position: 'absolute', bottom: -20, right: -10, width: 120, height: 120,
    backgroundColor: 'rgba(201,142,135,0.12)', borderRadius: 60,
    pointerEvents: 'none',
  },
  aiIconCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(196,30,58,0.08)', borderWidth: 1, borderColor: 'rgba(196,30,58,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  aiTitle:  { fontSize: 14, fontWeight: '700', color: TEXT, lineHeight: 20, marginBottom: 8 },
  aiDesc:   { fontSize: 12, color: MUTED, lineHeight: 18, marginBottom: 12 },
  aiPills:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  aiPill: {
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: 'rgba(239,228,222,0.8)', borderRadius: 100,
    borderWidth: 1, borderColor: 'rgba(214,170,161,0.4)',
  },
  aiPillText: { fontSize: 11, fontWeight: '600', color: TEXT },
  aiBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
    backgroundColor: '#EFE4DE', borderRadius: 100,
    borderWidth: 1, borderColor: 'rgba(196,30,58,0.2)',
    paddingVertical: 7, paddingHorizontal: 14,
  },
  aiBtnText: { fontSize: 11, fontWeight: '700', color: RED, letterSpacing: 0.5 },

  /* Quick Actions */
  qaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  qaCard: {
    width: CARD_W,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.82)',
    padding: 20,
    shadowColor: '#1C1412', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 16, elevation: 3,
  },
  qaCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(196,30,58,0.08)',
    borderWidth: 1, borderColor: 'rgba(196,30,58,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  qaLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: TEXT, marginBottom: 6 },
  qaDesc:  { fontSize: 12, color: MUTED, lineHeight: 17 },
  qaPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
    backgroundColor: RED, borderRadius: 100,
    paddingVertical: 6, paddingHorizontal: 12, marginTop: 16,
    shadowColor: RED, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28, shadowRadius: 8, elevation: 4,
  },
  qaPillText: { fontSize: 10, fontWeight: '700', color: '#FAF7F5', letterSpacing: 1 },

  /* Stats */
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: CARD_W,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.82)',
    padding: 18,
    shadowColor: '#1C1412', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 16, elevation: 3,
  },
  statIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(196,30,58,0.08)',
    borderWidth: 1, borderColor: 'rgba(196,30,58,0.15)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  statValue: { fontSize: 28, fontWeight: '700', color: '#1C1C1C', letterSpacing: -0.5, marginBottom: 4 },
  statLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, color: MUTED, textTransform: 'uppercase' },

  /* Setup */
  setupCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: 20,
    borderWidth: 1, borderColor: '#EAE3D9',
    shadowColor: '#1A1410', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.055, shadowRadius: 8, elevation: 2,
  },
  setupTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  setupEyebrow:{ fontSize: 9, fontWeight: '800', letterSpacing: 2, color: RED, marginBottom: 5 },
  setupTitle:  { fontSize: 15, fontWeight: '700', color: '#1A1108' },
  setupCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(196,30,58,0.07)',
    borderWidth: 1.5, borderColor: 'rgba(196,30,58,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  setupPct:    { fontSize: 11, fontWeight: '800', color: RED },
  progressBg:  { height: 4, backgroundColor: '#EDE6DC', borderRadius: 2, overflow: 'hidden', marginBottom: 16 },
  progressFill:{ height: 4, backgroundColor: RED, borderRadius: 2 },
  stepRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  stepDot: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.5, borderColor: '#D5CFCB',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F2EE',
  },
  stepDotDone: { backgroundColor: RED, borderColor: RED },
  stepNum:     { fontSize: 9, fontWeight: '800', color: '#A89F96' },
  stepText:    { fontSize: 13, color: '#1A1108', flex: 1 },
  stepDone:    { color: '#B8B0A6', textDecorationLine: 'line-through' },
});
